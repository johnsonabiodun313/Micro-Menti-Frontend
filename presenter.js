/**
 * Micro-Menti Presenter Dashboard Controller & Dynamic Word Cloud Renderer
 * Handles QR code generation, clear confirm() dialog, Socket.io updates, and pure CSS font scaling (< 50KB total footprint).
 */

(function() {
    // Extract room code from query parameters (?room=CODE or ?pin=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = (urlParams.get('room') || urlParams.get('pin') || '').trim().toUpperCase();
    const customTopic = urlParams.get('topic') || urlParams.get('q') || urlParams.get('question');

    if (!roomCode) {
        window.location.href = './index.html';
        return;
    }

    // Presenter Dashboard Security: Verify admin token
    const isParticipantView = urlParams.get('view') === 'participant';

    if (!isParticipantView) {
        const urlToken = urlParams.get('token');
        const localToken = localStorage.getItem(`micro_menti_admin_${roomCode}`);
        if (!urlToken || urlToken !== localToken) {
            console.warn('Unauthorized access attempt to presenter dashboard. Redirecting to participant view.');
            window.location.href = `./participant.html?pin=${encodeURIComponent(roomCode)}`;
            return;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (isParticipantView) {
            const btnSimulate = document.getElementById('btn-simulate-word');
            const btnClear = document.getElementById('clearPollBtn');
            const qrCard = document.getElementById('presenter-qr-card');
            const editBtn = document.querySelector('button[onclick="openEditTopicModal()"]');
            
            if (btnSimulate) btnSimulate.style.display = 'none';
            if (btnClear) btnClear.style.display = 'none';
            if (qrCard) qrCard.style.display = 'none';
            if (editBtn) editBtn.style.display = 'none';
        }
    });

    const BACKEND_URL = 'https://micro-menti-backend.onrender.com';
    
    let socket = null;

    if (typeof io !== 'undefined') {
        try {
            socket = io(BACKEND_URL, {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 10,
                timeout: 10000
            });

            const handleRoomConnection = () => {
                if (isParticipantView) {
                    socket.emit('joinRoom', roomCode);
                } else {
                    const payload = { pin: roomCode };
                    if (customTopic) {
                        payload.topic = customTopic;
                    }
                    socket.emit('createRoom', payload);
                }
                updateConnectionStatus(true);
            };

            socket.on('connect', () => {
                console.log(`[Socket.io Presenter] Connected to ${BACKEND_URL}. Creating/Joining room: ${roomCode}`);
                handleRoomConnection();
            });

            socket.on('disconnect', () => {
                console.log('[Socket.io Presenter] Disconnected from server.');
                updateConnectionStatus(false);
            });

            socket.on('roomCreated', (data) => {
                if (data && data.topic) {
                    const topicEl = document.getElementById('activeTopicHeading');
                    if (topicEl) topicEl.textContent = data.topic;
                }
            });

            socket.on('roomJoined', (data) => {
                if (data && data.topic) {
                    const topicEl = document.getElementById('activeTopicHeading');
                    if (topicEl) topicEl.textContent = data.topic;
                }
            });

            if (socket.connected) {
                handleRoomConnection();
            }
        } catch (err) {
            console.warn('[Socket.io Presenter] Initialization failed or server unreachable:', err);
            updateConnectionStatus(false);
        }
    } else {
        updateConnectionStatus(false);
    }

    function updateConnectionStatus(isConnected) {
        const dot = document.getElementById('connectionIndicatorDot');
        const badge = document.querySelector('.badge-live');
        if (dot) {
            dot.style.background = isConnected ? '#10b981' : '#f59e0b';
            dot.style.boxShadow = isConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b';
        }
        if (badge) {
            badge.innerHTML = isConnected 
                ? `<span id="connectionIndicatorDot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span> Broadcasting (Room ${roomCode})`
                : `<span id="connectionIndicatorDot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 8px #f59e0b;"></span> Local / Offline`;
        }
    }

    // Exact required hex color palette
    const PALETTE = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185'];

    /**
     * Strict rendering algorithm for the dynamic word cloud without <canvas>.
     */
    function renderWordCloud(dataArray) {
        const cloud = document.getElementById('cloud');
        const dashCloud = document.getElementById('dashboard-cloud');
        const targetContainer = dashCloud || cloud;
        if (!targetContainer) return;

        // Clear Container immediately
        if (cloud && cloud !== targetContainer) cloud.innerHTML = '';
        targetContainer.innerHTML = '';

        // Empty State Check
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            const emptySpan = document.createElement('span');
            emptySpan.className = 'empty-cloud';
            emptySpan.textContent = 'Waiting for live submissions... Type a word on participant screen and submit!';
            emptySpan.style.color = 'var(--color-text-muted)';
            emptySpan.style.fontSize = '1.2rem';
            emptySpan.style.fontStyle = 'italic';
            emptySpan.style.textAlign = 'center';
            targetContainer.appendChild(emptySpan);
            
            updateMetrics(0, 0);
            updateLeaderboard([]);
            return;
        }

        // Calculate Frequency Bounds
        const counts = dataArray.map(item => {
            if (typeof item === 'object' && item !== null) {
                return typeof item.value === 'number' ? item.value : (item.count || 1);
            }
            return 1;
        });
        const maxCount = Math.max(...counts);

        // Dynamic Scaling & Color Cycling Loop
        dataArray.forEach((item, i) => {
            const wordText = typeof item === 'object' && item !== null ? (item.text || item.word || '') : String(item);
            if (!wordText) return;

            const wordValue = typeof item === 'object' && item !== null ? (typeof item.value === 'number' ? item.value : (item.count || 1)) : 1;

            const span = document.createElement('span');
            span.textContent = wordText;

            // Include subscript/badge for frequency count
            if (wordValue >= 1) {
                const sub = document.createElement('sub');
                sub.className = 'word-count-badge';
                sub.textContent = wordValue;
                sub.style.fontSize = '0.45em';
                sub.style.opacity = '0.85';
                sub.style.marginLeft = '5px';
                sub.style.verticalAlign = 'super';
                span.appendChild(sub);
            }

            // Calculate Dynamic Font Size (16px to 72px)
            let fontSize = 32;
            if (maxCount > 1) {
                fontSize = 16 + Math.round(((wordValue - 1) / (maxCount - 1)) * (72 - 16));
            } else {
                fontSize = 32;
            }
            span.style.fontSize = `${fontSize}px`;

            // Assign Strict Color Palette by index modulo 6
            span.style.color = PALETTE[i % PALETTE.length];

            // Apply CSS Transforms & Utility classes (NOT <canvas>)
            span.classList.add('word-tag');
            span.style.display = 'inline-flex';
            span.style.alignItems = 'center';
            span.style.fontWeight = '700';
            span.style.lineHeight = '1.2';
            span.style.cursor = 'pointer';
            span.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s ease';
            span.style.transform = `scale(1) translate(${Math.sin(i) * 5}px, ${Math.cos(i) * 5}px)`;

            // Hover interactions
            span.addEventListener('mouseenter', () => {
                span.style.transform = `scale(1.15) translate(${Math.sin(i) * 5}px, ${Math.cos(i) * 5}px)`;
                span.style.textShadow = `0 0 16px ${PALETTE[i % PALETTE.length]}`;
            });
            span.addEventListener('mouseleave', () => {
                span.style.transform = `scale(1) translate(${Math.sin(i) * 5}px, ${Math.cos(i) * 5}px)`;
                span.style.textShadow = 'none';
            });

            targetContainer.appendChild(span);
        });

        // Update analytics metrics
        const totalVotes = counts.reduce((acc, c) => acc + c, 0);
        updateMetrics(totalVotes, dataArray.length);
        updateLeaderboard(dataArray);
    }

    function updateMetrics(totalVotes, uniqueWords) {
        const metricTotalWords = document.getElementById('metric-total-words');
        const metricParticipants = document.getElementById('metric-participants');
        if (metricTotalWords) metricTotalWords.textContent = totalVotes;
        if (metricParticipants) metricParticipants.textContent = Math.max(uniqueWords, Math.ceil(totalVotes / 1.5));
    }

    function updateLeaderboard(dataArray) {
        const lb = document.getElementById('top-words-leaderboard');
        if (!lb) return;
        lb.innerHTML = '';
        
        if (!dataArray || dataArray.length === 0) {
            lb.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 20px;">No top words yet.</div>';
            return;
        }

        const sorted = [...dataArray].sort((a, b) => {
            const vA = typeof a === 'object' ? (a.value || a.count || 1) : 1;
            const vB = typeof b === 'object' ? (b.value || b.count || 1) : 1;
            return vB - vA;
        }).slice(0, 10);

        sorted.forEach((item, idx) => {
            const wordText = typeof item === 'object' ? (item.text || item.word || '') : String(item);
            const wordVal = typeof item === 'object' ? (item.value || item.count || 1) : 1;
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '8px 12px';
            row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            row.style.fontSize = '0.9rem';
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-family: var(--font-mono); color: var(--color-text-muted); font-weight: 700; width: 20px;">#${idx + 1}</span>
                    <strong style="color: #ffffff;">${wordText}</strong>
                </div>
                <span style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-family: var(--font-mono); font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem;">${wordVal}</span>
            `;
            lb.appendChild(row);
        });
    }

    // Listen for real-time cloud updates over Socket.io
    if (socket) {
        socket.on('cloudUpdate', (dataArray) => {
            console.log('[Socket.io Presenter] Received cloudUpdate:', dataArray);
            renderWordCloud(dataArray);
        });
    }

    // Expose render function globally
    window.renderPresenterWordCloud = renderWordCloud;

    document.addEventListener('DOMContentLoaded', () => {
        // Update PIN display elements
        const pinDisplays = document.querySelectorAll('.session-pin-display');
        pinDisplays.forEach(el => el.textContent = roomCode);

        // Update custom topic if provided in query URL
        if (customTopic) {
            const topicEl = document.getElementById('activeTopicHeading') || document.querySelector('.dashboard-grid h1');
            if (topicEl) topicEl.innerHTML = customTopic;
        }

        // 1. QR Code Generation
        const qrcodeContainer = document.getElementById('qrcode');
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '';
            // Construct target URL to participant view participant.html with current room PIN and topic
            let originPath = window.location.origin + window.location.pathname.replace('present.html', 'participant.html');
            if (!originPath.endsWith('participant.html')) {
                originPath = originPath.replace(/\/$/, '') + '/participant.html';
            }
            let targetUrl = `${originPath}?pin=${roomCode}`;
            if (customTopic) {
                targetUrl += `&topic=${encodeURIComponent(customTopic)}`;
            }

            if (typeof QRCode !== 'undefined') {
                try {
                    new QRCode(qrcodeContainer, {
                        text: targetUrl,
                        width: 110,
                        height: 110,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M
                    });
                } catch (err) {
                    console.warn('[QRCode] Generation failed, injecting fallback QR SVG:', err);
                    injectFallbackQRSvg(qrcodeContainer);
                }
            } else {
                injectFallbackQRSvg(qrcodeContainer);
            }
        }

        // Shareable Link population & Copy Button
        let targetUrl = '';
        let originPath = window.location.origin + window.location.pathname.replace('present.html', 'participant.html');
        if (!originPath.endsWith('participant.html')) {
            originPath = originPath.replace(/\/$/, '') + '/participant.html';
        }
        targetUrl = `${originPath}?pin=${roomCode}`;
        if (customTopic) {
            targetUrl += `&topic=${encodeURIComponent(customTopic)}`;
        }

        const shareableInput = document.getElementById('shareable-link-input');
        const copyBtn = document.getElementById('copy-link-btn');
        if (shareableInput) {
            shareableInput.value = targetUrl;
        }
        if (copyBtn && shareableInput) {
            copyBtn.onclick = () => {
                shareableInput.select();
                shareableInput.setSelectionRange(0, 99999);
                navigator.clipboard.writeText(shareableInput.value).then(() => {
                    const icon = copyBtn.querySelector('.material-symbols-outlined');
                    if (icon) {
                        icon.textContent = 'check';
                        setTimeout(() => icon.textContent = 'content_copy', 2000);
                    }
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            };
        }

        // 2. Clear Poll Button & Browser Confirm Dialogue
        const clearPollBtn = document.getElementById('clearPollBtn') || document.getElementById('btn-clear-cloud');
        if (clearPollBtn) {
            clearPollBtn.addEventListener('click', (e) => {
                if (e && e.preventDefault) e.preventDefault();
                if (!window.confirm("Are you sure you want to clear the live word cloud? All data will be reset.")) {
                    return;
                }
                if (socket) {
                    socket.emit('resetCloud', roomCode);
                }
                // Instantly clear the cloud locally when returning/resetting
                renderWordCloud([]);
            });
        }

        // 3. Simulate Word button
        const simBtn = document.getElementById('btn-simulate-word');
        if (simBtn) {
            simBtn.addEventListener('click', () => {
                const words = ["fast", "engaging", "interactive", "vanilla", "simple", "lightning", "dynamic", "real-time", "seamless"];
                const randomWord = words[Math.floor(Math.random() * words.length)];
                if (socket && socket.connected) {
                    socket.emit('submitWord', { roomCode: roomCode, word: randomWord });
                } else if (typeof addOrIncrementWord === 'function') {
                    addOrIncrementWord(randomWord);
                }
            });
        }

        // Initialize empty or existing state on page load
        if (typeof words !== 'undefined' && Array.isArray(words) && words.length > 0) {
            renderWordCloud(words);
        } else {
            renderWordCloud([]);
        }
    });

    function injectFallbackQRSvg(container) {
        if (!container) return;
        container.innerHTML = `
            <svg width="110" height="110" viewBox="0 0 29 29" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H9V9H0V0ZM2 2V7H7V2H2ZM11 0H13V2H11V0ZM14 0H16V4H14V0ZM18 0H20V2H18V0ZM20 0H29V9H20V0ZM22 2V7H27V2H22ZM0 11H2V13H0V11ZM4 11H7V13H4V11ZM9 11H11V16H9V11ZM13 11H18V13H13V11ZM20 11H22V13H20V11ZM24 11H29V13H24V11ZM2 14H4V16H2V14ZM6 14H8V18H6V14ZM12 14H14V16H12V14ZM16 14H18V16H16V14ZM22 14H24V18H22V14ZM26 14H29V16H26V14ZM0 18H2V20H0V18ZM4 18H6V20H4V18ZM10 18H12V22H10V18ZM14 18H18V20H14V18ZM20 18H22V20H20V18ZM25 18H27V20H25V18ZM0 20H9V29H0V20ZM2 22V27H7V22H2ZM13 21H16V23H13V21ZM17 21H20V25H17V21ZM22 21H24V23H22V21ZM26 21H29V23H26V21ZM11 23H13V25H11V23ZM14 23H16V25H14V23ZM24 23H26V27H24V23ZM27 23H29V29H27V23ZM9 25H11V27H9V25ZM12 25H14V27H12V25ZM15 25H17V29H15V25ZM20 25H22V27H20V25ZM11 27H13V29H11V27ZM21 27H24V29H21V27Z" fill="#000000"></path>
            </svg>
        `;
    }
})();
