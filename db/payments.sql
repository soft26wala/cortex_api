CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,           -- Auto-incrementing ID
    transaction_id VARCHAR(255) UNIQUE,      -- PhonePe ki Transaction ID store karne ke liye
    user_id INTEGER NOT NULL,                -- User ki ID (Foreign Key ho sakti hai)
    course_name VARCHAR(255) NOT NULL,       -- Course ka naam
    course_id INTEGER NOT NULL,            -- Course ki ID
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- Payment ka status (e.g., SUCCESS, FAILED, PENDING)
    amount DECIMAL(10, 2),                   -- Amount kitna pay kiya
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Kis date aur time par payment hui
);