const express = require("express");
const { pool } = require("../db");

const router = express.Router();

/*
  DEMO PROTOTYPE LINK
  One device → One email account
*/
const LINKED_EMAIL = "swasthikshetty547@gmail.com";
const LINKED_DEVICE_ID = "VRITARA001";

// ==========================
// DEVICE SOS ROUTE
// ==========================
router.post("/sos", async (req, res) => {
  const client = await pool.connect();

  try {
    const { device_id, latitude, longitude, trigger_type, sound_level, motion_level } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    // Check if correct prototype device
    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({
        error: "Unknown device",
        received_device_id: device_id,
        expected_device_id: LINKED_DEVICE_ID
      });
    }

    // Find your app user by email
    const userResult = await client.query(
      "SELECT id, username, email FROM users WHERE email = $1 LIMIT 1",
      [LINKED_EMAIL]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: "Linked user not found in database",
        linked_email: LINKED_EMAIL
      });
    }

    const linkedUser = userResult.rows[0];
    const user_id = linkedUser.id;

    await client.query("BEGIN");

    // Save location if available
    if (latitude != null && longitude != null) {
      await client.query(
        "INSERT INTO location_logs (user_id, latitude, longitude) VALUES ($1, $2, $3)",
        [user_id, latitude, longitude]
      );
    }

    // Save incident to YOUR history
    const incidentResult = await client.query(
      `INSERT INTO incident_logs 
       (user_id, type, latitude, longitude, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        user_id,
        "device",
        latitude || null,
        longitude || null,
        `Device SOS Triggered (${trigger_type || "unknown"}) | Sound: ${sound_level || 0} | Motion: ${motion_level || 0}`,
        "active"
      ]
    );

    const incident = incidentResult.rows[0];

    // Update user emergency state
    await client.query(
      "UPDATE users SET emergency_state='emergency', active_incident_id=$1 WHERE id=$2",
      [incident.id, user_id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Device SOS saved successfully",
      linked_user: linkedUser,
      incident
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Device SOS error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
});

// ==========================
// DEVICE HEARTBEAT ROUTE
// ==========================
router.post("/heartbeat", async (req, res) => {
  try {
    const { device_id } = req.body || {};

    res.json({
      success: true,
      status: "Device alive",
      device_id: device_id || "unknown",
      linked_email: LINKED_EMAIL,
      linked_device_id: LINKED_DEVICE_ID
    });
  } catch (err) {
    console.error("Heartbeat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
