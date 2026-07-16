// --- Application State ---
let isLocked = false;
let isPaused = false;
let responseCount = 342;
let participantCount = 342;
const initialWordCount = 12; // Static words defined in HTML

// --- DOM Elements ---
const wordcloud = document.getElementById("wordcloud");
const responseCounter = document.getElementById("responseCounterVal");
const footerParticipants = document.getElementById("footerParticipantsVal");

const menuToggleBtn = document.getElementById("menuToggleBtn");
const controlSidebar = document.getElementById("controlSidebar");
const drawerOverlay = document.getElementById("drawerOverlay");

const fullscreenBtn = document.getElementById("fullscreenBtn");
const fullscreenIcon = document.getElementById("fullscreenIcon");

const resetPollBtn = document.getElementById("resetPollBtn");
const lockPollBtn = document.getElementById("lockPollBtn");
const lockBtnIcon = document.getElementById("lockBtnIcon");
const lockBtnText = document.getElementById("lockBtnText");

const pausePollBtn = document.getElementById("pausePollBtn");
const pauseBtnIcon = document.getElementById("pauseBtnIcon");
const pauseBtnText = document.getElementById("pauseBtnText");

const downloadImageBtn = document.getElementById("downloadImageBtn");
const settingsBtn = document.getElementById("settingsBtn");

// --- Simulated Response Generator ---
const demoWords = [
  { text: "K8s", size: "word-sm", color: "word-secondary" },
  { text: "Gateway", size: "word-xs", color: "word-muted" },
  { text: "Database", size: "word-sm", color: "word-muted" },
  { text: "Serverless", size: "word-md", color: "word-primary" },
  { text: "Security", size: "word-xs", color: "word-error" },
  { text: "Stateless", size: "word-sm", color: "word-secondary" },
  { text: "API", size: "word-md", color: "word-secondary" },
  { text: "Caching", size: "word-xs", color: "word-muted" },
  { text: "Scalable", size: "word-sm", color: "word-primary" },
  { text: "Cloud", size: "word-xs", color: "word-muted" },
  { text: "Kubernetes", size: "word-md", color: "word-secondary" },
  { text: "DevOps", size: "word-sm", color: "word-primary" },
  { text: "Microservice", size: "word-lg", color: "word-secondary" },
];

// -------------------------
// Word cloud layout helpers
// -------------------------

// Map size classes to numeric priority (higher = larger/placed earlier)
const sizePriority = {
  "word-xl": 5,
  "word-lg": 4,
  "word-md": 3,
  "word-sm": 2,
  "word-xs": 1,
};

// Utility: simple AABB overlap check with optional padding
function rectsOverlap(a, b, padding = 6) {
  return !(
    a.right + padding <= b.left - padding ||
    a.left - padding >= b.right + padding ||
    a.bottom + padding <= b.top - padding ||
    a.top - padding >= b.bottom + padding
  );
}

// Gaussian random helper (Box-Muller)
function randNormal(mean = 0, std = 1) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * std + mean;
}

// Gather word objects from existing DOM plus demoWords, de-duplicate by text
function gatherWords() {
  const collected = [];

  // Collect existing .word-tag elements (static HTML) first
  const existing = Array.from(wordcloud.querySelectorAll(".word-tag"));
  existing.forEach((el) => {
    const text = el.textContent.trim();
    const classes = Array.from(el.classList);
    const size =
      classes.find((c) => /^word-(xl|lg|md|sm|xs)$/.test(c)) || "word-md";
    const color =
      classes.find((c) => /word-(primary|secondary|muted|error)/.test(c)) ||
      "word-primary";
    collected.push({ text, size, color });
  });

  // Add demoWords, but don't duplicate texts
  demoWords.forEach((w) => {
    if (!collected.some((c) => c.text.toLowerCase() === w.text.toLowerCase())) {
      collected.push(w);
    }
  });

  return collected;
}

// Place words using absolute positioning and collision-detection
function buildWordCloud() {
  if (!wordcloud) return;

  // Preserve decorative children (glow/scan-line) and remove others
  const preserved = [];
  Array.from(wordcloud.children).forEach((child) => {
    if (
      child.classList &&
      (child.classList.contains("cloud-background-glow") ||
        child.classList.contains("scan-line"))
    ) {
      preserved.push(child);
    }
  });

  // Clear wordcloud and re-append preserved elements
  wordcloud.innerHTML = "";
  preserved.forEach((n) => wordcloud.appendChild(n));

  const words = gatherWords();

  // Sort words: largest first so collision avoidance is easier
  words.sort((a, b) => sizePriority[b.size] - sizePriority[a.size]);

  const placedRects = [];
  const containerRect = wordcloud.getBoundingClientRect();
  const cW = containerRect.width;
  const cH = containerRect.height;
  const margin = Math.max(
    24,
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--space-4"),
    ),
  );

  words.forEach((w, idx) => {
    // Create element hidden for measurement
    const el = document.createElement("div");
    el.className = `word-tag ${w.size} ${w.color} word-new-flash`;
    el.setAttribute("role", "text");
    el.setAttribute("aria-label", `Word: ${w.text}`);
    el.innerText = w.text;
    el.style.visibility = "hidden";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.willChange = "transform, opacity";

    wordcloud.appendChild(el);

    // Measure
    const rect = el.getBoundingClientRect();
    const wPx = rect.width;
    const hPx = rect.height;

    // Sampling strategy: larger words closer to center
    const prio = sizePriority[w.size] || 2;
    const centerX = cW / 2;
    const centerY = cH / 2;
    const stdBase = Math.max(cW, cH) * 0.18; // spread baseline
    const std = stdBase * (1 / prio); // higher priority = smaller spread

    let placed = false;
    const maxAttempts = 500;
    for (let a = 0; a < maxAttempts && !placed; a++) {
      // Sample normally from center, fallback to uniform if normal is NaN
      let x = centerX + randNormal(0, std);
      let y = centerY + randNormal(0, std);
      if (!isFinite(x) || !isFinite(y)) {
        x = Math.random() * cW;
        y = Math.random() * cH;
      }

      // Clamp inside container with margin so words never get clipped
      x = Math.max(margin + wPx / 2, Math.min(cW - margin - wPx / 2, x));
      y = Math.max(margin + hPx / 2, Math.min(cH - margin - hPx / 2, y));

      const candidate = {
        left: x - wPx / 2,
        top: y - hPx / 2,
        right: x + wPx / 2,
        bottom: y + hPx / 2,
      };

      // Check collisions
      const conflict = placedRects.some((r) => rectsOverlap(r, candidate, 6));
      if (!conflict) {
        // Place using percentage coordinates so responsive resizing keeps roughly same locations
        const leftPct = (x / cW) * 100;
        const topPct = (y / cH) * 100;
        el.style.left = `${leftPct}%`;
        el.style.top = `${topPct}%`;
        el.style.visibility = "visible";
        placedRects.push(candidate);
        placed = true;
      }
    }

    // If not placed after many attempts, place somewhere safe (stacked)
    if (!placed) {
      const x = Math.max(
        margin + wPx / 2,
        Math.min(cW - margin - wPx / 2, Math.random() * cW),
      );
      const y = Math.max(
        margin + hPx / 2,
        Math.min(cH - margin - hPx / 2, Math.random() * cH),
      );
      const leftPct = (x / cW) * 100;
      const topPct = (y / cH) * 100;
      el.style.left = `${leftPct}%`;
      el.style.top = `${topPct}%`;
      el.style.visibility = "visible";
      placedRects.push({
        left: x - wPx / 2,
        top: y - hPx / 2,
        right: x + wPx / 2,
        bottom: y + hPx / 2,
      });
    }

    // Let spawn/flash animation run then remove the flash class
    setTimeout(
      () => {
        el.classList.remove("word-new-flash");
      },
      1100 + idx * 40,
    );
  });

  // Update telemetry counts (static demo)
  responseCount = Math.max(responseCount, words.length + 320);
  responseCounter.innerText = responseCount;
}

// Debounced rebuild on resize to reposition words responsively
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildWordCloud();
  }, 180);
});

// Build initial layout once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Slight delay to allow fonts to load for accurate measurement
  setTimeout(() => {
    buildWordCloud();
  }, 80);
});

// --- Mobile Navigation Drawer Handlers ---
function toggleMenu() {
  const isExpanded = menuToggleBtn.getAttribute("aria-expanded") === "true";
  menuToggleBtn.setAttribute("aria-expanded", !isExpanded);
  controlSidebar.classList.toggle("active");
  drawerOverlay.classList.toggle("active");
}

menuToggleBtn.addEventListener("click", toggleMenu);
drawerOverlay.addEventListener("click", toggleMenu);

// --- Browser Fullscreen API Integration ---
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .then(() => {
        fullscreenIcon.innerText = "fullscreen_exit";
        showToast("Entered Fullscreen Mode", "info");
      })
      .catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
        showToast("Fullscreen request denied by browser", "warning");
      });
  } else {
    document.exitFullscreen().then(() => {
      fullscreenIcon.innerText = "fullscreen";
      showToast("Exited Fullscreen Mode", "info");
    });
  }
}

fullscreenBtn.addEventListener("click", toggleFullscreen);

// Update fullscreen icon if triggered via browser escape key
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    fullscreenIcon.innerText = "fullscreen";
  }
});

// --- Action Control Handlers ---

// 1. Lock Poll Toggle
lockPollBtn.addEventListener("click", () => {
  isLocked = !isLocked;

  if (isLocked) {
    lockPollBtn.classList.add("danger-action");
    lockBtnIcon.innerText = "lock_open";
    lockBtnText.innerText = "Unlock Poll";
    wordcloud.classList.add("poll-locked");

    // Add temporary visual overlay
    const lockOverlay = document.createElement("div");
    lockOverlay.id = "lockCloudOverlay";
    lockOverlay.innerHTML =
      '<span class="material-symbols-outlined" style="margin-right: 8px;">lock</span> Voting Locked';

    wordcloud.appendChild(lockOverlay);
    showToast("Poll locked. Submissions disabled.", "warning");
  } else {
    lockPollBtn.classList.remove("danger-action");
    lockBtnIcon.innerText = "lock";
    lockBtnText.innerText = "Lock Poll";
    wordcloud.classList.remove("poll-locked");

    const overlay = document.getElementById("lockCloudOverlay");
    if (overlay) overlay.remove();
    showToast("Poll unlocked. Submissions enabled.", "success");
  }
});

// 2. Pause Poll Toggle
pausePollBtn.addEventListener("click", () => {
  isPaused = !isPaused;

  if (isPaused) {
    pauseBtnIcon.innerText = "play_arrow";
    pauseBtnText.innerText = "Resume Poll";
    showToast("Poll visual updates paused", "info");
  } else {
    pauseBtnIcon.innerText = "pause";
    pauseBtnText.innerText = "Pause Poll";
    showToast("Poll visual updates resumed", "success");
  }
});

// 3. Reset Poll Handler
resetPollBtn.addEventListener("click", () => {
  // Rebuild the demo static layout and reset telemetry counters
  buildWordCloud();
  responseCount = 342;
  participantCount = 342;
  responseCounter.innerText = responseCount;
  footerParticipants.innerText = participantCount;
  showToast("Poll reset successfully", "success");
});

// 4. Download Image Handler
downloadImageBtn.addEventListener("click", () => {
  showToast("Preparing image download...", "info");

  setTimeout(() => {
    showToast("Word Cloud image downloaded successfully", "success");
  }, 1200);
});

// 5. Settings Handler
settingsBtn.addEventListener("click", () => {
  showToast("Settings panel opened (Demo Mode)", "info");
});

// --- Sleek Custom Notification Toast Utility ---
function showToast(message, type = "info") {
  // Check if toast container exists, if not build it
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    document.body.appendChild(toastContainer);
  }

  // Create toast card element
  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;

  let icon = "info";
  let iconColor = "var(--primary)";
  if (type === "success") {
    icon = "check_circle";
    iconColor = "var(--success)";
  } else if (type === "warning") {
    icon = "warning";
    iconColor = "var(--warning)";
  } else if (type === "error") {
    icon = "error";
    iconColor = "var(--error)";
  }

  toast.innerHTML = `
    <span class="material-symbols-outlined" style="color: ${iconColor}; font-size: 18px;">${icon}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animations
  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  // Auto dismiss toast
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
