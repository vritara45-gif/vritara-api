const API_BASE = "https://vritara-api.onrender.com";
console.log("API_BASE =", API_BASE);

let currentLocation = { latitude: null, longitude: null };
let otpEmailStore = "";
let forgotEmailStore = "";
let contactCount = 0;
let incidentCount = 0;
let emergencyState = "normal";
let deleteMediaId = null;

function showAlert(message, type) {
  const box = document.getElementById("alertBox");
  if (!box) return;
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    box.innerHTML = "";
  }, 5000);
}

function hideAllForms() {
  const ids = ["loginForm", "signupForm", "forgotForm", "resetForm", "otpRequestForm", "otpVerifyForm"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"));
}

function switchTab(tab) {
  hideAllForms();
  const tabs = document.querySelectorAll(".tab-btn");
  if (tab === "login") {
    const el = document.getElementById("loginForm");
    if (el) el.classList.remove("hidden");
    if (tabs[0]) tabs[0].classList.add("active");
  } else if (tab === "signup") {
    const el = document.getElementById("signupForm");
    if (el) el.classList.remove("hidden");
    if (tabs[1]) tabs[1].classList.add("active");
  }
}

function showForgot() {
  hideAllForms();
  const el = document.getElementById("forgotForm");
  if (el) el.classList.remove("hidden");
}

function showOtpRequest() {
  hideAllForms();
  const el = document.getElementById("otpRequestForm");
  if (el) el.classList.remove("hidden");
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return { error: "Invalid server response" };
  }
}

async function requestOtp() {
  const email = document.getElementById("otpEmail").value;
  if (!email) return showAlert("Please enter your email", "error");

  console.log("REQUEST OTP URL:", API_BASE + "/api/request-otp");

  try {
    const res = await fetch(API_BASE + "/api/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    console.log("OTP response status:", res.status);
    const data = await safeJson(res);
    console.log("OTP response data:", data);

    if (res.ok) {
      otpEmailStore = email;
      showAlert("OTP sent! Code: " + data.otp + " (simulated)", "success");
      hideAllForms();
      const el = document.getElementById("otpVerifyForm");
      if (el) el.classList.remove("hidden");
    } else {
      showAlert(data.error || "Failed to send OTP", "error");
    }
  } catch (err) {
    console.error("REQUEST OTP ERROR:", err);
    showAlert("Network error: " + err.message, "error");
  }
}

async function verifyOtp() {
  const otp = document.getElementById("otpCode").value;
  if (!otp) return showAlert("Please enter the OTP", "error");

  console.log("VERIFY OTP URL:", API_BASE + "/api/verify-otp");

  try {
    const res = await fetch(API_BASE + "/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpEmailStore, otp }),
    });

    console.log("Verify OTP response status:", res.status);
    const data = await safeJson(res);
    console.log("Verify OTP response data:", data);

    if (res.ok) {
      localStorage.setItem("vritara_token", data.token);
      localStorage.setItem("vritara_user", JSON.stringify(data.user));
      window.location.href = "/dashboard.html";
    } else {
      showAlert(data.error || "OTP verification failed", "error");
    }
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    showAlert("Network error: " + err.message, "error");
  }
}

async function handleForgot() {
  const email = document.getElementById("forgotEmail").value;
  if (!email) return showAlert("Please enter your email", "error");

  console.log("FORGOT PASSWORD URL:", API_BASE + "/api/forgot-password");

  try {
    const res = await fetch(API_BASE + "/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    console.log("Forgot password response status:", res.status);
    const data = await safeJson(res);
    console.log("Forgot password response data:", data);

    if (res.ok) {
      forgotEmailStore = email;
      showAlert("Reset token: " + data.resetToken + " (simulated)", "success");
      hideAllForms();
      const el = document.getElementById("resetForm");
      if (el) el.classList.remove("hidden");
    } else {
      showAlert(data.error || "Forgot password failed", "error");
    }
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    showAlert("Network error: " + err.message, "error");
  }
}

async function handleReset() {
  const resetToken = document.getElementById("resetToken").value;
  const newPassword = document.getElementById("newPassword").value;

  if (!resetToken || !newPassword) return showAlert("Please fill in all fields", "error");

  console.log("RESET PASSWORD URL:", API_BASE + "/api/reset-password");

  try {
    const res = await fetch(API_BASE + "/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmailStore, resetToken, newPassword }),
    });

    console.log("Reset password response status:", res.status);
    const data = await safeJson(res);
    console.log("Reset password response data:", data);

    if (res.ok) {
      showAlert(data.message || "Password reset successful", "success");
      switchTab("login");
    } else {
      showAlert(data.error || "Reset failed", "error");
    }
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    showAlert("Network error: " + err.message, "error");
  }
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    console.log("LOGIN URL:", API_BASE + "/api/login");
    console.log("LOGIN EMAIL:", email);

    try {
      const res = await fetch(API_BASE + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", res.status);
      const data = await safeJson(res);
      console.log("Login response data:", data);

      if (res.ok) {
        localStorage.setItem("vritara_token", data.token);
        localStorage.setItem("vritara_user", JSON.stringify(data.user));
        window.location.href = "/dashboard.html";
      } else {
        showAlert(data.error || "Login failed", "error");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      showAlert("Network error: " + err.message, "error");
    }
  });
}

const signupFormEl = document.getElementById("signupForm");
if (signupFormEl) {
  signupFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const phone = document.getElementById("signupPhone").value;
    const password = document.getElementById("signupPassword").value;

    console.log("SIGNUP URL:", API_BASE + "/api/signup");
    console.log("SIGNUP EMAIL:", email);

    try {
      const res = await fetch(API_BASE + "/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, phone, password }),
      });

      console.log("Signup response status:", res.status);
      const data = await safeJson(res);
      console.log("Signup response data:", data);

      if (res.ok) {
        localStorage.setItem("vritara_token", data.token);
        localStorage.setItem("vritara_user", JSON.stringify(data.user));
        window.location.href = "/dashboard.html";
      } else {
        showAlert(data.error || "Signup failed", "error");
      }
    } catch (err) {
      console.error("SIGNUP ERROR:", err);
      showAlert("Network error: " + err.message, "error");
    }
  });
}

function getToken() {
  return localStorage.getItem("vritara_token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + getToken(),
  };
}

function logout() {
  localStorage.removeItem("vritara_token");
  localStorage.removeItem("vritara_user");
  window.location.href = "/";
}

function switchPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item[data-page], .bottom-nav-item[data-page]").forEach((n) => n.classList.remove("active"));

  const pageEl = document.getElementById("page-" + page);
  if (pageEl) pageEl.classList.add("active");

  document.querySelectorAll(`[data-page="${page}"]`).forEach((n) => n.classList.add("active"));

  if (page === "contacts") loadContacts();
  if (page === "history") loadIncidents();
  if (page === "settings") loadProfile();
  if (page === "media") loadMedia();
}

function initTheme() {
  const saved = localStorage.getItem("vritara_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  const toggle = document.getElementById("themeToggle");
  if (toggle) toggle.checked = saved === "dark";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("vritara_theme", next);
  const toggle = document.getElementById("themeToggle");
  if (toggle) toggle.checked = next === "dark";
}

async function initDashboard() {
  initTheme();

  const user = JSON.parse(localStorage.getItem("vritara_user") || "{}");
  const welcomeEl = document.getElementById("welcomeText");
  if (welcomeEl && user.username) {
    welcomeEl.textContent = "Welcome, " + user.username + "!";
  }

  loadContacts();
  loadIncidents();
  startLocationTracking();
  loadProfile();
  loadSOSState();
}

function startLocationTracking() {
  const latEl = document.getElementById("latValue");
  const lngEl = document.getElementById("lngValue");
  const accEl = document.getElementById("accValue");
  const timeEl = document.getElementById("locTimeValue");
  const statusEl = document.getElementById("locationStatus");
  const statLoc = document.getElementById("statLocation");

  if (!navigator.geolocation) {
    if (latEl) latEl.textContent = "N/A";
    if (lngEl) lngEl.textContent = "N/A";
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:var(--text-muted)">Geolocation not supported</span>';
    }
    if (statLoc) statLoc.textContent = "N/A";
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      currentLocation.latitude = pos.coords.latitude;
      currentLocation.longitude = pos.coords.longitude;

      if (latEl) latEl.textContent = pos.coords.latitude.toFixed(6);
      if (lngEl) lngEl.textContent = pos.coords.longitude.toFixed(6);
      if (accEl) accEl.textContent = pos.coords.accuracy ? Math.round(pos.coords.accuracy) + "m" : "--";
      if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
      if (statLoc) statLoc.textContent = "ON";

      fetch(API_BASE + "/api/location", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(currentLocation),
      }).catch((err) => console.warn("Location sync failed:", err));
    },
    (err) => {
      console.warn("Geolocation error:", err);

      if (latEl) latEl.textContent = "Denied";
      if (lngEl) lngEl.textContent = "Denied";
      if (statusEl) {
        statusEl.innerHTML = '<span>Location access denied</span>';
        statusEl.style.background = "var(--danger-bg)";
        statusEl.style.color = "var(--danger)";
      }
      if (statLoc) statLoc.textContent = "OFF";
    },
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}

async function loadSOSState() {
  try {
    const res = await fetch(API_BASE + "/api/sos/state", {
      headers: authHeaders(),
    });
    const data = await safeJson(res);
    if (res.ok) {
      emergencyState = data.state || "normal";
      updateSOSUI();
    }
  } catch (err) {
    console.warn("Load SOS state failed:", err);
  }
}

function updateSOSUI() {
  const statusBar = document.getElementById("statusBar");
  const statusText = document.getElementById("statusText");
  const sosBtn = document.getElementById("sosBtn");
  const sosRing = document.getElementById("sosRing");
  const sosLabel = document.getElementById("sosLabel");
  const sosSublabel = document.getElementById("sosSublabel");
  const sosNavBtn = document.getElementById("sosNavBtn");

  if (emergencyState === "emergency") {
    if (statusBar) statusBar.className = "status-bar status-emergency";
    if (statusText) statusText.textContent = "EMERGENCY ACTIVE";
    if (sosBtn) {
      sosBtn.classList.add("sos-active");
      sosBtn.textContent = "SAFE";
    }
    if (sosRing) sosRing.classList.add("emergency-active");
    if (sosLabel) sosLabel.textContent = "Tap to mark yourself safe";
    if (sosSublabel) sosSublabel.textContent = "This will resolve the current emergency incident";
    if (sosNavBtn) {
      sosNavBtn.classList.add("sos-nav-active");
      sosNavBtn.textContent = "SAFE";
    }
  } else {
    if (statusBar) statusBar.className = "status-bar status-normal";
    if (statusText) statusText.textContent = "Status: Normal";
    if (sosBtn) {
      sosBtn.classList.remove("sos-active");
      sosBtn.textContent = "SOS";
    }
    if (sosRing) sosRing.classList.remove("emergency-active");
    if (sosLabel) sosLabel.textContent = "Tap to activate emergency";
    if (sosSublabel) sosSublabel.textContent = "Your location and alerts will be sent to your emergency contacts";
    if (sosNavBtn) {
      sosNavBtn.classList.remove("sos-nav-active");
      sosNavBtn.textContent = "SOS";
    }
  }
}

async function toggleSOS() {
  const overlay = document.getElementById("emergencyOverlay");

  if (emergencyState === "normal" && overlay) {
    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.add("hidden"), 2000);
  }

  try {
    const res = await fetch(API_BASE + "/api/sos/toggle", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        message: "Emergency SOS triggered from app",
      }),
    });

    const data = await safeJson(res);

    if (res.ok) {
      emergencyState = data.state;
      updateSOSUI();

      if (data.state === "emergency") {
        let alertMsg = "SOS ACTIVATED!";
        if (data.notifications) {
          if (data.notifications.sms_sent > 0) {
            alertMsg += ` SMS sent to ${data.notifications.sms_sent} contact(s).`;
          }
          if (data.notifications.nearby_broadcasts > 0) {
            alertMsg += ` ${data.notifications.nearby_broadcasts} nearby user(s) alerted.`;
          }
        }
        showAlert(alertMsg, "error");

        if (data.incident && data.incident.id) {
          simulateCapture(data.incident.id);
        }
      } else {
        showAlert("Emergency resolved. You are safe.", "success");
      }

      loadIncidents();
    } else {
      showAlert(data.error || "Failed to toggle SOS", "error");
    }
  } catch (err) {
    console.error("TOGGLE SOS ERROR:", err);
    showAlert("Network error: " + err.message, "error");
  }
}

async function simulateCapture(incidentId) {
  try {
    const imageRes = fetch(API_BASE + "/api/upload/simulate-capture", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ incident_id: incidentId, type: "image" }),
    });

    const audioRes = fetch(API_BASE + "/api/upload/simulate-capture", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ incident_id: incidentId, type: "audio" }),
    });

    await Promise.all([imageRes, audioRes]);
    console.log("Simulated media capture completed for incident", incidentId);
  } catch (err) {
    console.error("Simulate capture error:", err);
  }
}

async function loadContacts() {
  const list = document.getElementById("contactsList");
  if (!list) return;

  try {
    const res = await fetch(API_BASE + "/api/contacts", {
      headers: authHeaders(),
    });
    const data = await safeJson(res);

    if (data.contacts && data.contacts.length > 0) {
      contactCount = data.contacts.length;
      list.innerHTML = data.contacts
        .map(
          (c) => `
        <div class="contact-item">
          <div class="contact-info">
            <h4>${escapeHtml(c.name)}</h4>
            <p>${escapeHtml(c.phone)}${c.relationship ? " - " + escapeHtml(c.relationship) : ""}</p>
          </div>
          <button class="delete-btn" onclick="deleteContact('${c.id}')">Remove</button>
        </div>`
        )
        .join("");

      const addSection = document.getElementById("addContactSection");
      if (addSection) {
        if (data.contacts.length >= 3) {
          addSection.classList.add("hidden");
        } else {
          addSection.classList.remove("hidden");
        }
      }
    } else {
      contactCount = 0;
      list.innerHTML = '<p class="no-data">No emergency contacts added yet. Add contacts to receive SOS alerts.</p>';
    }
  } catch (err) {
    list.innerHTML = '<p class="no-data">Failed to load contacts</p>';
  }

  updateStats();
}

async function addContact() {
  const name = document.getElementById("contactName").value;
  const phone = document.getElementById("contactPhone").value;
  const relationship = document.getElementById("contactRelation").value;

  if (!name || !phone) return showAlert("Name and phone are required", "error");

  try {
    const res = await fetch(API_BASE + "/api/contacts", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, phone, relationship }),
    });
    const data = await safeJson(res);

    if (res.ok) {
      showAlert("Contact added!", "success");
      document.getElementById("contactName").value = "";
      document.getElementById("contactPhone").value = "";
      document.getElementById("contactRelation").value = "";
      loadContacts();
    } else {
      showAlert(data.error || "Failed to add contact", "error");
    }
  } catch (err) {
    showAlert("Network error: " + err.message, "error");
  }
}

async function deleteContact(id) {
  try {
    const res = await fetch(API_BASE + "/api/contacts/" + id, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (res.ok) {
      showAlert("Contact removed", "success");
      loadContacts();
    }
  } catch (err) {
    showAlert("Network error: " + err.message, "error");
  }
}

async function loadIncidents() {
  const list = document.getElementById("incidentList");
  if (!list) return;

  try {
    const res = await fetch(API_BASE + "/api/incidents", {
      headers: authHeaders(),
    });
    const data = await safeJson(res);

    if (data.incidents && data.incidents.length > 0) {
      incidentCount = data.incidents.length;
      list.innerHTML = data.incidents
        .map((i) => {
          let smsInfo = "";
          if (i.sms_notifications && i.sms_notifications.length > 0) {
            smsInfo = `<p class="incident-sms">SMS sent to: ${i.sms_notifications.map((s) => escapeHtml(s.contact_name)).join(", ")}</p>`;
          }

          let broadcastInfo = "";
          if (i.nearby_broadcasts && i.nearby_broadcasts.length > 0) {
            broadcastInfo = `<p class="incident-broadcast">Nearby alerts: ${i.nearby_broadcasts.length} user(s) notified</p>`;
          }

          let mediaInfo = "";
          if (i.media_files && i.media_files.length > 0) {
            mediaInfo = `<p class="incident-media">Evidence: ${i.media_files.length} file(s) attached</p>`;
          }

          const statusBadge = i.status ? `<span class="incident-status incident-status-${i.status}">${i.status}</span>` : "";

          return `
        <div class="incident-item">
          <span class="incident-type">${escapeHtml(i.type)} SOS</span>
          ${statusBadge}
          <p class="incident-time">${new Date(i.created_at).toLocaleString()}</p>
          <p class="incident-msg">${i.latitude ? "Location: " + Number(i.latitude).toFixed(4) + ", " + Number(i.longitude).toFixed(4) : "No location"}</p>
          ${i.message ? `<p class="incident-msg">${escapeHtml(i.message)}</p>` : ""}
          ${smsInfo}
          ${broadcastInfo}
          ${mediaInfo}
        </div>`;
        })
        .join("");
    } else {
      incidentCount = 0;
      list.innerHTML = '<p class="no-data">No incidents recorded yet</p>';
    }
  } catch (err) {
    list.innerHTML = '<p class="no-data">Failed to load incidents</p>';
  }

  updateStats();
}

function updateStats() {
  const statContacts = document.getElementById("statContacts");
  const statIncidents = document.getElementById("statIncidents");
  const contactCountText = document.getElementById("contactCountText");

  if (statContacts) statContacts.textContent = contactCount;
  if (statIncidents) statIncidents.textContent = incidentCount;
  if (contactCountText) contactCountText.textContent = contactCount + " / 3 contacts";
}

async function loadMedia() {
  const gallery = document.getElementById("mediaGallery");
  if (!gallery) return;

  try {
    const res = await fetch(API_BASE + "/api/upload/media", {
      headers: authHeaders(),
    });
    const data = await safeJson(res);

    if (data.media && data.media.length > 0) {
      gallery.innerHTML =
        '<div class="media-gallery">' +
        data.media
          .map((m) => {
            const isImage = m.mimetype && m.mimetype.startsWith("image");
            const isAudio = m.mimetype && m.mimetype.startsWith("audio");

            let fileUrl = m.file_path || "";
            if (fileUrl && !fileUrl.startsWith("http")) {
              fileUrl = API_BASE + fileUrl;
            }

            if (!fileUrl) {
              console.warn("Missing file_path for media:", m);
            }

            let preview = "";
            if (isImage) {
              preview = `<div class="media-preview"><img src="${fileUrl}?t=${Date.now()}" alt="${escapeHtml(m.original_name)}" onerror="this.parentElement.innerHTML='<div class=media-preview-audio><span>Image not found</span></div>'"></div>`;
            } else if (isAudio) {
              preview = `<div class="media-preview">
                <div class="media-preview-audio">
                  <span>Audio</span>
                </div>
                <audio controls style="width:100%; margin-top:8px;">
                  <source src="${fileUrl}" type="audio/wav">
                </audio>
              </div>`;
            } else {
              preview = `<div class="media-preview"><div class="media-preview-audio"><span>File</span></div></div>`;
            }

            const sizeKB = m.file_size ? (m.file_size / 1024).toFixed(1) + " KB" : "--";
            const incidentBadge = m.incident_id
              ? `<div class="media-incident-badge" style="background:var(--warning-bg);color:var(--warning)">Incident #${m.incident_id}${m.incident_status ? " - " + m.incident_status : ""}</div>`
              : `<div class="media-incident-badge" style="background:var(--info-bg);color:var(--info)">No incident</div>`;

            return `
            <div class="media-item">
              ${preview}
              <div class="media-info">
                <div class="media-name">${escapeHtml(m.original_name)}</div>
                <div class="media-meta">${sizeKB} &middot; ${new Date(m.created_at).toLocaleString()}</div>
                ${incidentBadge}
              </div>
              <button class="media-delete-btn" onclick="openDeleteModal(${m.id})">Delete</button>
            </div>`;
          })
          .join("") +
        "</div>";
    } else {
      gallery.innerHTML = '<p class="no-data">No media files yet. Media is captured automatically during SOS emergencies.</p>';
    }
  } catch (err) {
    gallery.innerHTML = '<p class="no-data">Failed to load media</p>';
  }
}

function openDeleteModal(mediaId) {
  deleteMediaId = mediaId;
  const modal = document.getElementById("deleteModal");
  const passwordInput = document.getElementById("deletePassword");
  const errorEl = document.getElementById("deleteError");
  if (modal) modal.classList.remove("hidden");
  if (passwordInput) passwordInput.value = "";
  if (errorEl) errorEl.classList.add("hidden");
}

function closeDeleteModal() {
  deleteMediaId = null;
  const modal = document.getElementById("deleteModal");
  if (modal) modal.classList.add("hidden");
}

async function confirmDeleteMedia() {
  const password = document.getElementById("deletePassword").value;
  const errorEl = document.getElementById("deleteError");

  if (!password) {
    if (errorEl) {
      errorEl.textContent = "Please enter your password";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  try {
    const res = await fetch(API_BASE + "/api/upload/delete/" + deleteMediaId, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ password }),
    });
    const data = await safeJson(res);

    if (res.ok) {
      closeDeleteModal();
      showAlert("Media deleted successfully", "success");
      loadMedia();
    } else {
      if (errorEl) {
        errorEl.textContent = data.error || "Delete failed";
        errorEl.classList.remove("hidden");
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = "Network error";
      errorEl.classList.remove("hidden");
    }
  }
}

async function loadProfile() {
  try {
    const res = await fetch(API_BASE + "/api/user/profile", {
      headers: authHeaders(),
    });
    const data = await safeJson(res);

    if (res.ok) {
      const nameEl = document.getElementById("profileName");
      const emailEl = document.getElementById("profileEmail");
      const phoneEl = document.getElementById("profilePhone");
      const avatarEl = document.getElementById("profileAvatar");
      const memberEl = document.getElementById("memberSince");

      if (nameEl) nameEl.textContent = data.username || "Unknown";
      if (emailEl) emailEl.textContent = data.email || "--";
      if (phoneEl) phoneEl.textContent = data.phone || "No phone set";
      if (avatarEl) avatarEl.textContent = (data.username || "U").charAt(0).toUpperCase();
      if (memberEl && data.created_at) memberEl.textContent = new Date(data.created_at).toLocaleDateString();

      const editUser = document.getElementById("editUsername");
      const editPhone = document.getElementById("editPhone");
      if (editUser) editUser.value = data.username || "";
      if (editPhone) editPhone.value = data.phone || "";
    }
  } catch (err) {
    console.warn("Profile load failed:", err);
  }
}

function showEditProfile() {
  const form = document.getElementById("profileEditForm");
  const btn = document.getElementById("editProfileBtn");
  if (form) form.classList.remove("hidden");
  if (btn) btn.classList.add("hidden");
}

function cancelEditProfile() {
  const form = document.getElementById("profileEditForm");
  const btn = document.getElementById("editProfileBtn");
  if (form) form.classList.add("hidden");
  if (btn) btn.classList.remove("hidden");
}

async function saveProfile() {
  const username = document.getElementById("editUsername").value;
  const phone = document.getElementById("editPhone").value;

  try {
    const res = await fetch(API_BASE + "/api/user/profile", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ username, phone }),
    });
    const data = await safeJson(res);

    if (res.ok) {
      showAlert("Profile updated!", "success");
      if (data.user) {
        localStorage.setItem("vritara_user", JSON.stringify(data.user));
      }
      cancelEditProfile();
      loadProfile();

      const welcomeEl = document.getElementById("welcomeText");
      if (welcomeEl && data.user && data.user.username) {
        welcomeEl.textContent = "Welcome, " + data.user.username + "!";
      }
    } else {
      showAlert(data.error || "Failed to update profile", "error");
    }
  } catch (err) {
    showAlert("Network error: " + err.message, "error");
  }
}

async function uploadFile(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById("uploadStatus");
  if (statusEl) statusEl.textContent = "Uploading " + file.name + "...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(API_BASE + "/api/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + getToken() },
      body: formData,
    });
    const data = await safeJson(res);

    if (res.ok) {
      if (statusEl) statusEl.textContent = "Uploaded: " + data.file.original_name;
      showAlert("File uploaded successfully!", "success");
      loadMedia();
    } else {
      if (statusEl) statusEl.textContent = "Upload failed";
      showAlert(data.error || "Upload failed", "error");
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = "Upload error";
    showAlert("Network error uploading file: " + err.message, "error");
  }

  input.value = "";
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
  if (localStorage.getItem("vritara_token")) {
    window.location.href = "/dashboard.html";
  }
}
