// Voice Mode Hook — manages TTS playback + STT recording state
// Single toggle: ON = TTS enabled, STT auto-starts, music ducks.
// OFF = everything stops, music returns. Handles Yuseongshin interruptions.

import { useState, useCallback, useRef, useEffect } from 'react';
import { speakText, stopCurrentPlayback, duckCurrentPlayback, unduckCurrentPlayback, speakGhostVoice } from '../utils/ttsService';
import { createSTTService, type STTResult } from '../utils/sttService';
import { rampMusicTo, duckMusic, unduckMusic } from '../utils/sound';

const VOICE_STORAGE_KEY = 'supernova_voice_mode';
const INTERRUPTION_COOLDOWN = 2 * 60 * 1000; // 2 minutes
const VOICE_MODE_MUSIC_LEVEL = 0.35; // 35% volume when voice mode active
const INTERRUPTION_MUSIC_LEVEL = 0.10; // 10% during Yuseongshin interruption

export function useVoiceMode() {
  // Never auto-restore voice mode — always start OFF, require user gesture
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingCharacterId, setSpeakingCharacterId] = useState<string | null>(null);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);

  const lastInterruptionRef = useRef(0);
  const sttServiceRef = useRef<ReturnType<typeof createSTTService> | null>(null);
  const onFinalTranscriptRef = useRef<((text: string) => void) | null>(null);
  const voiceEnabledRef = useRef(voiceEnabled);

  // Keep ref in sync
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Initialize STT service
  // onEnd only fires on TRUE end (explicit stop or fatal error after max retries),
  // NOT on transient Chrome reconnections (handled by sttService auto-restart)
  useEffect(() => {
    const stt = createSTTService({
      onResult: (result: STTResult) => {
        if (result.isFinal) {
          setInterimTranscript('');
          if (result.transcript.trim() && onFinalTranscriptRef.current) {
            onFinalTranscriptRef.current(result.transcript.trim());
          }
        } else {
          setInterimTranscript(result.transcript);
        }
      },
      onError: (error: string) => {
        console.warn('[Voice] STT error:', error);
        if (error) setSttError(error);
        setInterimTranscript('');
        if (error) setTimeout(() => setSttError(null), 3000);
      },
      onEnd: () => {
        // STT truly ended — explicit stop() or gave up after max restarts
        setIsListening(false);
        setInterimTranscript('');
      },
    });
    sttServiceRef.current = stt;

    // Cleanup: stop STT on unmount so mic doesn't stay open
    return () => {
      stt.stop();
    };
  }, []);

  // Track whether STT was active before TTS ducked it
  const sttWasListeningRef = useRef(false);

  // Disengage voice mode when browser tab loses focus or goes to background
  // Privacy: mic should never stay open when user isn't looking at the app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && voiceEnabledRef.current) {
        // Full disengage — stop STT, stop TTS, reset ALL state
        if (sttServiceRef.current) {
          sttServiceRef.current.stop();
        }
        stopCurrentPlayback();
        // Don't ramp — sound.ts will suspend the AudioContext immediately.
        // Set gain directly so it's correct when context resumes.
        rampMusicTo(1.0, 0);
        setVoiceEnabled(false);
        setIsListening(false);
        setInterimTranscript('');
        setIsSpeaking(false);
        setSpeakingCharacterId(null);
        sttWasListeningRef.current = false; // Reset — prevents phantom STT resume
        localStorage.setItem(VOICE_STORAGE_KEY, 'false');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const toggleVoice = useCallback(() => {
    const next = !voiceEnabledRef.current;

    // STT start/stop MUST happen directly in the click handler (user gesture context)
    // NOT inside React's setVoiceEnabled updater which may run asynchronously
    if (next) {
      // Turning ON: start STT immediately (needs user gesture) + duck music
      if (sttServiceRef.current?.isSupported) {
        sttServiceRef.current.start();
        setIsListening(true);
      }
      rampMusicTo(VOICE_MODE_MUSIC_LEVEL, 500);
    } else {
      // Turning OFF: stop everything, restore music
      if (sttServiceRef.current) {
        sttServiceRef.current.stop();
        setIsListening(false);
        setInterimTranscript('');
      }
      stopCurrentPlayback();
      setIsSpeaking(false);
      setSpeakingCharacterId(null);
      sttWasListeningRef.current = false;
      rampMusicTo(1.0, 500);
    }

    setVoiceEnabled(next);
    localStorage.setItem(VOICE_STORAGE_KEY, String(next));
  }, []);

  const playCharacterVoice = useCallback(async (text: string, characterId: string, bloomLevel = 50) => {
    if (!voiceEnabledRef.current) return;

    // Pause STT while character is speaking to prevent feedback loop
    if (sttServiceRef.current?.isListening()) {
      sttWasListeningRef.current = true;
      sttServiceRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }

    stopCurrentPlayback();

    setIsSpeaking(true);
    setSpeakingCharacterId(characterId);

    try {
      const handle = speakText(text, characterId, bloomLevel);
      await handle.promise;
    } catch (e) {
      console.warn('[Voice] TTS playback failed:', e);
    }

    // Always reset speaking state, even on error
    setIsSpeaking(false);
    setSpeakingCharacterId(null);

    // Resume STT after character finishes speaking (or fails)
    if (sttWasListeningRef.current) {
      sttWasListeningRef.current = false;
      setTimeout(() => {
        if (sttServiceRef.current && voiceEnabledRef.current) {
          sttServiceRef.current.start();
          setIsListening(true);
        }
      }, 300);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    stopCurrentPlayback();
    setIsSpeaking(false);
    setSpeakingCharacterId(null);
  }, []);

  // Yuseongshin ghost voice interruption — plays OVER character speech
  // Ducks to INTERRUPTION_MUSIC_LEVEL, then returns to VOICE_MODE_MUSIC_LEVEL (not 1.0)
  const triggerInterruption = useCallback(async (text: string) => {
    if (!voiceEnabledRef.current) return;

    const now = Date.now();
    if (now - lastInterruptionRef.current < INTERRUPTION_COOLDOWN) return;
    lastInterruptionRef.current = now;

    setIsInterrupting(true);

    // Duck character TTS and music further
    duckCurrentPlayback(0.15);
    duckMusic(INTERRUPTION_MUSIC_LEVEL, 200, true); // force=true to override voice mode duck

    await speakGhostVoice(text);

    // Unduck character TTS, return music to voice mode level (not full)
    unduckCurrentPlayback();
    unduckMusic(500);
    // After unduck completes, ensure we're at voice mode level
    setTimeout(() => {
      if (voiceEnabledRef.current) {
        rampMusicTo(VOICE_MODE_MUSIC_LEVEL, 300);
      }
    }, 600);

    setIsInterrupting(false);
  }, []);

  // Register callback for final STT transcript
  const setOnFinalTranscript = useCallback((cb: (text: string) => void) => {
    onFinalTranscriptRef.current = cb;
  }, []);

  return {
    voiceEnabled,
    toggleVoice,
    isListening,
    interimTranscript,
    isSpeaking,
    speakingCharacterId,
    playCharacterVoice,
    stopSpeaking,
    isInterrupting,
    triggerInterruption,
    sttError,
    setOnFinalTranscript,
  };
}
