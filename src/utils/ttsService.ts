// TTS Service — ElevenLabs streaming via /api/tts proxy
// Plays character voice through Web Audio graph for volume control + ducking.

import { getAudioContext, getMasterGain } from './sound';

// Voice IDs must match the allowlist in api/tts.ts
// Using eleven_v3 — most expressive model, best for emotional intonation
export const CHARACTER_VOICES: Record<string, string> = {
  miho: 'FGY2WhTYpPnrIDTdsKH5',      // Laura — Enthusiast, Quirky Attitude (young) → energetic ENFP fox spirit
  sohee: 'cgSgspJ2msm6clMCkdW9',      // Jessica — Playful, Bright, Warm (young) → gentle ISFJ
  sujin: 'BAdH0bMfq6VleQGLXj38',      // Tessa — Influencer Girl (young) → sharp ISTJ
  hyunju: 'lcMyyd2HUfFzxdCaC4Ta',      // Lucy — Fresh & Casual (young) → sensitive INFP
  yuseongshin: 'N2lVS1w4EtoT3dr4eOWO', // Callum — Husky Trickster → creepy manipulator
};

export interface TTSPlaybackHandle {
  promise: Promise<void>;
  stop: () => void;
  duck: (vol: number) => void;
  unduck: () => void;
}

let currentHandle: TTSPlaybackHandle | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentGain: GainNode | null = null;
let currentSource: MediaElementAudioSourceNode | null = null;

// Check if TTS is available (proxy exists and has a key)
export async function checkTTSAvailable(): Promise<boolean> {
  try {
    // Quick OPTIONS/POST check — if no key configured, we'll get a 500.
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '.', voiceId: CHARACTER_VOICES.miho }),
    });
    // 200 = working, 429 = rate limited but available, 400 = available
    return res.status !== 500;
  } catch {
    return false;
  }
}

// Strip action descriptions / stage directions so TTS only speaks dialogue
function cleanTextForSpeech(text: string): string {
  return text
    // Remove *action descriptions* and _action descriptions_
    .replace(/\*[^*]+\*/g, '')
    .replace(/_[^_]+_/g, '')
    // Remove (parenthetical descriptions)
    .replace(/\([^)]+\)/g, '')
    // Remove [bracketed descriptions]
    .replace(/\[[^\]]+\]/g, '')
    // Collapse multiple spaces/newlines
    .replace(/\s+/g, ' ')
    .trim();
}

// Voice settings shift with bloom — eleven_v3 model
// v3 stability: 0.0 = Creative (most emotional), 0.5 = Natural, 1.0 = Robust (steady)
function getVoiceSettings(bloomLevel: number) {
  const t = Math.max(0, Math.min(100, bloomLevel)) / 100; // 0..1

  // Low bloom → Creative (0.0): max emotional expression, sadness, wavering
  // Mid bloom → Natural (0.5): balanced
  // High bloom → Natural (0.5): still expressive but confident
  const stability = t < 0.4 ? 0.0 : 0.5;

  return {
    stability,
    similarity_boost: 0.8,
  };
}

export function speakText(text: string, characterId: string, bloomLevel = 50): TTSPlaybackHandle {
  // Stop any current playback
  stopCurrentPlayback();

  const voiceId = CHARACTER_VOICES[characterId];
  const cleaned = cleanTextForSpeech(text);
  if (!voiceId || !cleaned) {
    const noopHandle: TTSPlaybackHandle = {
      promise: Promise.resolve(),
      stop: () => {},
      duck: () => {},
      unduck: () => {},
    };
    return noopHandle;
  }

  let stopped = false;
  let resolvePromise: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  const audio = new Audio();
  currentAudio = audio;

  const handle: TTSPlaybackHandle = {
    promise,
    stop: () => {
      stopped = true;
      cleanup();
      resolvePromise();
    },
    duck: (vol: number) => {
      if (currentGain) {
        const ctx = getAudioContext();
        currentGain.gain.cancelScheduledValues(ctx.currentTime);
        currentGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.2);
      }
    },
    unduck: () => {
      if (currentGain) {
        const ctx = getAudioContext();
        currentGain.gain.cancelScheduledValues(ctx.currentTime);
        currentGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.3);
      }
    },
  };
  currentHandle = handle;

  function cleanup() {
    if (audio) {
      audio.pause();
      if (audio.src) URL.revokeObjectURL(audio.src);
      audio.removeAttribute('src');
    }
    if (currentSource) {
      try { currentSource.disconnect(); } catch {}
      currentSource = null;
    }
    if (currentGain) {
      try { currentGain.disconnect(); } catch {}
      currentGain = null;
    }
    if (currentHandle === handle) {
      currentHandle = null;
      currentAudio = null;
    }
  }

  // Fetch + play
  (async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanTextForSpeech(text).slice(0, 1000),
          voiceId,
          voiceSettings: getVoiceSettings(bloomLevel),
        }),
      });

      if (stopped) return;

      if (!res.ok) {
        cleanup();
        resolvePromise();
        return;
      }

      const blob = await res.blob();
      if (stopped) return;

      const url = URL.createObjectURL(blob);
      audio.src = url;
      audio.setAttribute('playsinline', '');

      // Connect through Web Audio for volume control
      const ctx = getAudioContext();
      const master = getMasterGain();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      // Yuseongshin gets distortion effects: bandpass + delay for hollow ghost voice
      if (characterId === 'yuseongshin') {
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 2;

        const delay = ctx.createDelay(0.1);
        delay.delayTime.value = 0.05;

        const feedback = ctx.createGain();
        feedback.gain.value = 0.3;

        const ghostGain = ctx.createGain();
        ghostGain.gain.value = 0.7;

        source.connect(bandpass);
        bandpass.connect(ghostGain);
        bandpass.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay); // feedback loop
        delay.connect(ghostGain);
        ghostGain.connect(gain);
      } else {
        source.connect(gain);
      }
      gain.connect(master);

      currentSource = source;
      currentGain = gain;

      audio.onended = () => {
        cleanup();
        resolvePromise();
      };

      audio.onerror = () => {
        cleanup();
        resolvePromise();
      };

      await audio.play();
    } catch {
      if (!stopped) {
        cleanup();
        resolvePromise();
      }
    }
  })();

  return handle;
}

export function stopCurrentPlayback(): void {
  if (currentHandle) {
    currentHandle.stop();
  }
}

export function duckCurrentPlayback(volume: number): void {
  if (currentHandle) {
    currentHandle.duck(volume);
  }
}

export function unduckCurrentPlayback(): void {
  if (currentHandle) {
    currentHandle.unduck();
  }
}

export function isPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

export function getCurrentHandle(): TTSPlaybackHandle | null {
  return currentHandle;
}

// Separate playback for Yuseongshin ghost voice — plays ALONGSIDE current audio, doesn't stop it
export function speakGhostVoice(text: string): Promise<void> {
  const voiceId = CHARACTER_VOICES.yuseongshin;
  const cleaned = cleanTextForSpeech(text);
  if (!voiceId || !cleaned) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const audio = new Audio();

    (async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleaned.slice(0, 1000),
            voiceId,
            voiceSettings: {
              stability: 0.0, // Creative — max eerie expression
              similarity_boost: 0.7,
            },
          }),
        });

        if (!res.ok) { resolve(); return; }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audio.src = url;
        audio.setAttribute('playsinline', '');

        // Ghost audio chain: bandpass + delay feedback for hollow echo
        const ctx = getAudioContext();
        const master = getMasterGain();
        const source = ctx.createMediaElementSource(audio);

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 2;

        const delay = ctx.createDelay(0.1);
        delay.delayTime.value = 0.05;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.3;

        const ghostGain = ctx.createGain();
        ghostGain.gain.value = 0.7;

        source.connect(bandpass);
        bandpass.connect(ghostGain);
        bandpass.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(ghostGain);
        ghostGain.connect(master);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          try { source.disconnect(); } catch {}
          try { ghostGain.disconnect(); } catch {}
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };

        await audio.play();
      } catch {
        resolve();
      }
    })();
  });
}
