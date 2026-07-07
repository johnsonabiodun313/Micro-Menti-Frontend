document.addEventListener('DOMContentLoaded', () => {

  const clearBtn = document.getElementById('clearBtn');
  const lockBtn = document.getElementById('lockBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const wordCloud = document.getElementById('wordCloud');
  const totalContributions = document.getElementById('totalContributions');
  const statusText = document.getElementById('statusText');
  const statusDot = document.getElementById('statusDot');

  let locked = false;

  // --- Clear Responses ---
  clearBtn.addEventListener('click', () => {
    const tags = wordCloud.querySelectorAll('.tag');
    tags.forEach(tag => tag.remove());
    totalContributions.textContent = '0';
    document.getElementById('engagement').textContent = '0%';
    document.getElementById('uniqueTokens').textContent = '0';
  });

  // --- Lock / Unlock Poll ---
  lockBtn.addEventListener('click', () => {
    locked = !locked;
    const label = lockBtn.querySelector('span');
    label.textContent = locked ? 'Unlock Poll' : 'Lock Poll';

    if (locked) {
      statusText.textContent = 'Poll Locked';
      statusText.classList.remove('live');
      statusDot.classList.remove('live');
    } else {
      statusText.textContent = 'Session Ended';
      statusText.classList.remove('live');
      statusDot.classList.remove('live');
    }
  });

  // --- Download Image (captures the word cloud panel as an SVG->PNG snapshot) ---
  downloadBtn.addEventListener('click', () => {
    downloadWordCloudAsImage();
  });

  function downloadWordCloudAsImage() {
    const panel = wordCloud;
    const rect = panel.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Build an SVG snapshot of the current word cloud contents
    const tags = Array.from(panel.querySelectorAll('.tag'));
    const bg = getComputedStyle(document.body).getPropertyValue('--bg') || '#0d0d10';

    let svgTexts = tags.map(tag => {
      const style = getComputedStyle(tag);
      const tagRect = tag.getBoundingClientRect();
      const x = tagRect.left - rect.left + tagRect.width / 2;
      const y = tagRect.top - rect.top + tagRect.height / 2 + tagRect.height * 0.32;
      const color = style.color;
      const fontSize = style.fontSize;
      const fontWeight = style.fontWeight;
      const text = tag.textContent;
      return `<text x="${x}" y="${y}" text-anchor="middle" font-family="-apple-system, Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${escapeXml(text)}</text>`;
    }).join('\n');

    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#17171b" />
        ${svgTexts}
      </svg>
    `;

    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(blob => {
        const link = document.createElement('a');
        link.download = `final-synthesis-${document.getElementById('snapshotId').textContent.replace('#', '')}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    };

    img.src = url;
  }

  function escapeXml(str) {
    return str.replace(/[<>&'"]/g, c => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    }[c]));
  }

});