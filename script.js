// Global variables
let audioCtx = null;
let musicInterval = null;
let isMusicPlaying = false;
let currentScent = 'coconut';
let currentScentColor = '#fef08a';

// Canvas Particle System setup
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

// Handle resizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Render loop for particles (sprays & confetti)
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity || 0;
    p.alpha -= p.decay;
    p.size *= 0.98;

    if (p.alpha <= 0 || p.size <= 0.2) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;

    if (p.shape === 'star') {
      drawStar(ctx, p.x, p.y, 5, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  requestAnimationFrame(animateParticles);
}
requestAnimationFrame(animateParticles);

// Helper to draw a star
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

// Sparkle emitter function
function createSparkles(x, y, color, count = 20, isSpray = false) {
  for (let i = 0; i < count; i++) {
    const angle = isSpray ? (Math.random() * -0.5 - 0.25) * Math.PI : Math.random() * Math.PI * 2; // Spray leftwards/upwards
    const speed = isSpray ? Math.random() * 8 + 4 : Math.random() * 6 + 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: isSpray ? 0.05 : 0.1,
      size: Math.random() * 8 + (isSpray ? 3 : 5),
      color: color,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015,
      shape: Math.random() > 0.3 ? 'star' : 'circle'
    });
  }
}

// ----------------------------------------------------
// STAR BACKGROUND INJECTION
// ----------------------------------------------------
function initStars() {
  const container = document.getElementById('starsContainer');
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDuration = `${Math.random() * 3 + 2}s`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    container.appendChild(star);
  }
}
initStars();

// ----------------------------------------------------
// SOUND EFFECTS (Web Audio API Synth)
// ----------------------------------------------------
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Simple synth beep
function playBeep(freq, type = 'sine', duration = 0.1, volume = 0.1) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.log("Web Audio blocked or unsupported", e);
  }
}

// Bubble/liquid noise effect
function playBubbleSound() {
  try {
    initAudio();
    let now = audioCtx.currentTime;
    for (let i = 0; i < 8; i++) {
      let timeOffset = i * 0.15;
      let osc = audioCtx.createOscillator();
      let gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 + Math.random() * 200, now + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(400 + Math.random() * 200, now + timeOffset + 0.1);

      gain.gain.setValueAtTime(0.08, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.15);
    }
  } catch (e) { }
}

// Spray whoosh noise
function playSpraySound() {
  try {
    initAudio();
    // Simulate noise by scheduling many rapid, random-frequency oscillators
    let now = audioCtx.currentTime;
    let duration = 0.25;

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noiseNode.start();
  } catch (e) { }
}

// Lofi Synth Lullaby Chords Player
function playLofiLullaby() {
  try {
    initAudio();

    // Cozy chords (Major 7th and Minor 7th variations)
    // 1. Fmaj7 (F3, A3, C4, E4)
    // 2. Em7 (E3, G3, B3, D4)
    // 3. Dm7 (D3, F3, A3, C4)
    // 4. Cmaj7 (C3, E3, G3, B3)
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [164.81, 196.00, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [130.81, 164.81, 196.00, 246.94]  // Cmaj7
    ];

    let chordIdx = 0;

    function playChord() {
      if (!isMusicPlaying) return;

      const freqs = chords[chordIdx];
      const now = audioCtx.currentTime;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600; // Warm lofi cut
      filter.Q.value = 1;

      filter.connect(audioCtx.destination);

      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle'; // Smooth flute-like tone
        osc.frequency.value = freq;

        // Gentle attack/decay
        gain.gain.setValueAtTime(0, now + (idx * 0.05)); // slight arpeggio
        gain.gain.linearRampToValueAtTime(0.04, now + 0.6 + (idx * 0.05));
        gain.gain.setValueAtTime(0.04, now + 2.0);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 4.0);

        osc.connect(gain);
        gain.connect(filter);

        osc.start(now);
        osc.stop(now + 4.2);
      });

      chordIdx = (chordIdx + 1) % chords.length;
    }

    // Initial chord
    playChord();

    // Loop chord changes every 4.5 seconds
    musicInterval = setInterval(playChord, 4500);

  } catch (e) {
    console.error("Lullaby player error", e);
  }
}

// ----------------------------------------------------
// TENGIL RUNAWAY BUTTON GAME
// ----------------------------------------------------
const btnBad = document.getElementById('btnBad');
const btnGood = document.getElementById('btnGood');
const btnGroup = document.getElementById('btnGroup');

const cheekyMessages = [
  "Eits, gak bisa di-klik! 😜",
  "Hayo mau kabur ke mana? 😂",
  "Enggak boleh bad mood, klik tombol hijau! 🚫",
  "Cursor kamu kurang cepat wlee~ 👅",
  "Error 404: Bad mood not allowed! 💻",
  "Klik tombol 'Beresin Dong' sebelah kanan! 👉",
  "Hampir kena! Tapi boong 🤪",
  "Gak mempan diklik, nyerah aja! 🏳️"
];

function moveButton() {
  playBeep(400, 'triangle', 0.08, 0.05);

  // Calculate bounds of parent or viewport
  const btnRect = btnBad.getBoundingClientRect();
  const groupRect = btnGroup.getBoundingClientRect();

  // Choose random translations within bounds
  // We want to move it reasonably away from the mouse cursor
  const rangeX = 150;
  const rangeY = 80;

  // Random sign and offset
  const randomX = (Math.random() - 0.5) * rangeX * 2;
  const randomY = (Math.random() - 0.5) * rangeY * 2;

  btnBad.style.transform = `translate(${randomX}px, ${randomY}px)`;

  // Change text randomly
  const randomMsg = cheekyMessages[Math.floor(Math.random() * cheekyMessages.length)];
  btnBad.innerText = randomMsg;
}

// Move when hover or focus
btnBad.addEventListener('mouseover', moveButton);
btnBad.addEventListener('touchstart', (e) => {
  e.preventDefault();
  moveButton();
});

// Click fallback (just in case they somehow press it via tab or super fast click)
btnBad.addEventListener('click', (e) => {
  e.preventDefault();
  moveButton();
});

// ----------------------------------------------------
// ACTION REVEAL - "BERESIN DONG!"
// ----------------------------------------------------
btnGood.addEventListener('click', () => {
  playBeep(600, 'sine', 0.15, 0.1);
  playBeep(800, 'sine', 0.25, 0.1);

  // Confetti explosion
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  createSparkles(center.x, center.y, '#c084fc', 35);
  createSparkles(center.x, center.y, '#86efac', 35);

  // Fade out section 1
  document.getElementById('decisionSection').style.transition = 'opacity 0.5s ease';
  document.getElementById('decisionSection').style.opacity = '0';

  setTimeout(() => {
    document.getElementById('decisionSection').classList.add('hidden');

    // Fade in Main Hub
    const mainHub = document.getElementById('mainHub');
    mainHub.classList.remove('hidden');
    // Scroll view smoothly
    mainHub.scrollIntoView({ behavior: 'smooth' });
  }, 500);
});

// ----------------------------------------------------
// VIRTUAL BREW BAR
// ----------------------------------------------------
const btnTuku = document.getElementById('btnTuku');
const btnMatcha = document.getElementById('btnMatcha');
const cupLiquid = document.getElementById('cupLiquid');
const cupFoam = document.getElementById('cupFoam');
const steamContainer = document.getElementById('steamContainer');
const baristaLog = document.getElementById('baristaLog');
const codeDrinkType = document.getElementById('codeDrinkType');

let isBrewing = false;

function brewDrink(type) {
  if (isBrewing) return;
  isBrewing = true;

  // Reset cup first
  cupLiquid.style.height = '0%';
  cupFoam.style.opacity = '0';
  cupFoam.style.bottom = '0%';
  steamContainer.style.opacity = '0';

  // Activate selected button styling
  if (type === 'tuku') {
    btnTuku.classList.add('active');
    btnMatcha.classList.remove('active');
    cupLiquid.style.backgroundColor = 'var(--color-tuku)';
    codeDrinkType.innerText = "'kopi tuku'";
  } else {
    btnMatcha.classList.add('active');
    btnTuku.classList.remove('active');
    cupLiquid.style.backgroundColor = 'var(--color-matcha)';
    codeDrinkType.innerText = "'matcha latte'";
  }

  // Step-by-step logs
  const logs = type === 'tuku' ? [
    "☕ [1/3] Menakar kopi aren Tetangga Tuku pilihan...",
    "☕ [2/3] Menyeduh susu segar dengan sirup gula aren manis...",
    "☕ [3/3] Selesai! Kopi Tuku hangat siap dinikmati! Kehangatan +100%."
  ] : [
    "🍵 [1/3] Menyiapkan Matcha Grade murni dari Uji, Kyoto...",
    "🍵 [2/3] Mengocok chasen hingga keluar busa creamy penenang...",
    "🍵 [3/3] Selesai! Matcha Latte hangat super wangi siap diseruput. Rileks +200%."
  ];

  baristaLog.innerText = logs[0];
  playBubbleSound();

  // Animating liquid pour
  setTimeout(() => {
    cupLiquid.style.height = '75%';
    cupFoam.style.bottom = '75%';
    cupFoam.style.opacity = '1';
    baristaLog.innerText = logs[1];
    playBubbleSound();
  }, 1000);

  setTimeout(() => {
    steamContainer.style.opacity = '1';
    baristaLog.innerText = logs[2];
    playBeep(523.25, 'sine', 0.3, 0.1); // high note success chime
    isBrewing = false;
  }, 2500);
}

btnTuku.addEventListener('click', () => brewDrink('tuku'));
btnMatcha.addEventListener('click', () => brewDrink('matcha'));

// ----------------------------------------------------
// MYKONOS PERFUME SPRITZER
// ----------------------------------------------------
const perfumeButtons = document.querySelectorAll('.btn-perfume');
const perfumeBottle = document.getElementById('perfumeBottle');
const gradStop1 = document.getElementById('gradStop1');
const gradStop2 = document.getElementById('gradStop2');
const perfumeLabel = document.getElementById('perfumeLabel');
const scentStatus = document.getElementById('scentStatus');
const codeAromaType = document.getElementById('codeAromaType');

const perfumeData = {
  coconut: {
    label: "COCONUT",
    colors: ['#fef08a', '#eab308'], // Gold/Yellow
    text: "🥥 Aroma <b>Coconut Dreams</b> manis kelapa-vanila menyeruak! Pikiran jadi super santai kayak lagi goleran di pantai Bali. 🏖️"
  },
  aphrodite: {
    label: "APHRODITE",
    colors: ['#fca5a5', '#db2777'], // Pink/Rose
    text: "🍓 Aroma <b>Aphrodite</b> berry-manis menyebar! Kamu mendadak merasa 200% lebih menarik, wangi, dan dicintai semesta. ✨"
  },
  senja: {
    label: "SENJA",
    colors: ['#fdba74', '#ea580c'], // Orange/Coffee
    text: "🌇 Aroma <b>Senja & Coffee</b> tercium hangat. Tenang banget kayak dengerin playlist indie sore-sore pas hujan reda. ☕"
  }
};

perfumeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active from all
    perfumeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const scent = btn.getAttribute('data-scent');
    currentScent = scent;
    const data = perfumeData[scent];

    // Change SVG labels and gradient colors
    perfumeLabel.textContent = data.label;
    gradStop1.setAttribute('stop-color', data.colors[0]);
    gradStop2.setAttribute('stop-color', data.colors[1]);
    currentScentColor = data.colors[0];

    // Update code viewer label
    codeAromaType.innerText = `'Mykonos ${data.label}'`;

    // Soft beep feedback
    playBeep(330, 'sine', 0.08, 0.05);
    scentStatus.innerHTML = `Varian diganti ke <b>${data.label}</b>. Semprot sekarang!`;
  });
});

perfumeBottle.addEventListener('click', () => {
  if (perfumeBottle.classList.contains('spraying')) return;
  perfumeBottle.classList.add('spraying');

  playSpraySound();

  // Calculate spray nozzle origin in viewport coordinates
  const rect = perfumeBottle.getBoundingClientRect();
  // Nozzle sits near center horizontally, upper third vertically
  const nozzleX = rect.left + rect.width / 2;
  const nozzleY = rect.top + rect.height * 0.18;

  // Spray particles
  createSparkles(nozzleX, nozzleY, currentScentColor, 25, true);

  // Show scent info text
  const data = perfumeData[currentScent];
  scentStatus.innerHTML = data.text;

  setTimeout(() => {
    perfumeBottle.classList.remove('spraying');
  }, 300);
});

// ----------------------------------------------------
// CODER'S NIGHT DEBUGGER & GIT RELEASING
// ----------------------------------------------------
const btnRunCode = document.getElementById('btnRunCode');
const terminalConsole = document.getElementById('terminalConsole');
const bedtimeModal = document.getElementById('bedtimeModal');

let isDebugging = false;

const logScript = [
  { text: "> npm run fix-mood --force", class: "info", delay: 100 },
  { text: "⚙️ Linter status: 0 syntax issues found in friends-mind.", class: "dim", delay: 500 },
  { text: "📦 Resolving custom emotional dependencies...", class: "dim", delay: 700 },
  { text: "   [+] kopi-tuku@aren-sweet-sugar installed successfully.", class: "success", delay: 1000 },
  { text: "   [+] matcha-pure-kyoto@calmness activated.", class: "success", delay: 1200 },
  { text: "   [+] mykonos-aromatic-mist@999.9 active in airspace.", class: "success", delay: 1400 },
  { text: "🔧 Refactoring variable friend.mood: 'bad' -> 'happy'", class: "info", delay: 1800 },
  { text: "🚀 Bundling stress relief patches...", class: "dim", delay: 2100 },
  { text: "✨ Compiling bedtime container [====================] 100% in 1.2s", class: "success", delay: 2500 },
  { text: "✅ Success! Mood compiled perfectly. 0 errors. 0 warnings.", class: "success", delay: 2800 },
  { text: "🛌 Deploying sleep instructions... Initiating Bedtime UI.", class: "info", delay: 3100 }
];

btnRunCode.addEventListener('click', () => {
  if (isDebugging) return;
  isDebugging = true;

  terminalConsole.innerHTML = "";
  btnRunCode.innerText = "Running optimization... ⏳";
  btnRunCode.disabled = true;

  logScript.forEach(line => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.className = `console-line ${line.class || ""}`;
      p.innerText = line.text;
      terminalConsole.appendChild(p);

      // Auto scroll terminal
      terminalConsole.scrollTop = terminalConsole.scrollHeight;

      // Typing click sound
      playBeep(600 + Math.random() * 200, 'triangle', 0.04, 0.03);
    }, line.delay);
  });

  // Show bedtime dialog at the end
  setTimeout(() => {
    // Reveal Bedtime Modal
    bedtimeModal.classList.add('show');

    // Massive confetti explosion
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    createSparkles(centerX, centerY, '#fef08a', 40);
    createSparkles(centerX, centerY, '#a78bfa', 40);
    createSparkles(centerX, centerY, '#4ade80', 40);

    // Success chords beep
    playBeep(523.25, 'sine', 0.2, 0.1); // C5
    setTimeout(() => playBeep(659.25, 'sine', 0.2, 0.1), 100); // E5
    setTimeout(() => playBeep(783.99, 'sine', 0.2, 0.1), 200); // G5
    setTimeout(() => playBeep(1046.50, 'sine', 0.4, 0.1), 300); // C6

    btnRunCode.innerText = "Success! Compiled ✅";
    btnRunCode.disabled = false;
    isDebugging = false;
  }, 3600);
});

// ----------------------------------------------------
// BEDTIME MOTIVATION TAROT CARD GAME
// ----------------------------------------------------
const cardDeck = document.getElementById('cardDeck');
const flipCard = document.getElementById('flipCard');
const quoteText = document.getElementById('quoteText');
const btnDrawCard = document.getElementById('btnDrawCard');

const bedtimeQuotes = [
  "Code-mu mungkin error hari ini, tapi kamu tetap 'Successfully Compiled' di hati orang-orang terdekatmu. Istirahat dulu! 💻❤️",
  "Gapapa badmood hari ini, tapi pastiin besok uda  semangat yak!✨",
  "Katanya ultraman, tapi koo BADMOOD SEHARIAN?",
  "MALES AAAAHHHH! Padahal eca pengen pura2 ga liat kalau asya lagi badmood tapi gabisa!",
  "Apasie singkat2 gitu?",
  "Hidup itu emang kadang kidding, kadang koddong",
  "Hidup itu kayak Kopi Tuku: kadang pait, tapi kalau diracik dengan sabar dan ditambah pemanis (kayak kamu), rasanya pas banget. ☕😊",
  "Matcha Latte itu menenangkan karena ada L-theanine. Kamunya tenang ya malam ini, besok kita taklukkan dunia lagi! 🍵🌿",
  "Error di text editor bisa di-Ctrl+Z. Kesalahan hari ini biarin aja berlalu, besok adalah lembaran clean code yang baru. ✍️🛡️",
  "Ingat: StackOverflow aja punya jawaban untuk setiap bug. Masalah hidupmu pasti juga ada solusinya, tapi carinya besok pagi aja pas otak udah fresh! 💡🚀",
  "Tidur malam ini adalah proses 'Garbage Collection'. Hapus memori buruk hari ini, sisakan space untuk kebahagiaan besok pagi. 🗑️🧠",
  "Jangan paksa push code kalau kepala udah overload. Commit pekerjaanmu hari ini, rest, dan force-push semangatmu besok pagi! 💻💤",
  "Malam ini tugasmu cuman satu: shutdown laptop, colok charger hp, lalu pejamkan mata. Dunia bisa menunggu besok. 🌙🛌",
  "uda di buka belum botol emosinya? atau ga mempan?"
];

let lastQuoteIndex = -1;

function drawTarotCard() {
  // Sound effect of card sliding (quick slide pitch upward)
  try {
    initAudio();
    let now = audioCtx.currentTime;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.2);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) { }

  // If already flipped, flip back first
  const isFlipped = flipCard.classList.contains('flipped');
  let delay = 0;

  if (isFlipped) {
    flipCard.classList.remove('flipped');
    delay = 400; // Wait for flip back transition
  }

  setTimeout(() => {
    // Select new random quote
    let randomIdx;
    do {
      randomIdx = Math.floor(Math.random() * bedtimeQuotes.length);
    } while (randomIdx === lastQuoteIndex && bedtimeQuotes.length > 1);

    lastQuoteIndex = randomIdx;
    quoteText.innerHTML = bedtimeQuotes[randomIdx];

    // Add flip class to trigger 3D rotation
    flipCard.classList.add('flipped');

    // Emit sparkles around the display card area
    const rect = flipCard.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    createSparkles(centerX, centerY, '#a78bfa', 15);
  }, delay);
}

// Draw card when clicking on the deck or the draw button
cardDeck.addEventListener('click', drawTarotCard);
btnDrawCard.addEventListener('click', drawTarotCard);

// Allow manual flipping back by clicking the display card itself
flipCard.addEventListener('click', () => {
  flipCard.classList.toggle('flipped');
  playBeep(400, 'sine', 0.08, 0.05);
});

// ----------------------------------------------------
// BEDTIME MUSIC & CLOSE MODAL
// ----------------------------------------------------
const btnToggleMusic = document.getElementById('btnToggleMusic');
const btnCloseModal = document.getElementById('btnCloseModal');

btnToggleMusic.addEventListener('click', () => {
  if (!isMusicPlaying) {
    isMusicPlaying = true;
    btnToggleMusic.innerText = "⏸️ Matikan Lagu Pengantar Tidur (Lofi Synth)";
    btnToggleMusic.classList.add('active');
    playLofiLullaby();
  } else {
    isMusicPlaying = false;
    btnToggleMusic.innerText = "🔊 Nyalakan Lagu Pengantar Tidur (Lofi Synth)";
    btnToggleMusic.classList.remove('active');
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  }
});

btnCloseModal.addEventListener('click', () => {
  playBeep(400, 'sine', 0.15, 0.05);
  bedtimeModal.classList.remove('show');
});
