CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,

  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  phone_number TEXT NOT NULL,
  current_node_id TEXT,

  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, phone_number)
);