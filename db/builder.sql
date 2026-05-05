-- ─────────────────────────────────────────────────────────────────────────────
-- Flow Builder Schema (INTEGER user_id)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS flows (
  id SERIAL PRIMARY KEY,

  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  data JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, name)
);

-- 🔥 Index for faster user queries
CREATE INDEX IF NOT EXISTS flows_user_idx ON flows(user_id);

-- ❌ REMOVE this (duplicate of UNIQUE constraint)
-- CREATE UNIQUE INDEX flows_user_name_idx ON flows(user_id, name);

-- JSON search index
CREATE INDEX IF NOT EXISTS flows_data_gin ON flows USING GIN (data);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS flows_updated_at ON flows;

CREATE TRIGGER flows_updated_at
BEFORE UPDATE ON flows
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();