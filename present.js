/* ==========================================================================
   Micro-Menti — Presenter Dashboard client logic
   Repo: Micro-Menti-Frontend
   Files: public/present.html + public/presenter.js
   ========================================================================== */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
// TODO: replace with the deployed Render backend URL before shipping.
const BACKEND_URL = "https://micro-menti-backend.onrender.com";

// Room this dashboard belongs to: ?room=CODE in the URL, falling back to
// whatever demo code is already baked into the header badge.
const params = new URLSearchParams(window.location.search);
const sessionCodeVal = document.getElementById("sessionCodeVal");
const roomCode = (
  params.get("room") ||
  (sessionCodeVal ? sessionCodeVal.innerText.trim() : "MAIN")
).toUpperCase();

// The participant-facing page lives alongside this one.
const participantUrl = new URL(
  `participant.html?room=${encodeURIComponent(roomCode)}`,
  window.location.href,
).href;

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const cloud = document.getElementById("cloud");
const responseCounter = document.getElementById("responseCounterVal"),
  footerParticipants = document.getElementById("footerParticipantsVal");
const menuToggleBtn = document.getElementById("menuToggleBtn"),
  controlSidebar = document.getElementById("controlSidebar"),
  drawerOverlay = document.getElementById("drawerOverlay");
const fullscreenBtn = document.getElementById("fullscreenBtn"),
  fullscreenIcon = document.getElementById("fullscreenIcon");
const clearPollBtn = document.getElementById("clearPollBtn");
const lockPollBtn = document.getElementById("lockPollBtn"),
  lockBtnIcon = document.getElementById("lockBtnIcon"),
  lockBtnText = document.getElementById("lockBtnText");
const pausePollBtn = document.getElementById("pausePollBtn"),
  pauseBtnIcon = document.getElementById("pauseBtnIcon"),
  pauseBtnText = document.getElementById("pauseBtnText");
const downloadImageBtn = document.getElementById("downloadImageBtn"),
  settingsBtn = document.getElementById("settingsBtn");
const liveBadge = document.querySelector(".live-badge"),
  liveBadgeText = liveBadge ? liveBadge.querySelector("span:last-child") : null;
const roomTitle = document.getElementById("roomTitle");

if (roomTitle) roomTitle.innerText = `Room ${roomCode}`;
if (sessionCodeVal) sessionCodeVal.innerText = roomCode;

let isLocked = false,
  isPaused = false;

document.addEventListener("DOMContentLoaded", () => {
  genParticles();
  generateQrCode();
});

// ---------------------------------------------------------------------------
// QR code — auto-generated for the participant URL on load
// ---------------------------------------------------------------------------
function generateQrCode() {
  const target = document.getElementById("qrcode");
  if (!target || typeof QRCode === "undefined") return;
  target.innerHTML = "";
  new QRCode(target, {
    text: participantUrl,
    width: 96,
    height: 96,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

// ---------------------------------------------------------------------------
// Socket.io connection
// ---------------------------------------------------------------------------
const socket = io(BACKEND_URL);

socket.on("connect", () => {
  setLiveState("connected", "Live");
  socket.emit("joinRoom", roomCode);
});

socket.on("disconnect", () => {
  setLiveState("error", "Offline");
});

socket.on("connect_error", () => {
  setLiveState("error", "Error");
});

function setLiveState(state, label) {
  if (!liveBadge) return;
  liveBadge.classList.remove(
    "status-connecting",
    "status-connected",
    "status-error",
  );
  liveBadge.classList.add(`status-${state}`);
  if (liveBadgeText) liveBadgeText.innerText = label;
}
setLiveState("connecting", "Connecting");

// ---------------------------------------------------------------------------
// Dynamic Word Cloud Renderer — strict rendering algorithm
// ---------------------------------------------------------------------------
const PALETTE = [
  "#38bdf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#fb7185",
];

socket.on("cloudUpdate", (dataArray) => {
  renderCloud(dataArray);
});

function renderCloud(dataArray) {
  if (!cloud) return;

  // 1. Clear container
  cloud.innerHTML = "";

  // 2. Empty state check
  if (!dataArray || dataArray.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-cloud";
    empty.textContent = "Waiting for live submissions...";
    cloud.appendChild(empty);
    if (responseCounter) responseCounter.innerText = "0";
    return;
  }

  // 3. Calculate frequency bounds
  const maxCount = Math.max(...dataArray.map((item) => item.value));

  // 4. Dynamic scaling & color cycling loop
  const frag = document.createDocumentFragment();
  dataArray.forEach((word, i) => {
    const span = document.createElement("span");
    span.textContent = word.text;

    // Dynamic font size (16px–72px)
    let fontSize;
    if (maxCount > 1) {
      fontSize =
        16 + Math.round(((word.value - 1) / (maxCount - 1)) * (72 - 16));
    } else {
      fontSize = 32;
    }
    span.style.fontSize = `${fontSize}px`;

    // Strict color palette, cycled by index
    span.style.color = PALETTE[i % PALETTE.length];

    // Layout: flow inline within #cloud rather than absolute-position
    // (the shared .word-tag class defaults to absolute positioning for the
    // old scatter layout; override per-instance the same way the sandbox
    // cloud on the landing page already does).
    span.style.position = "static";

    // Organic entrance transform (CSS transform, not canvas)
    span.style.transform = `scale(1) translate(${(Math.sin(i) * 5).toFixed(1)}px, ${(Math.cos(i) * 5).toFixed(1)}px)`;

    span.className = "word-tag";

    // Frequency badge
    const badge = document.createElement("sub");
    badge.className = "word-tag-badge";
    badge.textContent = word.value;
    span.appendChild(badge);

    span.setAttribute("aria-label", `${word.text}, ${word.value} submissions`);
    frag.appendChild(span);
  });

  // 5. Append all elements
  cloud.appendChild(frag);

  if (responseCounter) {
    const total = dataArray.reduce((sum, w) => sum + w.value, 0);
    responseCounter.innerText = total;
  }
}

// ---------------------------------------------------------------------------
// "Clear Poll" — native confirm() gate, then emit resetCloud
// ---------------------------------------------------------------------------
if (clearPollBtn) {
  clearPollBtn.addEventListener("click", () => {
    if (
      !window.confirm(
        "Are you sure you want to clear the live word cloud? All data will be reset.",
      )
    )
      return;
    socket.emit("resetCloud", roomCode);
    showToast("Word cloud cleared.");
  });
}

// ---------------------------------------------------------------------------
// Ambient particle background
// ---------------------------------------------------------------------------
function genParticles() {
  const c = document.getElementById("particle-container");
  if (!c) return;
  c.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const sz = Math.random() * 4 + 2,
      l = Math.random() * 100;
    const d = Math.random() * 8,
      sp = Math.random() * 8 + 8;
    const o = Math.random() * 0.2 + 0.05,
      dr = Math.random() * 30 - 15;
    p.style.width = p.style.height = `${sz}px`;
    p.style.left = `${l}%`;
    p.style.animationDelay = `${d}s`;
    p.style.setProperty("--speed", `${sp}s`);
    p.style.setProperty("--opacity", o);
    p.style.setProperty("--drift", `${dr}px`);
    c.appendChild(p);
  }
}

// ---------------------------------------------------------------------------
// Drawer / fullscreen / misc sidebar controls (unchanged dashboard chrome)
// ---------------------------------------------------------------------------
function toggleMenu() {
  const exp = menuToggleBtn.getAttribute("aria-expanded") === "true";
  menuToggleBtn.setAttribute("aria-expanded", !exp);
  controlSidebar.classList.toggle("active");
  drawerOverlay.classList.toggle("active");
}
if (menuToggleBtn && drawerOverlay) {
  menuToggleBtn.addEventListener("click", toggleMenu);
  drawerOverlay.addEventListener("click", toggleMenu);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .then(() => {
        fullscreenIcon.innerText = "fullscreen_exit";
        showToast("Fullscreen mode active.");
      })
      .catch(() => showToast("Fullscreen request denied."));
  } else {
    document.exitFullscreen().then(() => {
      fullscreenIcon.innerText = "fullscreen";
      showToast("Exited fullscreen.");
    });
  }
}
if (fullscreenBtn) fullscreenBtn.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && fullscreenIcon)
    fullscreenIcon.innerText = "fullscreen";
});

if (lockPollBtn) {
  lockPollBtn.addEventListener("click", () => {
    isLocked = !isLocked;
    if (isLocked) {
      lockPollBtn.classList.add("danger-action");
      lockBtnIcon.innerText = "lock_open";
      lockBtnText.innerText = "Unlock Poll";
      cloud.classList.add("poll-locked");
      showToast("Voting locked.");
    } else {
      lockPollBtn.classList.remove("danger-action");
      lockBtnIcon.innerText = "lock";
      lockBtnText.innerText = "Lock Poll";
      cloud.classList.remove("poll-locked");
      showToast("Voting unlocked.");
    }
  });
}

if (pausePollBtn) {
  pausePollBtn.addEventListener("click", () => {
    isPaused = !isPaused;
    pauseBtnIcon.innerText = isPaused ? "play_arrow" : "pause";
    pauseBtnText.innerText = isPaused ? "Resume Poll" : "Pause Poll";
    showToast(isPaused ? "Updates paused." : "Updates resumed.");
  });
}

if (downloadImageBtn) {
  downloadImageBtn.addEventListener("click", () => {
    showToast("Preparing image export...");
    setTimeout(
      () => showToast("Word Cloud image downloaded successfully."),
      1000,
    );
  });
}

if (settingsBtn)
  settingsBtn.addEventListener("click", () =>
    showToast("Settings configured (Demo)"),
  );

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
function showToast(msg) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `<span class="material-symbols-outlined" style="color:var(--secondary);font-size:18px;">info</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 20);
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
