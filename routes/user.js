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
    const { name, email, password, provider } = req.body; // provider field batayega ki login kahan se hai
    const photo = req.file ? req.file.filename : null;

    // 1. Check karein ki user pehle se exist karta hai ya nahi
    const userExist = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userExist.rows.length > 0) {
      // Agar user social login se aa raha hai toh sirf login karwayein (Signup nahi)
      if (provider === 'google' || provider === 'github') {
        const token = jwt.sign({ id: userExist.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ message: "Login successful", token, user: userExist.rows[0] });
      }
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Password Handling
    let hashedPassword = null;
    if (password) {
      // Agar password hai (manual form), toh ise hash karein
      hashedPassword = await bcrypt.hash(password, 10);
    } 
    // Note: Agar social login hai, toh hashedPassword null hi rahega Database mein.

    // 3. Database mein Insert karein
    const sql = `
      INSERT INTO users (name, email, photo, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email;
    `;

    const result = await db.query(sql, [name, email, photo, hashedPassword]);
    const newUser = result.rows[0];

    // 4. JWT Token generate karein
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: "User created successfully",
      token,
      user: newUser,
      photo_url: photo ? `/uploads/${photo}` : null
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
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
