CREATE TABLE IF NOT EXISTS courses_offered (
  course_id SERIAL PRIMARY KEY,
  course_name VARCHAR(150) NOT NULL,
  course_desc TEXT,
  course_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  course_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
