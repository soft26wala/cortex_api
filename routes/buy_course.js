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


// =========================================
//      ADD COURSE API WITH IMAGE (POSTGRES)
// =========================================

router.post("/", async (req, res) => {
    // Payment success hone ke baad ka logic
const { course_name, user_id, course_id } = req.body; 

const query = `
  INSERT INTO buy_course (course_name, user_id, course_id)
  VALUES ($1, $2, $3)
  RETURNING *;
`;

const values = [course_name, user_id, course_id];

try {
    const result = await pool.query(query, values);
    res.status(200).json({
        success: true,
        message: "Course purchased and recorded successfully!",
        data: result.rows[0]
    });
} catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Could not save purchase details" });
}
  
});

router.get("/", async (req, res) => {
    const { userId } = req.params; // Ya req.user.id agar aap JWT use kar rahe hain

    try {
        const courses = await pool.query(
            "SELECT * FROM buy_course WHERE user_id = $1", 
            [userId]
        );
        res.status(200).json(courses.rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching courses" });
    }
})

export default router;
