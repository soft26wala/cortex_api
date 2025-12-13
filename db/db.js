import pkg from "pg";
const { Client } = pkg;

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";

// 1. .env variables load karein (Agar locally chala rahe hain toh)
configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function connectDB() {
    let rootClient;
    let dbClient;

    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASS;
    const dbName = process.env.DB_NAME;

    if (!dbHost || !dbPort || !dbUser || !dbPass || !dbName) {
        console.error("❌ Environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME) are missing!");
        throw new Error("Missing Database Configuration");
    }

    try {
        // Step 1: Connect to the root/default database (usually 'postgres')
        // NOTE: Agar Glacier Hosting 'postgres' database ka access nahi deta,
        // toh yahan 'postgres' ki jagah seedha dbName use karein.
        rootClient = new Client({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPass,
            database: "postgres", // Attempt to connect to default DB
        });

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
        dbClient = new Client({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPass,
            database: dbName, // Connect to the specific DB
        });

        await dbClient.connect();
        console.log(`✅ Successfully connected to target database: ${dbName}`);

        // Step 4: Auto table creation
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
        
        // Agar password authentication fail hota hai
        if (error.code === '28P01') {
            console.error("--- TROUBLESHOOTING ---");
            console.error("1. Render Dashboard mein DB_USER aur DB_PASS check karein (case-sensitive).");
            console.error("2. Glacier Hosting panel mein user ka password dobara reset karein aur Render mein update karein.");
            console.error("-----------------------");
        }
        
        // Jo clients open hain, unhe band karein
        if (rootClient) {
            try { await rootClient.end(); } catch (e) { /* ignore */ }
        }
        if (dbClient) {
            try { await dbClient.end(); } catch (e) { /* ignore */ }
        }
        
        // Process ko error ke saath terminate karein
        throw error;
    }
}