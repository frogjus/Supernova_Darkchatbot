// Sound engine — all synthesized via Web Audio API
// No asset files needed. Dreamy, glitchy, pixel-aesthetic sounds.

let audioCtx: AudioContext | null = null;
let isAmbientPlaying = false;
let musicLoopTimer: number | null = null;
let currentBloom = 50;
let masterGain: GainNode | null = null;
let isMuted = localStorage.getItem('supernova_muted') === 'true';

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMuted ? 0 : 1.0;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

// Resume audio context on first user interaction (browser autoplay policy)
export function initAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// Update bloom for music mood shifts
export function setMusicBloom(bloom: number) {
  currentBloom = bloom;
}

// Mute / unmute all audio
export function toggleMute(): boolean {
  isMuted = !isMuted;
  localStorage.setItem('supernova_muted', String(isMuted));
  if (masterGain) {
    masterGain.gain.value = isMuted ? 0 : 1.0;
  }
  return isMuted;
}

export function getMuted(): boolean {
  return isMuted;
}

// ---- 8-Bit Music Engine ----
// Haunted music box melody that loops forever, shifting darker at low bloom

// Note frequencies — extended range for sparkly high notes
const NOTE: Record<string, number> = {
  C3: 131, D3: 147, Eb3: 156, E3: 165, F3: 175, G3: 196, Ab3: 208, A3: 220, Bb3: 233, B3: 247,
  C4: 262, D4: 294, Eb4: 311, E4: 330, F4: 349, Fs4: 370, G4: 392, Ab4: 415, A4: 440, Bb4: 466, B4: 494,
  C5: 523, Db5: 554, D5: 587, Eb5: 622, E5: 659, F5: 698, Fs5: 740, G5: 784, Ab5: 831, A5: 880, Bb5: 932, B5: 988,
  C6: 1047, D6: 1175, Eb6: 1245, E6: 1319, F6: 1397, G6: 1568, A6: 1760,
  R: 0, // rest
};

// ♡ DREAM melody — princess music box, high and sparkling
// Key of F major / D minor — sweet, girly, like a magical girl transformation
const MELODY_DREAM: [string, number][] = [
  // phrase 1 — twinkling music box opening
  ['C6', 0.25], ['A5', 0.25], ['F5', 0.25], ['A5', 0.25], ['C6', 0.5], ['D6', 0.25], ['C6', 0.25],
  ['A5', 0.5], ['R', 0.25], ['G5', 0.25], ['A5', 0.5], ['F5', 0.5],
  ['G5', 0.25], ['A5', 0.25], ['C6', 0.25], ['A5', 0.25], ['G5', 0.5], ['F5', 0.25], ['E5', 0.25],
  ['F5', 0.75], ['R', 0.25], ['R', 0.5], ['C5', 0.5],
  // phrase 2 — hopeful sparkle rise
  ['F5', 0.25], ['A5', 0.25], ['C6', 0.5], ['D6', 0.25], ['C6', 0.25], ['A5', 0.5],
  ['Bb5', 0.5], ['A5', 0.25], ['G5', 0.25], ['A5', 0.5], ['C6', 0.5],
  ['D6', 0.25], ['C6', 0.25], ['A5', 0.25], ['F5', 0.25], ['G5', 0.5], ['A5', 0.25], ['G5', 0.25],
  ['F5', 1.0], ['R', 0.5], ['R', 0.5],
];

// ♠ DARK melody — broken ballerina music box, eerie but still girly
// Same register but minor key, slower, with pauses like the mechanism is failing
const MELODY_DARK: [string, number][] = [
  // phrase 1 — haunted music box, winding down
  ['C6', 0.5], ['Ab5', 0.25], ['R', 0.25], ['F5', 0.25], ['Ab5', 0.25], ['C6', 0.75], ['R', 0.25],
  ['Bb5', 0.5], ['Ab5', 0.5], ['R', 0.25], ['G5', 0.25], ['Ab5', 0.5],
  ['F5', 0.25], ['R', 0.25], ['Ab5', 0.25], ['G5', 0.25], ['F5', 0.5], ['Eb5', 0.5],
  ['F5', 1.0], ['R', 0.75], ['C5', 0.25],
  // phrase 2 — the box slows, notes linger
  ['Eb5', 0.5], ['F5', 0.25], ['Ab5', 0.75], ['R', 0.5], ['G5', 0.25], ['F5', 0.25],
  ['Eb5', 0.5], ['R', 0.25], ['Db5', 0.25], ['C5', 0.5], ['R', 0.5],
  ['Ab5', 0.25], ['R', 0.25], ['G5', 0.25], ['F5', 0.25], ['Eb5', 0.5], ['Db5', 0.25], ['C5', 0.25],
  ['C5', 1.25], ['R', 0.75],
];

// Light tinkling arpeggios — like sparkle dust falling
const SPARKLE_DREAM: [string, number][] = [
  ['C6', 0.25], ['R', 0.75], ['A5', 0.25], ['R', 0.75],
  ['F6', 0.25], ['R', 0.75], ['D6', 0.25], ['R', 0.75],
  ['E6', 0.25], ['R', 0.75], ['C6', 0.25], ['R', 0.75],
  ['A5', 0.25], ['R', 0.75], ['F5', 0.25], ['R', 1.75],
];

const SPARKLE_DARK: [string, number][] = [
  ['Ab5', 0.25], ['R', 1.25], ['R', 0.5],
  ['Eb6', 0.25], ['R', 1.25], ['R', 0.5],
  ['C6', 0.25], ['R', 1.75],
  ['Ab5', 0.25], ['R', 1.25], ['R', 0.5],
  ['F5', 0.25], ['R', 1.75],
];

// Bass — gentle, pillowy, not heavy
const BASS_DREAM: [string, number][] = [
  ['F3', 0.5], ['R', 0.5], ['C4', 0.5], ['R', 0.5], ['F3', 0.5], ['R', 0.5], ['A3', 0.5], ['R', 0.5],
  ['Bb3', 0.5], ['R', 0.5], ['F3', 0.5], ['R', 0.5], ['C4', 0.5], ['R', 0.5], ['G3', 0.5], ['R', 0.5],
  ['F3', 0.5], ['R', 0.5], ['A3', 0.5], ['R', 0.5], ['Bb3', 0.5], ['R', 0.5], ['C4', 0.5], ['R', 0.5],
  ['F3', 1.0], ['R', 0.5], ['C4', 0.5], ['F3', 1.0],
];

const BASS_DARK: [string, number][] = [
  ['F3', 0.75], ['R', 0.75], ['Ab3', 0.75], ['R', 0.75],
  ['Eb3', 0.75], ['R', 0.75], ['Ab3', 0.75], ['R', 0.75],
  ['F3', 0.75], ['R', 0.75], ['C3', 0.75], ['R', 0.75],
  ['Ab3', 0.75], ['R', 0.75], ['F3', 1.5],
];

// Tempo — dream is delicate waltz-like, dark is slower music-box winding down
const BEAT_DREAM = 0.32;  // ~188 BPM, light and twinkling
const BEAT_DARK = 0.44;   // ~136 BPM, slower, hesitant

function playNote(
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType,
  volume: number,
  detune = 0,
) {
  if (freq === 0) return; // rest
  const ctx = getCtx();
  const master = getMaster();

  // Main tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  // Music-box / celesta envelope — sharp pluck, gentle ring-out
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(volume * 0.3, startTime + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(master);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);

  // Harmonic shimmer — a quiet octave-above sine for bell sparkle
  if (type === 'sine' || type === 'triangle') {
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.value = freq * 2;
    shimmer.detune.value = detune + 3;
    shimmerGain.gain.setValueAtTime(0, startTime);
    shimmerGain.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.005);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(startTime);
    shimmer.stop(startTime + duration + 0.05);
  }
}

function scheduleSequence(
  notes: [string, number][],
  startTime: number,
  beatLen: number,
  type: OscillatorType,
  volume: number,
  detune = 0,
): number {
  let t = startTime;
  for (const [noteName, beats] of notes) {
    const dur = beats * beatLen;
    const freq = NOTE[noteName] || 0;
    if (freq > 0) {
      playNote(freq, dur * 0.9, t, type, volume, detune);
    }
    t += dur;
  }
  return t; // return end time
}

function playMusicLoop() {
  const ctx = getCtx();
  const now = ctx.currentTime + 0.1;
  const isDark = currentBloom <= 35;

  const melody = isDark ? MELODY_DARK : MELODY_DREAM;
  const sparkle = isDark ? SPARKLE_DARK : SPARKLE_DREAM;
  const bass = isDark ? BASS_DARK : BASS_DREAM;
  const beat = isDark ? BEAT_DARK : BEAT_DREAM;

  // Melody — triangle wave for soft music-box tone
  const melodyVol = isDark ? 0.022 : 0.028;
  const melodyDetune = isDark ? 12 : 0; // detuned = broken music box
  const endTime = scheduleSequence(melody, now, beat, 'triangle', melodyVol, melodyDetune);

  // Ghost echo — a quiet sine duplicate, slightly delayed, for dreamy depth
  scheduleSequence(melody, now + 0.03, beat, 'sine', melodyVol * 0.3, isDark ? -8 : 5);

  // Sparkle layer — high tinkling notes like fairy dust
  scheduleSequence(sparkle, now, beat, 'sine', isDark ? 0.012 : 0.018, isDark ? 6 : 0);

  // Bass — soft sine, like a heartbeat underneath the music box
  const bassVol = isDark ? 0.02 : 0.018;
  scheduleSequence(bass, now, beat, 'sine', bassVol);

  // Pad drone — warm, enveloping, like being inside a snow globe
  const droneFreq = isDark ? NOTE.Ab3 : NOTE.F3;
  const master = getMaster();
  const loopDuration = endTime - now;

  const drone = ctx.createOscillator();
  const drone2 = ctx.createOscillator();
  const droneGain = ctx.createGain();
  const droneFilter = ctx.createBiquadFilter();
  drone.type = 'sine';
  drone.frequency.value = droneFreq;
  drone2.type = 'sine';
  drone2.frequency.value = droneFreq * (isDark ? 1.003 : 1.001); // subtle beating
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = isDark ? 150 : 250;
  droneGain.gain.value = isDark ? 0.018 : 0.012;
  drone.connect(droneFilter);
  drone2.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(master);
  drone.start(now);
  drone2.start(now);
  drone.stop(now + loopDuration);
  drone2.stop(now + loopDuration);

  // Schedule the next loop
  const msUntilNext = loopDuration * 1000 - 100; // slight overlap for seamless loop
  musicLoopTimer = window.setTimeout(playMusicLoop, msUntilNext);
}

export function startAmbient() {
  if (isAmbientPlaying) return;
  getCtx(); // ensure context
  isAmbientPlaying = true;
  playMusicLoop();
}

export function stopAmbient() {
  if (musicLoopTimer) {
    clearTimeout(musicLoopTimer);
    musicLoopTimer = null;
  }
  isAmbientPlaying = false;
}

// ---- Message Send Click ----
// Short, soft pixel click
export function playMessageSend() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.value = 800;
  gain.gain.value = 0.06;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

// ---- Message Receive ----
// Soft two-tone chime (like a notification)
export function playMessageReceive() {
  const ctx = getCtx();

  const playTone = (freq: number, delay: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.15);
  };

  playTone(660, 0);    // E5
  playTone(880, 0.08); // A5
}

// ---- Glitch Sound ----
// Harsh, distorted burst — like corrupted data
export function playGlitch() {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Fill with filtered noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 5;
  gain.gain.value = 0.08;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

// ---- Bloom Up Sound ----
// Ascending sparkle — hope
export function playBloomUp() {
  const ctx = getCtx();
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0;
    const start = ctx.currentTime + i * 0.08;
    gain.gain.linearRampToValueAtTime(0.04, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}

// ---- Bloom Down Sound ----
// Descending minor — dread
export function playBloomDown() {
  const ctx = getCtx();
  const notes = [440, 370, 311, 262]; // A4, F#4, Eb4, C4

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0;
    const start = ctx.currentTime + i * 0.1;
    gain.gain.linearRampToValueAtTime(0.04, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });
}

// ---- Channel Switch ----
// Soft tab click
export function playTabSwitch() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.value = 600;
  gain.gain.value = 0.03;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}
