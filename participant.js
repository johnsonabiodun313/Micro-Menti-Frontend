/**
 * Micro-Menti Participant Client & Anti-Spam Controller
 * Handles Socket.io connection to backend and localStorage debouncing/anti-spam (< 50KB total footprint).
 */

(function() {
    // Extract room code from query parameters (?room=CODE or ?pin=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = (urlParams.get('room') || urlParams.get('pin') || '').trim().toUpperCase();

    if (!roomCode) {
        window.location.href = './index.html';
        return;
    }

    const BACKEND_URL = 'https://micro-menti-backend.onrender.com';
    
    let socket = null;

    if (typeof io !== 'undefined') {
        try {
            socket = io(BACKEND_URL, {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 10,
                timeout: 10000
            });

            socket.on('connect', () => {
                console.log(`[Socket.io Participant] Connected to ${BACKEND_URL}. Joining room: ${roomCode}`);
                socket.emit('joinRoom', roomCode);
            });

            socket.on('roomJoined', (data) => {
                console.log(`[Socket.io Participant] Room joined: ${data.pin}, Topic: "${data.topic}"`);
                const topicEl = document.getElementById('participantTopicDisplay') || document.querySelector('.mobile-card h1');
                if (topicEl && data.topic) {
                    topicEl.textContent = data.topic;
                }
                const errorCard = document.getElementById('roomErrorCard');
                if (errorCard) errorCard.classList.add('hidden');
                const promptCard = document.getElementById('participantPromptCard');
                if (promptCard) promptCard.classList.remove('hidden');
            });

            socket.on('roomError', (data) => {
                console.warn(`[Socket.io Participant] Room error: ${data.message}`);
                const errorCard = document.getElementById('roomErrorCard');
                const errorMsg = document.getElementById('roomErrorMessage');
                if (errorMsg) errorMsg.textContent = data.message || `Room "${roomCode}" is not active or has ended.`;
                if (errorCard) errorCard.classList.remove('hidden');

                const promptCard = document.getElementById('participantPromptCard');
                if (promptCard) promptCard.classList.add('hidden');
                const form = document.getElementById('submissionForm') || document.getElementById('participant-word-form');
                if (form) form.classList.add('hidden');
                const quickReactions = document.getElementById('quickReactionsContainer');
                if (quickReactions) quickReactions.classList.add('hidden');
                const infoSec = document.getElementById('participantSubmissionsInfo');
                if (infoSec) infoSec.classList.add('hidden');
                const historySec = document.getElementById('participantHistorySection');
                if (historySec) historySec.classList.add('hidden');
                const successCard = document.getElementById('successCard');
                if (successCard) successCard.classList.add('hidden');
                const cloudSec = document.getElementById('participantCloudSection');
                if (cloudSec) cloudSec.classList.add('hidden');
            });

            socket.on('cloudUpdate', (data) => {
                // Participant view now redirects to presenter view, so we don't need local render.
            });

            if (socket.connected) {
                socket.emit('joinRoom', roomCode);
            }
        } catch (err) {
            console.warn('[Socket.io Participant] Client initialization failed or server unreachable:', err);
        }
    } else {
        console.warn('[Socket.io Participant] io CDN script not found. Running in standalone simulation mode.');
    }

    // Anti-Spam check & submission controller
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('submissionForm') || document.getElementById('participant-word-form');
        const wordInput = document.getElementById('wordInput') || document.getElementById('participant-word-input');
        const submitBtn = document.getElementById('submitBtn');
        const successCard = document.getElementById('successCard');
        const quickReactions = document.getElementById('quickReactionsContainer');

        // Update PIN display elements across the DOM
        const pinDisplays = document.querySelectorAll('.session-pin-display');
        pinDisplays.forEach(el => {
            el.textContent = roomCode;
        });

        // Update custom topic query if present (?topic=... or ?q=...)
        const customTopic = urlParams.get('topic') || urlParams.get('q') || urlParams.get('question');
        if (customTopic) {
            const topicEl = document.getElementById('participantTopicDisplay') || document.querySelector('.mobile-card h1');
            if (topicEl) {
                topicEl.textContent = customTopic;
            }
        }

        const storageKey = 'micro_menti_submitted_room_' + roomCode;

        // Check if user has already submitted for this room in localStorage
        if (localStorage.getItem(storageKey)) {
            window.hasSubmitted = true;
            if (form) form.classList.add('hidden');
            if (quickReactions) quickReactions.classList.add('hidden');
            window.location.href = `./present.html?room=${encodeURIComponent(roomCode)}&view=participant`;
            return;
        }

        // Handle Submission
        const handleWordSubmission = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            if (!wordInput) return;

            const word = wordInput.value.trim();
            if (!word || word.length > 25) return;

            // Emit to Socket.io backend
            if (socket && socket.connected) {
                socket.emit('submitWord', { roomCode: roomCode, word: word });
            } else if (socket) {
                // If socket exists but is still connecting, emit right after connection or now
                socket.emit('submitWord', { roomCode: roomCode, word: word });
            }

            // Also update local runtime/localStorage simulation if addOrIncrementWord is available
            if (typeof addOrIncrementWord === 'function') {
                addOrIncrementWord(word);
            }

            // Enforce client-side anti-spam tracking via localStorage
            localStorage.setItem(storageKey, Date.now());

            // Disable UI inputs
            wordInput.disabled = true;
            if (submitBtn) submitBtn.disabled = true;

            // Fade out form and reveal success confirmation card
            if (form) form.classList.add('hidden');
            if (quickReactions) quickReactions.classList.add('hidden');
            if (successCard) {
                successCard.classList.remove('hidden');
                successCard.innerHTML = `
                    <div style="font-size: 2.2rem; margin-bottom: 8px; color: #34d399;">✓</div>
                    <div style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin-bottom: 6px;">Response sent!</div>
                    <div style="font-size: 0.92rem; color: var(--color-text-muted); line-height: 1.4;">
                        Thank you for participating in room <strong style="color: #38bdf8;">${roomCode}</strong>. Redirecting to live cloud...
                    </div>
                `;
            }
            
            window.hasSubmitted = true;
            setTimeout(() => {
                window.location.href = `./present.html?room=${encodeURIComponent(roomCode)}&view=participant`;
            }, 1000);
        };

        if (form) {
            form.addEventListener('submit', handleWordSubmission);
        }
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                if (form && !form.onsubmit && e.target.type !== 'submit') {
                    handleWordSubmission(e);
                }
            });
        }
    });

    // Expose socket and roomCode globally if needed by other modules
    window.microMentiSocket = socket;
    window.microMentiRoomCode = roomCode;
})();
