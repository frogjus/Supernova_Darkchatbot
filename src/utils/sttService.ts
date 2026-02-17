// STT Service — Web Speech API wrapper
// Captures continuous utterances with interim results for live preview.
// Chrome only (uses Google's speech servers). Auto-restarts on transient failures.
//
// CRITICAL: start() MUST be synchronous. Chrome requires recognition.start()
// to run in the same call stack as the user gesture (click/tap). Any async
// wrapper (.then, await, setTimeout) loses the gesture context and Chrome
// kills the recognition immediately.

export interface STTResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

interface STTCallbacks {
  onResult: (result: STTResult) => void;
  onError: (error: string) => void;
  onEnd: () => void;  // Only fires on TRUE end (explicit stop or fatal error)
}

export interface STTService {
  start: () => void;
  stop: () => void;
  isListening: () => boolean;
  isSupported: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionCtor(): any | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function createSTTService(callbacks: STTCallbacks): STTService {
  const Ctor = getSpeechRecognitionCtor();
  const supported = !!Ctor;

  console.log('[STT] SpeechRecognition supported:', supported);

  if (!supported) {
    return {
      start: () => callbacks.onError('Speech recognition not supported in this browser'),
      stop: () => {},
      isListening: () => false,
      isSupported: false,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null;
  let listening = false;

  // Auto-restart state — Chrome's recognition frequently dies mid-session
  let shouldBeListening = false;  // User intent: do they WANT to be listening?
  let restartCount = 0;
  let restartTimer: number | null = null;
  const MAX_RESTARTS = 10;       // Give up after this many consecutive failures
  const BASE_RESTART_DELAY = 250; // ms, increases with backoff

  function createRecognition() {
    try {
      recognition = new Ctor();
    } catch (e) {
      console.error('[STT] Failed to create SpeechRecognition:', e);
      return false;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    // Let Chrome auto-detect language — handles mixed Korean/English well
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Recognition started');
      listening = true;
    };

    recognition.onaudiostart = () => {
      console.log('[STT] Audio capture started — mic is active');
    };

    recognition.onspeechstart = () => {
      console.log('[STT] Speech detected');
      // Reset restart counter — we're successfully capturing speech
      restartCount = 0;
    };

    recognition.onspeechend = () => {
      console.log('[STT] Speech ended');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // Reset restart counter on any result (even interim)
      restartCount = 0;

      const resultIndex = event.resultIndex;
      for (let i = resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;
        const confidence = result[0].confidence || 0;
        console.log('[STT]', isFinal ? 'FINAL:' : 'interim:', `"${transcript}"`, `(${(confidence * 100).toFixed(0)}%)`);
        callbacks.onResult({ transcript, isFinal, confidence });
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      const error = event.error || 'unknown';
      console.warn('[STT] Error:', error, event.message || '');

      if (error === 'not-allowed') {
        // Fatal: user denied mic permission
        shouldBeListening = false;
        callbacks.onError('Mic access denied — check permissions');
      } else if (error === 'audio-capture') {
        // Fatal: no mic hardware
        shouldBeListening = false;
        callbacks.onError('No microphone found');
      }
      // All other errors (no-speech, network, service-not-available, aborted)
      // are transient — auto-restart will handle them via onend
    };

    recognition.onend = () => {
      console.log('[STT] Recognition ended, shouldBeListening:', shouldBeListening, 'restarts:', restartCount);
      listening = false;

      if (shouldBeListening && restartCount < MAX_RESTARTS) {
        // Transient end — auto-restart with backoff
        restartCount++;
        const delay = BASE_RESTART_DELAY * Math.min(restartCount, 4); // Cap at 1s
        console.log(`[STT] Auto-restarting in ${delay}ms (attempt ${restartCount}/${MAX_RESTARTS})`);

        restartTimer = window.setTimeout(() => {
          restartTimer = null;
          if (shouldBeListening) {
            startRecognition();
          }
        }, delay);
        // Don't call callbacks.onEnd() — STT is still "active" from user's perspective
      } else if (shouldBeListening && restartCount >= MAX_RESTARTS) {
        // Gave up — too many consecutive failures
        console.error('[STT] Max restarts reached, giving up');
        shouldBeListening = false;
        restartCount = 0;
        callbacks.onError('Voice input disconnected — tap mic to retry');
        callbacks.onEnd();
      } else {
        // Normal stop — user explicitly stopped
        restartCount = 0;
        callbacks.onEnd();
      }
    };

    return true;
  }

  function startRecognition() {
    if (!createRecognition()) return;

    try {
      recognition.start();
      console.log('[STT] start() called');
    } catch (e) {
      console.error('[STT] start() threw:', e);
      listening = false;

      // Retry if we should still be listening
      if (shouldBeListening && restartCount < MAX_RESTARTS) {
        restartCount++;
        const delay = BASE_RESTART_DELAY * Math.min(restartCount, 4);
        restartTimer = window.setTimeout(() => {
          restartTimer = null;
          if (shouldBeListening) startRecognition();
        }, delay);
      }
    }
  }

  // SYNCHRONOUS — must run in user gesture context (click/tap call stack).
  // Chrome kills recognition.start() if called from async callbacks.
  // SpeechRecognition handles its own mic permission prompt — no getUserMedia needed.
  function start() {
    if (shouldBeListening) {
      console.log('[STT] Already active, ignoring start()');
      return;
    }

    shouldBeListening = true;
    restartCount = 0;
    startRecognition(); // Direct, synchronous — in user gesture context
  }

  function stop() {
    console.log('[STT] stop() called');
    shouldBeListening = false;
    restartCount = 0;

    // Clear any pending restart
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }

    if (recognition) {
      try {
        // abort() is cleaner than stop() for explicit shutdown —
        // doesn't trigger onresult for partial matches
        recognition.abort();
      } catch {
        // ignore
      }
      listening = false;
    }
  }

  return {
    start,
    stop,
    isListening: () => listening,
    isSupported: true,
  };
}
