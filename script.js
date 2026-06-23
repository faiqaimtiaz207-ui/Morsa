// ===== PARTICLE ANIMATION =====
(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  // Canvas sits fixed behind everything
  canvas.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 0;
    pointer-events: none;
    display: block;
  `;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 40;

  // Colour palette — matches the lavender/purple/pink/blue page theme (vibrant & saturated)
  const COLORS = [
    0xb88eff, // vibrant purple
    0x9944ff, // deep violet
    0xff66ff, // bright pink-magenta
    0xd633ff, // deep rose-violet
    0x88c8ff, // bright periwinkle
    0x5eb8ff, // vibrant sky blue
    0xd477ff, // saturated light purple
    0xff44dd, // bright pink
    0x8833ff, // deep brand purple
  ];

    // ---- PARTICLES ----
    // Increased particle count for a denser background bubble effect
    const PARTICLE_COUNT = 500;
  const particles = [];

  // Shared geometry (a small circle sprite)
  const circleGeo = new THREE.CircleGeometry(1, 24);

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function makeParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: randBetween(0.25, 0.8),
        });
        const mesh = new THREE.Mesh(circleGeo, mat);

        // Spread across a wider plane so more bubbles fill the backdrop
        const spread = { x: 70, y: 45 };
    mesh.position.set(
      randBetween(-spread.x, spread.x),
      randBetween(-spread.y, spread.y),
      randBetween(-10, 5)
    );
        const size = randBetween(0.18, 1.6);
        mesh.scale.setScalar(size);

        // Slow drift velocity (slightly wider range for variety)
        const speed = randBetween(0.006, 0.04);
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // Slow float bob
    const bobFreq = randBetween(0.3, 1.0);
    const bobAmp  = randBetween(0.02, 0.1);
    const bobOff  = Math.random() * Math.PI * 2;

    // Cursor repulsion state
    const repulse = { vx: 0, vy: 0 };

    scene.add(mesh);
    particles.push({ mesh, vx, vy, size, bobFreq, bobAmp, bobOff, repulse, spread });
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    makeParticle();
  }

  // ---- CURSOR REPULSION ----
  const REPULSE_RADIUS = 7;
  const REPULSE_FORCE = 0.09;
  const FRICTION = 0.91;
  const pointer = new THREE.Vector3(9999, 9999, 0);

  function updatePointer(x, y) {
    // Normalize screen coords to world coords
    const px = (x / window.innerWidth) * 2 - 1;
    const py = -(y / window.innerHeight) * 2 + 1;
    pointer.x = px * 55; // spread.x
    pointer.y = py * 35; // spread.y
  }

  window.addEventListener('mousemove', e => updatePointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', () => {
    pointer.set(9999, 9999, 0);
  });

  // ---- RESIZE ----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---- ANIMATION LOOP ----
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    for (const p of particles) {
      const m = p.mesh;
      const { spread } = p;

      // Cursor repulsion
      const dx = m.position.x - pointer.x;
      const dy = m.position.y - pointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPULSE_RADIUS && dist > 0.01) {
        const force = (REPULSE_RADIUS - dist) / REPULSE_RADIUS;
        p.repulse.vx += (dx / dist) * force * REPULSE_FORCE;
        p.repulse.vy += (dy / dist) * force * REPULSE_FORCE;
      }

      // Apply friction to repulsion velocity
      p.repulse.vx *= FRICTION;
      p.repulse.vy *= FRICTION;

      // Move
      m.position.x += p.vx + p.repulse.vx;
      m.position.y += p.vy + p.repulse.vy + Math.sin(t * p.bobFreq + p.bobOff) * p.bobAmp;

      // Wrap around edges (toroidal)
      if (m.position.x > spread.x) m.position.x = -spread.x;
      if (m.position.x < -spread.x) m.position.x = spread.x;
      if (m.position.y > spread.y) m.position.y = -spread.y;
      if (m.position.y < -spread.y) m.position.y = spread.y;
    }

    renderer.render(scene, camera);
  }

  animate();
})();

// Morse Code Mapping
const MORSE_MAP = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};

const REVERSE_MORSE_MAP = Object.fromEntries(
    Object.entries(MORSE_MAP).map(([char, morse]) => [morse, char])
);

// Audio Context and Timing
const MORSE_TIMING = {
    unit: 250,
    dot: 250,
    dash: 750,
    symbolGap: 250,
    letterGap: 750,
    wordGap: 1750
};

const FREQUENCY = 800; // Hz
const VOLUME = 0.3; // 0-1

let audioContext = null;
let isPlaying = false;
let currentOscillator = null;
let currentGainNode = null;
let playbackStartTime = 0;
let playbackPausedTime = 0;

// ===== CONVERTER TAB =====

const textInput = document.getElementById('text-input');
const morseOutput = document.getElementById('morse-output');
const morseInput = document.getElementById('morse-input');
const textOutput = document.getElementById('text-output');
const copyTextMorseBtn = document.getElementById('copy-text-morse');
const copyMorseTextBtn = document.getElementById('copy-morse-text');
const clearTextInputBtn = document.getElementById('clear-text-input');
const clearMorseInputBtn = document.getElementById('clear-morse-input');
const toast = document.getElementById('toast');

function flashButtonCopy(button, message = 'Copied', duration = 2000) {
    if (!button) return;
    const originalText = button.textContent;
    button.textContent = message;
    button.disabled = true;
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, duration);
}

// Convert text to Morse
function textToMorse(text) {
    return text
        .toUpperCase()
        .split(' ')
        .map(word =>
            word
                .split('')
                .map(char => MORSE_MAP[char] || char)
                .join(' ')
        )
        .join(' / ');
}

// Convert Morse to text
function morseToText(morse) {
    return morse
        .split(' / ')
        .map(word =>
            word
                .split(' ')
                .map(code => REVERSE_MORSE_MAP[code] || '')
                .join('')
        )
        .join(' ');
}

// Show toast notification
function showToast() {
    toast.classList.add('showing');
    setTimeout(() => {
        toast.classList.remove('showing');
    }, 2000);
}

// Update Morse output in real-time
textInput.addEventListener('input', () => {
    if (textInput.value.trim()) {
        morseOutput.value = textToMorse(textInput.value);
    } else {
        morseOutput.value = '';
    }
    localStorage.setItem('lastTextInput', textInput.value);
});

// Update text output in real-time
morseInput.addEventListener('input', () => {
    if (morseInput.value.trim()) {
        textOutput.value = morseToText(morseInput.value);
    } else {
        textOutput.value = '';
    }
    localStorage.setItem('lastMorseInput', morseInput.value);
});

// Copy buttons
copyTextMorseBtn.addEventListener('click', () => {
    if (morseOutput.value) {
        navigator.clipboard.writeText(morseOutput.value);
        flashButtonCopy(copyTextMorseBtn);
    }
});

copyMorseTextBtn.addEventListener('click', () => {
    if (textOutput.value) {
        navigator.clipboard.writeText(textOutput.value);
        flashButtonCopy(copyMorseTextBtn);
    }
});

// Clear buttons
clearTextInputBtn.addEventListener('click', () => {
    textInput.value = '';
    morseOutput.value = '';
    localStorage.removeItem('lastTextInput');
});

clearMorseInputBtn.addEventListener('click', () => {
    morseInput.value = '';
    textOutput.value = '';
    localStorage.removeItem('lastMorseInput');
});

// Load from localStorage
window.addEventListener('DOMContentLoaded', () => {
    const lastTextInput = localStorage.getItem('lastTextInput');
    const lastMorseInput = localStorage.getItem('lastMorseInput');
    if (lastTextInput) {
        textInput.value = lastTextInput;
        morseOutput.value = textToMorse(lastTextInput);
    }
    if (lastMorseInput) {
        morseInput.value = lastMorseInput;
        textOutput.value = morseToText(lastMorseInput);
    }
});

// ===== AUDIO TAB =====

const audioInput = document.getElementById('audio-input');
const playAudioBtn = document.getElementById('play-audio-btn');
const stopAudioBtn = document.getElementById('stop-audio-btn');
const audioMorseDisplay = document.getElementById('audio-morse-display');
const progressBar = document.getElementById('progress-bar');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');

// Initialize audio context
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Format time for display
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateMorseDuration(pattern) {
    let total = 0;
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];

        if (char === '.') total += MORSE_TIMING.dot;
        else if (char === '-') total += MORSE_TIMING.dash;
        else if (char === '/') total += MORSE_TIMING.wordGap;
        else if (char === ' ') {
            if (pattern[i - 1] === '/' || pattern[i + 1] === '/') {
                continue;
            }
            total += MORSE_TIMING.letterGap;
        }

        if ((char === '.' || char === '-') && (pattern[i + 1] === '.' || pattern[i + 1] === '-')) {
            total += MORSE_TIMING.symbolGap;
        }
    }
    return total;
}

async function playTone(duration) {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = FREQUENCY;
    gain.gain.setValueAtTime(VOLUME, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);

    currentOscillator = osc;
    currentGainNode = gain;

    return wait(duration);
}

// Play Morse audio
async function playMorseAudio(text, showProgress = true) {
    const ctx = getAudioContext();
    const morse = textToMorse(text);
    audioMorseDisplay.textContent = morse;

    const pattern = morse.split('');
    const totalDuration = calculateMorseDuration(pattern);

    if (showProgress) {
        totalTimeDisplay.textContent = formatTime(totalDuration);
    }

    playbackStartTime = ctx.currentTime;
    isPlaying = true;
    if (showProgress) {
        playAudioBtn.disabled = true;
        stopAudioBtn.disabled = false;
    }

    const pulseEl = document.getElementById('pulse-animation');
    if (showProgress) pulseEl.classList.add('active');

    let elapsed = 0;
    for (let i = 0; i < pattern.length && isPlaying; i++) {
        const char = pattern[i];

        if (char === '.' || char === '-') {
            const duration = char === '.' ? MORSE_TIMING.dot : MORSE_TIMING.dash;
            await playTone(duration);
            elapsed += duration;

            if (showProgress) updateProgressBar(elapsed, totalDuration);

            if (pattern[i + 1] === '.' || pattern[i + 1] === '-') {
                await wait(MORSE_TIMING.symbolGap);
                elapsed += MORSE_TIMING.symbolGap;
                if (showProgress) updateProgressBar(elapsed, totalDuration);
            }
        } else if (char === '/') {
            await wait(MORSE_TIMING.wordGap);
            elapsed += MORSE_TIMING.wordGap;
            if (showProgress) updateProgressBar(elapsed, totalDuration);
        } else if (char === ' ') {
            if (pattern[i - 1] === '/' || pattern[i + 1] === '/') {
                continue;
            }
            await wait(MORSE_TIMING.letterGap);
            elapsed += MORSE_TIMING.letterGap;
            if (showProgress) updateProgressBar(elapsed, totalDuration);
        }
    }

    isPlaying = false;
    if (showProgress) {
        playAudioBtn.disabled = false;
        stopAudioBtn.disabled = true;
        pulseEl.classList.remove('active');
        progressBar.style.width = '0%';
    }
}

function updateProgressBar(current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = percentage + '%';
    currentTimeDisplay.textContent = formatTime(current);
}

function stopAudio() {
    isPlaying = false;
    if (currentOscillator) {
        currentOscillator.stop();
        currentOscillator = null;
    }
    if (currentGainNode) {
        currentGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        currentGainNode = null;
    }
    playAudioBtn.disabled = false;
    stopAudioBtn.disabled = true;
    document.getElementById('pulse-animation').classList.remove('active');
    progressBar.style.width = '0%';
    currentTimeDisplay.textContent = '0:00';
    totalTimeDisplay.textContent = '0:00';
}

playAudioBtn.addEventListener('click', async () => {
    if (audioInput.value.trim()) {
        stopAudio();
        await playMorseAudio(audioInput.value);
    }
});

stopAudioBtn.addEventListener('click', stopAudio);

// ===== TRAINER TAB =====

const startTrainerBtn = document.getElementById('start-trainer');
const trainerStart = document.getElementById('trainer-start');
const trainerPlaying = document.getElementById('trainer-playing');
const trainerAnswer = document.getElementById('trainer-answer');
const currentScoreDisplay = document.getElementById('current-score');
const roundTimerDisplay = document.getElementById('round-timer');
const accuracyDisplay = document.getElementById('accuracy');
const bestScoreDisplay = document.getElementById('best-score-display');
const playAgainBtn = document.getElementById('play-again');

let trainerState = {
    score: 0,
    correct: 0,
    total: 0,
    currentLetter: '',
    timeLeft: 3,
    timerInterval: null,
    canAnswer: false,
    gameActive: false
};

const LETTERS_FOR_TRAINER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getRandomLetter() {
    return LETTERS_FOR_TRAINER[Math.floor(Math.random() * LETTERS_FOR_TRAINER.length)];
}

startTrainerBtn.addEventListener('click', () => {
    trainerState = {
        score: 0,
        correct: 0,
        total: 0,
        currentLetter: '',
        timeLeft: 3,
        timerInterval: null,
        canAnswer: true,
        gameActive: true
    };

    trainerStart.classList.add('hidden');
    trainerPlaying.classList.remove('hidden');
    // ensure Play Again button hidden while playing
    const playAgainBtnEl = document.getElementById('play-again');
    if (playAgainBtnEl) playAgainBtnEl.style.display = 'none';
    trainerAnswer.value = '';
    trainerAnswer.focus();

    nextRound();
});

function nextRound() {
    trainerState.currentLetter = getRandomLetter();
    trainerState.timeLeft = 3;
    trainerState.canAnswer = false;
    trainerAnswer.value = '';
    trainerAnswer.focus();

    // Clear previous feedback
    const feedbackEl = document.getElementById('trainer-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.classList.remove('success', 'error');
    }

    updateTrainerDisplay();
    playTrainerMorse();
}

async function playTrainerMorse() {
    const morse = MORSE_MAP[trainerState.currentLetter];
    const pattern = morse.split('');

    for (let i = 0; i < pattern.length && trainerState.gameActive; i++) {
        const char = pattern[i];

        if (char === '.' || char === '-') {
            const duration = char === '.' ? MORSE_TIMING.dot : MORSE_TIMING.dash;
            await playTone(duration);

            if (pattern[i + 1] === '.' || pattern[i + 1] === '-') {
                await wait(MORSE_TIMING.symbolGap);
            }
        }
    }

    trainerState.canAnswer = true;
    startRoundTimer();
}

function startRoundTimer() {
    clearInterval(trainerState.timerInterval);
    trainerState.timerInterval = setInterval(() => {
        trainerState.timeLeft--;
        updateTrainerDisplay();

        if (trainerState.timeLeft <= 0) {
            endRound(false);
        }
    }, 1000);
}

trainerAnswer.addEventListener('input', () => {
    if (trainerAnswer.value && trainerState.canAnswer && trainerState.gameActive) {
        const isCorrect = trainerAnswer.value.toUpperCase() === trainerState.currentLetter;
        endRound(isCorrect);
    }
});

function endRound(isCorrect) {
    clearInterval(trainerState.timerInterval);
    trainerState.canAnswer = false;

    // Show feedback message
    const feedbackEl = document.getElementById('trainer-feedback');
    if (feedbackEl) {
        if (isCorrect) {
            feedbackEl.textContent = 'Correct!';
            feedbackEl.classList.remove('error');
            feedbackEl.classList.add('success');
        } else {
            feedbackEl.textContent = `Wrong — it was ${trainerState.currentLetter}`;
            feedbackEl.classList.remove('success');
            feedbackEl.classList.add('error');
        }
    }

    trainerState.total++;
    if (isCorrect) {
        trainerState.correct++;
        trainerState.score++;
    }

    updateTrainerDisplay();

    setTimeout(() => {
        if (trainerState.score < 10) {
            nextRound();
        } else {
            endGame();
        }
    }, 1000);
}

function endGame() {
    trainerState.gameActive = false;
    clearInterval(trainerState.timerInterval);

    const accuracy = trainerState.total > 0
        ? Math.round((trainerState.correct / trainerState.total) * 100)
        : 0;
    const wpm = Math.round((trainerState.score / 5) * 60);

    const prevBest = parseInt(localStorage.getItem('bestScore') || '0');
    if (wpm > prevBest) {
        localStorage.setItem('bestScore', wpm);
    }

    // Reflect best score in the UI
    const newBest = localStorage.getItem('bestScore') || prevBest.toString();
    bestScoreDisplay.textContent = newBest;

    const trainerSubtitle = document.getElementById('trainer-subtitle');
    if (trainerSubtitle) {
        trainerSubtitle.textContent = `Can you beat your best score (${newBest} WPM)?`;
    }

    // Return to the start view and show Play Again button
    trainerPlaying.classList.add('hidden');
    trainerStart.classList.remove('hidden');
    const playAgainBtnEl = document.getElementById('play-again');
    if (playAgainBtnEl) {
        playAgainBtnEl.style.display = 'block';
    }
}

function updateTrainerDisplay() {
    currentScoreDisplay.textContent = trainerState.score;
    roundTimerDisplay.textContent = Math.max(0, trainerState.timeLeft);
    const accuracy = trainerState.total > 0
        ? Math.round((trainerState.correct / trainerState.total) * 100)
        : 100;
    accuracyDisplay.textContent = accuracy + '%';
}

playAgainBtn.addEventListener('click', () => {
    startTrainerBtn.click();
});

window.addEventListener('DOMContentLoaded', () => {
    const bestScore = localStorage.getItem('bestScore') || '0';
    bestScoreDisplay.textContent = bestScore;
    const trainerSubtitle = document.getElementById('trainer-subtitle');
    if (trainerSubtitle) {
        trainerSubtitle.textContent = `Can you beat your best score (${bestScore} WPM)?`;
    }
});

// ===== REFERENCE TAB =====

const lettersGrid = document.getElementById('letters-grid');
const numbersGrid = document.getElementById('numbers-grid');

function createReferenceItem(character) {
    const morse = MORSE_MAP[character];
    const item = document.createElement('div');
    item.className = 'reference-item';

    const charDiv = document.createElement('div');
    charDiv.className = 'reference-character';
    charDiv.textContent = character;

    const morseDiv = document.createElement('div');
    morseDiv.className = 'reference-morse';
    morseDiv.textContent = morse;

    const btn = document.createElement('button');
    btn.className = 'reference-button';
    btn.textContent = '▶ Play';
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        btn.disabled = true;
        await playMorseAudio(character, false);
        btn.disabled = false;
    });

    item.appendChild(charDiv);
    item.appendChild(morseDiv);
    item.appendChild(btn);

    return item;
}

function generateReferenceTables() {
    lettersGrid.innerHTML = '';
    numbersGrid.innerHTML = '';

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const numbers = '0123456789'.split('');

    letters.forEach(letter => {
        lettersGrid.appendChild(createReferenceItem(letter));
    });

    numbers.forEach(number => {
        numbersGrid.appendChild(createReferenceItem(number));
    });
}

generateReferenceTables();

// ===== TAB NAVIGATION =====

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });

        btn.classList.add('active');
        const activeTab = document.getElementById(`${tabName}-tab`);
        activeTab.classList.remove('hidden');
        activeTab.classList.add('active');

        if (isPlaying) {
            stopAudio();
        }

        if (trainerState.gameActive) {
            trainerState.gameActive = false;
            clearInterval(trainerState.timerInterval);
        }
    });
});

// ===== ABOUT TAB — FAQ ACCORDION =====
document.querySelectorAll('.about-faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.about-faq-item');
        const isOpen = item.dataset.open === 'true';

        document.querySelectorAll('.about-faq-item').forEach(i => {
            i.dataset.open = 'false';
            i.querySelector('.about-faq-q').setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
            item.dataset.open = 'true';
            btn.setAttribute('aria-expanded', 'true');
        }
    });
});

function scrollToTopOfTrainerTab() {
    const trainerTab = document.getElementById('trainer-tab');
    if (!trainerTab) return;

    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
    const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
    const offset = headerHeight + navHeight + 12;
    const targetTop = trainerTab.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
}

document.getElementById('about-trainer-link')?.addEventListener('click', () => {
    const trainerTabBtn = document.querySelector('.tab-btn[data-tab="trainer"]');
    trainerTabBtn?.click();
    scrollToTopOfTrainerTab();
});
