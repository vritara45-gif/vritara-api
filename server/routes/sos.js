const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

// ===============================
// HELPER FUNCTIONS
// ===============================
async function saveLocationLog(client, userId, latitude, longitude) {
  if (latitude != null && longitude != null) {
    await client.query(
      "INSERT INTO location_logs (user_id, latitude, longitude) VALUES ($1, $2, $3)",
      [userId, latitude, longitude]
    );
  }
}

// ===============================
// GET SOS STATE
// ===============================
router.get("/state", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT emergency_state, active_incident_id FROM users WHERE id = $1 LIMIT 1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      state: result.rows[0].emergency_state || "normal",
      active_incident_id: result.rows[0].active_incident_id || null,
    });
  } catch (err) {
    console.error("SOS state error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ===============================
// TOGGLE SOS
// ===============================
router.post("/toggle", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT emergency_state, active_incident_id FROM users WHERE id = $1 LIMIT 1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    const { latitude, longitude, message } = req.body;

    // ===============================
    // IF NORMAL -> ACTIVATE EMERGENCY
    // ===============================
    if (user.emergency_state !== "emergency") {
      await saveLocationLog(client, req.user.id, latitude, longitude);

      const incidentResult = await client.query(
        `INSERT INTO incident_logs
         (user_id, type, latitude, longitude, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          req.user.id,
          "manual",
          latitude || null,
          longitude || null,
          message || "Emergency SOS triggered from app",
          "active",
        ]
      );

      const incident = incidentResult.rows[0];

      await client.query(
        "UPDATE users SET emergency_state='emergency', active_incident_id=$1 WHERE id=$2",
        [incident.id, req.user.id]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        state: "emergency",
        message: "SOS activated",
        incident,
        notifications: {
          sms_sent: 0,
          nearby_broadcasts: 0
        }
      });
    }

    // ===============================
    // IF EMERGENCY -> MARK SAFE
    // ===============================
    let resolvedIncident = null;

    if (user.active_incident_id) {
      const resolvedResult = await client.query(
        `UPDATE incident_logs
         SET status = 'resolved'
         WHERE id = $1
         RETURNING *`,
        [user.active_incident_id]
      );

      resolvedIncident = resolvedResult.rows[0] || null;
    }

    await client.query(
      "UPDATE users SET emergency_state='normal', active_incident_id=NULL WHERE id=$1",
      [req.user.id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      state: "normal",
      message: "Emergency resolved",
      incident: resolvedIncident,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("SOS toggle error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ===============================
// MANUAL SOS (APP)
// ===============================
router.post("/manual", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { latitude, longitude, message } = req.body;

    await saveLocationLog(client, req.user.id, latitude, longitude);

    const incidentResult = await client.query(
      "INSERT INTO incident_logs (user_id, type, latitude, longitude, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        req.user.id,
        "manual",
        latitude || null,
        longitude || null,
        message || "Manual SOS triggered",
        "active",
      ]
    );

    const incident = incidentResult.rows[0];

    await client.query(
      "UPDATE users SET emergency_state='emergency', active_incident_id=$1 WHERE id=$2",
      [incident.id, req.user.id]
    );

    await client.query("COMMIT");

    res.json({
      emergency: true,
      message: "Manual SOS triggered",
      incident,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ===============================
// AUTOMATIC SOS (SENSOR)
// ===============================
router.post("/automatic", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { latitude, longitude, sound_level, motion_level } = req.body;

    await saveLocationLog(client, req.user.id, latitude, longitude);

    const incidentResult = await client.query(
      "INSERT INTO incident_logs (user_id, type, latitude, longitude, message, sound_level, motion_level, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        req.user.id,
        "automatic",
        latitude || null,
        longitude || null,
        `Auto: sound=${sound_level}, motion=${motion_level}`,
        sound_level,
        motion_level,
        "active"
      ]
    );

    const incident = incidentResult.rows[0];

    await client.query(
      "UPDATE users SET emergency_state='emergency', active_incident_id=$1 WHERE id=$2",
      [incident.id, req.user.id]
    );

    await client.query("COMMIT");

    res.json({
      emergency: true,
      message: "Automatic SOS triggered",
      incident,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Automatic SOS error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ===============================
// ESP32 DEVICE SOS (NO AUTH)
// ===============================
router.post("/device", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { device, latitude, longitude } = req.body;

    const userId = 1; // 🔥 change later for real mapping

    if (latitude != null && longitude != null) {
      await client.query(
        "INSERT INTO location_logs (user_id, latitude, longitude) VALUES ($1, $2, $3)",
        [userId, latitude, longitude]
      );
    }

    const incidentResult = await client.query(
      "INSERT INTO incident_logs (user_id, type, latitude, longitude, message, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        userId,
        "device",
        latitude || null,
        longitude || null,
        `Device SOS from ${device}`,
        "active",
      ]
    );

    const incident = incidentResult.rows[0];

    await client.query(
      "UPDATE users SET emergency_state='emergency', active_incident_id=$1 WHERE id=$2",
      [incident.id, userId]
    );

    await client.query("COMMIT");

    console.log("🚨 DEVICE SOS:", incident.id);

    res.json({
      success: true,
      message: "Device SOS triggered",
      incident,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ===============================
// EXPORT
// ===============================
module.exports = router;
