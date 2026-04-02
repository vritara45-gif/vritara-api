const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const result = await pool.query(
      "INSERT INTO location_logs (user_id, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, latitude, longitude]
    );

    res.json({ message: "Location updated", location: result.rows[0] });
  } catch (err) {
    console.error("Location error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
