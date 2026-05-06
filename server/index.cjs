const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { query } = require('./db.cjs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function dbReq(res, fn) {
  try {
    return await fn();
  } catch (e) {
    console.error('DB error:', e.message);
    return res.status(500).json({ success: false, message: 'Erreur base de données' });
  }
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    approved: row.approved,
    university: row.university ?? undefined,
    department: row.department ?? undefined,
    level: row.level ?? undefined,
    studentId: row.student_id ?? undefined,
    staffId: row.staff_id ?? undefined,
    username: row.username ?? undefined,
  };
}

function mapProject(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    mentorId: row.mentor_id ?? undefined,
    title: row.title,
    fileCtt: row.file_ctt ?? undefined,
    status: row.status,
    submittedDate: row.submitted_date instanceof Date ? row.submitted_date.toISOString() : row.submitted_date,
    mentorFeedback: row.mentor_feedback ?? undefined,
    meetingSchedule: row.meeting_schedule ?? undefined,
    progress: row.progress ?? 0,
    isLabel: row.is_label ?? false,
    isPME: row.is_pme ?? false,
  };
}

/** --- Auth --- */

app.post('/api/auth/email-exists', async (req, res) =>
  dbReq(res, async () => {
    const email = req.body.email?.trim()?.toLowerCase();
    if (!email) return res.status(400).json({ exists: false });
    const r = await query(`SELECT 1 FROM users WHERE LOWER(TRIM(email)) = $1`, [email]);
    res.json({ exists: r.rowCount > 0 });
  })
);

app.post('/api/auth/login', async (req, res) =>
  dbReq(res, async () => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    let row;

    const asAdmin = await query(
      `SELECT u.*, c.password_hash
       FROM users u
       INNER JOIN auth_credentials c ON c.user_id = u.id
       WHERE u.role = 'admin' AND u.username = $1`,
      [email]
    );
    if (asAdmin.rows[0]) {
      row = asAdmin.rows[0];
    } else {
      const r = await query(
        `SELECT u.*, c.password_hash
         FROM users u
         INNER JOIN auth_credentials c ON c.user_id = u.id
         WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1))`,
        [email]
      );
      row = r.rows[0];
    }

    if (!row) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    if (!row.approved) {
      return res.status(403).json({
        success: false,
        message: "Compte non activé – veuillez attendre l'approbation de l'administrateur",
      });
    }

    delete row.password_hash;
    res.json({ success: true, user: mapUser(row) });
  })
);

app.post('/api/auth/register', async (req, res) =>
  dbReq(res, async () => {
    const d = req.body;
    const email = d.email?.trim()?.toLowerCase();
    if (!email || !d.password || !d.firstName || !d.lastName || d.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Données invalides' });
    }

    const exists = await query(`SELECT 1 FROM users WHERE LOWER(TRIM(email)) = $1`, [email]);
    if (exists.rowCount > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const id = `student-${Date.now()}`;
    const hash = bcrypt.hashSync(d.password, 10);

    await query(
      `INSERT INTO users (
        id, role, email, first_name, last_name, approved, university, department, level, student_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        'student',
        email,
        d.firstName,
        d.lastName,
        false,
        d.university || null,
        d.department || null,
        d.level || null,
        d.studentId || null,
      ]
    );

    await query(`INSERT INTO auth_credentials (user_id, password_hash) VALUES ($1, $2)`, [id, hash]);

    res.json({
      success: true,
      message: "Inscription réussie ! En attente de l'approbation de l'administrateur.",
    });
  })
);

app.post('/api/auth/google', async (req, res) =>
  dbReq(res, async () => {
    const email = req.body.email?.trim()?.toLowerCase();
    const firstName = req.body.firstName || '';
    const lastName = req.body.lastName || '';
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }

    const r = await query(`SELECT * FROM users WHERE LOWER(TRIM(email)) = $1`, [email]);
    if (r.rowCount === 0) {
      const id = `student-${Date.now()}`;
      await query(
        `INSERT INTO users (id, role, email, first_name, last_name, approved)
         VALUES ($1, 'student', $2, $3, $4, false)`,
        [id, email, firstName, lastName]
      );
      return res.json({
        success: false,
        message: "Compte créé via Google. En attente de l'approbation de l'administrateur.",
      });
    }

    const u = r.rows[0];
    if (!u.approved) {
      return res.status(403).json({
        success: false,
        message: "Compte non activé – veuillez attendre l'approbation de l'administrateur",
      });
    }

    res.json({ success: true, user: mapUser(u) });
  })
);

/** --- Users --- */

app.get('/api/users', async (req, res) =>
  dbReq(res, async () => {
    const r = await query(`SELECT * FROM users ORDER BY email`);
    res.json({
      users: r.rows.map((row) => {
        delete row.password_hash;
        return mapUser(row);
      }),
    });
  })
);

app.patch('/api/users/:id', async (req, res) =>
  dbReq(res, async () => {
    const { approved } = req.body;
    if (typeof approved !== 'boolean') {
      return res.status(400).json({ success: false, message: 'approved requis (boolean)' });
    }
    const r = await query(`UPDATE users SET approved = $1 WHERE id = $2 RETURNING *`, [
      approved,
      req.params.id,
    ]);
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Utilisateur inconnu' });
    res.json({ success: true, user: mapUser(r.rows[0]) });
  })
);

app.delete('/api/users/:id', async (req, res) =>
  dbReq(res, async () => {
    const id = req.params.id;
    const adm = await query(`SELECT role FROM users WHERE id = $1`, [id]);
    if (adm.rows[0]?.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer un admin' });
    }
    await query(`DELETE FROM users WHERE id = $1`, [id]);
    res.json({ success: true });
  })
);

app.post('/api/users/mentor', async (req, res) =>
  dbReq(res, async () => {
    const d = req.body;
    if (!d.email || !d.password || d.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe (≥6) requis' });
    }

    const email = d.email.trim().toLowerCase();
    const exists = await query(`SELECT 1 FROM users WHERE LOWER(TRIM(email)) = $1`, [email]);
    if (exists.rowCount > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const id = `mentor-${Date.now()}`;
    const hash = bcrypt.hashSync(d.password, 10);

    await query(
      `INSERT INTO users (
        id, role, email, first_name, last_name, approved, department, staff_id
      ) VALUES ($1,$2,$3,$4,$5,true,$6,$7)`,
      [id, 'mentor', email, d.firstName, d.lastName, d.department || null, d.staffId || null]
    );

    await query(`INSERT INTO auth_credentials (user_id, password_hash) VALUES ($1,$2)`, [id, hash]);
    const u = (await query(`SELECT * FROM users WHERE id = $1`, [id])).rows[0];
    res.json({ success: true, user: mapUser(u) });
  })
);

/** --- Projects --- */

app.get('/api/projects', async (req, res) =>
  dbReq(res, async () => {
    const studentId = req.query.studentId;
    const mentorId = req.query.mentorId;
    let sql = `SELECT * FROM projects WHERE 1=1`;
    const params = [];
    if (studentId) {
      params.push(studentId);
      sql += ` AND student_id = $${params.length}`;
    }
    if (mentorId) {
      params.push(mentorId);
      sql += ` AND mentor_id = $${params.length}`;
    }
    sql += ` ORDER BY submitted_date DESC`;
    const r = await query(sql, params);
    res.json({ projects: r.rows.map(mapProject) });
  })
);

app.post('/api/projects', async (req, res) =>
  dbReq(res, async () => {
    const d = req.body;
    const id = d.id || `project-${Date.now()}`;
    await query(
      `INSERT INTO projects (
        id, student_id, title, file_ctt, status, submitted_date, progress, mentor_feedback, meeting_schedule
      ) VALUES ($1,$2,$3,$4,'pending',$5::timestamptz,0,$6,$7)`,
      [
        id,
        d.studentId,
        d.title,
        d.fileCtt || null,
        d.submittedDate || new Date().toISOString(),
        null,
        null,
      ]
    );
    const row = (await query(`SELECT * FROM projects WHERE id = $1`, [id])).rows[0];
    res.json({ success: true, project: mapProject(row) });
  })
);

app.patch('/api/projects/:id', async (req, res) =>
  dbReq(res, async () => {
    const id = req.params.id;
    const d = req.body;
    const cur = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (cur.rowCount === 0) return res.status(404).json({ success: false, message: 'Projet inconnu' });
    const p = cur.rows[0];

    const mentorId = d.mentorId !== undefined ? d.mentorId : p.mentor_id;
    const title = d.title !== undefined ? d.title : p.title;
    const fileCtt = d.fileCtt !== undefined ? d.fileCtt : p.file_ctt;
    const status = d.status !== undefined ? d.status : p.status;
    const mentorFeedback = d.mentorFeedback !== undefined ? d.mentorFeedback : p.mentor_feedback;

    let meetingSchedule = d.meetingSchedule !== undefined ? d.meetingSchedule : p.meeting_schedule;
    if (typeof meetingSchedule === 'string') {
      try {
        meetingSchedule = JSON.parse(meetingSchedule);
      } catch (_) {
        /* keep string */
      }
    }

    const progress = d.progress !== undefined ? Number(d.progress) : p.progress;
    let meetingSql = meetingSchedule === null ? null : JSON.stringify(meetingSchedule);

    await query(
      `UPDATE projects SET mentor_id=$1, title=$2, file_ctt=$3, status=$4,
       mentor_feedback=$5, meeting_schedule=$6::jsonb, progress=$7, is_label=$8, is_pme=$9
       WHERE id=$10`,
      [
        mentorId,
        title,
        fileCtt,
        status,
        mentorFeedback,
        meetingSql,
        progress,
        d.isLabel !== undefined ? d.isLabel : p.is_label,
        d.isPME !== undefined ? d.isPME : p.is_pme,
        id,
      ]
    );
    const row = (await query(`SELECT * FROM projects WHERE id = $1`, [id])).rows[0];
    res.json({ success: true, project: mapProject(row) });
  })
);

/** --- Messages --- */

app.get('/api/messages', async (req, res) =>
  dbReq(res, async () => {
    const chatId = req.query.chatId;
    if (!chatId) return res.status(400).json({ success: false, message: 'chatId requis' });
    const r = await query(`SELECT * FROM messages WHERE chat_id = $1 ORDER BY ts ASC`, [chatId]);
    const list = r.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      senderRole: row.sender_role,
      text: row.text,
      timestamp: row.ts instanceof Date ? row.ts.toISOString() : row.ts,
      chatId: row.chat_id,
    }));
    res.json({ messages: list });
  })
);

app.post('/api/messages', async (req, res) =>
  dbReq(res, async () => {
    const m = req.body;
    const id = m.id || `msg-${Date.now()}`;
    await query(
      `INSERT INTO messages (id, chat_id, sender_id, sender_role, text, ts)
       VALUES ($1,$2,$3,$4,$5,$6::timestamptz)`,
      [id, m.chatId, m.senderId, m.senderRole, m.text, m.timestamp || new Date().toISOString()]
    );
    res.json({ success: true, id });
  })
);

/** --- Formations --- */

app.get('/api/formations', async (req, res) =>
  dbReq(res, async () => {
    const r = await query(`SELECT * FROM formations ORDER BY date`);
    res.json({
      formations: r.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        time: row.time,
        location: row.location,
        instructor: row.instructor,
        totalSpots: row.total_spots,
        availableSpots: row.available_spots,
      })),
    });
  })
);

app.post('/api/formations', async (req, res) =>
  dbReq(res, async () => {
    const d = req.body;
    const id = d.id || `form-${Date.now()}`;
    const total = d.totalSpots ?? 30;
    const avail = d.availableSpots ?? total;
    await query(
      `INSERT INTO formations (id,title,description,date,time,location,instructor,total_spots,available_spots)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, d.title, d.description, d.date, d.time, d.location, d.instructor, total, avail]
    );
    res.json({ success: true });
  })
);

app.delete('/api/formations/:id', async (req, res) =>
  dbReq(res, async () => {
    await query(`DELETE FROM formations WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  })
);

app.patch('/api/formations/:id', async (req, res) =>
  dbReq(res, async () => {
    const d = req.body;
    const fields = [];
    const params = [];
    let i = 1;
    ['title', 'description', 'date', 'time', 'location', 'instructor', 'total_spots', 'available_spots'].forEach((k) => {
      const jsKey =
        k === 'total_spots'
          ? 'totalSpots'
          : k === 'available_spots'
            ? 'availableSpots'
            : k;
      if (d[jsKey] !== undefined) {
        fields.push(`${k} = $${i++}`);
        params.push(d[jsKey]);
      }
    });
    if (fields.length === 0) return res.json({ success: true });
    params.push(req.params.id);
    await query(`UPDATE formations SET ${fields.join(', ')} WHERE id = $${i}`, params);
    res.json({ success: true });
  })
);

/** --- Materials --- */

app.get('/api/materials', async (req, res) =>
  dbReq(res, async () => {
    const r = await query(`SELECT * FROM materials ORDER BY name`);
    res.json({
      materials: r.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        availableCount: row.available_count,
      })),
    });
  })
);

app.post('/api/materials', async (req, res) =>
  dbReq(res, async () => {
    const d = req.body;
    const id = d.id || `m-${Date.now()}`;
    await query(
      `INSERT INTO materials (id, name, type, available_count) VALUES ($1,$2,$3,$4)`,
      [id, d.name, d.type, d.availableCount ?? 0]
    );
    res.json({ success: true });
  })
);

app.delete('/api/materials/:id', async (req, res) =>
  dbReq(res, async () => {
    await query(`DELETE FROM materials WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  })
);

/** --- Material requests --- */

app.get('/api/material-requests', async (req, res) =>
  dbReq(res, async () => {
    const sid = req.query.studentId;
    let sql = `SELECT * FROM material_requests`;
    const params = [];
    if (sid) {
      sql += ` WHERE student_id = $1`;
      params.push(sid);
    }
    sql += ` ORDER BY date DESC`;
    const r = await query(sql, params);
    res.json({
      requests: r.rows.map((row) => ({
        id: row.id,
        materialName: row.material_name,
        studentName: row.student_name,
        studentId: row.student_id,
        projectTitle: row.project_title,
        supervisor: row.supervisor,
        status: row.status,
        date: row.date instanceof Date ? row.date.toISOString() : row.date,
      })),
    });
  })
);

app.post('/api/material-requests', async (req, res) =>
  dbReq(res, async () => {
    const d = req.body;
    const id = d.id || `req-${Date.now()}`;
    await query(
      `INSERT INTO material_requests (
        id, student_id, material_name, student_name, project_title, supervisor, status
      ) VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [id, d.studentId, d.materialName, d.studentName, d.projectTitle, d.supervisor]
    );
    res.json({ success: true });
  })
);

app.patch('/api/material-requests/:id', async (req, res) =>
  dbReq(res, async () => {
    const status = req.body.status;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false });
    }
    await query(`UPDATE material_requests SET status = $1 WHERE id = $2`, [status, req.params.id]);
    res.json({ success: true });
  })
);

/** --- OTP --- */

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email est requis' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const run = async () => {
    await query(
      `INSERT INTO otp_codes (email, otp, expires_at)
       VALUES (LOWER(TRIM($1)), $2, $3)
       ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
      [email, otp, expiresAt]
    );
  };

  try {
    await run();
  } catch (e) {
    console.error(e);
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        success: false,
        message: 'DATABASE_URL missing — OTP cannot be persisted',
      });
    }
    return res.status(500).json({ success: false, message: 'Erreur base de données' });
  }

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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    res.json({ success: true, message: 'OTP envoyé avec succès' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'e-mail" });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  const fail = async (msg, code = 400) => res.status(code).json({ success: false, message: msg });

  try {
    const r = await query(`SELECT otp, expires_at FROM otp_codes WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`, [
      email,
    ]);

    if (r.rowCount === 0) {
      return fail('Aucun code trouvé pour cet email');
    }

    const row = r.rows[0];
    if (new Date() > new Date(row.expires_at)) {
      await query(`DELETE FROM otp_codes WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`, [email]);
      return fail('Code expiré');
    }

    if (row.otp === otp) {
      await query(`DELETE FROM otp_codes WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`, [email]);
      return res.json({ success: true, message: 'Code vérifié' });
    }
    return fail('Code incorrect');
  } catch (e) {
    console.error(e);
    return fail('Erreur base de données', 500);
  }
});

/** --- News --- */

app.get('/api/news', async (req, res) => {
  try {
    const r = await query(
      `SELECT id, title, content, type, date, image_url AS "imageUrl" FROM news_items ORDER BY id DESC`
    );
    const news = r.rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      content: row.content,
      type: row.type,
      date: row.date instanceof Date ? row.date.toISOString() : row.date,
      imageUrl: row.imageUrl ?? undefined,
    }));
    res.json({ success: true, news });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Erreur base de données' });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const { title, content, type, date, imageUrl } = req.body;
    const ins = await query(
      `INSERT INTO news_items (title, content, type, date, image_url)
       VALUES ($1,$2,$3, COALESCE($4::timestamptz, NOW()), $5)
       RETURNING id, title, content, type, date, image_url AS "imageUrl"`,
      [title, content, type, date || null, imageUrl || null]
    );
    const row = ins.rows[0];
    const newItem = {
      id: Number(row.id),
      title: row.title,
      content: row.content,
      type: row.type,
      date: row.date instanceof Date ? row.date.toISOString() : row.date,
      imageUrl: row.imageUrl ?? undefined,
    };
    res.json({ success: true, news: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const r = await query(`DELETE FROM news_items WHERE id = $1`, [req.params.id]);
    if (r.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }
    res.json({ success: true, message: 'Article supprimé' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

/** --- Health --- */

app.get('/api/health', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, db: 'missing DATABASE_URL' });
  }
  try {
    await query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    res.status(503).json({ ok: false, db: String(e.message) });
  }
});

const PORT = process.env.PORT || 3001;

if (!process.env.DATABASE_URL) {
  console.warn(
    '\n[WARNING] DATABASE_URL is not set. OTP, news, and all API routes touching Postgres will fail until you configure it.\n'
  );
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
