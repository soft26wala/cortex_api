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
  const { name, number, course } = req.body;

  if (!name || !number || !course) {
    return res.status(400).json({ msg: "Missing fields" });
  }

  try {
    const q = `
      INSERT INTO callback (name, number, course)
      VALUES ($1, $2, $3)
      RETURNING callback_id;
    `;

    const result = await db.query(q, [name, number, course]);

    res.status(200).json({
      msg: "Callback added",
      callback_id: result.rows[0].callback_id
    });

  } catch (err) {
    return res.status(500).json(err);
  }
});


// ===============================
// READ all callback
// ===============================
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM callback ORDER BY callback_id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: "Database Error", error: err });
  }
});


// ===============================
// UPDATE oncall (true/false)
// ===============================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { oncall } = req.body;

  try {
    const sql = `
      UPDATE callback
      SET oncall = $1
      WHERE callback_id = $2
    `;
    await db.query(sql, [oncall, id]);

    res.json({ msg: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update error", error: err });
  }
});


// ===============================
// DELETE callback
// ===============================
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await db.query("DELETE FROM callback WHERE callback_id = $1", [id]);

    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
