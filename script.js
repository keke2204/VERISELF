/**
 * VERISELF — Editorial Showcase Client Logic
 * Handcrafted Vanilla JavaScript • Zero External Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initComparisonPlate();
  initHashComparator();
});

/* 1. Theme Management (Pure Monochrome Invert) */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('veriself-monograph-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.contains('light');
      if (isLight) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('veriself-monograph-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('veriself-monograph-theme', 'light');
      }
    });
  }
}

/* 2. Before / After Comparison Plate (Editorial Specimen Slider) */
function initComparisonPlate() {
  const container = document.getElementById('comparisonSlider');
  const cloakedWrapper = document.getElementById('cloakedWrapper');
  const sliderHandle = document.getElementById('sliderHandle');

  if (!container || !cloakedWrapper || !sliderHandle) return;

  let isDragging = false;

  function updatePosition(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;

    const percent = ((x / rect.width) * 100).toFixed(2);
    cloakedWrapper.style.width = percent + '%';
    sliderHandle.style.left = percent + '%';
  }

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    updatePosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches || !e.touches[0]) return;
    updatePosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

/* 3. Forensic Perceptual Hash Comparator (Hamming Bit Distance) */
function initHashComparator() {
  const input1 = document.getElementById('hashInput1');
  const input2 = document.getElementById('hashInput2');

  if (input1 && input2) {
    input1.addEventListener('input', calculateHamming);
    input2.addEventListener('input', calculateHamming);
    calculateHamming();
  }
}

function calculateHamming() {
  const raw1 = (document.getElementById('hashInput1')?.value || '').trim().toLowerCase();
  const raw2 = (document.getElementById('hashInput2')?.value || '').trim().toLowerCase();

  const resDist = document.getElementById('resDistance');
  const resSim = document.getElementById('resSimilarity');
  const resVerdict = document.getElementById('resVerdict');

  if (!resDist || !resSim || !resVerdict) return;

  // Sanitize hex strings (64-bit perceptual hash = 16 hex characters)
  const clean1 = raw1.replace(/[^0-9a-f]/g, '').padEnd(16, '0').slice(0, 16);
  const clean2 = raw2.replace(/[^0-9a-f]/g, '').padEnd(16, '0').slice(0, 16);

  let bitDistance = 0;

  for (let i = 0; i < 16; i++) {
    const val1 = parseInt(clean1[i] || '0', 16);
    const val2 = parseInt(clean2[i] || '0', 16);
    let xor = val1 ^ val2;
    while (xor > 0) {
      bitDistance += (xor & 1);
      xor >>= 1;
    }
  }

  const similarity = Math.max(0, ((64 - bitDistance) / 64) * 100).toFixed(2);
  const isMatch = bitDistance <= 8;

  resDist.textContent = `${bitDistance} BITS / 64`;
  resSim.textContent = `${similarity}%`;

  if (isMatch) {
    resVerdict.textContent = `CONFIRMED MATCH (≤ 8 BITS)`;
    resVerdict.className = 'verdict-tag font-mono status-match';
  } else {
    resVerdict.textContent = `DISTINCT ASSET (> 8 BITS)`;
    resVerdict.className = 'verdict-tag font-mono status-distinct';
  }
}

/* 4. Terminal Command Copy Helper */
function copyCode(text) {
  navigator.clipboard.writeText(text).then(() => {
    const active = document.activeElement;
    if (active && active.classList.contains('copy-btn')) {
      const originalText = active.textContent;
      active.textContent = 'COPIED';
      setTimeout(() => {
        active.textContent = originalText;
      }, 1600);
    }
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}
