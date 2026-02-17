// STT Service — Web Speech API wrapper
// Captures continuous utterances with interim results for live preview.
// Only works in Chrome (uses Google's speech servers).
// Requests mic permission via getUserMedia before starting recognition.

export interface STTResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

interface STTCallbacks {
  onResult: (result: STTResult) => void;
  onError: (error: string) => void;
  onEnd: () => void;
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

// Request mic permission explicitly — Chrome needs this before speech recognition works
let micPermissionGranted = false;
async function ensureMicPermission(): Promise<boolean> {
  if (micPermissionGranted) return true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately — we just needed the permission grant
    stream.getTracks().forEach(t => t.stop());
    micPermissionGranted = true;
    console.log('[STT] Mic permission granted');
    return true;
  } catch (e) {
    console.warn('[STT] Mic permission denied:', e);
    return false;
  }
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

  function startRecognition() {
    try {
      recognition = new Ctor();
    } catch (e) {
      console.error('[STT] Failed to create SpeechRecognition:', e);
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    // Let Chrome auto-detect language — avoids failures when Korean model unavailable
    // Chrome handles mixed Korean/English well with default lang
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[STT] Recognition started');
      listening = true;
    };

    recognition.onaudiostart = () => console.log('[STT] Audio capture started — mic is active');
    recognition.onspeechstart = () => console.log('[STT] Speech detected');
    recognition.onspeechend = () => console.log('[STT] Speech ended');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
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

      // Only show user-actionable errors
      if (error === 'not-allowed') {
        callbacks.onError('Mic access denied — check permissions');
      } else if (error === 'audio-capture') {
        callbacks.onError('No microphone found');
      }
      // All other errors (no-speech, network, service-not-available, aborted)
      // fail silently — voice mode still works for TTS
    };

    recognition.onend = () => {
      console.log('[STT] Recognition ended');
      listening = false;
      callbacks.onEnd();
    };

    try {
      recognition.start();
      console.log('[STT] start() called');
    } catch (e) {
      console.error('[STT] start() threw:', e);
      listening = false;
    }
  }

  function start() {
    if (listening) {
      console.log('[STT] Already listening, ignoring start()');
      return;
    }

    // Request mic permission first, then start recognition
    // getUserMedia triggers Chrome's permission prompt if not yet granted
    ensureMicPermission().then(granted => {
      if (granted) {
        startRecognition();
      } else {
        callbacks.onError('Mic access denied — check permissions');
      }
    });
  }

  function stop() {
    if (recognition) {
      try {
        recognition.stop();
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
