const express = require("express");
const path = require("path");
const fs = require("fs");
const { pool } = require("../db");
const validateApiKey = require("../middleware/apiKey");

const router = express.Router();

/*
  DEMO LINK:
  Device VRITARA001 -> linked to this email
*/
const LINKED_EMAIL = "swasthikshetty547@gmail.com";
const LINKED_DEVICE_ID = "VRITARA001";

// ==========================
// STORAGE PATH
// ==========================
const uploadDir = path.join(__dirname, "../uploads/device-media");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================
// DEVICE SOS ROUTE
// ==========================
router.post("/sos", validateApiKey, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      device_id,
      trigger_type,
      latitude,
      longitude,
      sound_level,
      motion_level
    } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id required" });
    }

    // Check if correct device
    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({
        error: "Unknown device",
        received_device_id: device_id,
        expected_device_id: LINKED_DEVICE_ID
      });
    }

    // Find linked user from email
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

    const incidentResult = await client.query(
      `INSERT INTO incident_logs (user_id, type, latitude, longitude, message, status, created_at)
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
// DEVICE IMAGE UPLOAD ROUTE
// ==========================
// ESP32 sends RAW JPEG bytes directly
router.post(
  "/upload-image",
  validateApiKey,
  express.raw({ type: "image/jpeg", limit: "10mb" }),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const device_id = req.headers["x-device-id"] || LINKED_DEVICE_ID;

      if (device_id !== LINKED_DEVICE_ID) {
        return res.status(404).json({
          error: "Unknown device",
          received_device_id: device_id,
          expected_device_id: LINKED_DEVICE_ID
        });
      }

      const userResult = await client.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [LINKED_EMAIL]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Linked user not found" });
      }

      const user_id = userResult.rows[0].id;

      const latestIncidentResult = await client.query(
        `SELECT * FROM incident_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [user_id]
      );

      if (latestIncidentResult.rows.length === 0) {
        return res.status(404).json({ error: "No incident found for image linking" });
      }

      const incident = latestIncidentResult.rows[0];

      if (!req.body || !req.body.length) {
        return res.status(400).json({ error: "No image data received" });
      }

      const fileName = `device_image_${Date.now()}.jpg`;
      const filePathAbs = path.join(uploadDir, fileName);
      const filePathDb = `/uploads/device-media/${fileName}`;

      fs.writeFileSync(filePathAbs, req.body);

      const mediaResult = await client.query(
        `INSERT INTO media_storage
         (user_id, incident_id, filename, original_name, mimetype, file_size, file_path, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          user_id,
          incident.id,
          fileName,
          fileName,
          "image/jpeg",
          req.body.length,
          filePathDb
        ]
      );

      res.json({
        success: true,
        message: "Image uploaded successfully",
        media: mediaResult.rows[0]
      });
    } catch (err) {
      console.error("Device image upload error:", err);
      res.status(500).json({ error: "Server error", details: err.message });
    } finally {
      client.release();
    }
  }
);

// ==========================
// DEVICE HEARTBEAT ROUTE
// ==========================
router.post("/heartbeat", validateApiKey, async (req, res) => {
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
  const user_id = userResult.rows[0].id;

  const incidentResult = await client.query(
    `SELECT * FROM incident_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [user_id]
  );

  if (incidentResult.rows.length === 0) {
    throw new Error("No incident found");
  }

  return {
    user_id,
    incident: incidentResult.rows[0],
  };
}

// ==========================
// DEVICE SOS ROUTE
// ==========================
router.post("/sos", validateApiKey, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      device_id,
      trigger_type,
      latitude,
      longitude,
      sound_level,
      motion_level,
    } = req.body;

    if (device_id !== LINKED_DEVICE_ID) {
      return res.status(404).json({ error: "Unknown device" });
    }

    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [LINKED_EMAIL]
    );

    const user_id = userResult.rows[0].id;

    await client.query("BEGIN");

    const incidentResult = await client.query(
      `INSERT INTO incident_logs 
      (user_id, type, latitude, longitude, message, status, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *`,
      [
        user_id,
        "device",
        latitude || null,
        longitude || null,
        `Device SOS (${trigger_type || "unknown"}) | Sound:${sound_level || 0} Motion:${motion_level || 0}`,
        "active",
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      incident: incidentResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================
// IMAGE UPLOAD
// ==========================
router.post(
  "/upload-image",
  validateApiKey,
  express.raw({ type: "image/jpeg", limit: "10mb" }),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const device_id = req.headers["x-device-id"];

      if (device_id !== LINKED_DEVICE_ID) {
        return res.status(404).json({ error: "Unknown device" });
      }

      if (!req.body || !req.body.length) {
        return res.status(400).json({ error: "No image received" });
      }

      const { user_id, incident } = await getUserAndIncident(client);

      const fileName = `img_${Date.now()}.jpg`;
      const absPath = path.join(uploadDir, fileName);
      const dbPath = `/uploads/device-media/${fileName}`;

      fs.writeFileSync(absPath, req.body);

      await client.query(
        `INSERT INTO media_storage
        (user_id, incident_id, filename, original_name, mimetype, file_size, file_path, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [
          user_id,
          incident.id,
          fileName,
          fileName,
          "image/jpeg",
          req.body.length,
          dbPath,
        ]
      );

      res.json({ success: true, file: dbPath });
    } catch (err) {
      console.error("Image upload error:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

// ==========================
// AUDIO UPLOAD
// ==========================
router.post(
  "/upload-audio",
  validateApiKey,
  express.raw({ type: "audio/wav", limit: "10mb" }),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const device_id = req.headers["x-device-id"];

      if (device_id !== LINKED_DEVICE_ID) {
        return res.status(404).json({ error: "Unknown device" });
      }

      if (!req.body || !req.body.length) {
        return res.status(400).json({ error: "No audio received" });
      }

      const { user_id, incident } = await getUserAndIncident(client);

      const fileName = `audio_${Date.now()}.wav`;
      const absPath = path.join(uploadDir, fileName);
      const dbPath = `/uploads/device-media/${fileName}`;

      fs.writeFileSync(absPath, req.body);

      await client.query(
        `INSERT INTO media_storage
        (user_id, incident_id, filename, original_name, mimetype, file_size, file_path, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [
          user_id,
          incident.id,
          fileName,
          fileName,
          "audio/wav",
          req.body.length,
          dbPath,
        ]
      );

      res.json({ success: true, file: dbPath });
    } catch (err) {
      console.error("Audio upload error:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
);

// ==========================
// HEARTBEAT
// ==========================
router.post("/heartbeat", validateApiKey, (req, res) => {
  res.json({ success: true, status: "alive" });
});

module.exports = router;
