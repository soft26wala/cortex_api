import { Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";

configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Global variable takki baar-baar execution na ho
let isConnected = false;

export async function connectDB() {
  if (isConnected) return pool;

  try {
    console.log("🚀 Initializing Database...");

    const files = ["buy_course.sql", "user.sql", "courses_offered.sql", "callback.sql", "student.sql", "event.sql", "payments.sql"];

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const schema = fs.readFileSync(filePath, "utf8");
        try {
          // SQL execute karein, agar table exist karti hai toh error ignore karein
          await pool.query(schema); 
          console.log(`📑 Executed ${file}`);
        } catch (sqlErr) {
          // Agar error "already exists" wala hai toh ignore karein
          if (sqlErr.code === '42P07' || sqlErr.code === '23505') {
            console.log(`ℹ️ Skipping ${file}: Tables/Types already exist.`);
          } else {
            throw sqlErr;
          }
        }
      }
    }

    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);");
    
    isConnected = true; 
    console.log("✅ Database Ready!");
    return pool;
  } catch (err) {
    console.error("❌ Neon Connection Error:", err.message);
    throw err;
  }
}