import express from "express";

const router = express.Router();

let db;

export const setBuilderDB = (database) => {
  db = database;
};

// Auto-ensure column is_active exists
const ensureColumn = async () => {
  if (!db) return;
  try {
    await db.query(`ALTER TABLE flows ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
  } catch (err) {
    // ignore
  }
};

// ────────── GET / (all or latest) ──────────
router.get("/", async (req, res) => {
  try {
    await ensureColumn();
    const { clientId, single } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId required" });
    }

    if (single === "true") {
      const result = await db.query(
        `SELECT id, name, data, is_active, created_at, updated_at
         FROM flows
         WHERE client_id = $1
         ORDER BY updated_at DESC
         LIMIT 1`,
        [clientId]
      );
      return res.json(result.rows[0] || null);
    }

    const result = await db.query(
      `SELECT id, name, data, is_active, created_at, updated_at
       FROM flows
       WHERE client_id = $1
       ORDER BY updated_at DESC`,
      [clientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("[GET /flows]", error);
    res.status(500).json({ error: "Failed to fetch flows" });
  }
});

// ────────── GET /:id (single flow by ID) ──────────
router.get("/:id", async (req, res) => {
  try {
    await ensureColumn();
    const { id } = req.params;

    if (!id || id === "new") {
      return res.json(null);
    }

    const result = await db.query(
      `SELECT id, name, data, is_active, created_at, updated_at
       FROM flows
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Flow not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("[GET /flows/:id]", error);
    res.status(500).json({ error: "Failed to fetch flow" });
  }
});

// ────────── POST / (upsert flow) ──────────
router.post("/", async (req, res) => {
  try {
    await ensureColumn();
    const { id, name, data, userId = 1, clientId, isActive = true } = req.body;

    if (!name?.trim() || !data || !clientId) {
      return res.status(400).json({
        error: "name, data, and clientId required",
      });
    }

    if (id && !isNaN(Number(id))) {
      const result = await db.query(
        `UPDATE flows
         SET name = $1, data = $2::jsonb, is_active = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [name.trim(), JSON.stringify(data), isActive, id]
      );
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }

    const result = await db.query(
      `INSERT INTO flows (user_id, client_id, name, data, is_active)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (client_id, name)
       DO UPDATE SET
         data = EXCLUDED.data,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [userId, clientId, name.trim(), JSON.stringify(data), isActive]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("[POST /flows]", error);
    res.status(500).json({ error: "Failed to save flow" });
  }
});

// ────────── PATCH /:id (toggle active) ──────────
router.patch("/:id", async (req, res) => {
  try {
    await ensureColumn();
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await db.query(
      `UPDATE flows SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [isActive, id]
    );

    res.json(result.rows[0] || { success: true });
  } catch (error) {
    console.error("[PATCH /flows/:id]", error);
    res.status(500).json({ error: "Failed to update flow status" });
  }
});

// ────────── DELETE / (by query params or /:id) ──────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM flows WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /flows/:id]", error);
    res.status(500).json({ error: "Failed to delete flow" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { name, clientId } = req.query;
    if (name && clientId) {
      await db.query(`DELETE FROM flows WHERE name = $1 AND client_id = $2`, [name, clientId]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /flows]", error);
    res.status(500).json({ error: "Failed to delete flow" });
  }
});

export default router;
