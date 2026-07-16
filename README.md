# 📊 Micro-Menti (High-Capacity Word Cloud)

Micro-Menti is a single-feature, hyper-focused alternative to Mentimeter. It is designed specifically to host live, interactive Word Cloud polls for up to 1,000 concurrent mobile participants. The system prioritizes ultra-low latency, zero user friction, and high cost-efficiency by eliminating traditional databases and bloated frontend frameworks.

---

## 🎯 Core Objectives

*   **Massive Concurrency:** Support 1,000+ simultaneous WebSocket connections on a single, low-spec server instance ($5/month).
*   **Frictionless UX:** Participants must join via a simple URL or QR code scan—no apps, signups, accounts, or emails required.
*   **Real-Time Visualization:** Presenter screen updates dynamically with zero page-refreshes using optimized CSS layout transformations.

---

## 🏗️ Target Tech Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JS / CSS3 / HTML5 | Eliminates build compilation steps and keeps asset footprints under 50KB. |
| **Runtime Engine** | Node.js (Express) | High asynchronous throughput for lightweight network handling. |
| **Real-time Pipeline** | Socket.io | Native abstractions for robust WebSockets fallback layers. |
| **Production Hosting** | Ubuntu Linux + Nginx + PM2 | Standard, cheap, easily tuneable connection configurations. |

---

## 📋 Scope Matrix

### In Scope
*   **Participant Web App:** Single-field input interface capped at 25 characters per submission with cookie/local storage anti-spam tracking.
*   **Presenter Dashboard:** Dynamic, responsive text cloud layout scaling font sizes automatically (16px to 72px) relative to word frequency, with automatic QR Code rendering and global administrative reset buttons.
*   **Backend Engine:** In-memory data architecture to process hundreds of write streams per second safely, using a throttled 500ms broadcast loop and text sanitation filtering.

### Out of Scope (What this will NOT do)
*   User registration, presentation histories, or persistent accounts.
*   Multiple poll formats (e.g., Multiple Choice, Q&A, or Quizzes).
*   Permanent data storage or database exporting (historical archives are lost on server restart).

---

## 📈 Key Performance Indicators (KPIs)

*   **Connection Target:** 1,000 active concurrent WebSocket tunnels sustained for 30 minutes without dropouts.
*   **System Response Latency:** Sub-100ms time windows between participant click actions and server acknowledgement.
*   **Hardware Efficiency:** Memory footprint remains under 250MB RAM under maximum simulated artificial audience load.

---

## 🚀 Architectural Blueprint & Codebase

### 1. The Backend (`server.js`)
This lightweight server handles incoming words, tracks frequencies in memory, and broadcasts data changes in real time.

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure CORS to handle high connection volume safely
const io = new Server(server, { cors: { origin: "*" } });

// In-memory data store for maximum speed (Supports thousands of entries)
let wordCounts = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Send current cloud snapshot immediately upon joining
    socket.emit('cloudUpdate', formatCloudData());

    // Handle incoming submissions from participants
    socket.on('submitWord', (word) => {
        if (!word || typeof word !== 'string') return;
        
        // Clean the input text
        const cleanWord = word.trim().toLowerCase().substring(0, 25); 
        if (cleanWord.length === 0) return;

        // Increment the count
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;

        // Broadcast updates to client browsers
        io.emit('cloudUpdate', formatCloudData());
    });

    // Reset loop for new presentations
    socket.on('resetCloud', () => {
        wordCounts = {};
        io.emit('cloudUpdate', []);
    });
});

// Helper to convert internal store to UI-friendly layout
function formatCloudData() {
    return Object.keys(wordCounts).map(word => ({ text: word, value: wordCounts[word] }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
