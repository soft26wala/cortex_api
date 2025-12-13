CREATE TABLE IF NOT EXISTS student_register (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    age INT,
    course VARCHAR(100),
    total_fee NUMERIC(10,2) NOT NULL,
    fee_paid NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
