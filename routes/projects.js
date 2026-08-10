import express from "express";

const router = express.Router();
let db;

export const setProjectsDB = (database) => {
  db = database;
};

// GET: /api/projects?email=client@company.com
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    if (email) {
      const result = await db.query(
        "SELECT * FROM client_projects WHERE LOWER(client_email) = LOWER($1) ORDER BY created_at DESC",
        [email]
      );
      return res.json(result.rows);
    }

    const result = await db.query("SELECT * FROM client_projects ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST: /api/projects
router.post("/", async (req, res) => {
  try {
    const {
      id,
      clientEmail,
      clientName,
      name,
      type,
      scale,
      totalQuotation,
      progressPercent,
      status,
      assignedTeam,
      payments,
      updatesWarranty,
      testDetails,
      notes,
    } = req.body;

    const projId = id || `CTX-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const query = `
      INSERT INTO client_projects (
        id, client_email, client_name, name, type, scale,
        total_quotation, progress_percent, status,
        assigned_team, payments, updates_warranty, test_details, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        client_email = EXCLUDED.client_email,
        client_name = EXCLUDED.client_name,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        scale = EXCLUDED.scale,
        total_quotation = EXCLUDED.total_quotation,
        progress_percent = EXCLUDED.progress_percent,
        status = EXCLUDED.status,
        assigned_team = EXCLUDED.assigned_team,
        payments = EXCLUDED.payments,
        updates_warranty = EXCLUDED.updates_warranty,
        test_details = EXCLUDED.test_details,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      projId,
      clientEmail,
      clientName || "Client",
      name,
      type || "Custom Software",
      scale || "Growth Enterprise",
      totalQuotation || 0,
      progressPercent || 0,
      status || "Quotation Requested",
      JSON.stringify(assignedTeam || {}),
      JSON.stringify(payments || {}),
      JSON.stringify(updatesWarranty || {}),
      JSON.stringify(testDetails || {}),
      notes || "",
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating/updating project:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM client_projects WHERE id = $1", [id]);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
