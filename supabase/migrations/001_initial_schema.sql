-- Smart University Incubator — Postgres schema for Supabase
-- Run this in Supabase SQL Editor after creating the project.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  university TEXT,
  department TEXT,
  level TEXT CHECK (level IS NULL OR level IN ('L3', 'M2')),
  student_id TEXT,
  staff_id TEXT,
  username TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS auth_credentials (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  email TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS news_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('formation', 'article', 'evenement')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW (),
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mentor_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_ctt TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'incubation', 'rejected')),
  submitted_date TIMESTAMPTZ NOT NULL,
  mentor_feedback TEXT,
  meeting_schedule JSONB,
  progress INT NOT NULL DEFAULT 0,
  is_label BOOLEAN NOT NULL DEFAULT FALSE,
  is_pme BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_projects_student ON projects (student_id);
CREATE INDEX IF NOT EXISTS idx_projects_mentor ON projects (mentor_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'mentor')),
  text TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages (chat_id);

CREATE TABLE IF NOT EXISTS formations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  instructor TEXT NOT NULL,
  total_spots INT NOT NULL DEFAULT 30,
  available_spots INT NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  available_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS material_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  supervisor TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

CREATE INDEX IF NOT EXISTS idx_material_requests_student ON material_requests (student_id);

-- Default admin — password: admin (bcrypt hash generated at migrate time)
INSERT INTO users (id, role, email, first_name, last_name, approved, username)
VALUES ('admin-1', 'admin', 'admin@incubator.com', 'Admin', 'System', TRUE, 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_credentials (user_id, password_hash)
VALUES (
  'admin-1',
  '$2b$10$vaaMhHyh8t6EY9vV3MwZCOuK2tT/t2DhENQBiMK8Xbt0hwJUquIRa'
)
ON CONFLICT (user_id) DO NOTHING;

-- Starter catalog (matches prior localStorage defaults)
INSERT INTO formations (id, title, description, date, time, location, instructor, total_spots, available_spots)
VALUES
  (
    'f1',
    'Pitch Perfect: Comment convaincre les investisseurs',
    'Apprenez les techniques pour structurer votre pitch et capter l''attention.',
    '2026-03-01',
    '10:00 - 12:00',
    'Amphi Innovation',
    'Jean Dupont',
    30,
    12
  ),
  (
    'f2',
    'Marketing Digital pour Startups',
    'Les fondamentaux pour lancer votre marque sur les réseaux sociaux.',
    '2026-03-05',
    '14:00 - 17:00',
    'Salle 4B',
    'Marie Lambert',
    20,
    0
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO materials (id, name, type, available_count)
VALUES
  ('m1', 'MacBook Pro M2', 'laptop', 5),
  ('m2', 'Casque VR Meta Quest 3', 'vr', 2),
  ('m3', 'Kit Arduino Mega', 'electronics', 10),
  ('m4', 'Serveur Jetson Nano', 'server', 0)
ON CONFLICT (id) DO NOTHING;
