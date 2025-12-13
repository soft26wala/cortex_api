import express from "express";
import { connectDB } from "../db/db.js";

const router = express.Router();
let db;

// Connect DB (PostgreSQL)
(async () => {
  db = await connectDB();
})();
// GET all students
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        email,
        phone,
        age,
        course,
        total_fee,
        fee_paid,
        (total_fee - fee_paid) AS remaining_fee,
        created_at
      FROM student_register
      ORDER BY id DESC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


/* ===============================
   1. Student Register API
   =============================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, age, course, total_fee, fee_paid } = req.body;

    const query = `
      INSERT INTO student_register
      (name, email, phone, age, course, total_fee, fee_paid)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `;

    const values = [
      name,
      email,
      phone,
      age,
      course,
      total_fee,
      fee_paid || 0,
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ===============================
   2. Update ONLY Paid Fee API
   =============================== */
router.put("/update-fee/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fee_paid } = req.body;

    const query = `
      UPDATE student_register
      SET fee_paid = fee_paid + $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [fee_paid, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Fee updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
