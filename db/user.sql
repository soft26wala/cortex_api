CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  photo VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  provider VARCHAR(50) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure role column exists for existing tables
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Ensure password column exists for manual signups
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password VARCHAR(255);

