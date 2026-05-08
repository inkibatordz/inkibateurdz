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
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Email Configuration Check:');
console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'DEFINED' : 'MISSING');
console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'DEFINED' : 'MISSING');

let pool;
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('✅ PostgreSQL Pool created successfully');
  } else {
    console.warn('⚠️ DATABASE_URL is MISSING. Database features will fail.');
  }
} catch (err) {
  console.error('❌ Failed to create PostgreSQL Pool:', err.message);
}

// Wrapper for pool.query to handle missing pool
const safeQuery = async (text, params) => {
  if (!pool) {
    throw new Error('Database connection is not configured (DATABASE_URL is missing).');
  }
  return await pool.query(text, params);
};

// Initialize database tables
const initDb = async () => {
  try {
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS otps (
        email TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires BIGINT NOT NULL
      );
    `);
    await safeQuery(`
      CREATE TABLE IF NOT EXISTS news (
        id BIGINT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT,
        date TEXT,
        image_url TEXT
      );
    `);
    await safeQuery(`
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
    await safeQuery(`
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
        approved BOOLEAN DEFAULT TRUE,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrations for existing users table
    await safeQuery(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='status') THEN
          ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='created_at') THEN
          ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `);

    await safeQuery(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        student_id TEXT NOT NULL REFERENCES users(id),
        mentor_id TEXT REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_date TEXT NOT NULL,
        file_ctt TEXT
      );
    `);

    // Migrations for existing projects table
    await safeQuery(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='file_ctt') THEN
          ALTER TABLE projects ADD COLUMN file_ctt TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='progress') THEN
          ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='mentor_feedback') THEN
          ALTER TABLE projects ADD COLUMN mentor_feedback TEXT;
        END IF;
      END $$;
    `);

    await safeQuery(`
      CREATE TABLE IF NOT EXISTS material_requests (
        id TEXT PRIMARY KEY,
        material_name TEXT NOT NULL,
        student_id TEXT NOT NULL REFERENCES users(id),
        project_title TEXT,
        supervisor TEXT,
        status TEXT DEFAULT 'pending',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await safeQuery(`
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        size TEXT,
        date TEXT,
        url TEXT
      );
    `);

    await safeQuery(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await safeQuery(`
      CREATE TABLE IF NOT EXISTS training_registrations (
        training_id TEXT NOT NULL REFERENCES trainings(id),
        student_id TEXT NOT NULL REFERENCES users(id),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (training_id, student_id)
      );
    `);

    // Migrations for existing projects table
    await safeQuery(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='progress') THEN
          ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='mentor_feedback') THEN
          ALTER TABLE projects ADD COLUMN mentor_feedback TEXT;
        END IF;
      END $$;
    `);

    // Add default admin if no users exist
    const userCountResult = await safeQuery('SELECT COUNT(*) FROM users');
    if (parseInt(userCountResult.rows[0].count) === 0) {
      await safeQuery(
        'INSERT INTO users (id, email, password, role, first_name, last_name, approved) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['admin', 'admin', 'admin', 'admin', 'Admin', 'System', true]
      );
      console.log('Default admin created');
    }

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
};

initDb();

app.post('/api/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

  try {
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await testTransporter.verify();
    
    await testTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Test de Connexion Inkibator',
      text: 'Si vous recevez ceci, votre configuration Email sur Render est PARFAITE !'
    });

    res.json({ success: true, message: 'Email de test envoyé avec succès !' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Échec du test : ' + error.message,
      setup_guide: '1. Activez la validation en 2 étapes sur votre compte Google. 2. Créez un "Mot de passe d\'application" sur https://myaccount.google.com/apppasswords. 3. Mettez à jour EMAIL_USER et EMAIL_PASS sur Render.'
    });
  }
});

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email est requis' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email variables are missing in /api/send-otp');
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur Configuration : EMAIL_USER ou EMAIL_PASS manquant sur Render.',
      instructions: 'Allez dans les réglages "Environment" de Render et ajoutez EMAIL_USER (votre gmail) et EMAIL_PASS (le code de 16 lettres).'
    });
  }

  try {
    await pool.query(
      'INSERT INTO otps (email, otp, expires) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp = $2, expires = $3',
      [email, otp, expires]
    );

    const mailOptions = {
      from: `"Incubateur 2TI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${otp} est votre code de vérification`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; background: #f8fafc; border: 1px solid #e2e8f0;">
          <h2 style="color: #2563eb; font-size: 28px; font-weight: 800; margin-bottom: 24px; text-align: center;">Vérification Email</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">Bienvenue sur la plateforme Inkibator. Utilisez le code secret ci-dessous pour finaliser votre inscription :</p>
          <div style="background: #ffffff; padding: 30px; border-radius: 20px; text-align: center; margin: 32px 0; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1e40af; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">Ce code expirera dans 10 minutes pour votre sécurité.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Tlemcen Tech Incubator - 2TI. Tous droits réservés.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${email}`);
    res.json({ success: true, message: 'Un code de vérification a été envoyé à ' + email });
  } catch (error) {
    console.error('CRITICAL EMAIL ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'L\'envoi de l\'email a échoué. Cause : ' + error.message,
      help: 'Vérifiez que vous utilisez un "Mot de passe d\'application" Google et non votre mot de passe habituel.'
    });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const result = await safeQuery('SELECT * FROM otps WHERE email = $1', [email]);
    const storedData = result.rows[0];

    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Aucun code trouvé pour cet email' });
    }

    if (Date.now() > parseInt(storedData.expires)) {
      await safeQuery('DELETE FROM otps WHERE email = $1', [email]);
      return res.status(400).json({ success: false, message: 'Code expiré' });
    }

    if (storedData.otp === otp) {
      await safeQuery('DELETE FROM otps WHERE email = $1', [email]);
      res.json({ success: true, message: 'Code vérifié' });
    } else {
      res.status(400).json({ success: false, message: 'Code incorrect' });
    }
  } catch (err) {
    console.error('Error verifying OTP:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

// --- News API ---
app.get('/api/news', async (req, res) => {
  try {
    const result = await safeQuery('SELECT * FROM news ORDER BY id DESC');
    const news = result.rows.map(item => ({
      ...item,
      imageUrl: item.image_url // map snake_case back to camelCase for frontend
    }));
    res.json({ success: true, news });
  } catch (err) {
    console.error('Error fetching news:', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des news: ' + err.message });
  }
});

app.post('/api/news', async (req, res) => {
  console.log('--- NEW NEWS ITEM ATTEMPT ---');
  console.log('Data received:', req.body);
  try {
    const { title, content, type, date, imageUrl } = req.body;
    const id = Date.now();
    const newItem = { id, title, content, type, date: date || new Date().toISOString(), imageUrl };
    
    await safeQuery(
      'INSERT INTO news (id, title, content, type, date, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, title, content, type, newItem.date, imageUrl]
    );

    console.log('News item saved successfully');
    res.json({ success: true, news: newItem });
  } catch (err) {
    console.error('SERVER ERROR IN POST NEWS:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await safeQuery('DELETE FROM news WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true, message: 'Article supprimé' });
    } else {
      res.status(404).json({ success: false, message: 'Article non trouvé' });
    }
  } catch (err) {
    console.error('Error deleting news:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

// --- Trainings API ---
app.get('/api/trainings', async (req, res) => {
  try {
    const result = await safeQuery('SELECT * FROM trainings ORDER BY date ASC');
    const trainings = result.rows.map(item => ({
      ...item,
      totalSpots: item.total_spots,
      availableSpots: item.available_spots
    }));
    res.json({ success: true, trainings });
  } catch (err) {
    console.error('Error fetching trainings:', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des formations: ' + err.message });
  }
});

app.post('/api/trainings', async (req, res) => {
  try {
    const { id, title, description, date, time, location, instructor, totalSpots } = req.body;
    await safeQuery(
      'INSERT INTO trainings (id, title, description, date, time, location, instructor, total_spots, available_spots) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, title, description, date, time, location, instructor, totalSpots, totalSpots]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding training:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/trainings/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await safeQuery('DELETE FROM trainings WHERE id = $1', [id]);
    res.json({ success: true, message: 'Formation supprimée' });
  } catch (err) {
    console.error('Error deleting training:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

// --- Auth & Users API ---
app.post('/api/register', async (req, res) => {
  const { id, email, password, role, firstName, lastName, department, level, studentId } = req.body;
  try {
    await safeQuery(
      'INSERT INTO users (id, email, password, role, first_name, last_name, department, level, student_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id || Date.now().toString(), email, password, role || 'student', firstName, lastName, department, level, studentId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription: ' + err.message });
  }
});

// --- Users Management API (Admin only) ---
app.get('/api/users', async (req, res) => {
  try {
    const result = await safeQuery('SELECT * FROM users ORDER BY created_at DESC');
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      department: user.department,
      level: user.level,
      studentId: user.student_id,
      status: user.status || 'pending',
      approved: user.status === 'approved'
    }));
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.put('/api/users/:id/approve', async (req, res) => {
  const id = req.params.id;
  if (id === 'admin') {
    return res.status(403).json({ success: false, message: 'Action interdite sur le compte administrateur système' });
  }
  try {
    await safeQuery('UPDATE users SET status = $1 WHERE id = $2', ['approved', id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error approving user:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const id = req.params.id;
  if (id === 'admin') {
    return res.status(403).json({ success: false, message: 'Le compte administrateur système ne peut pas être supprimé' });
  }
  try {
    await safeQuery('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, isGoogle } = req.body;
  
  if (email === 'admin' && password === 'admin') {
    return res.json({ 
      success: true, 
      user: { id: 'admin', email: 'admin', role: 'admin', firstName: 'Admin', lastName: 'System' } 
    });
  }

  try {
    let result;
    if (isGoogle) {
      // Google Login: Only check email
      result = await safeQuery('SELECT * FROM users WHERE email = $1', [email]);
    } else {
      // Normal Login: Check email and password
      result = await safeQuery('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    }

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
      res.status(401).json({ success: false, message: isGoogle ? 'Compte non trouvé. Veuillez vous inscrire d\'abord.' : 'Identifiants incorrects' });
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

// --- Projects API ---
app.get('/api/projects', async (req, res) => {
  const { studentId, mentorId } = req.query;
  try {
    let queryText = `
      SELECT p.*, 
             u.first_name as student_first_name, u.last_name as student_last_name,
             m.first_name as mentor_first_name, m.last_name as mentor_last_name
      FROM projects p 
      JOIN users u ON p.student_id = u.id
      LEFT JOIN users m ON p.mentor_id = m.id
    `;
    let params = [];
    
    if (studentId) {
      queryText += ' WHERE p.student_id = $1';
      params.push(studentId);
    } else if (mentorId) {
      queryText += ' WHERE p.mentor_id = $1';
      params.push(mentorId);
    }
    
    const result = await safeQuery(queryText, params);
    const projects = result.rows.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      studentId: p.student_id,
      mentorId: p.mentor_id,
      studentName: `${p.student_first_name} ${p.student_last_name}`,
      mentorName: p.mentor_id ? `${p.mentor_first_name} ${p.mentor_last_name}` : 'Non assigné',
      submittedDate: p.submitted_date,
      fileCtt: p.file_ctt
    }));
    res.json({ success: true, projects });
  } catch (err) {
    console.error('Error fetching projects:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { id, title, description, studentId } = req.body;
  try {
    await safeQuery(
      'INSERT INTO projects (id, title, description, student_id, submitted_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [id || `proj-${Date.now()}`, title, description, studentId, new Date().toISOString(), 'pending']
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding project:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/projects/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  try {
    await safeQuery('UPDATE projects SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating project status:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.put('/api/projects/:id/assign-mentor', async (req, res) => {
  const id = req.params.id;
  const { mentorId } = req.body;
  try {
    await safeQuery('UPDATE projects SET mentor_id = $1, status = $2 WHERE id = $3', [mentorId, 'accepted', id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error assigning mentor:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

// --- Material Requests API ---
app.get('/api/material-requests', async (req, res) => {
  const { studentId } = req.query;
  try {
    let queryText = 'SELECT mr.*, u.first_name, u.last_name FROM material_requests mr JOIN users u ON mr.student_id = u.id';
    let params = [];
    if (studentId) {
      queryText += ' WHERE mr.student_id = $1';
      params.push(studentId);
    }
    queryText += ' ORDER BY mr.date DESC';
    const result = await safeQuery(queryText, params);
    res.json({ success: true, requests: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/material-requests', async (req, res) => {
  const { materialName, studentId, projectTitle, supervisor } = req.body;
  try {
    await safeQuery(
      'INSERT INTO material_requests (id, material_name, student_id, project_title, supervisor) VALUES ($1, $2, $3, $4, $5)',
      [`req-${Date.now()}`, materialName, studentId, projectTitle, supervisor]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/material-requests/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await safeQuery('UPDATE material_requests SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Materials API ---
app.get('/api/materials', async (req, res) => {
  try {
    const result = await safeQuery('SELECT * FROM materials ORDER BY date DESC');
    res.json({ success: true, materials: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/materials', async (req, res) => {
  const { id, title, type, category, size, date, url } = req.body;
  try {
    await safeQuery(
      'INSERT INTO materials (id, title, type, category, size, date, url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id || `mat-${Date.now()}`, title, type, category, size, date || new Date().toISOString(), url]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/materials/:id', async (req, res) => {
  try {
    await safeQuery('DELETE FROM materials WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Notifications API ---
app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await safeQuery('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ success: true, notifications: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  const { userId, title, message, type } = req.body;
  try {
    await safeQuery(
      'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
      [`notif-${Date.now()}`, userId, title, message, type || 'info']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await safeQuery('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Training Registrations ---
app.post('/api/trainings/:id/register', async (req, res) => {
  const trainingId = req.params.id;
  const { studentId } = req.body;
  try {
    // Check if already registered
    const check = await safeQuery('SELECT 1 FROM training_registrations WHERE training_id = $1 AND student_id = $2', [trainingId, studentId]);
    if (check.rows.length > 0) return res.status(400).json({ success: false, message: 'Déjà inscrit' });

    // Check availability
    const training = await safeQuery('SELECT available_spots FROM trainings WHERE id = $1', [trainingId]);
    if (training.rows[0].available_spots <= 0) return res.status(400).json({ success: false, message: 'Formation complète' });

    await safeQuery('BEGIN');
    await safeQuery('INSERT INTO training_registrations (training_id, student_id) VALUES ($1, $2)', [trainingId, studentId]);
    await safeQuery('UPDATE trainings SET available_spots = available_spots - 1 WHERE id = $1', [trainingId]);
    await safeQuery('COMMIT');

    res.json({ success: true });
  } catch (err) {
    await safeQuery('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/trainings/my-registrations', async (req, res) => {
  const { studentId } = req.query;
  try {
    const result = await safeQuery('SELECT training_id FROM training_registrations WHERE student_id = $1', [studentId]);
    res.json({ success: true, registrations: result.rows.map(r => r.training_id) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Dashboard Statistics ---
app.get('/api/stats', async (req, res) => {
  try {
    const usersCount = await safeQuery('SELECT COUNT(*) FROM users');
    const projectsCount = await safeQuery('SELECT COUNT(*) FROM projects');
    const trainingsCount = await safeQuery('SELECT COUNT(*) FROM trainings');
    const pendingUsers = await safeQuery('SELECT COUNT(*) FROM users WHERE status = $1', ['pending']);
    
    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalProjects: parseInt(projectsCount.rows[0].count),
        totalTrainings: parseInt(trainingsCount.rows[0].count),
        pendingUsers: parseInt(pendingUsers.rows[0].count)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Profile Update ---
app.put('/api/users/:id', async (req, res) => {
  const { firstName, lastName, department, level, university } = req.body;
  try {
    await safeQuery(
      'UPDATE users SET first_name = $1, last_name = $2, department = $3, level = $4 WHERE id = $5',
      [firstName, lastName, department, level, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update project progress/feedback
app.put('/api/projects/:id/mentor-update', async (req, res) => {
  const { progress, feedback } = req.body;
  try {
    await safeQuery(
      'UPDATE projects SET progress = $1, mentor_feedback = $2 WHERE id = $3',
      [progress, feedback, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
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
