import express from "express";
import { connectDB } from "../db/db.js";

const router = express.Router();

let db;

// Connect PostgreSQL only once
(async () => {
  db = await connectDB();
})();


// ===============================
// CREATE callback (POSTGRESQL)
// ===============================
router.get("/", async (req, res) => {
  // read user_id from query string (axios `{ params: { user_id } }`)
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ msg: "User not logged in" });
  }

  try {
   const user = await db.query("SELECT * FROM users WHERE id::text = $1 OR email = $2", [user_id, user_id]);
        if (!user.rows.length) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
      const userid = user.rows[0].id;
      const course = await db.query("SELECT * FROM payments WHERE user_id = $1", [userid]);

    res.status(200).json({
      success: true,
      user: user.rows[0],
      course: course.rows
    });

  } catch (err) {
    return res.status(500).json(err);
  }
});


export default router;
