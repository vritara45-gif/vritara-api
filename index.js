require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeDatabase, pool } = require("./server/db");

const validateApiKey = require("./server/middleware/apiKey");
const { authenticateToken } = require("./server/middleware/auth");

const authRoutes = require("./server/routes/auth");
const userRoutes = require("./server/routes/user");
const contactRoutes = require("./server/routes/contacts");
const sosRoutes = require("./server/routes/sos");
const uploadRoutes = require("./server/routes/upload");
const locationRoutes = require("./server/routes/location");
const deviceRoutes = require("./server/routes/device");

const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// Disable caching (important for media refresh)
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// ======================
// STATIC FILES
// ======================

// Frontend
app.use(express.static(path.join(__dirname, "public")));

// 🔥 IMPORTANT: serve uploaded media files
app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));

// ======================
const PORT = parseInt(process.env.PORT || "10000", 10);

// ======================
// BASIC ROUTES
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/status", (req, res) => {
  res.json({ status: "API is live" });
});

// ======================
// API ROUTES
// ======================
app.use("/api", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/device", deviceRoutes);

// ======================
// INCIDENT HISTORY ROUTE
// ======================
app.get("/api/incidents", authenticateToken, async (req, res) => {
  try {
    const incidentsResult = await pool.query(
      "SELECT * FROM incident_logs WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );

    const incidents = [];

    for (const incident of incidentsResult.rows) {
      let smsRows = [];
      let broadcastRows = [];
      let mediaRows = [];

      try {
        const smsResult = await pool.query(
          "SELECT contact_name, contact_phone, status, created_at FROM sms_logs WHERE incident_id = $1",
          [incident.id]
        );
        smsRows = smsResult.rows;
      } catch (err) {}

      try {
        const broadcastResult = await pool.query(
          `SELECT nb.distance_meters, nb.status, nb.created_at, u.username as receiver_name
           FROM nearby_broadcasts nb
           LEFT JOIN users u ON nb.receiver_id = u.id
           WHERE nb.incident_id = $1`,
          [incident.id]
        );
        broadcastRows = broadcastResult.rows;
      } catch (err) {}

      try {
        // 🔥 IMPORTANT: include file_path (needed for frontend)
        const mediaResult = await pool.query(
          `SELECT id, filename, original_name, mimetype, file_size, file_path, created_at 
           FROM media_storage 
           WHERE incident_id = $1`,
          [incident.id]
        );
        mediaRows = mediaResult.rows;
      } catch (err) {}

      incidents.push({
        ...incident,
        sms_notifications: smsRows,
        nearby_broadcasts: broadcastRows,
        media_files: mediaRows,
      });
    }

    res.json({ incidents });
  } catch (err) {
    console.error("Get incidents error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// IOT DEVICE ROUTES
// ======================
app.post("/api/sensor-data", validateApiKey, (req, res) => {
  console.log("Sensor Data Received:", req.body);

  const { sound_level, motion_level } = req.body;
  let emergency = false;

  if (sound_level > 80 && motion_level > 1.5) {
    emergency = true;
  }

  res.json({
    emergency,
    message: emergency ? "Emergency detected" : "Normal condition",
  });
});

app.post("/api/emergency/manual", validateApiKey, (req, res) => {
  console.log("Manual Emergency Triggered");
  res.json({ emergency: true, message: "Manual SOS Triggered" });
});

app.post("/api/heartbeat", validateApiKey, (req, res) => {
  res.json({ status: "Device alive" });
});

// ======================
// START SERVER
// ======================
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ VRITARA Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
