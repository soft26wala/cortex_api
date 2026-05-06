// routes/courseRoutes.js
import express from "express";
import multer from 'multer';
import cloudinary from '../cloudinaryConfig.js'

const router = express.Router();

// Store db reference (will be set by server.js)
let db = null;

// Export function to set db connection
export function setCourseDB(database) {
  db = database;
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ======================================================
// ADD COURSE (PostgreSQL Version)
// ======================================================
router.post("/", upload.single("course_image"), async (req, res) => {
    try {
        console.log("BODY:", req.body);
        // req.file अब लोकल पाथ के बजाय एक 'buffer' ऑब्जेक्ट होगा।
        // console.log("FILE:", JSON.stringify(req.file, null, 2)); 
        
        const {
            course_name,
            course_desc,
            course_price,
            total_price
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "File missing" });
        }

        // --- 🚀 Cloudinary अपलोड लॉजिक यहाँ शुरू होता है 🚀 ---

        // 1. Buffer को Data URI में बदलें
        // Cloudinary को अपलोड करने के लिए Buffer को Base64 स्ट्रिंग में बदलना पड़ता है।
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        // 2. Cloudinary पर अपलोड करें
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "course_images", // Cloudinary में एक फ़ोल्डर
            resource_type: "auto"
        });

        // 3. Cloudinary से secure URL प्राप्त करें
        const imageUrl = result.secure_url;
        const publicId = result.public_id;

        // --- Cloudinary अपलोड लॉजिक यहाँ समाप्त होता है ---

        const sql = `
            INSERT INTO courses_offered
            (course_name, course_desc, course_price, course_image, total_price)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        
        // 💡 Note: public_id को भी डेटाबेस में सहेजना अच्छा अभ्यास है 
        // ताकि बाद में आप इमेज को Cloudinary से हटा सकें।
        const dbResult = await db.query(sql, [
            course_name,
            course_desc,
            course_price,
            imageUrl, // Cloudinary URL
            total_price,
        ]);

        console.log("DB RESULT:", dbResult.rows);

        return res.json({
            success: true,
            data: dbResult.rows[0],
            message: "Course created and image uploaded successfully."
        });

    } catch (err) {
        console.error("ERROR:", err.message);
        // Cloudinary error भी यहाँ आ सकता है
        return res.status(500).json({ error: "Failed to upload or insert data: " + err.message });
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
