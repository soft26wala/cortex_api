import pkg from "pg";
const { Client } = pkg;

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";

configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function connectDB() {
    let rootClient;
    let dbClient;

    // --- Configuration from URL ---
    // Render se DATABASE_URL variable lo
    const dbURL = process.env.DATABASE_URL; 
    
    if (!dbURL) {
        console.error("❌ Environment variable DATABASE_URL is missing!");
        throw new Error("Missing Database URL Configuration");
    }

    // Target database ka naam URL ke end se nikalna
    const dbName = dbURL.substring(dbURL.lastIndexOf('/') + 1); 
    
    // Root connection URL banane ke liye: Target DB name ko 'postgres' se replace karein
    const rootURL = dbURL.replace(`/${dbName}`, '/postgres');

    try {
        // Step 1: Connect to the root database (postgres)
        // Client connection string se sab details nikal lega
        rootClient = new Client({ connectionString: rootURL }); 

        await rootClient.connect();
        console.log("✅ Connected to root database (postgres).");

        // Step 2: Create target database if it doesn't exist
        const checkDBQuery = `SELECT 1 FROM pg_database WHERE datname='${dbName}'`;
        const result = await rootClient.query(checkDBQuery);

        if (result.rowCount === 0) {
            await rootClient.query(`CREATE DATABASE ${dbName}`);
            console.log(`📦 Database '${dbName}' created!`);
        } else {
            console.log(`📦 Database '${dbName}' already exists!`);
        }

        await rootClient.end();
        
        // Step 3: Connect to the target database
        dbClient = new Client({ connectionString: dbURL }); // Original URL use karein

        await dbClient.connect();
        console.log(`✅ Successfully connected to target database: ${dbName}`);

        // Step 4: Auto table creation (your original logic)
        const sqlFiles = [
            "buy_course.sql",
            "user.sql",
            "courses_offered.sql",
            "callback.sql",
        ];

        for (const file of sqlFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const schema = fs.readFileSync(filePath, "utf8");
                await dbClient.query(schema);
            } else {
                console.warn(`⚠️ Warning: SQL file not found: ${file}`);
            }
        }

        console.log("✅ All necessary tables created/verified on PostgreSQL!");

        return dbClient; // Return the active connection client

    } catch (error) {
        console.error("🛑 FATAL DATABASE CONNECTION ERROR:", error.message);
        
        // Clean up open clients
        if (rootClient) {
            try { await rootClient.end(); } catch (e) { /* ignore */ }
        }
        if (dbClient) {
            try { await dbClient.end(); } catch (e) { /* ignore */ }
        }
        
        // Propagate error
        throw error;
    }
}