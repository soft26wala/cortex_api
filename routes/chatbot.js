import express from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "../db/db.js";

const router = express.Router();

let db;

// Connect DB only once
(async () => {
  db = await connectDB();
})();




router.post("/order", async (req, res) => {
  const { name, phone, product, address } = req.body;

  try {
    const user = await db.query(
      "INSERT INTO users(name, phone) VALUES($1,$2) RETURNING id",
      [name, phone]
    );

    await db.query(
      "INSERT INTO orders(user_id, product, address) VALUES($1,$2,$3)",
      [user.rows[0].id, product, address]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
