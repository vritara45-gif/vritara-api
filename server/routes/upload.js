const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { authenticateToken } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|ogg|webm|mp4|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image and audio files are allowed"));
  },
});

router.post("/", authenticateToken, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const incidentId = req.body.incident_id || null;

    const result = await pool.query(
      "INSERT INTO media_storage (user_id, incident_id, filename, original_name, mimetype, file_size, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        req.user.id,
        incidentId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.path,
      ]
    );

    res.status(201).json({
      message: "File uploaded successfully",
      file: result.rows[0],
    });
  } catch (err) {
    console.error("Upload save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/simulate-capture", authenticateToken, async (req, res) => {
  const { incident_id, type } = req.body;

  if (!incident_id) {
    return res.status(400).json({ error: "incident_id required" });
  }

  try {
    const captureType = type === "audio" ? "audio" : "image";
    const ext = captureType === "audio" ? ".wav" : ".bmp";
    const subDir = captureType === "audio" ? "audio" : "images";
    const mimeType = captureType === "audio" ? "audio/wav" : "image/bmp";

    const dirPath = path.join(__dirname, "../uploads", subDir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    const filePath = path.join(dirPath, uniqueName);

    if (captureType === "image") {
      const width = 320;
      const height = 240;
      const headerSize = 54;
      const dataSize = width * height * 3;
      const fileSize = headerSize + dataSize;

      const buffer = Buffer.alloc(fileSize);
      buffer.write("BM", 0);
      buffer.writeUInt32LE(fileSize, 2);
      buffer.writeUInt32LE(headerSize, 10);
      buffer.writeUInt32LE(40, 14);
      buffer.writeInt32LE(width, 18);
      buffer.writeInt32LE(height, 22);
      buffer.writeUInt16LE(1, 26);
      buffer.writeUInt16LE(24, 28);
      buffer.writeUInt32LE(dataSize, 34);

      const r = Math.floor(Math.random() * 60) + 20;
      const g = Math.floor(Math.random() * 60) + 20;
      const b = Math.floor(Math.random() * 60) + 20;
      for (let i = headerSize; i < fileSize; i += 3) {
        buffer[i] = b + Math.floor(Math.random() * 30);
        buffer[i + 1] = g + Math.floor(Math.random() * 30);
        buffer[i + 2] = r + Math.floor(Math.random() * 30);
      }
      fs.writeFileSync(filePath, buffer);
    } else {
      const sampleRate = 8000;
      const duration = 2;
      const numSamples = sampleRate * duration;
      const dataSize = numSamples * 2;
      const header = Buffer.alloc(44);
      header.write("RIFF", 0);
      header.writeUInt32LE(36 + dataSize, 4);
      header.write("WAVE", 8);
      header.write("fmt ", 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(1, 22);
      header.writeUInt32LE(sampleRate, 24);
      header.writeUInt32LE(sampleRate * 2, 28);
      header.writeUInt16LE(2, 32);
      header.writeUInt16LE(16, 34);
      header.write("data", 36);
      header.writeUInt32LE(dataSize, 40);

      const data = Buffer.alloc(dataSize);
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.floor(Math.sin(i * 0.05) * 1000 + (Math.random() - 0.5) * 500);
        data.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
      }
      fs.writeFileSync(filePath, Buffer.concat([header, data]));
    }

    const originalName = `${captureType}_capture_${new Date().toISOString().replace(/[:.]/g, "-")}${ext}`;
    const stats = fs.statSync(filePath);

    const result = await pool.query(
      "INSERT INTO media_storage (user_id, incident_id, filename, original_name, mimetype, file_size, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [req.user.id, incident_id, uniqueName, originalName, mimeType, stats.size, filePath]
    );

    console.log(`[SIMULATED ${captureType.toUpperCase()} CAPTURE] File: ${uniqueName} for incident ${incident_id}`);

    res.status(201).json({
      message: `${captureType} captured (simulated)`,
      file: result.rows[0],
    });
  } catch (err) {
    console.error("Simulate capture error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/media", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ms.*, il.type as incident_type, il.status as incident_status
       FROM media_storage ms
       LEFT JOIN incident_logs il ON ms.incident_id = il.id
       WHERE ms.user_id = $1
       ORDER BY ms.created_at DESC`,
      [req.user.id]
    );

    res.json({ media: result.rows });
  } catch (err) {
    console.error("Get media error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/delete/:id", authenticateToken, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required to delete media" });
  }

  try {
    const userResult = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, userResult.rows[0].password);
    if (!valid) {
      return res.status(403).json({ error: "Incorrect password" });
    }

    const mediaResult = await pool.query(
      "SELECT * FROM media_storage WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: "Media not found" });
    }

    const media = mediaResult.rows[0];

    if (media.file_path && fs.existsSync(media.file_path)) {
      fs.unlinkSync(media.file_path);
    }

    await pool.query("DELETE FROM media_storage WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);

    res.json({ message: "Media deleted successfully" });
  } catch (err) {
    console.error("Delete media error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
