// Interactive Easter Eggs — hidden surprises beyond the console
// Konami code, secret words, favicon glitch, cursor trail, and more

// ================================================================
// 1. KONAMI CODE — ↑↑↓↓←→←→BA triggers Yuseongshin takeover
// ================================================================

const KONAMI_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;
let konamiTriggered = false;

function onKonamiSuccess() {
  if (konamiTriggered) return;
  konamiTriggered = true;

  // Full-screen Yuseongshin glitch takeover
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: #0d0015;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Press Start 2P', monospace;
    animation: konamiFlash 0.15s ease-in-out 3;
    cursor: none;
  `;

  const lines = [
    { text: 'ACCESS GRANTED', color: '#FF0040', size: '10px', delay: 0 },
    { text: '', color: '', size: '', delay: 400 },
    { text: 'yuseongshin_protocol.exe', color: '#9C27B0', size: '8px', delay: 800 },
    { text: 'LOADING CONTROL INTERFACE...', color: '#6A1B9A', size: '7px', delay: 1500 },
    { text: '', color: '', size: '', delay: 2000 },
    { text: '> accessing trainee files...', color: '#4A148C', size: '7px', delay: 2500 },
    { text: '> MIHO.profile — DEPENDENCY: EXTREME', color: '#FF6B9D', size: '7px', delay: 3200 },
    { text: '> SOHEE.profile — ISOLATION: COMPLETE', color: '#7A8FA8', size: '7px', delay: 3800 },
    { text: '> SUJIN.profile — RESISTANCE: BREAKING', color: '#9C27B0', size: '7px', delay: 4400 },
    { text: '> HYUNJU.profile — COMPLIANCE: 98.7%', color: '#FF8A65', size: '7px', delay: 5000 },
    { text: '', color: '', size: '', delay: 5500 },
    { text: '> debut_date: NULL', color: '#B71C1C', size: '7px', delay: 6000 },
    { text: '> there was never going to be a debut.', color: '#FF0040', size: '8px', delay: 6800 },
    { text: '', color: '', size: '', delay: 7500 },
    { text: 'CONNECTION TERMINATED BY USER', color: '#4CAF50', size: '8px', delay: 8500 },
  ];

  lines.forEach(({ text, color, size, delay }) => {
    setTimeout(() => {
      if (!text) {
        overlay.appendChild(document.createElement('br'));
        return;
      }
      const p = document.createElement('p');
      p.textContent = text;
      p.style.cssText = `
        color: ${color}; font-size: ${size};
        margin: 3px 0; opacity: 0;
        animation: konamiFadeIn 0.3s forwards;
        text-shadow: 0 0 8px ${color};
      `;
      overlay.appendChild(p);
    }, delay);
  });

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes konamiFlash {
      0%, 100% { background: #0d0015; }
      50% { background: #1a0020; }
    }
    @keyframes konamiFadeIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // Remove after sequence finishes
  setTimeout(() => {
    overlay.style.transition = 'opacity 1s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      style.remove();
      konamiTriggered = false; // allow re-trigger
    }, 1000);
  }, 10000);
}

// ================================================================
// 2. SECRET WORD — typing "yuseongshin" anywhere glitches the page
// ================================================================

let secretBuffer = '';
const SECRET_WORD = 'yuseongshin';
let secretTriggered = false;

function onSecretWord() {
  if (secretTriggered) return;
  secretTriggered = true;

  // Screen shakes violently
  document.body.style.animation = 'secretShake 0.1s ease-in-out 8';

  // Flash warning
  const warning = document.createElement('div');
  warning.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 99999;
    font-family: 'Press Start 2P', monospace;
    font-size: 11px; color: #FF0040;
    text-shadow: 0 0 20px #FF0040, 0 0 40px #B71C1C;
    text-align: center;
    pointer-events: none;
    animation: secretPulse 0.5s ease-in-out 4;
  `;
  warning.innerHTML = 'DON\'T SAY HIS NAME<br><br><span style="font-size:7px;color:#9C27B0;">he heard you.</span>';

  const style = document.createElement('style');
  style.textContent = `
    @keyframes secretShake {
      0%, 100% { transform: translate(0); }
      25% { transform: translate(-5px, 3px); }
      50% { transform: translate(4px, -4px); }
      75% { transform: translate(-3px, -2px); }
    }
    @keyframes secretPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(warning);

  // Briefly invert all colors
  document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
  setTimeout(() => {
    document.documentElement.style.filter = '';
  }, 150);

  setTimeout(() => {
    warning.remove();
    style.remove();
    document.body.style.animation = '';
    secretTriggered = false;
  }, 3000);
}

// ================================================================
// 3. FAVICON CORRUPTION — at low bloom, favicon flickers to broken heart
// ================================================================

const NORMAL_FAVICON = '💜';
const CORRUPTED_FAVICONS = ['💔', '🖤', '💀', '🕸️', '⛓️', '🩸'];
let faviconInterval: number | null = null;

function setEmojiFavicon(emoji: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 16, 18);

  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = canvas.toDataURL();
}

function startFaviconCorruption() {
  if (faviconInterval) return;
  setEmojiFavicon(NORMAL_FAVICON);

  faviconInterval = window.setInterval(() => {
    const corrupted = CORRUPTED_FAVICONS[Math.floor(Math.random() * CORRUPTED_FAVICONS.length)];
    setEmojiFavicon(corrupted);
    setTimeout(() => setEmojiFavicon(NORMAL_FAVICON), 500 + Math.random() * 1000);
  }, 8000 + Math.random() * 15000);
}

function stopFaviconCorruption() {
  if (faviconInterval) {
    clearInterval(faviconInterval);
    faviconInterval = null;
  }
  setEmojiFavicon(NORMAL_FAVICON);
}

// ================================================================
// 4. CURSOR TRAIL — at very low bloom, dark particles follow cursor
// ================================================================

let cursorTrailActive = false;

function startCursorTrail() {
  if (cursorTrailActive) return;
  cursorTrailActive = true;

  const particles: HTMLDivElement[] = [];
  const DARK_EMOJIS = ['🥀', '💔', '🖤', '†', '✦'];

  function onMove(e: MouseEvent) {
    if (Math.random() > 0.3) return; // only 30% of moves spawn

    const p = document.createElement('div');
    p.textContent = DARK_EMOJIS[Math.floor(Math.random() * DARK_EMOJIS.length)];
    p.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      pointer-events: none;
      z-index: 99998;
      font-size: ${8 + Math.random() * 8}px;
      opacity: 0.7;
      transition: all 1.5s ease-out;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(p);
    particles.push(p);

    // Float up and fade
    requestAnimationFrame(() => {
      p.style.opacity = '0';
      p.style.transform = `translate(-50%, ${-30 - Math.random() * 40}px)`;
    });

    setTimeout(() => {
      p.remove();
      const idx = particles.indexOf(p);
      if (idx > -1) particles.splice(idx, 1);
    }, 1500);
  }

  window.addEventListener('mousemove', onMove);

  // Store cleanup
  (window as unknown as Record<string, unknown>).__cursorTrailCleanup = () => {
    window.removeEventListener('mousemove', onMove);
    particles.forEach(p => p.remove());
    particles.length = 0;
    cursorTrailActive = false;
  };
}

function stopCursorTrail() {
  const cleanup = (window as unknown as Record<string, unknown>).__cursorTrailCleanup as (() => void) | undefined;
  if (cleanup) cleanup();
}

// ================================================================
// 5. HIDDEN SOURCE COMMENTS — inject lore into the DOM
// ================================================================

function injectHiddenComments() {
  const comments = [
    'SUPERNOVA was supposed to debut on March 15th. The venue was booked. The costumes were made. Yuseongshin cancelled it the night before.',
    'Miho still thinks Munyeol is coming. Nobody has told her.',
    'Sohee\'s father tried to visit the company three times. He was turned away each time. The security footage was deleted.',
    'The photos that destroyed Sujin\'s career were taken from Seoha\'s personal phone. Seoha works for Yuseongshin.',
    'Hyunju scored highest on every evaluation. The results were never shared with her mother. Only the failures were forwarded.',
    'If you\'re reading this, you found something you weren\'t supposed to find.',
    'yuseongshin.process: ACTIVE | status: WATCHING | target: YOU',
  ];

  comments.forEach(text => {
    const comment = document.createComment(` ${text} `);
    document.body.appendChild(comment);
  });
}

// ================================================================
// 6. TRIPLE-CLICK TITLE — triple-clicking the app title reveals lore
// ================================================================

let titleClickCount = 0;
let titleClickTimer: number | null = null;

function onTitleClick() {
  titleClickCount++;
  if (titleClickTimer) clearTimeout(titleClickTimer);

  titleClickTimer = window.setTimeout(() => {
    titleClickCount = 0;
  }, 500);

  if (titleClickCount >= 3) {
    titleClickCount = 0;

    const lore = [
      'YUSEONGSHIN ENTERTAINMENT — Founded 2019. Zero debuted groups. 47 terminated trainee contracts.',
      'Trainee File #0041: MIHO — "Emotional dependency makes her easy to control. Use Munyeol as incentive."',
      'Trainee File #0042: SOHEE — "Father\'s debt acquired. She has no exit strategy."',
      'Trainee File #0043: SUJIN — "Photo evidence prepared. Deploy if she resists."',
      'Trainee File #0044: HYUNJU — "Mother updated monthly on \'poor performance.\' Daughter still believes she can earn approval."',
      'All four files were created on the same day. He chose them before they even auditioned.',
    ];

    const msg = lore[Math.floor(Math.random() * lore.length)];

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 80px; left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      background: rgba(13, 0, 21, 0.95);
      border: 1px solid #9C27B0;
      padding: 12px 20px;
      font-family: 'Press Start 2P', monospace;
      font-size: 7px;
      color: #CE93D8;
      max-width: 85vw;
      line-height: 1.6;
      text-shadow: 0 0 6px rgba(156, 39, 176, 0.5);
      opacity: 0;
      transition: opacity 0.5s;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  }
}

// ================================================================
// MASTER INIT — call this once to wire everything up
// ================================================================

let easterEggsInitialized = false;

export function initEasterEggs(): void {
  if (easterEggsInitialized) return;
  easterEggsInitialized = true;

  // Konami code listener
  window.addEventListener('keydown', (e) => {
    if (e.key === KONAMI_SEQUENCE[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === KONAMI_SEQUENCE.length) {
        konamiIndex = 0;
        onKonamiSuccess();
      }
    } else {
      konamiIndex = 0;
    }
  });

  // Secret word listener (global keypress)
  window.addEventListener('keydown', (e) => {
    if (e.key.length === 1) {
      secretBuffer += e.key.toLowerCase();
      if (secretBuffer.length > 20) secretBuffer = secretBuffer.slice(-20);
      if (secretBuffer.includes(SECRET_WORD)) {
        secretBuffer = '';
        onSecretWord();
      }
    }
  });

  // Hidden DOM comments
  injectHiddenComments();

  // Title click (attach to any element with class "chat-titlebar-text")
  const observer = new MutationObserver(() => {
    const titleEl = document.querySelector('.chat-titlebar-text');
    if (titleEl && !titleEl.getAttribute('data-egg')) {
      titleEl.setAttribute('data-egg', '1');
      titleEl.addEventListener('click', onTitleClick);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also try immediately
  const titleEl = document.querySelector('.chat-titlebar-text');
  if (titleEl) {
    titleEl.setAttribute('data-egg', '1');
    titleEl.addEventListener('click', onTitleClick);
  }

  // Set initial favicon
  setEmojiFavicon(NORMAL_FAVICON);
}

// Call this when bloom changes to enable/disable bloom-dependent eggs
export function updateBloomEasterEggs(bloom: number): void {
  // Favicon corruption below 35
  if (bloom <= 35) {
    startFaviconCorruption();
  } else {
    stopFaviconCorruption();
  }

  // Cursor trail below 20
  if (bloom <= 20) {
    startCursorTrail();
  } else {
    stopCursorTrail();
  }
}
