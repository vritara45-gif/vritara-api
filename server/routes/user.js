const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, phone, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { username, phone } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (username) {
      fields.push(`username = $${idx++}`);
      values.push(username);
    }
    if (phone) {
      fields.push(`phone = $${idx++}`);
      values.push(phone);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, username, email, phone`,
      values
    );

    res.json({ message: "Profile updated", user: result.rows[0] });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
