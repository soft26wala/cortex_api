CREATE TABLE IF NOT EXISTS company_events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) DEFAULT 'Interview',
    title TEXT NOT NULL,
    candidate_name VARCHAR(255),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);