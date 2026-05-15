const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
        approved BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'pending',
        label TEXT,
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
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='label') THEN
          ALTER TABLE users ADD COLUMN label TEXT;
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
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='file_data') THEN
          ALTER TABLE projects ADD COLUMN file_data TEXT;
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
    // Delete registrations first
    await safeQuery('DELETE FROM training_registrations WHERE training_id = $1', [id]);
    await safeQuery('DELETE FROM trainings WHERE id = $1', [id]);
    res.json({ success: true, message: 'Formation supprimée' });
  } catch (err) {
    console.error('Error deleting training:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.post('/api/trainings/:id/notify', async (req, res) => {
  const { id } = req.params;
  try {
    const trainingRes = await safeQuery('SELECT title, date, time FROM trainings WHERE id = $1', [id]);
    if (trainingRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Formation non trouvée' });
    
    const { title, date, time } = trainingRes.rows[0];
    const dateStr = new Date(date).toLocaleDateString('fr-FR');
    
    // Get all approved students
    const studentsRes = await safeQuery('SELECT id FROM users WHERE role = $1 AND status = $2', ['student', 'approved']);
    
    // Get registered students
    const regRes = await safeQuery('SELECT student_id FROM training_registrations WHERE training_id = $1', [id]);
    const registeredIds = new Set(regRes.rows.map(r => r.student_id));
    
    const notifications = studentsRes.rows.map(student => {
      const isRegistered = registeredIds.has(student.id);
      const notifId = `notif-${Date.now()}-${student.id.slice(-4)}`;
      
      const notifTitle = isRegistered ? 'Rappel: Formation' : 'Nouvelle Formation';
      const notifMessage = isRegistered 
        ? `N'oubliez pas ! Votre formation "${title}" aura lieu le ${dateStr} à ${time}.`
        : `Une nouvelle formation "${title}" est disponible le ${dateStr}. Inscrivez-vous dès maintenant !`;
      const notifType = isRegistered ? 'warning' : 'info';

      return safeQuery(
        'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
        [notifId, student.id, notifTitle, notifMessage, notifType]
      );
    });
    
    await Promise.all(notifications);
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending training notifications:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/trainings/:id/participants', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await safeQuery(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.department, u.level, u.label
      FROM training_registrations tr
      JOIN users u ON tr.student_id = u.id
      WHERE tr.training_id = $1
      ORDER BY u.last_name ASC
    `, [id]);
    
    const participants = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      department: row.department,
      level: row.level,
      label: row.label
    }));
    
    res.json({ success: true, participants });
  } catch (err) {
    console.error('Error fetching participants:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/users/:id/label', async (req, res) => {
  const { label } = req.body;
  try {
    await safeQuery('UPDATE users SET label = $1 WHERE id = $2', [label, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Auth & Users API ---
app.post('/api/register', async (req, res) => {
  const { id, email, password, role, firstName, lastName, department, level, studentId, approved, status } = req.body;
  try {
    const isApproved = approved === true || approved === 'true';
    const initialStatus = status || (isApproved ? 'approved' : 'pending');

    await safeQuery(
      'INSERT INTO users (id, email, password, role, first_name, last_name, department, level, student_id, approved, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [
        id || Date.now().toString(), 
        email, 
        password, 
        role || 'student', 
        firstName, 
        lastName, 
        department, 
        level, 
        studentId,
        isApproved,
        initialStatus
      ]
    );

    // Notify Admin of new registration if it's a student or needs approval
    if (!isApproved) {
      await createNotification('admin', 'Nouvelle inscription', `L'utilisateur ${firstName} ${lastName} (${email}) vient de s'inscrire et attend votre approbation.`, 'info');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription: ' + err.message });
  }
});

// --- Users Management API (Admin only) ---
// Helper to create notifications
async function createNotification(userId, title, message, type = 'info') {
  try {
    const id = Date.now().toString();
    await safeQuery(
      'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, title, message, type]
    );
    return true;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return false;
  }
}

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
      approved: user.status === 'approved',
      label: user.label
    }));
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.put('/api/users/:id/deactivate', async (req, res) => {
  const id = req.params.id;
  if (id === 'admin') {
    return res.status(403).json({ success: false, message: 'Action interdite' });
  }
  try {
    await safeQuery('UPDATE users SET status = $1, approved = $2 WHERE id = $3', ['pending', false, id]);
    
    // Notify the user
    await createNotification(id, 'Compte désactivé', 'Votre compte a été désactivé par un administrateur. Contactez le bureau pour plus d\'informations.', 'warning');
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deactivating user:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.put('/api/users/:id/approve', async (req, res) => {
  const id = req.params.id;
  if (id === 'admin') {
    return res.status(403).json({ success: false, message: 'Action interdite sur le compte administrateur système' });
  }
  try {
    // Get user email before updating
    const userResult = await safeQuery('SELECT email, first_name, last_name FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    const user = userResult.rows[0];

    await safeQuery('UPDATE users SET status = $1, approved = $2 WHERE id = $3', ['approved', true, id]);
    
    // Notify the user in-app
    await createNotification(id, 'Compte approuvé', 'Félicitations ! Votre compte a été approuvé. Vous pouvez maintenant accéder à toutes les fonctionnalités.', 'success');
    
    // Send email notification
    try {
      await transporter.sendMail({
        from: `"Inkibator Admin" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Votre compte Inkibator a été approuvé !',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Félicitations ${user.first_name} !</h2>
            <p>Nous avons le plaisir de vous informer que votre compte sur la plateforme <strong>Inkibator</strong> a été approuvé par l'administration.</p>
            <p>Vous pouvez dès à présent vous connecter et accéder à toutes les ressources de l'incubateur.</p>
            <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0;"><strong>Lien de connexion :</strong> <a href="${process.env.APP_URL || 'http://localhost:5173'}/login">Accéder à mon compte</a></p>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Ceci est un message automatique, merci de ne pas y répondre.</p>
          </div>
        `
      });
      console.log(`Email d'approbation envoyé à ${user.email}`);
    } catch (mailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'approbation:', mailError.message);
      // We don't fail the request if email fails, but we log it
    }

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
    // Delete all related data first to avoid foreign key constraints
    await safeQuery('DELETE FROM notifications WHERE user_id = $1', [id]);
    await safeQuery('DELETE FROM training_registrations WHERE student_id = $1', [id]);
    await safeQuery('DELETE FROM material_requests WHERE student_id = $1', [id]);
    await safeQuery('DELETE FROM projects WHERE student_id = $1 OR mentor_id = $1', [id]);
    
    // Finally delete the user
    const result = await safeQuery('DELETE FROM users WHERE id = $1', [id]);
    
    if (result.rowCount > 0) {
      res.json({ success: true, message: 'Utilisateur et toutes ses données associées supprimés' });
    } else {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression: ' + err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, isGoogle } = req.body;
  
  try {
    let result;
    if (isGoogle) {
      // Google Login: Only check email
      result = await safeQuery('SELECT * FROM users WHERE email = $1', [email]);
    } else {
      // Normal Login: Check email and password
      // We check both email OR id (for the system admin account which uses 'admin' as both)
      result = await safeQuery(
        'SELECT * FROM users WHERE (email = $1 OR id = $1) AND password = $2', 
        [email, password]
      );
    }

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Block unapproved students (but allow admin and mentors)
      if (user.role === 'student' && user.status !== 'approved') {
        return res.status(403).json({ 
          success: false, 
          message: "Votre compte est en attente d'approbation par l'administration. Vous recevrez une notification par email une fois validé." 
        });
      }

      // Notify Admin of student/mentor login (optional, but keep for consistency with current code)
      if (user.role !== 'admin') {
        await createNotification('admin', 'Nouvelle connexion', `${user.role === 'student' ? 'L\'étudiant' : 'Le mentor'} ${user.first_name} ${user.last_name} s'est connecté.`, 'info');
      }

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
          studentId: user.student_id,
          status: user.status,
          approved: user.status === 'approved' || user.role === 'admin'
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

app.post('/api/reset-password', async (req, res) => {
  const { email, firstName, lastName, studentId, newPassword } = req.body;
  try {
    const result = await safeQuery(
      'SELECT id, first_name FROM users WHERE email = $1 AND first_name = $2 AND last_name = $3 AND student_id = $4',
      [email, firstName, lastName, studentId]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      await safeQuery('UPDATE users SET password = $1 WHERE id = $2', [newPassword, user.id]);
      
      // Send Email Notification
      try {
        await transporter.sendMail({
          from: `"Inkibator Support" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Réinitialisation de votre mot de passe - Inkibator',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; padding: 12px; background-color: #2563eb; border-radius: 12px;">
                   <span style="font-size: 24px; color: white;">🎓</span>
                </div>
                <h2 style="color: #1e293b; margin-top: 15px;">Réinitialisation Réussie</h2>
              </div>
              
              <p>Bonjour <strong>${user.first_name}</strong>,</p>
              <p>Nous vous confirmons que le mot de passe de votre compte <strong>Inkibator</strong> a été modifié avec succès suite à votre demande de vérification d'identité.</p>
              
              <div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Vos nouveaux identifiants :</p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <p style="margin: 0;"><strong>📧 Email :</strong> ${email}</p>
                  <p style="margin: 0;"><strong>🔑 Mot de passe :</strong> <span style="color: #2563eb; font-family: monospace; font-size: 110%;">${newPassword}</span></p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/login" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.2s;">
                  Se connecter à la plateforme
                </a>
              </div>
              
              <p style="font-size: 14px; color: #64748b;">
                <strong>Note de sécurité :</strong> Si vous n'êtes pas à l'origine de cette demande, veuillez contacter immédiatement l'administration.
              </p>
              
              <hr style="margin: 30px 0; border: 0; border-top: 1px solid #f1f5f9;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                Ceci est un message automatique, merci de ne pas y répondre.<br/>
                &copy; 2024 Inkibator Platform. Tous droits réservés.
              </p>
            </div>
          `
        });
        console.log(`Email de réinitialisation envoyé avec succès à ${email}`);
      } catch (mailError) {
        console.error('Erreur lors de l\'envoi de l\'email de reset:', mailError.message);
      }

      res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
    } else {
      res.status(404).json({ success: false, message: 'Les informations fournies ne correspondent à aucun compte' });
    }
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

// --- Notifications API ---
app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, message: 'userId requis' });
  try {
    const result = await safeQuery(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json({ success: true, notifications: result.rows });
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await safeQuery('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// --- Projects API ---
app.get('/api/projects', async (req, res) => {
  const { studentId, mentorId } = req.query;
  try {
    let queryText = `
      SELECT p.*, 
             u.first_name as student_first_name, u.last_name as student_last_name, u.label as student_label,
             m.first_name as mentor_first_name, m.last_name as mentor_last_name
      FROM projects p 
      LEFT JOIN users u ON p.student_id = u.id
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

    queryText += ' ORDER BY p.submitted_date DESC';
    const result = await safeQuery(queryText, params);
    res.json({ success: true, projects: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { title, description, studentId, fileCtt, fileData } = req.body;
  const id = 'proj-' + Date.now();
  const submittedDate = new Date().toISOString();
  
  try {
    await safeQuery(
      'INSERT INTO projects (id, title, description, student_id, status, submitted_date, file_ctt, file_data, progress) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)',
      [id, title, description || 'Nouveau projet', studentId, 'pending', submittedDate, fileCtt || null, fileData || null]
    );

    // Notify Admin
    await createNotification('admin', 'Nouveau projet soumis', `Un nouveau projet intitulé "${title}" a été soumis pour examen.`, 'info');

    res.json({ success: true, project: { id, title, status: 'pending' } });
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
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

app.get('/api/projects/:id/file', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await safeQuery('SELECT file_ctt, file_data FROM projects WHERE id = $1', [id]);
    if (result.rows.length > 0 && result.rows[0].file_data) {
      res.json({ success: true, fileCtt: result.rows[0].file_ctt, fileData: result.rows[0].file_data });
    } else {
      res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
  } catch (err) {
    console.error('Error fetching project file:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Delete messages related to this project
    await safeQuery('DELETE FROM messages WHERE project_id = $1', [id]);
    
    const result = await safeQuery('DELETE FROM projects WHERE id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true, message: 'Projet supprimé' });
    } else {
      res.status(404).json({ success: false, message: 'Projet non trouvé' });
    }
  } catch (err) {
    console.error('Error deleting project:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

app.put('/api/projects/:id/assign-mentor', async (req, res) => {
  const id = req.params.id;
  const { mentorId } = req.body;
  try {
    await safeQuery('UPDATE projects SET mentor_id = $1, status = $2 WHERE id = $3', [mentorId, 'accepted', id]);
    
    // Notify the student and the mentor
    const projectRes = await safeQuery('SELECT title, student_id FROM projects WHERE id = $1', [id]);
    if (projectRes.rows.length > 0) {
      const { title, student_id } = projectRes.rows[0];
      await createNotification(student_id, 'Mentor assigné', `Le mentor a été assigné à votre projet "${title}".`, 'success');
      await createNotification(mentorId, 'Nouveau projet assigné', `Vous avez été assigné au projet "${title}".`, 'info');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error assigning mentor:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + err.message });
  }
});

// --- Messages API ---
app.get('/api/messages/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await safeQuery(
      `SELECT m.*, u.first_name, u.last_name, u.role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.project_id = $1
       ORDER BY m.created_at ASC`,
      [projectId]
    );
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { projectId, senderId, content } = req.body;
  const id = 'msg_' + Date.now();
  try {
    await safeQuery(
      'INSERT INTO messages (id, project_id, sender_id, content) VALUES ($1, $2, $3, $4)',
      [id, projectId, senderId, content]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending message:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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

app.delete('/api/trainings/:id/participants/:studentId', async (req, res) => {
  const { id, studentId } = req.params;
  try {
    await safeQuery('BEGIN');
    const result = await safeQuery(
      'DELETE FROM training_registrations WHERE training_id = $1 AND student_id = $2',
      [id, studentId]
    );
    
    if (result.rowCount > 0) {
      await safeQuery('UPDATE trainings SET available_spots = available_spots + 1 WHERE id = $1', [id]);
    }
    
    await safeQuery('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await safeQuery('ROLLBACK');
    console.error('Error removing participant:', err.message);
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
