// STT Service — Web Speech API wrapper
// Captures single utterances with interim results for live preview.
// Only works in Chrome (uses Google's speech servers).

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

  function start() {
    if (listening) {
      console.log('[STT] Already listening, ignoring start()');
      return;
    }

    try {
      recognition = new Ctor();
    } catch (e) {
      console.error('[STT] Failed to create SpeechRecognition:', e);
      callbacks.onError('Voice input not available');
      return;
    }

    recognition.continuous = true; // keep listening until stopped
    recognition.interimResults = true;
    // Korean-first since this is a Korean game — Chrome handles mixed Korean/English well in this mode
    recognition.lang = 'ko';
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
      // Get the latest result
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

      const friendlyErrors: Record<string, string> = {
        'no-speech': "Couldn't hear you — try again",
        'not-allowed': 'Mic access denied — check browser permissions',
        'network': 'Voice service unavailable — are you online?',
        'aborted': '',
        'audio-capture': 'No microphone found',
        'service-not-available': 'Voice service unavailable',
        'language-not-supported': 'Language not supported',
      };

      const msg = friendlyErrors[error] ?? `Voice input failed (${error})`;
      if (msg) callbacks.onError(msg);
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
      callbacks.onError('Failed to start voice input');
    }
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
