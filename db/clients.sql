CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,

  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 🔥 admin id

  name TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Meta credentials
  phone_number_id TEXT,
  access_token TEXT,
  waba_id TEXT,

  -- Plan
  plan_name TEXT,
  total_messages INTEGER DEFAULT 0,
  used_messages INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  slug TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX clients_user_idx ON clients(user_id);