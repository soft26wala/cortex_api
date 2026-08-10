-- ─────────────────────────────────────────────────────────────────────────────
-- Client Projects & Quotations Schema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_projects (
  id VARCHAR(50) PRIMARY KEY,
  client_email VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  scale VARCHAR(50) NOT NULL,
  total_quotation NUMERIC(12, 2) NOT NULL DEFAULT 0,
  progress_percent INT NOT NULL DEFAULT 0,
  status VARCHAR(100) NOT NULL DEFAULT 'Quotation Requested',
  assigned_team JSONB DEFAULT '{}'::jsonb,
  payments JSONB DEFAULT '{}'::jsonb,
  updates_warranty JSONB DEFAULT '{}'::jsonb,
  test_details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_projects_email_idx ON client_projects(client_email);
