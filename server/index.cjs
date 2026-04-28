const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Mock database for OTPs and News
const otpStore = new Map();
const newsStore = new Map();

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email est requis' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

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
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'e-mail' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedData = otpStore.get(email);

  if (!storedData) {
    return res.status(400).json({ success: false, message: 'Aucun code trouvé pour cet email' });
  }

  if (Date.now() > storedData.expires) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: 'Code expiré' });
  }

  if (storedData.otp === otp) {
    otpStore.delete(email);
    res.json({ success: true, message: 'Code vérifié' });
  } else {
    res.status(400).json({ success: false, message: 'Code incorrect' });
  }
});

// --- News API ---
app.get('/api/news', (req, res) => {
  const news = Array.from(newsStore.values()).sort((a, b) => b.id - a.id);
  res.json({ success: true, news });
});

app.post('/api/news', (req, res) => {
  console.log('--- NEW NEWS ITEM ATTEMPT ---');
  console.log('Data received:', req.body);
  try {
    const { title, content, type, date, imageUrl } = req.body;
    const id = Date.now();
    const newItem = { id, title, content, type, date: date || new Date().toISOString(), imageUrl };
    newsStore.set(id, newItem);
    console.log('News item saved successfully');
    res.json({ success: true, news: newItem });
  } catch (err) {
    console.error('SERVER ERROR IN POST NEWS:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/news/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (newsStore.has(id)) {
    newsStore.delete(id);
    res.json({ success: true, message: 'Article supprimé' });
  } else {
    res.status(404).json({ success: false, message: 'Article non trouvé' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
