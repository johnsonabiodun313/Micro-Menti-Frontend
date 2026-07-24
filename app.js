/**
 * Micro-Menti High-Performance Vanilla JS Runtime
 * Powers Participant View, Presenter Dashboard, and Landing Page Sandbox
 * Zero external libraries or Tailwind dependencies (< 50KB total footprint)
 */

const STORAGE_KEY = "MICRO_MENTI_WORDS_V1";
const DEFAULT_WORDS = [
    { text: "interactive", count: 42 },
    { text: "real-time", count: 38 },
    { text: "simple", count: 28 },
    { text: "collaborative", count: 26 },
    { text: "fast", count: 24 },
    { text: "engaging", count: 22 },
    { text: "scalable", count: 18 },
    { text: "websockets", count: 15 },
    { text: "modern", count: 14 }
];

const SIMULATION_POOL = [
    "dynamic", "lightning", "glassmorphism", "seamless", "instant",
    "intuitive", "brilliant", "accessible", "vanilla", "lightweight",
    "responsive", "engaging", "powerful", "innovative", "fluid"
];

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    initParticles();
    initScrollAnimations();
    
    // Check current screen type
    if (document.getElementById("sandbox-cloud")) {
        initLandingSandbox();
    }
    if (document.getElementById("participant-word-form") || document.getElementById("submissionForm") || document.getElementById("wordInput")) {
        initParticipantView();
    }
    if (document.getElementById("dashboard-cloud")) {
        initPresenterDashboard();
    }
});

/* ==========================================================================
   STORAGE & DATA SYNC HELPER
   ========================================================================== */

function getStoredWords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn("localStorage not available or corrupted:", e);
    }
    // Seed defaults if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WORDS));
    return [...DEFAULT_WORDS];
}

function saveWords(words) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
        window.dispatchEvent(new Event("wordCloudUpdated"));
    } catch (e) {
        console.warn("Failed to save to localStorage:", e);
    }
}

function addOrIncrementWord(wordText) {
    const cleanWord = wordText.trim().toLowerCase();
    if (!cleanWord) return;
    
    const words = getStoredWords();
    const existing = words.find(w => w.text.toLowerCase() === cleanWord);
    if (existing) {
        existing.count += 1;
    } else {
        words.push({ text: cleanWord, count: 1 });
    }
    saveWords(words);
}

/* ==========================================================================
   1. PARTICIPANT VIEW CONTROLLER (public/index.html)
   ========================================================================== */

function initParticipantView() {
    // Populate the Participant's displayed Topic and Room PIN (from URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const pin = urlParams.get("pin") || "----";
    const customTopic = urlParams.get("topic") || urlParams.get("q") || urlParams.get("question");
    
    // Update PIN badges if present
    const pinBadges = document.querySelectorAll(".session-pin-display");
    pinBadges.forEach(b => {
        b.textContent = pin.toUpperCase();
    });

    const form = document.getElementById("submissionForm") || document.getElementById("participant-word-form");
    const input = document.getElementById("wordInput") || document.getElementById("participant-word-input");
    const historyContainer = document.getElementById("participant-history");
    let mySubmissions = [];

    if (form && input) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const word = input.value.trim();
            if (!word) return;

            addOrIncrementWord(word);
            mySubmissions.unshift(word);
            input.value = "";
            input.focus();

            showToast(`Word "${word}" submitted to live cloud!`, "success");
            renderParticipantHistory(historyContainer, mySubmissions);
        });
    }

    renderParticipantHistory(historyContainer, mySubmissions);
}

function renderParticipantHistory(container, list) {
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `<p style="color: var(--color-text-muted); font-size: 0.85rem; font-style: italic;">No contributions yet during this session. Type a word above and hit Submit!</p>`;
        return;
    }

    list.slice(0, 10).forEach((word, idx) => {
        const badge = document.createElement("span");
        badge.className = "badge-pin";
        badge.style.display = "inline-flex";
        badge.style.alignItems = "center";
        badge.style.gap = "6px";
        badge.style.marginRight = "8px";
        badge.style.marginBottom = "8px";
        badge.style.animation = "slideInToast 0.2s ease forwards";
        badge.innerHTML = `<span style="color: #34d399;">✓</span> ${word}`;
        container.appendChild(badge);
    });
}

/* ==========================================================================
   2. PRESENTER DASHBOARD CONTROLLER (public/present.html)
   ========================================================================== */

let simulationTimer = null;

function initPresenterDashboard() {
    renderPresenterAll();

    // Listen to updates from Participant View (via localStorage or same-window event)
    window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) {
            renderPresenterAll();
        }
    });
    window.addEventListener("wordCloudUpdated", () => {
        renderPresenterAll();
    });

    // Wire up Presenter controls
    const clearBtn = document.getElementById("btn-clear-cloud");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all responses from this session?")) {
                saveWords([]);
                showToast("Live word cloud cleared.", "info");
            }
        });
    }

    const simBtn = document.getElementById("btn-simulate-word");
    if (simBtn) {
        simBtn.addEventListener("click", () => {
            const randomWord = SIMULATION_POOL[Math.floor(Math.random() * SIMULATION_POOL.length)];
            addOrIncrementWord(randomWord);
            showToast(`Simulated response added: +${randomWord}`, "success");
        });
    }

    const autoSimBtn = document.getElementById("btn-toggle-auto-sim");
    if (autoSimBtn) {
        autoSimBtn.addEventListener("click", () => {
            if (simulationTimer) {
                clearInterval(simulationTimer);
                simulationTimer = null;
                autoSimBtn.style.background = "";
                autoSimBtn.innerHTML = `<span>⚡ Start Auto-Simulate</span>`;
                showToast("Auto-simulation paused.", "info");
            } else {
                simulationTimer = setInterval(() => {
                    const randomWord = SIMULATION_POOL[Math.floor(Math.random() * SIMULATION_POOL.length)];
                    addOrIncrementWord(randomWord);
                }, 2200);
                autoSimBtn.style.background = "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)";
                autoSimBtn.innerHTML = `<span>🛑 Stop Auto-Simulate</span>`;
                showToast("Auto-simulation active (1 word every 2s).", "success");
            }
        });
    }
}

function renderPresenterAll() {
    const words = getStoredWords();
    renderWordCloud("dashboard-cloud", words, true);
    renderLeaderboard("top-words-leaderboard", words);
    updatePresenterMetrics(words);
}

function updatePresenterMetrics(words) {
    const totalWords = words.reduce((acc, w) => acc + w.count, 0);
    const uniqueWords = words.length;
    const estimatedParticipants = Math.max(Math.ceil(totalWords / 2.5), uniqueWords > 0 ? 1 : 0);

    const countEl = document.getElementById("metric-total-words");
    const partEl = document.getElementById("metric-participants");
    if (countEl) countEl.textContent = totalWords;
    if (partEl) partEl.textContent = estimatedParticipants;
}

function renderLeaderboard(containerId, wordsList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (wordsList.length === 0) {
        container.innerHTML = `<div style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 20px 0;">No submissions yet. Waiting for participants...</div>`;
        return;
    }

    const sorted = [...wordsList].sort((a, b) => b.count - a.count).slice(0, 8);
    const maxCount = sorted[0]?.count || 1;

    sorted.forEach((word, index) => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.flexDirection = "column";
        item.style.gap = "4px";
        item.style.marginBottom = "14px";

        const barWidth = Math.max(Math.round((word.count / maxCount) * 100), 10);
        const gradientColor = index % 2 === 0 
            ? "linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)" 
            : "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)";

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="font-weight: 700; color: #ffffff;">${index + 1}. ${word.text}</span>
                <span style="font-family: var(--font-mono); color: var(--color-text-muted);">${word.count} votes</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden;">
                <div style="width: ${barWidth}%; height: 100%; background: ${gradientColor}; border-radius: 3px; transition: width 0.3s ease;"></div>
            </div>
        `;
        container.appendChild(item);
    });
}

/* ==========================================================================
   3. SHARED WORD CLOUD RENDER ENGINE
   ========================================================================== */

function renderWordCloud(containerId, wordsList, isPresenter = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    if (wordsList.length === 0) {
        container.innerHTML = `<span style="color: var(--color-text-muted); font-family: var(--font-mono); font-size: 0.9rem;">No words yet. Submit below or invite participants!</span>`;
        return;
    }

    const sortedWords = [...wordsList].sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...sortedWords.map(w => w.count));
    const minCount = Math.min(...sortedWords.map(w => w.count));

    const colors = [
        { text: "#c084fc", glow: "rgba(139, 92, 246, 0.5)" },
        { text: "#38bdf8", glow: "rgba(6, 182, 212, 0.5)" },
        { text: "#60a5fa", glow: "rgba(59, 130, 246, 0.5)" },
        { text: "#818cf8", glow: "rgba(99, 102, 241, 0.5)" },
        { text: "#2dd4bf", glow: "rgba(45, 212, 191, 0.5)" }
    ];

    sortedWords.forEach((word, index) => {
        const span = document.createElement("span");

        // Scale font sizes dynamically between 15px and 48px depending on vote frequency
        let fontSize = 16;
        if (maxCount !== minCount) {
            const ratio = (word.count - minCount) / (maxCount - minCount);
            fontSize = 16 + Math.round(ratio * (isPresenter ? 34 : 26));
        } else if (word.count > 0) {
            fontSize = isPresenter ? 24 : 18;
        }

        span.className = "word-cloud-tag";
        span.style.fontSize = `${fontSize}px`;
        span.style.fontWeight = fontSize > 28 ? "800" : "600";
        span.style.padding = "6px 12px";

        const duration = (Math.random() * 3 + 4).toFixed(1);
        const delay = (Math.random() * 2).toFixed(1);
        const rotation = (Math.random() * 4 - 2).toFixed(1);

        span.style.setProperty("--duration", `${duration}s`);
        span.style.setProperty("--delay", `${delay}s`);
        span.style.setProperty("--rotate", `${rotation}deg`);

        const color = colors[index % colors.length];
        span.style.color = color.text;
        span.style.setProperty("--glow-color", color.glow);

        span.innerHTML = `${word.text} <sub style="font-size: 0.65em; opacity: 0.5; font-family: var(--font-mono); margin-left: 3px;">${word.count}</sub>`;

        span.onclick = (e) => {
            e.stopPropagation();
            if (containerId === "sandbox-cloud") {
                const existing = sandboxWords.find(w => w.text === word.text);
                if (existing) existing.count += 1;
                span.style.transform = "scale(1.35) rotate(4deg)";
                span.style.transition = "transform 0.1s ease-out";
                setTimeout(() => renderWordCloud("sandbox-cloud", sandboxWords), 150);
            } else {
                addOrIncrementWord(word.text);
                span.style.transform = "scale(1.35) rotate(4deg)";
                span.style.transition = "transform 0.1s ease-out";
                setTimeout(() => typeof renderPresenterAll === "function" && renderPresenterAll(), 150);
            }
        };

        container.appendChild(span);
    });
}

/* ==========================================================================
   4. LANDING PAGE SANDBOX (root index.html)
   ========================================================================== */

let sandboxWords = [
    { text: "interactive", count: 32 },
    { text: "fast", count: 24 },
    { text: "simple", count: 28 },
    { text: "scalable", count: 18 },
    { text: "websockets", count: 15 },
    { text: "engaging", count: 22 },
    { text: "modern", count: 14 }
];

function handleSandboxSubmit(event) {
    if (event) event.preventDefault();
    const input = document.getElementById("sandbox-input");
    if (!input) return;
    const wordText = input.value.trim().toLowerCase();
    if (!wordText) return;

    const existing = sandboxWords.find(w => w.text.toLowerCase() === wordText);
    if (existing) {
        existing.count += 1;
    } else {
        sandboxWords.push({ text: wordText, count: 1 });
    }
    renderWordCloud("sandbox-cloud", sandboxWords);
    
    // Auto-scroll to bottom so new words are visible
    const cloudContainer = document.getElementById("sandbox-cloud");
    if (cloudContainer) {
        cloudContainer.scrollTop = cloudContainer.scrollHeight;
    }

    input.value = "";
    showToast(`Added "${wordText}" to demo cloud!`, "success");
}
window.handleSandboxSubmit = handleSandboxSubmit;

function initLandingSandbox() {
    renderWordCloud("sandbox-cloud", sandboxWords);

    const form = document.getElementById("sandbox-form");
    if (form) {
        form.addEventListener("submit", handleSandboxSubmit);
    }
}

/* ==========================================================================
   5. BACKGROUND PARTICLES & SCROLL ANIMATIONS
   ========================================================================== */

function initParticles() {
    const container = document.getElementById("particle-container");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < 22; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";

        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const speed = Math.random() * 10 + 10;
        const opacity = Math.random() * 0.18 + 0.05;
        const drift = Math.random() * 30 - 15;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.setProperty("--speed", `${speed}s`);
        particle.style.setProperty("--opacity", opacity);
        particle.style.setProperty("--drift", `${drift}px`);

        container.appendChild(particle);
    }
}

function initScrollAnimations() {
    const sections = document.querySelectorAll("section");
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.classList.add("fade-in-up");
        observer.observe(section);
    });
}

/* ==========================================================================
   6. MODALS & TOAST NOTIFICATIONS
   ========================================================================== */

function openJoinModal() {
    const modal = document.getElementById("join-session-modal");
    const input = document.getElementById("session-code-input");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("active");
    modal.style.display = "flex";
    if (input) setTimeout(() => input.focus(), 100);
}

function closeJoinModal() {
    const modal = document.getElementById("join-session-modal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.classList.add("hidden");
    modal.style.display = "none";
}

window.openJoinModal = openJoinModal;
window.closeJoinModal = closeJoinModal;

function openCreateModal() {
    const modal = document.getElementById("create-poll-modal");
    const input = document.getElementById("create-pin-input");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("active");
    modal.style.display = "flex";
    if (input) {
        if (!input.value || input.value === "5591") {
            input.value = Math.floor(1000 + Math.random() * 9000).toString();
        }
        setTimeout(() => input.focus(), 100);
    }
}

function closeCreateModal() {
    const modal = document.getElementById("create-poll-modal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.classList.add("hidden");
    modal.style.display = "none";
}

window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;

function handleCreateSubmit(event) {
    if (event && event.preventDefault) event.preventDefault();
    const pinInput = document.getElementById("create-pin-input");
    const topicInput = document.getElementById("create-topic-input");
    let pin = pinInput ? pinInput.value.trim().toUpperCase() : "";
    if (!pin || pin === "5591") {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
    }
    const topic = (topicInput ? topicInput.value.trim() : "") || "Live Word Cloud";
    
    // Set admin token to secure presenter dashboard
    const adminToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(`micro_menti_admin_${pin}`, adminToken);

    showToast(`Launching Poll Room ${pin}...`, "success");
    closeCreateModal();
    setTimeout(() => {
        window.location.href = `./present.html?pin=${pin}&topic=${encodeURIComponent(topic)}&token=${adminToken}`;
    }, 400);
}

window.handleCreateSubmit = handleCreateSubmit;

async function handleJoinSubmit(event) {
    if (event && event.preventDefault) event.preventDefault();
    const input = document.getElementById("session-code-input");
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (!code || code.length < 2 || code === "5591") {
        alert("Please enter a valid room PIN code from your presenter.");
        return;
    }
    
    showToast(`Checking Room ${code}...`, "info");
    
    try {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const BACKEND_URL = window.MICRO_MENTI_BACKEND_URL || (isLocal ? 'http://localhost:3000' : 'https://micro-menti-backend.onrender.com');
        const response = await fetch(`${BACKEND_URL}/api/room/${code}`);
        const data = await response.json();
        
        if (data.valid) {
            showToast(`Joining Room ${code}...`, "success");
            closeJoinModal();
            setTimeout(() => {
                window.location.href = `./participant.html?pin=${encodeURIComponent(code)}`;
            }, 400);
        } else {
            alert(`Room "${code}" is not active or has not been created by a presenter yet.`);
            input.value = "";
            input.focus();
        }
    } catch (err) {
        console.warn("Could not validate room, trying to connect anyway.", err);
        closeJoinModal();
        window.location.href = `./participant.html?pin=${encodeURIComponent(code)}`;
    }
}

window.handleJoinSubmit = handleJoinSubmit;

function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.position = "fixed";
        container.style.bottom = "24px";
        container.style.right = "24px";
        container.style.zIndex = "110";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "12px";
        container.style.pointerEvents = "none";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast-card";
    const iconColor = type === "success" ? "#34d399" : "#c084fc";
    const iconSymbol = type === "success" ? "✓" : "ℹ";

    toast.innerHTML = `
        <span style="color: ${iconColor}; font-weight: bold; font-size: 1.1rem;">${iconSymbol}</span>
        <div style="flex-grow: 1;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3850);
}

window.showToast = showToast;

function toggleMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    if (!menu) return;
    if (menu.classList.contains("hidden")) {
        menu.classList.remove("hidden");
        menu.classList.add("flex");
    } else {
        menu.classList.add("hidden");
        menu.classList.remove("flex");
    }
}
window.toggleMobileMenu = toggleMobileMenu;

function sendSentimentReaction(reaction) {
    addOrIncrementWord(reaction);
    const historyContainer = document.getElementById("participant-history");
    if (historyContainer) {
        const badge = document.createElement("span");
        badge.className = "badge-pin";
        badge.style.display = "inline-flex";
        badge.style.alignItems = "center";
        badge.style.gap = "6px";
        badge.style.marginRight = "8px";
        badge.style.marginBottom = "8px";
        badge.style.animation = "slideInToast 0.2s ease forwards";
        badge.innerHTML = `<span style="color: #c084fc;">★</span> ${reaction}`;
        historyContainer.prepend(badge);
    }
    showToast(`Sent quick sentiment: "${reaction}" to live cloud!`, "success");
}
window.sendSentimentReaction = sendSentimentReaction;