import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";

configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Neon mein hum ek connection string (DATABASE_URL) use karte hain
const sql = neon(process.env.DATABASE_URL);

export async function connectDB() {
  try {
    console.log("🚀 Connecting to Neon Database...");

    // Step 1: SQL Files load karein
    const files = [
      "buy_course.sql",
      "user.sql",
      "courses_offered.sql",
      "callback.sql",
      "student.sql",
      "payments.sql",
      "event.sql"
    ];

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      const schema = fs.readFileSync(filePath, "utf8");
      
      // Neon/Serverless mein raw string queries ke liye sql.query() use karte hain:
      await sql.query(schema);
      console.log(`📑 Executed ${file}`);
    }

    // Step 2: Ensure required columns exist
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);`;
    console.log("✅ Ensured 'password' column exists.");

    console.log("✅ All tables synced with Neon!");
    
    // Neon HTTP client stateless hota hai, isliye 'db' object hi 'sql' hai
    return sql;

  } catch (err) {
    console.error("❌ Neon Connection Error:", err.message);
    throw err;
  }
}