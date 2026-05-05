import express from "express"
const router = express.Router()

let db 
export const setClientDB = (database) => { db = database }

// 🔥 CREATE CLIENT
router.post("/", async (req, res) => {
  const { name, phone, userId } = req.body

  const slug = name.toLowerCase().replace(/\s+/g, "-")

  const result = await db.query(
    `INSERT INTO clients (user_id, name, phone, slug)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [userId, name, phone, slug]
  )

  res.json(result.rows[0])
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
  const { id } = req.params
  const { name, phone } = req.body

  const result = await db.query(
    `UPDATE clients
     SET name=$1, phone=$2
     WHERE id=$3
     RETURNING *`,
    [name, phone, id]
  )

  res.json(result.rows[0])
})

export default router