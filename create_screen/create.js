document.addEventListener("DOMContentLoaded", () => {
  const pollInput = document.getElementById("poll-input");
  const goLiveBtn = document.getElementById("go-live-btn");
  const settingsBtn = document.getElementById("settings-icon-btn");
  const latencyValue = document.getElementById("latency-value");
  const joinCode = document.getElementById("join-code");

  // Simulate a live-updating latency value, like a real websocket ping
  function updateLatency() {
    const fakeLatency = Math.floor(Math.random() * 20) + 5; // 5ms - 25ms
    latencyValue.textContent = `${fakeLatency}ms`;
  }
  setInterval(updateLatency, 3000);

  // Pressing Enter in the input triggers "Go Live"
  pollInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      goLiveBtn.click();
    }
  });

  // Go Live button behavior
  goLiveBtn.addEventListener("click", () => {
    const question = pollInput.value.trim();

    if (!question) {
      pollInput.style.borderColor = "#e05a5a";
      pollInput.placeholder = "Please enter a question first...";
      setTimeout(() => {
        pollInput.style.borderColor = "";
        pollInput.placeholder = "e.g., Describe microservices in one word";
      }, 1800);
      return;
    }

    goLiveBtn.disabled = true;
    const originalText = goLiveBtn.innerHTML;
    goLiveBtn.innerHTML = `<span class="bolt">&#9889;</span> Launching...`;

    setTimeout(() => {
      goLiveBtn.innerHTML = `<span class="bolt">&#10003;</span> Poll is Live!`;

      setTimeout(() => {
        goLiveBtn.innerHTML = originalText;
        goLiveBtn.disabled = false;
      }, 2000);
    }, 1200);
  });

  // Settings icon button — placeholder interaction
  settingsBtn.addEventListener("click", () => {
    settingsBtn.classList.toggle("active");
  });

  // Generate a random join code on load, similar to a real session start
  function generateJoinCode() {
    return Math.floor(1000 + Math.random() * 9000);
  }
  joinCode.textContent = generateJoinCode();
});
