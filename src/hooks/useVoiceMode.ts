// Voice Mode Hook — manages TTS playback + STT recording state
// Persists voice preference in localStorage. Handles Yuseongshin interruptions.

import { useState, useCallback, useRef, useEffect } from 'react';
import { speakText, stopCurrentPlayback, checkTTSAvailable, duckCurrentPlayback, unduckCurrentPlayback, speakGhostVoice } from '../utils/ttsService';
import { createSTTService, type STTResult } from '../utils/sttService';
import { duckMusic, unduckMusic } from '../utils/sound';

const VOICE_STORAGE_KEY = 'supernova_voice_mode';
const INTERRUPTION_COOLDOWN = 2 * 60 * 1000; // 2 minutes

export function useVoiceMode() {
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem(VOICE_STORAGE_KEY) === 'true';
  });
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingCharacterId, setSpeakingCharacterId] = useState<string | null>(null);
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);

  const lastInterruptionRef = useRef(0);
  const sttServiceRef = useRef<ReturnType<typeof createSTTService> | null>(null);
  const onFinalTranscriptRef = useRef<((text: string) => void) | null>(null);

  // Check TTS availability on mount
  useEffect(() => {
    checkTTSAvailable().then(available => setTtsAvailable(available));
  }, []);

  // Initialize STT service
  useEffect(() => {
    const stt = createSTTService({
      onResult: (result: STTResult) => {
        if (result.isFinal) {
          setInterimTranscript('');
          // Auto-send on final result, but don't stop listening (continuous mode)
          if (result.transcript.trim() && onFinalTranscriptRef.current) {
            onFinalTranscriptRef.current(result.transcript.trim());
          }
        } else {
          setInterimTranscript(result.transcript);
        }
      },
      onError: (error: string) => {
        console.warn('[STT Error]', error);
        if (error) setSttError(error);
        setIsListening(false);
        setInterimTranscript('');
        if (error) setTimeout(() => setSttError(null), 2500);
      },
      onEnd: () => {
        // Recognition ended (user clicked stop or browser stopped it)
        setIsListening(false);
        setInterimTranscript('');
      },
    });
    setSttSupported(stt.isSupported);
    sttServiceRef.current = stt;
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      localStorage.setItem(VOICE_STORAGE_KEY, String(next));
      if (!next) {
        // Turning off: stop any playback
        stopCurrentPlayback();
        setIsSpeaking(false);
        setSpeakingCharacterId(null);
      }
      return next;
    });
  }, []);

  const startListening = useCallback(() => {
    if (sttServiceRef.current && sttServiceRef.current.isSupported) {
      setSttError(null);
      sttServiceRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (sttServiceRef.current) {
      sttServiceRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }
  }, []);

  // Track whether STT was active before TTS ducked it
  const sttWasListeningRef = useRef(false);

  const playCharacterVoice = useCallback(async (text: string, characterId: string, bloomLevel = 50) => {
    if (!voiceEnabled || !ttsAvailable) return;

    // Pause STT while character is speaking to prevent feedback loop
    if (sttServiceRef.current?.isListening()) {
      sttWasListeningRef.current = true;
      sttServiceRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }

    // Stop any current playback first
    stopCurrentPlayback();

    setIsSpeaking(true);
    setSpeakingCharacterId(characterId);

    const handle = speakText(text, characterId, bloomLevel);
    await handle.promise;

    setIsSpeaking(false);
    setSpeakingCharacterId(null);

    // Resume STT after character finishes speaking
    if (sttWasListeningRef.current) {
      sttWasListeningRef.current = false;
      // Small delay to let audio fully stop before reopening mic
      setTimeout(() => {
        if (sttServiceRef.current && voiceEnabled) {
          sttServiceRef.current.start();
          setIsListening(true);
        }
      }, 300);
    }
  }, [voiceEnabled, ttsAvailable]);

  const stopSpeaking = useCallback(() => {
    stopCurrentPlayback();
    setIsSpeaking(false);
    setSpeakingCharacterId(null);
  }, []);

  // Yuseongshin ghost voice interruption — plays OVER character speech, doesn't stop it
  const triggerInterruption = useCallback(async (text: string) => {
    if (!voiceEnabled || !ttsAvailable) return;

    const now = Date.now();
    if (now - lastInterruptionRef.current < INTERRUPTION_COOLDOWN) return;
    lastInterruptionRef.current = now;

    setIsInterrupting(true);

    // Duck character TTS to 15% and ambient music (don't stop them)
    duckCurrentPlayback(0.15);
    duckMusic(0.1, 200);

    // Play Yuseongshin ghost voice alongside current character speech
    await speakGhostVoice(text);

    // Unduck character TTS and music back to normal
    unduckCurrentPlayback();
    unduckMusic(500);

    setIsInterrupting(false);
  }, [voiceEnabled, ttsAvailable]);

  // Register callback for final STT transcript (called by parent to auto-send)
  const setOnFinalTranscript = useCallback((cb: (text: string) => void) => {
    onFinalTranscriptRef.current = cb;
  }, []);

  return {
    voiceEnabled,
    toggleVoice,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    sttSupported,
    isSpeaking,
    speakingCharacterId,
    playCharacterVoice,
    stopSpeaking,
    isInterrupting,
    triggerInterruption,
    ttsAvailable,
    sttError,
    setOnFinalTranscript,
  };
}
