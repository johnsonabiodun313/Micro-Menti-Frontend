let sandboxWords = [
  { text: "Interactive", count: 32 },
  { text: "Fast", count: 24 },
  { text: "Simple", count: 28 },
  { text: "Scalable", count: 18 },
  { text: "WebSockets", count: 15 },
  { text: "Engaging", count: 22 },
  { text: "Modern", count: 14 },
];

document.addEventListener("DOMContentLoaded", () => {
  genParticles();
  drawCloud("sandbox-cloud", sandboxWords);
  initScroll();
});

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

function drawCloud(cId, list) {
  const c = document.getElementById(cId);
  if (!c) return;
  c.innerHTML = "";
  if (!list.length) {
    c.innerHTML = `<span class="font-mono" style="color:#555;font-size:14px;">No words yet!</span>`;
    return;
  }
  const sorted = [...list].sort((a, b) => b.count - a.count);
  const max = Math.max(...sorted.map((w) => w.count)),
    min = Math.min(...sorted.map((w) => w.count));
  const cls = [
    { c: "word-primary", g: "rgba(139,92,246,0.4)" },
    { c: "word-secondary", g: "rgba(6,182,212,0.4)" },
    { c: "word-muted", g: "rgba(156,163,175,0.2)" },
  ];
  sorted.forEach((w, i) => {
    const s = document.createElement("span");
    let f = 14;
    if (max !== min) f = 14 + Math.round(((w.count - min) / (max - min)) * 20);
    s.className = "word-tag font-bold";
    s.style.fontSize = `${f}px`;
    s.style.position = "static";
    s.style.transform = "none";
    s.style.display = "inline-block";
    s.style.cursor = "pointer";
    s.style.setProperty("--rotate", `${(Math.random() * 4 - 2).toFixed(1)}deg`);
    const item = cls[i % cls.length];
    s.classList.add(item.c);
    s.style.setProperty("--glow-color", item.g);
    s.innerHTML = `${w.text} <sub style="font-size:9px;opacity:0.4;vertical-align:super;margin-left:2px;">${w.count}</sub>`;
    s.onclick = (e) => {
      e.stopPropagation();
      w.count += 2;
      s.style.transform = "scale(1.2) rotate(3deg)";
      setTimeout(() => drawCloud(cId, list), 150);
    };
    c.appendChild(s);
  });
}

function handleSandboxSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("sandbox-input");
  if (!input) return;
  const txt = input.value.trim().split(/\s+/)[0];
  if (!txt) return;
  const match = sandboxWords.find(
    (w) => w.text.toLowerCase() === txt.toLowerCase(),
  );
  if (match) match.count++;
  else sandboxWords.push({ text: txt, count: 1 });
  drawCloud("sandbox-cloud", sandboxWords);
  input.value = "";
  showToast(`Added "${txt}" to demo!`);
}

function toggleMobileMenu() {
  const m = document.getElementById("mobile-menu");
  if (m) m.classList.toggle("active");
}

function initScroll() {
  const list = document.querySelectorAll("section");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 },
  );
  list.forEach((s) => {
    s.style.opacity = "0";
    s.style.transform = "translateY(20px)";
    s.style.transition = "opacity .6s ease, transform .6s ease";
    obs.observe(s);
  });
}

function openJoinModal() {
  const m = document.getElementById("join-session-modal"),
    input = document.getElementById("session-code-input");
  if (!m) return;
  m.classList.add("flex", "animate-fade-in");
  if (input) {
    input.value = "";
    setTimeout(() => input.focus(), 100);
  }
}

function closeJoinModal() {
  const m = document.getElementById("join-session-modal");
  if (m) m.classList.remove("flex", "animate-fade-in");
}

document.addEventListener("mousedown", (e) => {
  const m = document.getElementById("join-session-modal");
  if (
    m &&
    m.classList.contains("flex") &&
    !m.querySelector(".modal-content-panel").contains(e.target)
  )
    closeJoinModal();
});

function handleJoinSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("session-code-input");
  if (input) {
    const val = input.value.trim().toUpperCase();
    if (val) {
      closeJoinModal();
      joinSession(val);
    }
  }
}

function joinSession(code) {
  showToast(`Joining session ${code}...`);
  setTimeout(() => {
    window.location.href = `participant.html?room=${encodeURIComponent(code)}`;
  }, 400);
}

function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast-card";
  const icon = type === "success" ? "check_circle" : "info";
  const color = type === "success" ? "var(--secondary)" : "var(--primary)";
  toast.innerHTML = `
        <span class="material-symbols-outlined" style="color:${color};font-size:18px;">${icon}</span>
        <div style="flex-grow:1;">${msg}</div>
        <button onclick="this.parentElement.remove()" class="material-symbols-outlined" style="font-size:16px;color:#555;background:transparent;">close</button>
    `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
