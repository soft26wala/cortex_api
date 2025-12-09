import express from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "../db/db.js";

const router = express.Router();
let db;

// Connect DB once
(async () => {
  db = await connectDB();
})();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==============================
// CREATE User (POSTGRES)
// ==============================
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { name, email } = req.body;
    const photo = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO users (name, email, photo)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    const result = await db.query(sql, [name, email, photo]);

    res.json({
      message: "User created",
      id: result.rows[0].id,
      photo_url: photo ? `/uploads/${photo}` : null
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

// ==============================
// GET ALL Users
// ==============================
router.get("/all", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ==============================
// GET Single User
// ==============================
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id=$1", [req.params.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).send(err);
  }
});

// ==============================
// UPDATE User (with photo)
// ==============================
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const { name, phone, age, email, gender } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (photo) {
      const sql = `
        UPDATE users
        SET name=$1, phone=$2, age=$3, email=$4, gender=$5, photo=$6
        WHERE id=$7
      `;
      await db.query(sql, [name, phone, age, email, gender, photo, req.params.id]);
    } else {
      const sql = `
        UPDATE users
        SET name=$1, phone=$2, age=$3, email=$4, gender=$5
        WHERE id=$6
      `;
      await db.query(sql, [name, phone, age, email, gender, req.params.id]);
    }

    res.json({
      message: "User updated",
      photo_url: photo ? `/uploads/${photo}` : null
    });

  } catch (err) {
    res.status(500).send(err);
  }
});

// ==============================
// DELETE User
// ==============================
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
