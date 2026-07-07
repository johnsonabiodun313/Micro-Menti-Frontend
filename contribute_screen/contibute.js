document.addEventListener("DOMContentLoaded", () => {
  const wordInput = document.getElementById("wordInput");
  const charCount = document.getElementById("charCount");
  const submitBtn = document.getElementById("submitBtn");
  const latencyEl = document.getElementById("latency");
  const MAX_CHARS = 25;

  // Update character counter as the participant types
  wordInput.addEventListener("input", () => {
    // Enforce single "word" feel: strip line breaks
    wordInput.value = wordInput.value.replace(/\n/g, "");
    const length = wordInput.value.length;
    charCount.textContent = length;

    submitBtn.disabled = length === 0;
  });

  // Start with submit disabled until something is typed
  submitBtn.disabled = wordInput.value.length === 0;

  // Handle submission
  submitBtn.addEventListener("click", () => {
    const answer = wordInput.value.trim();
    if (!answer) return;

    console.log("Submitted answer:", answer);

    // Simple visual feedback on submit
    submitBtn.textContent = "Submitted!";
    submitBtn.disabled = true;

    setTimeout(() => {
      wordInput.value = "";
      charCount.textContent = "0";
      submitBtn.textContent = "Submit";
      submitBtn.disabled = true;
      wordInput.focus();
    }, 1200);
  });

  // Allow Enter key to submit (without adding a newline)
  wordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!submitBtn.disabled) {
        submitBtn.click();
      }
    }
  });

  // Simulate a subtly fluctuating latency reading, like a live connection
  setInterval(() => {
    const simulatedLatency = Math.floor(Math.random() * 10) + 10; // 10-19ms
    latencyEl.textContent = `${simulatedLatency}ms`;
  }, 3000);
});
