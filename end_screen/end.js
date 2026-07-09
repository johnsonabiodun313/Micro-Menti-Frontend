document.addEventListener('DOMContentLoaded', () => {

  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const saveBtn = document.getElementById('saveBtn');
  const latencyValue = document.getElementById('latencyValue');
  const connectedValue = document.getElementById('connectedValue');

  // Export My Cloud button
  exportBtn.addEventListener('click', () => {
    exportBtn.textContent = 'EXPORTED ✓';
    setTimeout(() => {
      exportBtn.textContent = 'EXPORT MY CLOUD';
    }, 1500);
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    const confirmed = confirm('Clear your contribution from this session?');
    if (confirmed) {
      clearBtn.querySelector('span').textContent = 'CLEARED';
      setTimeout(() => {
        clearBtn.querySelector('span').textContent = 'CLEAR';
      }, 1200);
    }
  });

  // Save button
  saveBtn.addEventListener('click', () => {
    const label = saveBtn.querySelector('span');
    const original = label.textContent;
    label.textContent = 'SAVED';
    setTimeout(() => {
      label.textContent = original;
    }, 1200);
  });

  // Simulate a subtly "live" status bar, like the reference screenshot
  function randomLatency() {
    return Math.floor(8 + Math.random() * 20); // 8-28ms
  }

  function randomConnected(base) {
    const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
    return Math.max(1, base + delta);
  }

  let connectedCount = 342;

  setInterval(() => {
    latencyValue.textContent = `${randomLatency()}ms`;
    connectedCount = randomConnected(connectedCount);
    connectedValue.textContent = connectedCount;
  }, 3000);

});
