let isLocked = false, isPaused = false, responseCount = 342, participantCount = 342;
const wordcloud = document.getElementById("wordcloud"), responseCounter = document.getElementById("responseCounterVal"), footerParticipants = document.getElementById("footerParticipantsVal");
const menuToggleBtn = document.getElementById("menuToggleBtn"), controlSidebar = document.getElementById("controlSidebar"), drawerOverlay = document.getElementById("drawerOverlay");
const fullscreenBtn = document.getElementById("fullscreenBtn"), fullscreenIcon = document.getElementById("fullscreenIcon");
const resetPollBtn = document.getElementById("resetPollBtn"), lockPollBtn = document.getElementById("lockPollBtn"), lockBtnIcon = document.getElementById("lockBtnIcon"), lockBtnText = document.getElementById("lockBtnText");
const pausePollBtn = document.getElementById("pausePollBtn"), pauseBtnIcon = document.getElementById("pauseBtnIcon"), pauseBtnText = document.getElementById("pauseBtnText");
const downloadImageBtn = document.getElementById("downloadImageBtn"), settingsBtn = document.getElementById("settingsBtn");

const demoWords = [
  { text: "Scalable", size: "word-xl", color: "word-primary" },
  { text: "Complex", size: "word-lg", color: "word-secondary" },
  { text: "Distributed", size: "word-md", color: "word-secondary" },
  { text: "Fast", size: "word-md", color: "word-primary" },
  { text: "Decoupled", size: "word-md", color: "word-muted" },
  { text: "Agile", size: "word-sm", color: "word-primary" },
  { text: "Cloud", size: "word-sm", color: "word-muted" },
  { text: "K8s", size: "word-sm", color: "word-secondary" },
  { text: "DevOps", size: "word-sm", color: "word-muted" },
  { text: "Granular", size: "word-xs", color: "word-muted" },
  { text: "Docker", size: "word-xs", color: "word-secondary" },
  { text: "Messy", size: "word-xs", color: "word-error" },
  { text: "Serverless", size: "word-md", color: "word-primary" },
  { text: "Stateless", size: "word-sm", color: "word-secondary" },
  { text: "Security", size: "word-xs", color: "word-error" },
  { text: "API", size: "word-md", color: "word-secondary" },
  { text: "Caching", size: "word-xs", color: "word-muted" }
];

const sizePriority = { "word-xl": 5, "word-lg": 4, "word-md": 3, "word-sm": 2, "word-xs": 1 };

document.addEventListener("DOMContentLoaded", () => {
    genParticles();
    setTimeout(buildWordCloud, 100);
});

function genParticles() {
    const c = document.getElementById("particle-container");
    if (!c) return;
    c.innerHTML = "";
    for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        const sz = Math.random() * 4 + 2, l = Math.random() * 100;
        const d = Math.random() * 8, sp = Math.random() * 8 + 8;
        const o = Math.random() * 0.2 + 0.05, dr = Math.random() * 30 - 15;
        p.style.width = p.style.height = `${sz}px`;
        p.style.left = `${l}%`;
        p.style.animationDelay = `${d}s`;
        p.style.setProperty("--speed", `${sp}s`);
        p.style.setProperty("--opacity", o);
        p.style.setProperty("--drift", `${dr}px`);
        c.appendChild(p);
    }
}

function rectsOverlap(a, b, p = 8) {
  return !(a.right + p <= b.left - p || a.left - p >= b.right + p || a.bottom + p <= b.top - p || a.top - p >= b.bottom + p);
}

function randNormal(m = 0, s = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return (Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)) * s + m;
}

function buildWordCloud() {
  if (!wordcloud) return;
  const p = [];
  Array.from(wordcloud.children).forEach(c => {
    if (c.classList && (c.classList.contains("cloud-background-glow") || c.classList.contains("scan-line"))) p.push(c);
  });
  wordcloud.innerHTML = "";
  p.forEach(n => wordcloud.appendChild(n));

  const sorted = [...demoWords].sort((a, b) => sizePriority[b.size] - sizePriority[a.size]);
  const placed = [];
  const cRect = wordcloud.getBoundingClientRect();
  const cW = cRect.width || 800, cH = cRect.height || 450, margin = 24;

  sorted.forEach((w, idx) => {
    const el = document.createElement("div");
    el.className = `word-tag ${w.size} ${w.color} word-new-flash`;
    el.innerText = w.text;
    el.style.visibility = "hidden";
    el.style.left = el.style.top = "0px";
    wordcloud.appendChild(el);

    const r = el.getBoundingClientRect();
    const wPx = r.width || 60, hPx = r.height || 30;
    const prio = sizePriority[w.size] || 2;
    const std = (Math.max(cW, cH) * 0.16) * (1 / (prio * 0.8));

    let ok = false;
    for (let a = 0; a < 200 && !ok; a++) {
      let x = (cW / 2) + randNormal(0, std), y = (cH / 2) + randNormal(0, std);
      if (!isFinite(x) || !isFinite(y)) { x = Math.random() * cW; y = Math.random() * cH; }
      x = Math.max(margin + wPx / 2, Math.min(cW - margin - wPx / 2, x));
      y = Math.max(margin + hPx / 2, Math.min(cH - margin - hPx / 2, y));

      const candidate = { left: x - wPx / 2, top: y - hPx / 2, right: x + wPx / 2, bottom: y + hPx / 2 };
      if (!placed.some(pl => rectsOverlap(pl, candidate, 6))) {
        el.style.left = `${(x / cW) * 100}%`;
        el.style.top = `${(y / cH) * 100}%`;
        el.style.visibility = "visible";
        placed.push(candidate);
        ok = true;
      }
    }

    if (!ok) {
      const x = Math.max(margin + wPx / 2, Math.min(cW - margin - wPx / 2, Math.random() * cW));
      const y = Math.max(margin + hPx / 2, Math.min(cH - margin - hPx / 2, Math.random() * cH));
      el.style.left = `${(x / cW) * 100}%`;
      el.style.top = `${(y / cH) * 100}%`;
      el.style.visibility = "visible";
      placed.push({ left: x - wPx / 2, top: y - hPx / 2, right: x + wPx / 2, bottom: y + hPx / 2 });
    }
    setTimeout(() => el.classList.remove("word-new-flash"), 1100 + idx * 30);
  });

  if (responseCounter) responseCounter.innerText = responseCount;
  if (footerParticipants) footerParticipants.innerText = participantCount;
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildWordCloud, 200);
});

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
    document.documentElement.requestFullscreen()
      .then(() => { fullscreenIcon.innerText = "fullscreen_exit"; showToast("Fullscreen mode active."); })
      .catch(() => showToast("Fullscreen request denied."));
  } else {
    document.exitFullscreen().then(() => { fullscreenIcon.innerText = "fullscreen"; showToast("Exited fullscreen."); });
  }
}

if (fullscreenBtn) fullscreenBtn.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && fullscreenIcon) fullscreenIcon.innerText = "fullscreen";
});

if (resetPollBtn) {
    resetPollBtn.addEventListener("click", () => {
        responseCount = 0; participantCount = 1;
        buildWordCloud();
        showToast("Poll reset successfully.");
    });
}

if (lockPollBtn) {
    lockPollBtn.addEventListener("click", () => {
      isLocked = !isLocked;
      if (isLocked) {
        lockPollBtn.classList.add("danger-action");
        lockBtnIcon.innerText = "lock_open";
        lockBtnText.innerText = "Unlock Poll";
        wordcloud.classList.add("poll-locked");
        const overlay = document.createElement("div");
        overlay.id = "lockCloudOverlay";
        overlay.innerHTML = '<span class="material-symbols-outlined" style="margin-right:8px;">lock</span> Voting Locked';
        wordcloud.appendChild(overlay);
        showToast("Voting locked.");
      } else {
        lockPollBtn.classList.remove("danger-action");
        lockBtnIcon.innerText = "lock";
        lockBtnText.innerText = "Lock Poll";
        wordcloud.classList.remove("poll-locked");
        const overlay = document.getElementById("lockCloudOverlay");
        if (overlay) overlay.remove();
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
      setTimeout(() => showToast("Word Cloud image downloaded successfully."), 1000);
    });
}

if (settingsBtn) settingsBtn.addEventListener("click", () => showToast("Settings configured (Demo)"));

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
