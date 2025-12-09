// routes/courseRoutes.js
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

// Multer Storage Settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// =========================================
//      ADD COURSE API WITH IMAGE (POSTGRES)
// =========================================

router.post("/", upload.single("course_image"), async (req, res) => {
  try {
    const { course_name, course_desc, course_price } = req.body;
    const imageName = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO courses_offered
      (course_name, course_desc, course_price, course_image)
      VALUES ($1, $2, $3, $4)
      RETURNING course_id;
    `;

    const result = await db.query(sql, [
      course_name,
      course_desc,
      course_price,
      imageName
    ]);

    return res.json({
      message: "Course added successfully",
      course_id: result.rows[0].course_id,
      image_url: imageName ? `/uploads/${imageName}` : null
    });

  } catch (err) {
    console.log("Error:", err);
    return res.status(500).send(err);
  }
});

export default router;
