# VRITARA Safety App

## Overview
VRITARA is a personal safety application with both backend API and frontend UI served from the same Express.js server on port 5000. Data is persisted in PostgreSQL.

## Project Architecture
```
index.js                  - Main Express server entry point
server/
  db.js                   - PostgreSQL connection pool and schema initialization
  middleware/
    apiKey.js             - X-API-Key validation middleware
    auth.js               - JWT authentication middleware
  routes/
    auth.js               - Signup, login, OTP, forgot/reset password routes
    user.js               - User profile routes
    contacts.js           - Emergency contacts CRUD (max 3)
    sos.js                - Full SOS system with toggle, SMS simulation, nearby broadcast, media linking
    upload.js             - File upload, simulated capture, media list, password-protected delete
    location.js           - Location tracking route
  uploads/
    images/               - Simulated captured images
    audio/                - Simulated captured audio
public/
  index.html              - Login/Signup/OTP/Forgot Password page (with logo support)
  dashboard.html          - Main dashboard page (with logo support)
  style.css               - Global styles (white text, premium dark/light theme)
  app.js                  - Frontend JavaScript
```

## Database Tables
- **users** - id, username, email, phone, password (bcrypt), otp_code, otp_expires_at, reset_token, reset_token_expires_at, emergency_state, active_incident_id, created_at
- **emergency_contacts** - id, user_id (FK), name, phone, relationship, created_at
- **incident_logs** - id, user_id (FK), type, latitude, longitude, message, sound_level, motion_level, status (active/resolved), created_at
- **location_logs** - id, user_id (FK), latitude, longitude, created_at
- **sms_logs** - id, incident_id (FK), user_id (FK), contact_name, contact_phone, message, status, created_at
- **nearby_broadcasts** - id, incident_id (FK), broadcaster_id (FK), receiver_id (FK), distance_meters, message, status, created_at
- **media_storage** - id, user_id (FK), incident_id (FK), filename, original_name, mimetype, file_size, file_path, created_at

## SOS Toggle System
SOS button toggles between NORMAL and EMERGENCY states:
- **Activate**: Creates incident (status: active), saves location, sends SMS to contacts, broadcasts to nearby users, simulates media capture (BMP image + WAV audio)
- **Deactivate**: Resolves incident (status: resolved), resets user to normal state
- Emergency state persists in database (users.emergency_state + users.active_incident_id)

## Simulated Media Capture
When SOS is activated:
1. Auto-generates BMP image (320x240, random colors)
2. Auto-generates WAV audio (2 seconds, 8kHz)
3. Both files stored in server/uploads/ with metadata in media_storage table
4. Files linked to the incident via incident_id

## Media Deletion Security
- Deleting media requires password verification
- User's password checked via bcrypt.compare before file removal
- Both file on disk and database record are deleted

## Key Technical Details
- **Server**: Express.js on port 5000
- **Database**: PostgreSQL (Replit built-in, via DATABASE_URL)
- **Auth**: JWT tokens (24h expiry), bcryptjs password hashing
- **OTP Login**: Simulated 6-digit OTP with 5-minute expiry
- **Forgot Password**: Reset token with 15-minute expiry
- **API Key**: `vritara-safety-device-key-2024` via `X-API-Key` header (for device routes)
- **File Uploads**: Multer, stored in `server/uploads/`, references in media_storage table
- **Static Uploads**: Served from `/uploads` route
- **Nearby Broadcast**: Haversine formula calculates distance between users, alerts those within 200m
- **Frontend**: Vanilla HTML/CSS/JS, premium white-text dark UI with logo support

## API Routes
- `POST /api/signup` - Register new user
- `POST /api/login` - Login with email/password
- `POST /api/request-otp` - Request OTP for email
- `POST /api/verify-otp` - Verify OTP and login
- `POST /api/forgot-password` - Get reset token
- `POST /api/reset-password` - Reset password with token
- `GET/PUT /api/user/profile` - User profile (JWT required)
- `GET/POST/DELETE /api/contacts` - Emergency contacts (JWT required, max 3)
- `POST /api/sos/toggle` - Toggle SOS state between normal/emergency (JWT required)
- `GET /api/sos/state` - Get current emergency state (JWT required)
- `POST /api/sos/manual` - Manual SOS with full notification flow (JWT required)
- `POST /api/sos/automatic` - Auto SOS with full notification flow (JWT required)
- `GET /api/sos/incidents` - Incident history with SMS/broadcast/media details (JWT required)
- `GET /api/incidents` - Same as above, top-level route (JWT required)
- `POST /api/upload` - File upload (JWT required)
- `POST /api/upload/simulate-capture` - Simulated media capture (JWT required)
- `GET /api/upload/media` - List all user media files (JWT required)
- `POST /api/upload/delete/:id` - Delete media with password verification (JWT required)
- `POST /api/location` - Location update (JWT required)
- `GET /status` - Health check
- Legacy device routes: `/api/sensor-data`, `/api/emergency/manual`, `/api/heartbeat` (API key required)

## Frontend Dashboard
- **Layout**: Desktop sidebar + mobile bottom navigation with 6 pages
- **Pages**: Home (SOS toggle + stats + upload), Location (live GPS tracking), Contacts (CRUD), Media (gallery with delete), History (incident list with status badges), Settings (profile + theme)
- **SOS Toggle**: Red SOS button turns green "SAFE" when emergency is active; tap to toggle
- **Media Gallery**: Grid layout showing captured images/audio with incident badges, password-protected delete
- **Theme**: Dark/Light toggle using CSS custom properties, persisted in localStorage
- **Navigation**: Sidebar nav for desktop (240px), bottom nav for mobile (<768px) with floating SOS button
- **Stats**: Quick stats cards showing contact count, incident count, location status
- **Logo Support**: Optional logo.png displayed on login page and dashboard (graceful fallback if missing)

## Recent Changes
- 2026-02-12: Added SOS toggle system with emergency state persistence in database
- 2026-02-12: Added simulated media capture (BMP images + WAV audio) during SOS activation
- 2026-02-12: Added Media Storage page with gallery view and password-protected delete
- 2026-02-12: Updated UI to premium white text, added logo support on login and dashboard
- 2026-02-12: Added incident status badges (active/resolved) in history
- 2026-02-12: Major dashboard upgrade - sidebar/bottom nav, 6 pages, dark/light theme, settings with profile edit
- 2026-02-12: Enhanced SOS system with SMS simulation, nearby user broadcast, and media linking
- 2026-02-12: Added sms_logs and nearby_broadcasts tables
- 2026-02-12: Added GET /api/incidents top-level route
- 2026-02-12: Migrated from in-memory storage to PostgreSQL database
- 2026-02-12: Added OTP login simulation and forgot password with reset token flow
- 2026-02-12: Built full VRITARA Safety App with backend routes and frontend UI
