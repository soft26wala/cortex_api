// routes/courseRoutes.js
import express from "express";
import { connectDB } from "../db/db.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();
let db;

// Connect DB (PostgreSQL)
(async () => {
  db = await connectDB();
})();

// ======================================================
// ADD COURSE (PostgreSQL Version)
// ======================================================
router.post("/", upload.single("course_image"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", JSON.stringify(req.file, null, 2));

    const {
      course_name,
      course_desc,
      course_price,
      total_price
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File missing" });
    }

    const imageUrl = req.file.path;

    const sql = `
      INSERT INTO courses_offered
      (course_name, course_desc, course_price, course_image, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await db.query(sql, [
      course_name,
      course_desc,
      course_price,
      imageUrl,
      total_price
    ]);

    console.log("DB RESULT:", result.rows);

    return res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (err) {
    console.error("DB ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});



// ======================================================
// GET ALL COURSES
// ======================================================
router.get("/all", async (req, res) => {
  try {
    const sql = "SELECT * FROM courses_offered ORDER BY course_id DESC";
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ======================================================
// GET SINGLE COURSE
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    const sql = "SELECT * FROM courses_offered WHERE course_id = $1";
    const result = await db.query(sql, [req.params.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).send(err);
  }
});

// ======================================================
// UPDATE COURSE (NO IMAGE CHANGE)
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const { course_name, course_desc, course_price, total_price } = req.body;
    const sql = `
      UPDATE courses_offered
      SET course_name = $1, course_desc = $2, course_price = $3 , total_price = $4
      WHERE course_id = $5
    `;
    await db.query(sql, [
      course_name,
      course_desc,
      course_price,
      total_price,
      req.params.id
    ]);

    res.json({ message: "Course updated successfully" });
  } catch (err) {
    res.status(500).send(err);
  }
});

// ======================================================
// DELETE COURSE
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM courses_offered WHERE course_id = $1", [
      req.params.id
    ]);
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
