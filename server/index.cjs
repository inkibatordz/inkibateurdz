const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        email TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires BIGINT NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id BIGINT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT,
        date TEXT,
        image_url TEXT
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trainings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT NOT NULL,
        instructor TEXT NOT NULL,
        total_spots INTEGER NOT NULL,
        available_spots INTEGER NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        department TEXT,
        level TEXT,
        student_id TEXT,
        approved BOOLEAN DEFAULT TRUE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        student_id TEXT NOT NULL REFERENCES users(id),
        mentor_id TEXT REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_date TEXT NOT NULL
      );
    `);

    // Add default admin if no users exist
    const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCountResult.rows[0].count) === 0) {
      await pool.query(
        'INSERT INTO users (id, email, password, role, first_name, last_name, approved) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['admin', 'admin', 'admin', 'admin', 'Admin', 'System', true]
      );
      console.log('Default admin created');
    }

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDb();

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email est requis' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000;

  try {
    await pool.query(
      'INSERT INTO otps (email, otp, expires) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires = $3',
      [email, otp, expires]
    );

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Votre code de vérification -  Incubator',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563eb;">Verification Code</h2>
        <p>Bonjour,</p>
        <p>Voici votre code de vérification pour vous connecter à l'Incubateur Universitaire :</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e40af; margin: 20px 0; text-align: center; background: #f3f4f6; padding: 15px; border-radius: 8px;">
          ${otp}
        </div>
        <p>Ce code expirera dans 10 minutes.</p>
        <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">© 2026 University Incubator. Tous droits réservés.</p>
      </div>
    `,
  };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    res.json({ success: true, message: 'OTP envoyé avec succès' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'e-mail. Vérifiez vos variables d\'environnement EMAIL_USER et EMAIL_PASS (Mot de passe d\'application Google requis).' 
    });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM otps WHERE email = $1', [email]);
    const storedData = result.rows[0];

    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Aucun code trouvé pour cet email' });
    }

    if (Date.now() > parseInt(storedData.expires)) {
      await pool.query('DELETE FROM otps WHERE email = $1', [email]);
      return res.status(400).json({ success: false, message: 'Code expiré' });
    }

    if (storedData.otp === otp) {
      await pool.query('DELETE FROM otps WHERE email = $1', [email]);
      res.json({ success: true, message: 'Code vérifié' });
    } else {
      res.status(400).json({ success: false, message: 'Code incorrect' });
    }
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// --- News API ---
app.get('/api/news', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY id DESC');
    const news = result.rows.map(item => ({
      ...item,
      imageUrl: item.image_url // map snake_case back to camelCase for frontend
    }));
    res.json({ success: true, news });
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des news' });
  }
});

app.post('/api/news', async (req, res) => {
  console.log('--- NEW NEWS ITEM ATTEMPT ---');
  console.log('Data received:', req.body);
  try {
    const { title, content, type, date, imageUrl } = req.body;
    const id = Date.now();
    const newItem = { id, title, content, type, date: date || new Date().toISOString(), imageUrl };
    
    await pool.query(
      'INSERT INTO news (id, title, content, type, date, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, title, content, type, newItem.date, imageUrl]
    );

    console.log('News item saved successfully');
    res.json({ success: true, news: newItem });
  } catch (err) {
    console.error('SERVER ERROR IN POST NEWS:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('DELETE FROM news WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true, message: 'Article supprimé' });
    } else {
      res.status(404).json({ success: false, message: 'Article non trouvé' });
    }
  } catch (err) {
    console.error('Error deleting news:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// --- Trainings API ---
app.get('/api/trainings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainings ORDER BY date ASC');
    const trainings = result.rows.map(item => ({
      ...item,
      totalSpots: item.total_spots,
      availableSpots: item.available_spots
    }));
    res.json({ success: true, trainings });
  } catch (err) {
    console.error('Error fetching trainings:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des formations' });
  }
});

app.post('/api/trainings', async (req, res) => {
  try {
    const { id, title, description, date, time, location, instructor, totalSpots } = req.body;
    await pool.query(
      'INSERT INTO trainings (id, title, description, date, time, location, instructor, total_spots, available_spots) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, title, description, date, time, location, instructor, totalSpots, totalSpots]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding training:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/trainings/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM trainings WHERE id = $1', [id]);
    res.json({ success: true, message: 'Formation supprimée' });
  } catch (err) {
    console.error('Error deleting training:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// --- Auth & Users API ---
app.post('/api/register', async (req, res) => {
  const { id, email, password, role, firstName, lastName, department, level, studentId } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (id, email, password, role, first_name, last_name, department, level, student_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id || Date.now().toString(), email, password, role || 'student', firstName, lastName, department, level, studentId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'L\'utilisateur existe peut-être déjà' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Special case for admin mockup if needed, but better to check DB
  if (email === 'admin' && password === 'admin') {
    return res.json({ 
      success: true, 
      user: { id: 'admin', email: 'admin', role: 'admin', firstName: 'Admin', lastName: 'System' } 
    });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          firstName: user.first_name, 
          lastName: user.last_name,
          department: user.department,
          level: user.level,
          studentId: user.student_id
        } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// --- Projects API ---
app.get('/api/projects', async (req, res) => {
  const { studentId, mentorId } = req.query;
  try {
    let query = 'SELECT p.*, u.first_name as student_first_name, u.last_name as student_last_name FROM projects p JOIN users u ON p.student_id = u.id';
    let params = [];
    
    if (studentId) {
      query += ' WHERE p.student_id = $1';
      params.push(studentId);
    } else if (mentorId) {
      query += ' WHERE p.mentor_id = $1';
      params.push(mentorId);
    }
    
    const result = await pool.query(query, params);
    const projects = result.rows.map(p => ({
      ...p,
      studentName: `${p.student_first_name} ${p.student_last_name}`,
      submittedDate: p.submitted_date
    }));
    res.json({ success: true, projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/projects', async (req, res) => {
  const { id, title, description, studentId } = req.body;
  try {
    await pool.query(
      'INSERT INTO projects (id, title, description, student_id, submitted_date) VALUES ($1, $2, $3, $4, $5)',
      [id || `proj-${Date.now()}`, title, description, studentId, new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


const PORT = process.env.PORT || 3001;

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*path', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
