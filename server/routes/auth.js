const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id, username, email, phone, created_at",
      [username, email, phone, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3",
      [otpCode, expiresAt, email]
    );

    console.log(`OTP for ${email}: ${otpCode}`);

    res.json({
      message: "OTP sent successfully (check server logs for simulation)",
      otp: otpCode,
    });
  } catch (err) {
    console.error("OTP request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expires_at > NOW()",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    const user = result.rows[0];

    await pool.query(
      "UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1",
      [user.id]
    );

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "OTP verified, login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    const resetToken = Math.random().toString(36).slice(-8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = $3",
      [resetToken, expiresAt, email]
    );

    res.json({
      message: "Password reset token generated (simulated)",
      resetToken,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Email, reset token, and new password are required" });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expires_at > NOW()",
      [email, resetToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE email = $2",
      [hashedPassword, email]
    );

    res.json({ message: "Password reset successful. You can now login with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
