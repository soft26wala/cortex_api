import express from "express";
// import multer from "multer";
// import path from "path";
import { connectDB } from "../db/db.js";

const router = express.Router();

let db;

export const setBuilderDB = (database) => {
  db = database;
};

router.get("/", async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId required" });
    }

    const result = await db.query(
      `SELECT id, name, data, created_at, updated_at
       FROM flows
       WHERE client_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("[GET /flow]", error);
    res.status(500).json({ error: "Failed to fetch flow" });
  }
});

// ─────────────────────────────────────────
// POST → upsert flow
// ─────────────────────────────────────────
router.post("/", async (req, res) => {
  console.log("🔥 BUILDER ROUTE HIT");

  try {
    const { name, data, userId, clientId } = req.body;

    if (!name?.trim() || !data || !userId || !clientId) {
      return res.status(400).json({
        error: "name, data, userId, clientId required",
      });
    }

    const result = await db.query(
      `INSERT INTO flows (user_id, client_id, name, data)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (client_id, name)
       DO UPDATE SET
         data = EXCLUDED.data,
         updated_at = NOW()
       RETURNING *`,
      [userId, clientId, name.trim(), JSON.stringify(data)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("[POST /flow]", error);
    res.status(500).json({ error: "Failed to save flow" });
  }
});

// ─────────────────────────────────────────
// DELETE → by name
// ─────────────────────────────────────────
router.delete("/", async (req, res) => {
  const { name, clientId } = req.query;

  if (!name || !clientId) {
    return res.status(400).json({
      error: "name and clientId required",
    });
  }

  await db.query(
    `DELETE FROM flows WHERE name = $1 AND client_id = $2`,
    [name, clientId]
  );

  res.json({ success: true });
});
export default router;
