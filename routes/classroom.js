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
router.post("/", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id ) {
    return res.status(400).json({ msg: "Your not login" });
  }

  try {
   const user = await db.query("SELECT * FROM users WHERE id::text = $1 OR email = $2", [user_id, user_id]);
        if (!user.rows.length) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
      const userid = user.rows[0].id;
      const course = await db.query("SELECT * FROM payments WHERE user_id = $1", [userid]);

    res.status(200).json({
      msg: "Callback added",
      callback_id: result.rows[0].callback_id,
      course
    });

  } catch (err) {
    return res.status(500).json(err);
  }
});


export default router;
