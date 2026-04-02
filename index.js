const express = require("express");
const cors = require("cors");
const path = require("path");
const { initializeDatabase } = require("./server/db");

const validateApiKey = require("./server/middleware/apiKey");
const authRoutes = require("./server/routes/auth");
const userRoutes = require("./server/routes/user");
const contactRoutes = require("./server/routes/contacts");
const sosRoutes = require("./server/routes/sos");
const uploadRoutes = require("./server/routes/upload");
const locationRoutes = require("./server/routes/location");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));

const PORT = parseInt(process.env.PORT || "5000", 10);

app.get("/status", (req, res) => {
  res.json({ status: "API is live" });
});

app.use("/api", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/location", locationRoutes);

const { authenticateToken } = require("./server/middleware/auth");
const { pool } = require("./server/db");
app.get("/api/incidents", authenticateToken, async (req, res) => {
  try {
    const incidentsResult = await pool.query(
      "SELECT * FROM incident_logs WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );

    const incidents = [];
    for (const incident of incidentsResult.rows) {
      const smsResult = await pool.query(
        "SELECT contact_name, contact_phone, status, created_at FROM sms_logs WHERE incident_id = $1",
        [incident.id]
      );
      const broadcastResult = await pool.query(
        `SELECT nb.distance_meters, nb.status, nb.created_at, u.username as receiver_name
         FROM nearby_broadcasts nb LEFT JOIN users u ON nb.receiver_id = u.id
         WHERE nb.incident_id = $1`,
        [incident.id]
      );
      const mediaResult = await pool.query(
        "SELECT id, filename, original_name, mimetype, file_size, created_at FROM media_storage WHERE incident_id = $1",
        [incident.id]
      );
      incidents.push({
        ...incident,
        sms_notifications: smsResult.rows,
        nearby_broadcasts: broadcastResult.rows,
        media_files: mediaResult.rows,
      });
    }

    res.json({ incidents });
  } catch (err) {
    console.error("Get incidents error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`VRITARA Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
