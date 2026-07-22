/* ==========================================================================
   Micro-Menti — Participant View client logic
   Repo: Micro-Menti-Frontend
   Files: public/index.html (participant view) + public/participant.js
   ========================================================================== */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
// TODO: replace with the deployed Render backend URL before shipping.
const BACKEND_URL = "https://<render-backend-url>";

// Multi-room mode: pull ?room=CODE from the URL, default to the single
// global room "MAIN" when the query param is absent.
const params = new URLSearchParams(window.location.search);
const roomCode = (params.get("room") || "MAIN").trim().toUpperCase();

const STORAGE_KEY = "micro_menti_submitted_room_" + roomCode;

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const wordForm = document.getElementById("wordForm");
const wordInput = document.getElementById("wordInput");
const submitBtn = document.getElementById("submitBtn");
const charCount = document.getElementById("charCount");
const successCard = document.getElementById("successCard");
const roomBadge = document.getElementById("roomBadge");
const connectionStatus = document.getElementById("connectionStatus");
const connectionText = document.getElementById("connectionText");
const latencyEl = document.getElementById("participant-latency");

if (roomBadge) roomBadge.innerText = `ROOM: ${roomCode}`;

// ---------------------------------------------------------------------------
// Socket.io connection
// ---------------------------------------------------------------------------
const socket = io(BACKEND_URL);

socket.on("connect", () => {
  setConnectionState("connected", "Live");
  // Multi-room mode: announce which room this client belongs to as soon as
  // the connection is established.
  socket.emit("joinRoom", roomCode);
});

socket.on("disconnect", () => {
  setConnectionState("error", "Disconnected");
});

socket.on("connect_error", () => {
  setConnectionState("error", "Connection failed");
});

function setConnectionState(state, label) {
  if (!connectionStatus || !connectionText) return;
  connectionStatus.classList.remove(
    "status-connecting",
    "status-connected",
    "status-error",
  );
  connectionStatus.classList.add(`status-${state}`);
  connectionText.innerText = label;
}
setConnectionState("connecting", "Connecting…");

// Lightweight round-trip latency readout, purely cosmetic — relies on the
// engine's own heartbeat packets so it needs no custom backend event.
if (latencyEl && socket.io && socket.io.engine) {
  let pingSentAt = 0;
  socket.io.engine.on("packet", (packet) => {
    if (packet.type === "ping") pingSentAt = performance.now();
    if (packet.type === "pong" && pingSentAt) {
      latencyEl.innerText = `${Math.round(performance.now() - pingSentAt)}ms`;
    }
  });
}

// ---------------------------------------------------------------------------
// Anti-spam: has this device already submitted for this room?
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  genParticles();

  if (localStorage.getItem(STORAGE_KEY)) {
    showSuccessState({ immediate: true });
  }
});

// ---------------------------------------------------------------------------
// Submission flow
// ---------------------------------------------------------------------------
if (wordInput && submitBtn) {
  wordInput.addEventListener("input", () => {
    const len = wordInput.value.length;
    if (charCount) charCount.innerText = len;
    submitBtn.disabled = len === 0;
  });
}

if (wordForm) {
  wordForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const word = wordInput.value.trim();
    if (!word || word.length > 25) return;

    submitBtn.disabled = true;
    wordInput.disabled = true;
    submitBtn.innerText = "Submitting…";

    socket.emit("submitWord", { roomCode: roomCode, word: word });

    localStorage.setItem(STORAGE_KEY, Date.now());

    showSuccessState();
  });
}

function showSuccessState({ immediate = false } = {}) {
  if (wordForm) {
    if (immediate) {
      wordForm.classList.add("hidden");
    } else {
      wordForm.classList.add("fading-out");
      setTimeout(() => wordForm.classList.add("hidden"), 350);
    }
  }
  if (successCard) {
    if (immediate) {
      successCard.classList.remove("hidden");
    } else {
      setTimeout(() => successCard.classList.remove("hidden"), 350);
    }
  }
}

// ---------------------------------------------------------------------------
// Ambient particle background (visual parity with the rest of the app)
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
// Toasts (matches present.js / app.js pattern for visual consistency)
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
