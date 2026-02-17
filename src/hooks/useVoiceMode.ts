// Voice Mode Hook — manages TTS playback + STT recording state
// Single toggle: ON = TTS enabled, STT auto-starts, music ducks.
// OFF = everything stops, music returns. Handles Yuseongshin interruptions.
//
// ARCHITECTURE: toggleVoice ONLY handles STT + state. Music ducking lives
// in a useEffect watching voiceEnabled. This prevents AudioContext operations
// from competing with SpeechRecognition in the same user gesture context.

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
  const sttExplicitStopRef = useRef(false); // true when WE stop STT (vs. it ending on its own)
  const sttRestartCountRef = useRef(0);
  const sttRestartWindowRef = useRef(0);

  // Keep ref in sync
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Initialize STT service
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
        setIsListening(false);
        setInterimTranscript('');
        if (error) setTimeout(() => setSttError(null), 3000);
      },
      onEnd: () => {
        setIsListening(false);
        setInterimTranscript('');

        // Auto-restart: if voice mode is still ON and we didn't explicitly stop,
        // recognition may have died unexpectedly — restart it.
        if (voiceEnabledRef.current && !sttExplicitStopRef.current) {
          // Rate-limit: max 3 restarts in 10 seconds to prevent infinite loops
          const now = Date.now();
          if (now - sttRestartWindowRef.current > 10000) {
            sttRestartCountRef.current = 0;
            sttRestartWindowRef.current = now;
          }
          if (sttRestartCountRef.current < 3) {
            sttRestartCountRef.current++;
            console.log('[Voice] STT ended unexpectedly, auto-restarting...', sttRestartCountRef.current);
            setTimeout(() => {
              if (voiceEnabledRef.current && sttServiceRef.current) {
                sttServiceRef.current.start();
                setIsListening(true);
              }
            }, 300);
          } else {
            console.warn('[Voice] STT keeps dying, giving up auto-restart');
          }
        }
        sttExplicitStopRef.current = false;
      },
    });
    sttServiceRef.current = stt;

    return () => { stt.stop(); };
  }, []);

  // Track whether STT was active before TTS ducked it
  const sttWasListeningRef = useRef(false);

  // Music ducking — reacts to voiceEnabled state changes.
  // MUST NOT be in the click handler — AudioContext operations (getCtx, gain ramps)
  // can compete with SpeechRecognition for the user activation on macOS.
  useEffect(() => {
    if (voiceEnabled) {
      rampMusicTo(VOICE_MODE_MUSIC_LEVEL, 500);
    } else {
      rampMusicTo(1.0, 500);
    }
  }, [voiceEnabled]);

  // Disengage voice mode when browser tab loses focus or goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && voiceEnabledRef.current) {
        if (sttServiceRef.current) {
          sttExplicitStopRef.current = true;
          sttServiceRef.current.stop();
        }
        stopCurrentPlayback();
        rampMusicTo(1.0, 0);
        setVoiceEnabled(false);
        setIsListening(false);
        setInterimTranscript('');
        setIsSpeaking(false);
        setSpeakingCharacterId(null);
        sttWasListeningRef.current = false;
        localStorage.setItem(VOICE_STORAGE_KEY, 'false');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // toggleVoice: ONLY handles STT start/stop + React state.
  // No AudioContext, no rampMusicTo, no audio.play() — nothing that could
  // consume or compete with the user gesture that SpeechRecognition needs.
  const toggleVoice = useCallback(() => {
    const next = !voiceEnabledRef.current;

    if (next) {
      // Turning ON: start STT — this MUST be the main synchronous action
      if (sttServiceRef.current?.isSupported) {
        sttServiceRef.current.start();
        setIsListening(true);
      }
    } else {
      // Turning OFF: stop everything
      if (sttServiceRef.current) {
        sttExplicitStopRef.current = true;
        sttServiceRef.current.stop();
        setIsListening(false);
        setInterimTranscript('');
      }
      stopCurrentPlayback();
      setIsSpeaking(false);
      setSpeakingCharacterId(null);
      sttWasListeningRef.current = false;
    }

    // State update triggers the music ducking useEffect above
    setVoiceEnabled(next);
    localStorage.setItem(VOICE_STORAGE_KEY, String(next));
  }, []);

  const playCharacterVoice = useCallback(async (text: string, characterId: string, bloomLevel = 50) => {
    if (!voiceEnabledRef.current) return;

    // Pause STT while character is speaking to prevent feedback loop
    if (sttServiceRef.current?.isListening()) {
      sttWasListeningRef.current = true;
      sttExplicitStopRef.current = true;
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

    setIsSpeaking(false);
    setSpeakingCharacterId(null);

    // Resume STT after character finishes speaking
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

  const triggerInterruption = useCallback(async (text: string) => {
    if (!voiceEnabledRef.current) return;

    const now = Date.now();
    if (now - lastInterruptionRef.current < INTERRUPTION_COOLDOWN) return;
    lastInterruptionRef.current = now;

    setIsInterrupting(true);

    duckCurrentPlayback(0.15);
    duckMusic(INTERRUPTION_MUSIC_LEVEL, 200, true);

    await speakGhostVoice(text);

    unduckCurrentPlayback();
    unduckMusic(500);
    setTimeout(() => {
      if (voiceEnabledRef.current) {
        rampMusicTo(VOICE_MODE_MUSIC_LEVEL, 300);
      }
    }, 600);

    setIsInterrupting(false);
  }, []);

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
