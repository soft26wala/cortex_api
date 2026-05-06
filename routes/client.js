import express from "express"
const router = express.Router()

let db 
export const setClientDB = (database) => { db = database }

// 🔥 CREATE CLIENT
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      name,
      phone,
      phone_number_id,
      access_token,
      waba_id,
      plan_name,
      total_messages,
      expires_at
    } = req.body

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+$/, "")

    const result = await db.query(
      `INSERT INTO clients (
        user_id,
        name,
        phone,
        phone_number_id,
        access_token,
        waba_id,
        plan_name,
        total_messages,
        expires_at,
        slug
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        userId,
        name,
        phone,
        phone_number_id || null,
        access_token || null,
        waba_id || null,
        plan_name || "Basic",
        total_messages || 1000,
        expires_at || null,
        slug
      ]
    )

    res.json(result.rows[0])

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Create failed" })
  }
})


// 🔥 GET ALL CLIENTS (admin wise)
router.get("/:userId", async (req, res) => {
  const { userId } = req.params

  const result = await db.query(
    "SELECT * FROM clients WHERE user_id = $1",
    [userId]
  )

  res.json(result.rows)
})

// 🔥 GET SINGLE CLIENT BY SLUG
router.get("/slug/:slug", async (req, res) => {
  const { slug } = req.params

  const result = await db.query(
    "SELECT * FROM clients WHERE slug = $1",
    [slug]
  )

  res.json(result.rows[0])
})

// 🔥 UPDATE CLIENT
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      phone,
      phone_number_id,
      access_token,
      waba_id,
      plan_name,
      total_messages,
      expires_at
    } = req.body

    const result = await db.query(
      `UPDATE clients
       SET
         name = $1,
         phone = $2,
         phone_number_id = $3,
         access_token = $4,
         waba_id = $5,
         plan_name = $6,
         total_messages = $7,
         expires_at = $8
       WHERE id = $9
       RETURNING *`,
      [
        name,
        phone,
        phone_number_id,
        access_token,
        waba_id,
        plan_name,
        total_messages,
        expires_at,
        id
      ]
    )

    res.json(result.rows[0])

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Update failed" })
  }
})


export default router