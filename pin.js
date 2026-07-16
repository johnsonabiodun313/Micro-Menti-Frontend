// Tailwind Custom Configuration for Design Consistency
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

// Initialize Particle Background and UI state
document.addEventListener("DOMContentLoaded", () => {
    generateBackgroundParticles();
    
    // Auto-focus session code input if present
    const input = document.getElementById("session-code-input");
    if (input) {
        input.focus();
        
        // Auto-sanitize session code input (numbers/letters uppercase only)
        input.addEventListener("input", (e) => {
            let val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
            e.target.value = val.toUpperCase();
        });
    }
});

// 1. Particle Background Generator (matches landing page particle weights)
function generateBackgroundParticles() {
    const container = document.getElementById("particle-container");
    if (!container) return;
    
    container.innerHTML = "";
    const particleCount = 20; // Lightweight particle simulation
    
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

// 2. Session Join Handling
function handleJoinSession(event) {
    event.preventDefault();
    const input = document.getElementById("session-code-input");
    const submitBtn = document.getElementById("join-submit-btn");
    const btnIcon = document.getElementById("join-btn-icon");
    const btnSpinner = document.getElementById("join-btn-spinner");
    
    if (!input || !submitBtn) return;
    
    const code = input.value.trim().toUpperCase();
    if (!code) {
        showToast("Please enter a valid session code.", "error");
        return;
    }
    
    // Set UI to loading state
    submitBtn.disabled = true;
    input.disabled = true;
    if (btnIcon) btnIcon.classList.add("hidden");
    if (btnSpinner) btnSpinner.classList.remove("hidden");
    
    // Simulate API lookup and WebSocket socket handshakes
    setTimeout(() => {
        // Mock successful validation
        showToast(`Connected! Welcoming you to Session <span class="text-cyan-400 font-mono font-bold">${code}</span>...`, "success");
        
        // Final transition after simulated page load
        setTimeout(() => {
            // Restore UI inputs
            submitBtn.disabled = false;
            input.disabled = false;
            if (btnIcon) btnIcon.classList.remove("hidden");
            if (btnSpinner) btnSpinner.classList.add("hidden");
            
            // Simulates redirecting to live survey presenter board
            alert(`Succesfully joined session ${code}! Now entering live word cloud survey...`);
            input.value = "";
            input.focus();
        }, 1200);
        
    }, 1500);
}

// 3. QR Code Scanner Simulation Modals
let qrScanTimeout = null;

function openQRModal() {
    const modal = document.getElementById("qr-scanner-modal");
    const successOverlay = document.getElementById("qr-success-overlay");
    if (!modal) return;
    
    modal.classList.remove("hidden");
    modal.classList.add("flex", "animate-fade-in");
    
    // Clear any previous overlay states
    if (successOverlay) {
        successOverlay.classList.remove("opacity-100", "scale-100");
        successOverlay.classList.add("opacity-0", "scale-95");
    }
    
    // Simulate automatic QR detection after 2.5 seconds
    qrScanTimeout = setTimeout(() => {
        if (successOverlay) {
            successOverlay.classList.remove("opacity-0", "scale-95");
            successOverlay.classList.add("opacity-100", "scale-100");
        }
        
        // Auto-close and populate code after success
        setTimeout(() => {
            closeQRModal();
            const input = document.getElementById("session-code-input");
            if (input) {
                // Generate a randomized 4 digit code simulating scanner parse
                const mockCodes = ["4829", "8931", "1257", "9043", "7382"];
                const parsedCode = mockCodes[Math.floor(Math.random() * mockCodes.length)];
                input.value = parsedCode;
                
                // Show notification and trigger form join submit automatically!
                showToast(`Scanned Code <span class="text-cyan-400 font-mono font-bold">${parsedCode}</span> successfully.`, "success");
                
                // Auto-submit the form
                const form = document.getElementById("join-session-form");
                if (form) {
                    // Slight delay to allow the user to see the code input change
                    setTimeout(() => {
                        form.dispatchEvent(new Event("submit"));
                    }, 500);
                }
            }
        }, 1200);
        
    }, 2500);
}

function closeQRModal() {
    const modal = document.getElementById("qr-scanner-modal");
    if (!modal) return;
    
    if (qrScanTimeout) {
        clearTimeout(qrScanTimeout);
        qrScanTimeout = null;
    }
    
    modal.classList.add("hidden");
    modal.classList.remove("flex", "animate-fade-in");
}

// Close QR Modal when clicking outside the panel
document.addEventListener("mousedown", (e) => {
    const modal = document.getElementById("qr-scanner-modal");
    if (!modal || modal.classList.contains("hidden")) return;
    
    const panel = modal.querySelector(".glass-panel");
    if (panel && !panel.contains(e.target)) {
        closeQRModal();
    }
});

// 4. Toast Notification System (identical styling/classes to landing page)
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
    
    // Automatically fade out after 3.85 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3850);
}