const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM emergency_contacts WHERE user_id = $1",
      [req.user.id]
    );

    if (parseInt(countResult.rows[0].count) >= 3) {
      return res.status(400).json({ error: "Maximum 3 emergency contacts allowed" });
    }

    const result = await pool.query(
      "INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.id, name, phone, relationship || "Other"]
    );

    res.status(201).json({ message: "Contact added", contact: result.rows[0] });
  } catch (err) {
    console.error("Add contact error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY created_at",
      [req.user.id]
    );
    res.json({ contacts: result.rows });
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ message: "Contact deleted" });
  } catch (err) {
    console.error("Delete contact error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
