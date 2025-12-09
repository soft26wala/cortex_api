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
  // Step 1: Connect to root database (postgres)
  const root = new Client({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    database: "postgres", // root DB
  });

  await root.connect();

  // Step 2: Create database if not exists (Postgres way)
  const dbName = process.env.DATABASE;

  const checkDBQuery = `SELECT 1 FROM pg_database WHERE datname='${dbName}'`;
  const result = await root.query(checkDBQuery);

  if (result.rowCount === 0) {
    await root.query(`CREATE DATABASE ${dbName}`);
    console.log(`📦 Database '${dbName}' created!`);
  } else {
    console.log(`📦 Database '${dbName}' already exists!`);
  }

  await root.end();

  // Step 3: Connect to target database
  const db = new Client({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    database: dbName,
  });

  await db.connect();

  // Step 4: Auto table creation (Postgres executes entire SQL)
  const buy_course = path.join(__dirname, "buy_course.sql");
  const users = path.join(__dirname, "user.sql");
  const courses_offered = path.join(__dirname, "courses_offered.sql");
  const callback = path.join(__dirname, "callback.sql");

  const schema = fs.readFileSync(buy_course, "utf8");
  const schema1 = fs.readFileSync(users, "utf8");
  const schema2 = fs.readFileSync(courses_offered, "utf8");
  const schema3 = fs.readFileSync(callback, "utf8");

  await db.query(schema); // buy_course.sql
  await db.query(schema1); // users.sql
  await db.query(schema2); // courses_offered.sql
  await db.query(schema3); // callback.sql

  console.log("✅ All tables created on PostgreSQL!");

  return db;
}
