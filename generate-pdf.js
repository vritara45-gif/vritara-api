const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://e0538aec-ddf0-4112-ab9f-3752d0d16dab-00-317onqis7vczd.pike.replit.dev";
const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 40px 50px; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; line-height: 1.7; font-size: 11.5px; }

  .cover { page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
  .cover-logo { width: 120px; height: 120px; margin-bottom: 30px; border-radius: 20px; }
  .cover h1 { font-size: 36px; color: #800020; letter-spacing: 6px; margin-bottom: 8px; }
  .cover h2 { font-size: 18px; color: #333; font-weight: 400; margin-bottom: 40px; }
  .cover-meta { font-size: 13px; color: #555; line-height: 2; }
  .cover-meta strong { color: #1a1a2e; }
  .cover-line { width: 80px; height: 3px; background: #800020; margin: 30px auto; }

  h1 { font-size: 22px; color: #800020; margin: 30px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #800020; }
  h2 { font-size: 17px; color: #800020; margin: 24px 0 10px; }
  h3 { font-size: 14px; color: #2c2c54; margin: 18px 0 8px; padding: 8px 12px; background: #f8f0f2; border-left: 4px solid #800020; border-radius: 4px; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0 6px 20px; }
  li { margin: 3px 0; }

  .endpoint-box { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin: 12px 0 20px; page-break-inside: avoid; }
  .method-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 11px; color: #fff; margin-right: 8px; }
  .method-POST { background: #800020; }
  .method-GET { background: #27ae60; }
  .method-PUT { background: #2980b9; }
  .method-DELETE { background: #c0392b; }
  .url-path { font-family: 'Courier New', monospace; font-size: 12px; color: #333; font-weight: 600; }
  .auth-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 8px; }
  .auth-required { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
  .auth-none { background: #d4edda; color: #155724; border: 1px solid #28a745; }

  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
  th { background: #800020; color: #fff; padding: 8px 12px; text-align: left; font-size: 10.5px; }
  td { padding: 7px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f9f9f9; }

  pre { background: #1a1a2e; color: #e0e0e0; padding: 12px 16px; border-radius: 6px; font-size: 10.5px; font-family: 'Courier New', monospace; overflow-x: auto; margin: 8px 0; white-space: pre-wrap; word-break: break-word; }
  code { font-family: 'Courier New', monospace; font-size: 10.5px; background: #f0f0f0; padding: 1px 5px; border-radius: 3px; }

  .desc { color: #555; font-size: 11.5px; margin: 6px 0 10px; }
  .section-intro { color: #444; margin-bottom: 16px; }
  .note-box { background: #fff8e1; border-left: 4px solid #ffc107; padding: 10px 14px; margin: 10px 0; border-radius: 4px; font-size: 11px; }
  .important-box { background: #fce4ec; border-left: 4px solid #800020; padding: 10px 14px; margin: 10px 0; border-radius: 4px; font-size: 11px; }

  .page-break { page-break-before: always; }
  .footer { text-align: center; color: #999; font-size: 9px; margin-top: 40px; padding-top: 10px; border-top: 1px solid #eee; }

  .flow-step { display: flex; align-items: flex-start; gap: 10px; margin: 8px 0; }
  .flow-num { background: #800020; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .flow-text { flex: 1; }

  .db-table { margin: 12px 0; }
  .db-table-name { font-weight: 700; color: #800020; font-size: 13px; margin-bottom: 4px; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <img src="logo.png" class="cover-logo" onerror="this.style.display='none'" />
  <h1>VRITARA</h1>
  <h2>Smart Safety System</h2>
  <div class="cover-line"></div>
  <h2 style="font-size:20px; color:#800020; margin-bottom:30px;">Backend API Documentation</h2>
  <div class="cover-meta">
    <strong>Version:</strong> 1.0<br>
    <strong>Environment:</strong> Production<br>
    <strong>Base URL:</strong> ${BASE_URL}<br>
    <strong>Prepared For:</strong> PCB &amp; Hardware Integration Vendor<br>
    <strong>Date:</strong> ${today}<br>
  </div>
</div>

<!-- 1. PROJECT OVERVIEW -->
<h1>1. Project Overview</h1>
<div class="section-intro">
<p><strong>VRITARA Smart Safety System</strong> is a comprehensive personal safety platform designed for real-time emergency detection, alerting, and incident management. The system integrates a mobile/web application with IoT-enabled wearable hardware (smartwatch) to provide both manual and automatic SOS capabilities.</p>
</div>

<h2>Core Features</h2>
<ul>
  <li><strong>Smart SOS System:</strong> Toggle-based emergency state management with both manual and automatic trigger modes. The SOS state persists in the database and survives app restarts.</li>
  <li><strong>Manual SOS:</strong> User-triggered emergency via app button. Creates incident, sends alerts to emergency contacts, and broadcasts to nearby users.</li>
  <li><strong>Automatic SOS:</strong> Hardware-triggered emergency based on sensor data (sound level &gt; 80dB, motion level &gt; 1.5g). The smartwatch sends sensor readings to the backend which processes and triggers alerts automatically.</li>
  <li><strong>JWT Authentication:</strong> Secure user authentication with JSON Web Tokens (24-hour expiry), bcrypt password hashing, OTP login simulation, and password reset flow.</li>
  <li><strong>Nearby Device Broadcast:</strong> When an SOS is triggered, the system uses the Haversine formula to identify all VRITARA users within a 200-meter radius and sends them emergency broadcast alerts.</li>
  <li><strong>Emergency Contacts:</strong> Users can register up to 3 emergency contacts. During SOS, simulated SMS alerts are sent to all contacts with the user's location.</li>
  <li><strong>Media Storage:</strong> Automatic evidence capture during SOS (BMP images + WAV audio). Media files are linked to incidents and can be securely deleted with password verification.</li>
  <li><strong>Incident Logging System:</strong> Complete incident lifecycle tracking with status management (active/resolved), SMS logs, nearby broadcast logs, and attached media records.</li>
</ul>

<!-- 2. AUTHENTICATION FLOW -->
<h1 class="page-break">2. Authentication Flow</h1>

<h2>2.1 Signup Process</h2>
<ol>
  <li>User sends POST request to <code>/api/signup</code> with username, email, phone, and password.</li>
  <li>Server validates all fields are present and email is not already registered.</li>
  <li>Password is hashed using <strong>bcrypt</strong> (10 salt rounds).</li>
  <li>User record is created in PostgreSQL database.</li>
  <li>Server returns a <strong>JWT token</strong> (valid for 24 hours) and user profile data.</li>
</ol>

<h2>2.2 Login Process</h2>
<ol>
  <li>User sends POST request to <code>/api/login</code> with email and password.</li>
  <li>Server looks up user by email and verifies password using <strong>bcrypt.compare</strong>.</li>
  <li>On success, server returns a new JWT token and user profile data.</li>
</ol>

<h2>2.3 OTP Login (Simulated)</h2>
<ol>
  <li>User requests OTP via <code>/api/request-otp</code> with their email.</li>
  <li>Server generates a 6-digit OTP code, stores it with a 5-minute expiry.</li>
  <li>OTP is returned in the response (simulated &mdash; in production, this would be sent via SMS/email).</li>
  <li>User verifies OTP via <code>/api/verify-otp</code> to receive JWT token.</li>
</ol>

<h2>2.4 JWT Token Usage</h2>
<p>All authenticated endpoints require the JWT token in the Authorization header:</p>
<pre>Authorization: Bearer &lt;JWT_TOKEN&gt;</pre>
<div class="note-box">
  <strong>Token Expiry:</strong> JWT tokens expire after 24 hours. After expiry, the user must login again to obtain a new token.
</div>

<!-- 3. API ENDPOINTS -->
<h1 class="page-break">3. API Endpoints</h1>
<p class="section-intro">All endpoints use the base URL: <code>${BASE_URL}</code></p>

<!-- 3.1 Server Status -->
<h3>3.1 Server Status</h3>
<div class="endpoint-box">
  <span class="method-badge method-GET">GET</span>
  <span class="url-path">/status</span>
  <span class="auth-badge auth-none">No Auth</span>
  <p class="desc">Health check endpoint to verify the API server is running and responsive.</p>
  <strong>Success Response (200):</strong>
  <pre>{
  "status": "API is live"
}</pre>
</div>

<!-- 3.2 Signup -->
<h3>3.2 Signup</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/signup</span>
  <span class="auth-badge auth-none">No Auth</span>
  <p class="desc">Register a new user account. Returns JWT token on successful registration.</p>
  <strong>Request Headers:</strong>
  <table><tr><th>Key</th><th>Value</th></tr><tr><td>Content-Type</td><td>application/json</td></tr></table>
  <strong>Request Body:</strong>
  <pre>{
  "username": "testuser",
  "email": "testuser@gmail.com",
  "phone": "9876543210",
  "password": "Test@123"
}</pre>
  <strong>Success Response (201):</strong>
  <pre>{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "testuser@gmail.com",
    "phone": "9876543210"
  }
}</pre>
  <strong>Error Responses:</strong>
  <table><tr><th>Code</th><th>Condition</th><th>Response</th></tr>
  <tr><td>400</td><td>Missing fields</td><td>{"error": "All fields are required"}</td></tr>
  <tr><td>409</td><td>Email exists</td><td>{"error": "Email already registered"}</td></tr>
  <tr><td>500</td><td>Server error</td><td>{"error": "Server error"}</td></tr></table>
</div>

<!-- 3.3 Login -->
<h3>3.3 Login</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/login</span>
  <span class="auth-badge auth-none">No Auth</span>
  <p class="desc">Authenticate an existing user with email and password. Returns JWT token on success.</p>
  <strong>Request Headers:</strong>
  <table><tr><th>Key</th><th>Value</th></tr><tr><td>Content-Type</td><td>application/json</td></tr></table>
  <strong>Request Body:</strong>
  <pre>{
  "email": "testuser@gmail.com",
  "password": "Test@123"
}</pre>
  <strong>Success Response (200):</strong>
  <pre>{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "testuser@gmail.com",
    "phone": "9876543210"
  }
}</pre>
  <strong>Error Responses:</strong>
  <table><tr><th>Code</th><th>Condition</th><th>Response</th></tr>
  <tr><td>400</td><td>Missing fields</td><td>{"error": "Email and password are required"}</td></tr>
  <tr><td>401</td><td>Wrong credentials</td><td>{"error": "Invalid credentials"}</td></tr>
  <tr><td>500</td><td>Server error</td><td>{"error": "Server error"}</td></tr></table>
</div>

<!-- 3.4 Request OTP -->
<h3>3.4 Request OTP</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/request-otp</span>
  <span class="auth-badge auth-none">No Auth</span>
  <p class="desc">Request a 6-digit OTP code for passwordless login. OTP is valid for 5 minutes.</p>
  <strong>Request Body:</strong>
  <pre>{ "email": "testuser@gmail.com" }</pre>
  <strong>Success Response (200):</strong>
  <pre>{
  "message": "OTP sent successfully (check server logs for simulation)",
  "otp": "482913"
}</pre>
  <strong>Error Responses:</strong>
  <table><tr><th>Code</th><th>Condition</th><th>Response</th></tr>
  <tr><td>400</td><td>Missing email</td><td>{"error": "Email is required"}</td></tr>
  <tr><td>404</td><td>Email not found</td><td>{"error": "Email not found"}</td></tr></table>
</div>

<!-- 3.5 Verify OTP -->
<h3>3.5 Verify OTP</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/verify-otp</span>
  <span class="auth-badge auth-none">No Auth</span>
  <p class="desc">Verify OTP code and login. Returns JWT token on success.</p>
  <strong>Request Body:</strong>
  <pre>{ "email": "testuser@gmail.com", "otp": "482913" }</pre>
  <strong>Success Response (200):</strong>
  <pre>{
  "message": "OTP verified, login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": { "id": 1, "username": "testuser", "email": "testuser@gmail.com", "phone": "9876543210" }
}</pre>
  <strong>Error Responses:</strong>
  <table><tr><th>Code</th><th>Condition</th><th>Response</th></tr>
  <tr><td>400</td><td>Missing fields</td><td>{"error": "Email and OTP are required"}</td></tr>
  <tr><td>401</td><td>Invalid/expired OTP</td><td>{"error": "Invalid or expired OTP"}</td></tr></table>
</div>

<!-- 3.6 Forgot Password -->
<h3>3.6 Forgot Password</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/forgot-password</span>
  <span class="auth-badge auth-none">No Auth</span>
  <p class="desc">Generate a password reset token. Token is valid for 15 minutes.</p>
  <strong>Request Body:</strong>
  <pre>{ "email": "testuser@gmail.com" }</pre>
  <strong>Success Response (200):</strong>
  <pre>{
  "message": "Password reset token generated (simulated)",
  "resetToken": "a1b2c3d4"
}</pre>
</div>

<!-- 3.7 Reset Password -->
<h3>3.7 Reset Password</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/reset-password</span>
  <span class="auth-badge auth-none">No Auth</span>
  <p class="desc">Reset user password using a valid reset token.</p>
  <strong>Request Body:</strong>
  <pre>{
  "email": "testuser@gmail.com",
  "resetToken": "a1b2c3d4",
  "newPassword": "NewPass@456"
}</pre>
  <strong>Success Response (200):</strong>
  <pre>{ "message": "Password reset successful. You can now login with your new password." }</pre>
</div>

<!-- 3.8 Get Profile -->
<h3 class="page-break">3.8 Get User Profile</h3>
<div class="endpoint-box">
  <span class="method-badge method-GET">GET</span>
  <span class="url-path">/api/user/profile</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Retrieve the authenticated user's profile information.</p>
  <strong>Success Response (200):</strong>
  <pre>{
  "id": 1,
  "username": "testuser",
  "email": "testuser@gmail.com",
  "phone": "9876543210",
  "created_at": "2026-02-12T10:00:00.000Z"
}</pre>
</div>

<!-- 3.9 Update Profile -->
<h3>3.9 Update User Profile</h3>
<div class="endpoint-box">
  <span class="method-badge method-PUT">PUT</span>
  <span class="url-path">/api/user/profile</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Update the authenticated user's username and/or phone number.</p>
  <strong>Request Body:</strong>
  <pre>{ "username": "newname", "phone": "9999999999" }</pre>
  <strong>Success Response (200):</strong>
  <pre>{
  "message": "Profile updated",
  "user": { "id": 1, "username": "newname", "email": "testuser@gmail.com", "phone": "9999999999" }
}</pre>
</div>

<!-- 3.10 SOS Toggle -->
<h3>3.10 Toggle SOS (Primary SOS Endpoint)</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/sos/toggle</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Toggle the user's emergency state between <strong>normal</strong> and <strong>emergency</strong>. When activating: creates incident, sends SMS to contacts, broadcasts to nearby users. When deactivating: resolves the active incident. Uses database transactions for atomic state changes.</p>
  <strong>Request Body:</strong>
  <pre>{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "message": "Emergency SOS triggered"
}</pre>
  <strong>Activation Response (201):</strong>
  <pre>{
  "state": "emergency",
  "incident": {
    "id": 1,
    "user_id": 4,
    "type": "manual",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "message": "Emergency SOS triggered",
    "status": "active",
    "created_at": "2026-02-12T10:30:00.000Z"
  },
  "notifications": {
    "sms_sent": 2,
    "sms_details": [
      { "contact": "Father", "phone": "9876543210", "status": "sent" }
    ],
    "nearby_broadcasts": 1,
    "nearby_details": [
      { "receiver": "nearby_user", "distance": "150m", "status": "sent" }
    ]
  }
}</pre>
  <strong>Deactivation Response (200):</strong>
  <pre>{
  "state": "normal",
  "resolved_incident_id": 1,
  "message": "Emergency resolved"
}</pre>
</div>

<!-- 3.11 Get SOS State -->
<h3>3.11 Get SOS State</h3>
<div class="endpoint-box">
  <span class="method-badge method-GET">GET</span>
  <span class="url-path">/api/sos/state</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Get the current emergency state of the authenticated user.</p>
  <strong>Success Response (200):</strong>
  <pre>{
  "state": "normal",
  "active_incident_id": null
}</pre>
</div>

<!-- 3.12 Manual SOS -->
<h3>3.12 Trigger Manual SOS</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/sos/manual</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Trigger a manual SOS emergency. Creates an incident log, sends simulated SMS to all emergency contacts, broadcasts to nearby users within 200m, and links any provided media files to the incident.</p>
  <strong>Request Body:</strong>
  <pre>{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "message": "Manual emergency triggered",
  "media_ids": [1, 2]
}</pre>
  <strong>Success Response (201):</strong>
  <pre>{
  "emergency": true,
  "message": "SOS signal sent successfully",
  "incident": {
    "id": 5,
    "user_id": 4,
    "type": "manual",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "status": "active",
    "created_at": "2026-02-12T10:35:00.000Z"
  },
  "notifications": {
    "sms_sent": 2,
    "sms_details": [...],
    "nearby_broadcasts": 0,
    "nearby_details": []
  },
  "media": [...]
}</pre>
</div>

<!-- 3.13 Automatic SOS -->
<h3>3.13 Trigger Automatic SOS</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/sos/automatic</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Trigger an automatic SOS based on sensor data from the smartwatch/wearable device. The backend processes sound and motion levels and creates an incident with full notification flow. This is the primary endpoint for PCB/hardware integration.</p>
  <strong>Request Body:</strong>
  <pre>{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "sound_level": 85,
  "motion_level": 3.5,
  "media_ids": []
}</pre>
  <strong>Success Response (201):</strong>
  <pre>{
  "emergency": true,
  "message": "Automatic SOS triggered",
  "incident": {
    "id": 6,
    "user_id": 4,
    "type": "automatic",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "message": "Auto-detected: sound=85dB, motion=3.5g",
    "sound_level": 85,
    "motion_level": 3.5,
    "status": "active",
    "created_at": "2026-02-12T10:40:00.000Z"
  },
  "notifications": {
    "sms_sent": 2,
    "sms_details": [...],
    "nearby_broadcasts": 0,
    "nearby_details": []
  },
  "media": []
}</pre>
</div>

<!-- 3.14 Get Incidents -->
<h3 class="page-break">3.14 Get Incident History</h3>
<div class="endpoint-box">
  <span class="method-badge method-GET">GET</span>
  <span class="url-path">/api/incidents</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Retrieve all incidents for the authenticated user, including SMS notifications, nearby broadcasts, and attached media files. Also available at <code>/api/sos/incidents</code>.</p>
  <strong>Success Response (200):</strong>
  <pre>{
  "incidents": [
    {
      "id": 6,
      "user_id": 4,
      "type": "automatic",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "message": "Auto-detected: sound=85dB, motion=3.5g",
      "sound_level": 85,
      "motion_level": 3.5,
      "status": "resolved",
      "created_at": "2026-02-12T10:40:00.000Z",
      "sms_notifications": [
        { "contact_name": "Father", "contact_phone": "9876543210", "status": "sent" }
      ],
      "nearby_broadcasts": [],
      "media_files": [
        { "id": 3, "filename": "1707...-img.bmp", "mimetype": "image/bmp", "file_size": 230454 }
      ]
    }
  ]
}</pre>
</div>

<!-- 3.15 Update Location -->
<h3>3.15 Update Location</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/location</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Update the user's current GPS location. This is used for location tracking and nearby user broadcast calculations.</p>
  <strong>Request Body:</strong>
  <pre>{
  "latitude": 12.9716,
  "longitude": 77.5946
}</pre>
  <strong>Success Response (200):</strong>
  <pre>{
  "message": "Location updated",
  "location": {
    "id": 10,
    "user_id": 4,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "created_at": "2026-02-12T10:45:00.000Z"
  }
}</pre>
</div>

<!-- 3.16 Add Contact -->
<h3>3.16 Add Emergency Contact</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/contacts</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Add an emergency contact (maximum 3 per user). These contacts receive SMS alerts during SOS events.</p>
  <strong>Request Body:</strong>
  <pre>{
  "name": "Father",
  "phone": "9876543210",
  "relationship": "Parent"
}</pre>
  <strong>Success Response (201):</strong>
  <pre>{
  "message": "Contact added",
  "contact": {
    "id": 1,
    "user_id": 4,
    "name": "Father",
    "phone": "9876543210",
    "relationship": "Parent",
    "created_at": "2026-02-12T10:00:00.000Z"
  }
}</pre>
  <strong>Error Responses:</strong>
  <table><tr><th>Code</th><th>Condition</th><th>Response</th></tr>
  <tr><td>400</td><td>Missing name/phone</td><td>{"error": "Name and phone are required"}</td></tr>
  <tr><td>400</td><td>Max contacts reached</td><td>{"error": "Maximum 3 emergency contacts allowed"}</td></tr></table>
</div>

<!-- 3.17 Get Contacts -->
<h3>3.17 Get Emergency Contacts</h3>
<div class="endpoint-box">
  <span class="method-badge method-GET">GET</span>
  <span class="url-path">/api/contacts</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Retrieve all emergency contacts for the authenticated user.</p>
  <strong>Success Response (200):</strong>
  <pre>{ "contacts": [ { "id": 1, "name": "Father", "phone": "9876543210", "relationship": "Parent" } ] }</pre>
</div>

<!-- 3.18 Delete Contact -->
<h3>3.18 Delete Emergency Contact</h3>
<div class="endpoint-box">
  <span class="method-badge method-DELETE">DELETE</span>
  <span class="url-path">/api/contacts/:id</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Delete an emergency contact by ID.</p>
  <strong>Success Response (200):</strong>
  <pre>{ "message": "Contact deleted" }</pre>
</div>

<!-- 3.19 Upload Media -->
<h3>3.19 Upload Media File</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/upload</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Upload an image or audio file. Max size: 10MB. Accepted formats: JPEG, PNG, GIF, MP3, WAV, OGG, WebM, MP4, M4A. Use <code>multipart/form-data</code> with field name <code>file</code>.</p>
  <strong>Request Headers:</strong>
  <table><tr><th>Key</th><th>Value</th></tr><tr><td>Content-Type</td><td>multipart/form-data</td></tr><tr><td>Authorization</td><td>Bearer &lt;token&gt;</td></tr></table>
  <strong>Form Data:</strong>
  <table><tr><th>Key</th><th>Type</th><th>Description</th></tr>
  <tr><td>file</td><td>File</td><td>The media file to upload</td></tr>
  <tr><td>incident_id</td><td>Text (optional)</td><td>Link file to an incident</td></tr></table>
  <strong>Success Response (201):</strong>
  <pre>{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "user_id": 4,
    "filename": "1707...-photo.jpg",
    "original_name": "photo.jpg",
    "mimetype": "image/jpeg",
    "file_size": 245000,
    "created_at": "2026-02-12T10:50:00.000Z"
  }
}</pre>
</div>

<!-- 3.20 Get Media -->
<h3>3.20 Get User Media Files</h3>
<div class="endpoint-box">
  <span class="method-badge method-GET">GET</span>
  <span class="url-path">/api/upload/media</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">List all media files uploaded by the authenticated user, with incident association details.</p>
  <strong>Success Response (200):</strong>
  <pre>{ "media": [ { "id": 1, "filename": "...", "original_name": "...", "mimetype": "image/bmp", "incident_status": "active" } ] }</pre>
</div>

<!-- 3.21 Delete Media -->
<h3>3.21 Delete Media (Password Protected)</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/upload/delete/:id</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Delete a media file. Requires the user's account password for security verification. Deletes both the file from disk and the database record.</p>
  <strong>Request Body:</strong>
  <pre>{ "password": "Test@123" }</pre>
  <strong>Success Response (200):</strong>
  <pre>{ "message": "Media deleted successfully" }</pre>
  <strong>Error Responses:</strong>
  <table><tr><th>Code</th><th>Condition</th><th>Response</th></tr>
  <tr><td>400</td><td>No password</td><td>{"error": "Password is required to delete media"}</td></tr>
  <tr><td>403</td><td>Wrong password</td><td>{"error": "Incorrect password"}</td></tr>
  <tr><td>404</td><td>Media not found</td><td>{"error": "Media not found"}</td></tr></table>
</div>

<!-- 3.22 Simulate Capture -->
<h3>3.22 Simulate Media Capture</h3>
<div class="endpoint-box">
  <span class="method-badge method-POST">POST</span>
  <span class="url-path">/api/upload/simulate-capture</span>
  <span class="auth-badge auth-required">Bearer Token</span>
  <p class="desc">Simulate camera/audio capture during an emergency. Generates a BMP image (320x240) or WAV audio (2 seconds, 8kHz) and links it to the specified incident.</p>
  <strong>Request Body:</strong>
  <pre>{ "incident_id": 5, "type": "image" }</pre>
  <p>Type can be <code>"image"</code> or <code>"audio"</code>.</p>
  <strong>Success Response (201):</strong>
  <pre>{
  "message": "image captured (simulated)",
  "file": { "id": 8, "filename": "170...-capture.bmp", "mimetype": "image/bmp", "file_size": 230454 }
}</pre>
</div>

<!-- 3.23 Legacy Device Routes -->
<h3>3.23 Legacy Device Endpoints</h3>
<div class="endpoint-box">
  <p class="desc">These endpoints use API key authentication via <code>X-API-Key</code> header.</p>
  <strong>API Key:</strong> <code>vritara-safety-device-key-2024</code>
  <table><tr><th>Method</th><th>Path</th><th>Description</th></tr>
  <tr><td>POST</td><td>/api/sensor-data</td><td>Send sensor readings (sound_level, motion_level). Returns emergency flag.</td></tr>
  <tr><td>POST</td><td>/api/emergency/manual</td><td>Legacy manual emergency trigger for devices.</td></tr>
  <tr><td>POST</td><td>/api/heartbeat</td><td>Device heartbeat/alive check.</td></tr></table>
</div>

<!-- 4. EMERGENCY FLOW -->
<h1 class="page-break">4. Emergency Flow (PCB Vendor Reference)</h1>

<h2>4.1 Manual SOS Flow</h2>
<div class="flow-step"><div class="flow-num">1</div><div class="flow-text">User presses SOS button in app or calls <code>POST /api/sos/toggle</code></div></div>
<div class="flow-step"><div class="flow-num">2</div><div class="flow-text">Backend checks current state. If <strong>normal</strong>, activates emergency (atomic DB transaction)</div></div>
<div class="flow-step"><div class="flow-num">3</div><div class="flow-text">Incident log created with type <code>"manual"</code>, status <code>"active"</code>, and GPS coordinates</div></div>
<div class="flow-step"><div class="flow-num">4</div><div class="flow-text">User's <code>emergency_state</code> set to <code>"emergency"</code> and <code>active_incident_id</code> stored</div></div>
<div class="flow-step"><div class="flow-num">5</div><div class="flow-text">Simulated SMS sent to all emergency contacts with user's name, location, and emergency message</div></div>
<div class="flow-step"><div class="flow-num">6</div><div class="flow-text">Nearby broadcast: system queries <code>location_logs</code> for all users with positions logged in the last hour, calculates Haversine distance, and alerts those within 200 meters</div></div>
<div class="flow-step"><div class="flow-num">7</div><div class="flow-text">App auto-captures evidence: BMP image (320x240) + WAV audio (2 sec, 8kHz), linked to incident</div></div>
<div class="flow-step"><div class="flow-num">8</div><div class="flow-text">User taps SOS again to deactivate: incident status changes to <code>"resolved"</code>, state returns to <code>"normal"</code></div></div>

<h2>4.2 Automatic SOS Flow (Hardware Integration)</h2>
<div class="flow-step"><div class="flow-num">1</div><div class="flow-text">Smartwatch continuously monitors environmental sensors (microphone + accelerometer)</div></div>
<div class="flow-step"><div class="flow-num">2</div><div class="flow-text">When sound &gt; 80dB AND motion &gt; 1.5g, device sends data to <code>POST /api/sos/automatic</code></div></div>
<div class="flow-step"><div class="flow-num">3</div><div class="flow-text">Backend creates incident with type <code>"automatic"</code>, stores sensor readings in <code>sound_level</code> and <code>motion_level</code> fields</div></div>
<div class="flow-step"><div class="flow-num">4</div><div class="flow-text">Full notification flow executes: SMS to contacts + nearby broadcast + incident logging</div></div>
<div class="flow-step"><div class="flow-num">5</div><div class="flow-text">Device continues sending location updates via <code>POST /api/location</code></div></div>

<h2>4.3 Location Storage</h2>
<p>Every location update (via <code>/api/location</code>) and SOS trigger stores GPS coordinates in <code>location_logs</code>. This data is used for:</p>
<ul>
  <li>Incident location recording</li>
  <li>Nearby user broadcast calculation (Haversine formula, 200m radius)</li>
  <li>Real-time tracking display in the dashboard</li>
</ul>

<h2>4.4 SMS Simulation</h2>
<p>SMS alerts are simulated (logged to console and <code>sms_logs</code> table). Each SMS includes:</p>
<ul>
  <li>User's name and emergency type (manual/automatic)</li>
  <li>GPS coordinates (latitude, longitude)</li>
  <li>Urgency message requesting immediate response</li>
</ul>
<div class="note-box"><strong>Production Note:</strong> Replace simulated SMS with Twilio, AWS SNS, or similar SMS gateway for actual SMS delivery.</div>

<h2>4.5 Nearby Broadcast (200m Radius)</h2>
<p>The system uses the <strong>Haversine formula</strong> to calculate great-circle distance between the SOS user and all other VRITARA users who have logged their location within the last hour. Users within 200 meters receive an emergency broadcast alert stored in the <code>nearby_broadcasts</code> table.</p>

<h2>4.6 SOS Toggle State</h2>
<p>The toggle system uses two fields in the <code>users</code> table:</p>
<ul>
  <li><code>emergency_state</code>: Either <code>"normal"</code> or <code>"emergency"</code></li>
  <li><code>active_incident_id</code>: References the current active incident (NULL when normal)</li>
</ul>
<p>State changes use PostgreSQL transactions (<code>BEGIN/COMMIT/ROLLBACK</code>) to ensure atomicity.</p>

<!-- 5. DATABASE SCHEMA -->
<h1 class="page-break">5. Database Schema Overview</h1>

<div class="db-table">
<div class="db-table-name">users</div>
<table>
<tr><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>id</td><td>SERIAL PK</td><td>Auto-increment primary key</td></tr>
<tr><td>username</td><td>VARCHAR(100)</td><td>Display name</td></tr>
<tr><td>email</td><td>VARCHAR(255) UNIQUE</td><td>Login email</td></tr>
<tr><td>phone</td><td>VARCHAR(20)</td><td>Phone number</td></tr>
<tr><td>password</td><td>VARCHAR(255)</td><td>bcrypt hashed password</td></tr>
<tr><td>otp_code</td><td>VARCHAR(6)</td><td>Current OTP (nullable)</td></tr>
<tr><td>otp_expires_at</td><td>TIMESTAMP</td><td>OTP expiry time</td></tr>
<tr><td>reset_token</td><td>VARCHAR(100)</td><td>Password reset token (nullable)</td></tr>
<tr><td>reset_token_expires_at</td><td>TIMESTAMP</td><td>Reset token expiry</td></tr>
<tr><td>emergency_state</td><td>VARCHAR(20)</td><td>'normal' or 'emergency'</td></tr>
<tr><td>active_incident_id</td><td>INTEGER</td><td>FK to active incident (nullable)</td></tr>
<tr><td>created_at</td><td>TIMESTAMP</td><td>Account creation time</td></tr>
</table>
</div>

<div class="db-table">
<div class="db-table-name">emergency_contacts</div>
<table>
<tr><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>id</td><td>SERIAL PK</td><td>Auto-increment primary key</td></tr>
<tr><td>user_id</td><td>INTEGER FK</td><td>References users(id), CASCADE delete</td></tr>
<tr><td>name</td><td>VARCHAR(100)</td><td>Contact name</td></tr>
<tr><td>phone</td><td>VARCHAR(20)</td><td>Contact phone number</td></tr>
<tr><td>relationship</td><td>VARCHAR(50)</td><td>Relationship (default: 'Other')</td></tr>
<tr><td>created_at</td><td>TIMESTAMP</td><td>Record creation time</td></tr>
</table>
</div>

<div class="db-table">
<div class="db-table-name">incident_logs</div>
<table>
<tr><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>id</td><td>SERIAL PK</td><td>Auto-increment primary key</td></tr>
<tr><td>user_id</td><td>INTEGER FK</td><td>References users(id)</td></tr>
<tr><td>type</td><td>VARCHAR(20)</td><td>'manual' or 'automatic'</td></tr>
<tr><td>latitude</td><td>DOUBLE PRECISION</td><td>GPS latitude</td></tr>
<tr><td>longitude</td><td>DOUBLE PRECISION</td><td>GPS longitude</td></tr>
<tr><td>message</td><td>TEXT</td><td>Incident description</td></tr>
<tr><td>sound_level</td><td>DOUBLE PRECISION</td><td>Detected sound level (dB)</td></tr>
<tr><td>motion_level</td><td>DOUBLE PRECISION</td><td>Detected motion level (g)</td></tr>
<tr><td>status</td><td>VARCHAR(20)</td><td>'active' or 'resolved'</td></tr>
<tr><td>created_at</td><td>TIMESTAMP</td><td>Incident creation time</td></tr>
</table>
</div>

<div class="db-table">
<div class="db-table-name">location_logs</div>
<table>
<tr><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>id</td><td>SERIAL PK</td><td>Auto-increment primary key</td></tr>
<tr><td>user_id</td><td>INTEGER FK</td><td>References users(id)</td></tr>
<tr><td>latitude</td><td>DOUBLE PRECISION</td><td>GPS latitude</td></tr>
<tr><td>longitude</td><td>DOUBLE PRECISION</td><td>GPS longitude</td></tr>
<tr><td>created_at</td><td>TIMESTAMP</td><td>Location timestamp</td></tr>
</table>
</div>

<div class="db-table">
<div class="db-table-name">sms_logs</div>
<table>
<tr><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>id</td><td>SERIAL PK</td><td>Auto-increment primary key</td></tr>
<tr><td>incident_id</td><td>INTEGER FK</td><td>References incident_logs(id)</td></tr>
<tr><td>user_id</td><td>INTEGER FK</td><td>References users(id)</td></tr>
<tr><td>contact_name</td><td>VARCHAR(100)</td><td>Recipient contact name</td></tr>
<tr><td>contact_phone</td><td>VARCHAR(20)</td><td>Recipient phone number</td></tr>
<tr><td>message</td><td>TEXT</td><td>SMS message content</td></tr>
<tr><td>status</td><td>VARCHAR(20)</td><td>'sent' or 'failed'</td></tr>
<tr><td>created_at</td><td>TIMESTAMP</td><td>SMS timestamp</td></tr>
</table>
</div>

<div class="db-table">
<div class="db-table-name">nearby_broadcasts</div>
<table>
<tr><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>id</td><td>SERIAL PK</td><td>Auto-increment primary key</td></tr>
<tr><td>incident_id</td><td>INTEGER FK</td><td>References incident_logs(id)</td></tr>
<tr><td>broadcaster_id</td><td>INTEGER FK</td><td>User who triggered SOS</td></tr>
<tr><td>receiver_id</td><td>INTEGER FK</td><td>Nearby user who received alert</td></tr>
<tr><td>distance_meters</td><td>DOUBLE PRECISION</td><td>Distance between users</td></tr>
<tr><td>message</td><td>TEXT</td><td>Broadcast message</td></tr>
<tr><td>status</td><td>VARCHAR(20)</td><td>'sent'</td></tr>
<tr><td>created_at</td><td>TIMESTAMP</td><td>Broadcast timestamp</td></tr>
</table>
</div>

<div class="db-table">
<div class="db-table-name">media_storage</div>
<table>
<tr><th>Column</th><th>Type</th><th>Description</th></tr>
<tr><td>id</td><td>SERIAL PK</td><td>Auto-increment primary key</td></tr>
<tr><td>user_id</td><td>INTEGER FK</td><td>References users(id)</td></tr>
<tr><td>incident_id</td><td>INTEGER FK</td><td>References incident_logs(id), SET NULL on delete</td></tr>
<tr><td>filename</td><td>VARCHAR(255)</td><td>Server filename</td></tr>
<tr><td>original_name</td><td>VARCHAR(255)</td><td>Original upload filename</td></tr>
<tr><td>mimetype</td><td>VARCHAR(100)</td><td>MIME type (image/bmp, audio/wav, etc.)</td></tr>
<tr><td>file_size</td><td>INTEGER</td><td>File size in bytes</td></tr>
<tr><td>file_path</td><td>VARCHAR(500)</td><td>Server file path</td></tr>
<tr><td>created_at</td><td>TIMESTAMP</td><td>Upload timestamp</td></tr>
</table>
</div>

<h2>Table Relationships</h2>
<ul>
  <li><code>users</code> &rarr; <code>emergency_contacts</code> (one-to-many, max 3)</li>
  <li><code>users</code> &rarr; <code>incident_logs</code> (one-to-many)</li>
  <li><code>users</code> &rarr; <code>location_logs</code> (one-to-many)</li>
  <li><code>incident_logs</code> &rarr; <code>sms_logs</code> (one-to-many)</li>
  <li><code>incident_logs</code> &rarr; <code>nearby_broadcasts</code> (one-to-many)</li>
  <li><code>incident_logs</code> &rarr; <code>media_storage</code> (one-to-many)</li>
  <li><code>users</code> &rarr; <code>media_storage</code> (one-to-many)</li>
</ul>

<!-- 6. HARDWARE INTEGRATION -->
<h1 class="page-break">6. Hardware Integration Notes</h1>

<h2>6.1 Smartwatch Integration</h2>
<p>The VRITARA smartwatch device integrates with the backend API to provide automatic emergency detection and response. The device communicates with the following endpoints:</p>

<table>
<tr><th>Action</th><th>Endpoint</th><th>Frequency</th></tr>
<tr><td>Send sensor data</td><td>POST /api/sos/automatic</td><td>On threshold breach</td></tr>
<tr><td>Update location</td><td>POST /api/location</td><td>Every 10-30 seconds</td></tr>
<tr><td>Health check</td><td>POST /api/heartbeat</td><td>Every 60 seconds</td></tr>
<tr><td>Manual SOS button</td><td>POST /api/sos/toggle</td><td>On user press</td></tr>
</table>

<h2>6.2 Device Data Payload</h2>
<p>The smartwatch sends the following data during automatic SOS detection:</p>
<pre>{
  "latitude": 12.9716,      // GPS latitude (double precision)
  "longitude": 77.5946,     // GPS longitude (double precision)
  "sound_level": 85,        // Ambient sound in decibels (dB)
  "motion_level": 3.5,      // Accelerometer reading in g-force
  "media_ids": []            // Optional: IDs of pre-uploaded media files
}</pre>

<h2>6.3 Authentication for Device</h2>
<p>The smartwatch must authenticate using JWT tokens. Recommended flow:</p>
<ol>
  <li>Device performs initial login via <code>POST /api/login</code> using stored credentials</li>
  <li>JWT token stored in device memory (valid for 24 hours)</li>
  <li>Token refreshed by re-authenticating before expiry</li>
  <li>All API calls include <code>Authorization: Bearer &lt;token&gt;</code> header</li>
</ol>

<h2>6.4 Emergency Detection Thresholds</h2>
<table>
<tr><th>Sensor</th><th>Threshold</th><th>Unit</th><th>Description</th></tr>
<tr><td>Sound Level</td><td>&gt; 80</td><td>dB</td><td>Ambient noise indicating distress (scream, impact)</td></tr>
<tr><td>Motion Level</td><td>&gt; 1.5</td><td>g</td><td>Sudden acceleration indicating fall or assault</td></tr>
</table>
<div class="important-box">
  <strong>Important:</strong> Both thresholds must be exceeded simultaneously for automatic SOS to trigger. The device firmware should implement debouncing to avoid false positives.
</div>

<h2>6.5 DNA Mechanism</h2>
<p>The DNA sample collection mechanism is handled entirely in the wearable hardware. This mechanism is not managed by the backend API. The smartwatch activates the DNA collection module independently during emergency events as part of the physical evidence gathering process.</p>

<h2>6.6 Network Requirements</h2>
<ul>
  <li><strong>Protocol:</strong> HTTPS (TLS 1.2+)</li>
  <li><strong>Content-Type:</strong> application/json</li>
  <li><strong>Timeout:</strong> Recommended 10-second timeout per request</li>
  <li><strong>Retry:</strong> Implement exponential backoff for failed requests (3 retries max)</li>
  <li><strong>Offline:</strong> Queue SOS events locally and send when connectivity is restored</li>
</ul>

<div class="footer">
  <p>VRITARA Smart Safety System &mdash; Backend API Documentation v1.0</p>
  <p>Confidential &mdash; Prepared for PCB &amp; Hardware Integration Partners</p>
  <p>${today}</p>
</div>

</body>
</html>`;

async function generatePDF() {
  const htmlPath = path.join(__dirname, "temp-doc.html");
  fs.writeFileSync(htmlPath, htmlContent);

  const browser = await puppeteer.launch({
    executablePath: "/nix/store/khk7xpgsm5insk81azy9d560yq4npf77-chromium-131.0.6778.204/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });

  const pdfPath = path.join(__dirname, "public", "VRITARA_Backend_API_Documentation_v1.pdf");
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "40px", right: "50px", bottom: "40px", left: "50px" },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;color:#999;width:100%;text-align:right;padding-right:50px;">VRITARA API Documentation v1.0</div>',
    footerTemplate: '<div style="font-size:8px;color:#999;width:100%;text-align:center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  });

  await browser.close();
  fs.unlinkSync(htmlPath);
  console.log("PDF generated:", pdfPath);
}

generatePDF().catch(console.error);
