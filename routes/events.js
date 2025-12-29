import express from 'express';
import { connectDB } from "../db/db.js";

const router = express.Router();

let db;

// Connect DB only once
(async () => {
  db = await connectDB();
})();




// --- 1. GET: Saare events fetch karne ke liye ---
router.get('/events', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM company_events ORDER BY id DESC");
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// --- 2. POST: Naya interview/event add karne ke liye ---
router.post('/events', async (req, res) => {
    const { type, title, candidate_name, event_date, event_time, link } = req.body;
    try {
        const result = await db.query(
            "INSERT INTO company_events (type, title, candidate_name, event_date, event_time, link) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [type, title, candidate_name, event_date, event_time, link]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Insert Fail", error: err.message });
    }
});

// --- 3. PUT: Data update karne ke liye ---
router.put('/events/:id', async (req, res) => {
    const { id } = req.params;
    const { title, link, event_date } = req.body;
    try {
        const result = await db.query(
            "UPDATE company_events SET title = $1, link = $2, event_date = $3 WHERE id = $4 RETURNING *",
            [title, link, event_date, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Event not found" });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Update Fail", error: err.message });
    }
});

// --- 4. DELETE: Event delete karne ke liye ---
router.delete('/events/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query("DELETE FROM company_events WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Event not found" });
        res.status(200).json({ message: "Event Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ message: "Delete Fail", error: err.message });
    }
});

export default router;