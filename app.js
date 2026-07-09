// Tailwind Custom Configuration
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                background: "#030303",
                surface: "rgba(10, 10, 15, 0.7)",
                border: "rgba(255, 255, 255, 0.08)",
                primary: "#8b5cf6",
                secondary: "#06b6d4",
                success: "#10b981",
                danger: "#ef4444"
            },
            fontFamily: {
                sans: ["Outfit", "Plus Jakarta Sans", "Inter", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"]
            }
        }
    }
};

// Marketing Hero Word Cloud Dataset
let sandboxWords = [
    { text: "Interactive", count: 32 },
    { text: "Fast", count: 24 },
    { text: "Simple", count: 28 },
    { text: "Scalable", count: 18 },
    { text: "WebSockets", count: 15 },
    { text: "Engaging", count: 22 },
    { text: "Modern", count: 14 }
];

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    generateBackgroundParticles();
    renderWordCloud("sandbox-cloud", sandboxWords);
    initScrollAnimations();
});

// 1. Particle Background Generator
function generateBackgroundParticles() {
    const container = document.getElementById("particle-container");
    if (!container) return;
    
    container.innerHTML = "";
    const particleCount = 20; // Lightweight count for fluid browser tests
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        
        const size = Math.random() * 4 + 2; // 2px to 6px
        const left = Math.random() * 100; // 0% to 100%
        const delay = Math.random() * 8; // 0s to 8s delay
        const speed = Math.random() * 8 + 8; // 8s to 16s speed
        const opacity = Math.random() * 0.2 + 0.05; // 0.05 to 0.25 opacity
        const drift = Math.random() * 30 - 15; // -15px to 15px drift
        
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

// 2. Interactive Word Cloud Compiler/Renderer (Landing Sandbox)
function renderWordCloud(containerId, wordsList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = "";
    
    if (wordsList.length === 0) {
        container.innerHTML = `<span class="text-gray-500 font-mono text-sm">No words yet. Submit below!</span>`;
        return;
    }

    // Sort words by count to scale sizes
    const sortedWords = [...wordsList].sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...sortedWords.map(w => w.count));
    const minCount = Math.min(...sortedWords.map(w => w.count));
    
    // Color pool for tags
    const colors = [
        { text: "text-purple-400", glow: "rgba(139, 92, 246, 0.4)" },
        { text: "text-cyan-400", glow: "rgba(6, 182, 212, 0.4)" },
        { text: "text-blue-400", glow: "rgba(59, 130, 246, 0.4)" },
        { text: "text-indigo-400", glow: "rgba(99, 102, 241, 0.4)" },
        { text: "text-teal-300", glow: "rgba(45, 212, 191, 0.4)" }
    ];

    sortedWords.forEach((word, index) => {
        const span = document.createElement("span");
        
        // Calculate responsive font size based on count relative to max/min
        let fontSize = 14; // Default baseline size
        if (maxCount !== minCount) {
            const ratio = (word.count - minCount) / (maxCount - minCount);
            fontSize = 14 + Math.round(ratio * 24); // Scales from 14px to 38px
        } else if (word.count > 0) {
            fontSize = 18; 
        }
        
        span.className = "word-cloud-tag font-bold py-1 px-2";
        span.style.fontSize = `${fontSize}px`;
        
        // Assign random parameters for float animations
        const duration = (Math.random() * 3 + 4).toFixed(1); // 4s to 7s
        const delay = (Math.random() * 2).toFixed(1); // 0s to 2s
        const rotation = (Math.random() * 4 - 2).toFixed(1); // -2deg to 2deg
        
        span.style.setProperty("--duration", `${duration}s`);
        span.style.setProperty("--delay", `${delay}s`);
        span.style.setProperty("--rotate", `${rotation}deg`);
        
        // Assign color
        const color = colors[index % colors.length];
        span.classList.add(color.text);
        span.style.setProperty("--glow-color", color.glow);
        
        // Content with subscript votes count representation
        span.innerHTML = `${word.text} <sub class="text-[9px] opacity-40 font-mono align-super font-normal ml-0.5">${word.count}</sub>`;
        
        // Click to vote/grow interaction
        span.onclick = (e) => {
            e.stopPropagation();
            word.count += 2;
            flashTag(span);
            setTimeout(() => renderWordCloud(containerId, wordsList), 150);
        };
        
        container.appendChild(span);
    });
}

function flashTag(element) {
    element.style.transform = "scale(1.3) rotate(3deg)";
    element.style.transition = "transform 0.1s ease-out";
}

// 3. Form Submission Handler
function handleSandboxSubmit(event) {
    event.preventDefault();
    const input = document.getElementById("sandbox-input");
    if (!input) return;
    
    const wordText = input.value.trim().toLowerCase();
    if (!wordText) return;
    
    // Add or increment word count
    const existing = sandboxWords.find(w => w.text.toLowerCase() === wordText);
    if (existing) {
        existing.count += 1;
    } else {
        sandboxWords.push({ text: wordText, count: 1 });
    }
    
    renderWordCloud("sandbox-cloud", sandboxWords);
    input.value = "";
}

// 4. Mobile Menu Toggle
let isMobileMenuOpen = false;
function toggleMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu");
    if (!mobileMenu) return;
    
    isMobileMenuOpen = !isMobileMenuOpen;
    if (isMobileMenuOpen) {
        mobileMenu.classList.remove("hidden");
    } else {
        mobileMenu.classList.add("hidden");
    }
}

// 5. Scroll Intersection Fade-in Animations
function initScrollAnimations() {
    const sections = document.querySelectorAll("section");
    
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        section.classList.add("fade-in-up");
        observer.observe(section);
    });
}

// 6. Join Session Modal Controls & Toast Notification System
function openJoinModal() {
    const modal = document.getElementById("join-session-modal");
    const input = document.getElementById("session-code-input");
    if (!modal) return;
    
    modal.classList.remove("hidden");
    modal.classList.add("flex", "animate-fade-in");
    
    if (input) {
        input.value = "";
        setTimeout(() => input.focus(), 100);
    }
}

function closeJoinModal() {
    const modal = document.getElementById("join-session-modal");
    if (!modal) return;
    
    modal.classList.add("hidden");
    modal.classList.remove("flex", "animate-fade-in");
}

// Close modal when clicking outside the panel
document.addEventListener("mousedown", (e) => {
    const modal = document.getElementById("join-session-modal");
    if (!modal || modal.classList.contains("hidden")) return;
    
    const panel = modal.querySelector(".glass-panel");
    if (panel && !panel.contains(e.target)) {
        closeJoinModal();
    }
});

function handleJoinSubmit(event) {
    event.preventDefault();
    const input = document.getElementById("session-code-input");
    if (!input) return;
    
    const code = input.value.trim().toUpperCase();
    if (!code) return;
    
    // Simulate join action
    showToast(`Joining Session <span class="text-cyan-400 font-mono font-bold">${code}</span>... Please wait.`, "success");
    closeJoinModal();
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "toast-card flex items-center gap-3 px-5 py-4 text-sm text-gray-200 pointer-events-auto max-w-sm";
    
    const icon = type === "success" ? "check_circle" : "info";
    const iconColor = type === "success" ? "text-cyan-400" : "text-purple-400";
    
    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor} shrink-0">${icon}</span>
        <div class="flex-grow">${message}</div>
        <button onclick="this.parentElement.remove()" class="material-symbols-outlined text-xs text-gray-500 hover:text-white transition-colors shrink-0 ml-2">close</button>
    `;
    
    container.appendChild(toast);
    
    // Remove element after animation completes (3.85s matches the css fadeOut animation duration)
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3850);
}