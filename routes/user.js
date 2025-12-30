import express from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "../db/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


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
    // 1. Data Extract karein (Body check karein)
    const { name, email, password, provider } = req.body;
    const photo = req.file ? req.file.filename : (req.body.photo || null);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 2. Check karein user pehle se hai ya nahi
    const userExist = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userExist.rows.length > 0) {
      // Agar user exist karta hai (Social ya Manual), toh directly login karwa do
      const user = userExist.rows[0];
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      return res.status(200).json({
        message: "Login successful",
        token,
        user: { id: user.id, name: user.name, email: user.email, photo: user.photo }
      });
    }

    // 3. Naye User ke liye Password Hashing
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } 
    // Social login mein password null rahega, DB mein password column NULLABLE hona chahiye.

    // 4. DATABASE MEIN INSERT (Sabse important step)
    const sql = `
      INSERT INTO users (name, email, photo, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, photo;
    `;

    const result = await db.query(sql, [name, email, photo, hashedPassword]);
    const newUser = result.rows[0];

    // 5. AUTO-LOGIN: Signup hote hi Token generate karein
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Response bhejein (Ab user ko dobara login nahi karna padega)
    res.status(201).json({
      message: "User registered and logged in successfully",
      token,
      user: newUser
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
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


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Database se user ko email ke zariye dhundein
    const userQuery = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const user = result.rows[0];

    // 2. Check karein ki user ne Google se sign up kiya tha ya password se
    if (!user.password && (user.provider === 'google' || user.provider === 'github')) {
      return res.status(400).json({ 
        message: "Is account ne Social Login use kiya hai. Please Sign in with Google/GitHub." 
      });
    }

    // 3. Password compare karein (bcrypt.compare)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    // 4. JWT Token generate karein
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } // Token 7 din tak valid rahega
    );

    // 5. Success Response
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


export default router;
