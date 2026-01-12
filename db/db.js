// import pkg from "@neondatabase/serverless";
// const { Pool } = pkg; // 'neon' ki jagah 'Pool' use karein
import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";

configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pool connection setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function connectDB() {
  try {
    console.log("🚀 Connecting to Neon via Pool...");

    const files = [
      "buy_course.sql",
      "user.sql",
      "courses_offered.sql",
      "callback.sql",
      "student.sql",
      "event.sql",
      "payments.sql"
    ];

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const schema = fs.readFileSync(filePath, "utf8");
        
        // pool.query multiple commands (semicolon separated) ko handle kar leta hai
        await pool.query(schema); 
        console.log(`📑 Executed ${file}`);
      }
    }

    // Column check
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);");
    console.log("✅ Ensured 'password' column exists.");

    return pool; // Ab aap pool.query() use kar payenge pure app mein
  } catch (err) {
    console.error("❌ Neon Connection Error:", err.message);
    throw err;
  }
}