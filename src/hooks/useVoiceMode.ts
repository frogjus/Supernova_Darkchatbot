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
import { rampMusicTo, duckMusic, unduckMusic, setSTTActive } from '../utils/sound';

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
  const isSpeakingRef = useRef(false); // true during TTS playback — blocks STT auto-restart
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
        // Any result = recognition is healthy — reset restart counter
        sttRestartCountRef.current = 0;

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
        // Note: recognition.start() from setTimeout works without user gesture
        // as long as mic permission was already granted (from the initial start).
        if (voiceEnabledRef.current && !sttExplicitStopRef.current && !isSpeakingRef.current) {
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
                setSTTActive(true);
                sttServiceRef.current.start();
                setIsListening(true);
              }
            }, 300);
          } else {
            console.warn('[Voice] STT keeps dying, giving up auto-restart');
            setSTTActive(false);
          }
        } else {
          setSTTActive(false);
        }
        sttExplicitStopRef.current = false;
      },
    });
    sttServiceRef.current = stt;

    return () => { stt.stop(); };
  }, []);

  // Track whether STT was active before TTS ducked it
  const sttWasListeningRef = useRef(false);

  // NOTE: Music ducking is handled DIRECTLY in toggleVoice (instant, 0ms) — NOT
  // in a useEffect. On Chrome macOS, a linearRampToValueAtTime gain ramp causes
  // ongoing AudioContext processing that shares the audio HAL with the mic input,
  // killing SpeechRecognition. An instant setValueAtTime avoids this entirely.

  // Disengage voice mode when browser tab loses focus or goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && voiceEnabledRef.current) {
        voiceEnabledRef.current = false;
        setSTTActive(false);
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

  // toggleVoice: start/stop voice mode.
  //
  // CRITICAL: On Chrome macOS, SpeechRecognition and AudioContext share the same
  // audio HAL. Any ongoing gain ramp (linearRampToValueAtTime) on the AudioContext
  // causes the audio pipeline to reset, killing SpeechRecognition. Solution:
  // 1. Use instant (0ms) volume changes — setValueAtTime, not linearRamp
  // 2. Do music duck AFTER stt.start() (instant ops don't interfere)
  // 3. setSTTActive suppresses the global unlockAudio() click handler
  const toggleVoice = useCallback(() => {
    const next = !voiceEnabledRef.current;

    if (next) {
      // Turning ON
      voiceEnabledRef.current = true;
      setSTTActive(true);

      // 1. Start STT — needs user activation token
      if (sttServiceRef.current?.isSupported) {
        sttServiceRef.current.start();
      }

      // 2. Duck music INSTANTLY (0ms = setValueAtTime, no ongoing ramp)
      //    Safe after stt.start() because instant ops don't cause HAL resets
      rampMusicTo(VOICE_MODE_MUSIC_LEVEL, 0);

      // 3. State updates can happen immediately now — the useEffect that was
      //    causing the dangerous gain ramp has been removed
      setIsListening(true);
      setVoiceEnabled(true);
      localStorage.setItem(VOICE_STORAGE_KEY, 'true');
    } else {
      // Turning OFF
      voiceEnabledRef.current = false;
      setSTTActive(false);

      if (sttServiceRef.current) {
        sttExplicitStopRef.current = true;
        sttServiceRef.current.stop();
      }
      stopCurrentPlayback();

      // Smooth restore is safe — STT is already stopped, no HAL conflict
      rampMusicTo(1.0, 500);

      setVoiceEnabled(false);
      setIsListening(false);
      setInterimTranscript('');
      setIsSpeaking(false);
      setSpeakingCharacterId(null);
      sttWasListeningRef.current = false;
      localStorage.setItem(VOICE_STORAGE_KEY, 'false');
    }
  }, []);

  const playCharacterVoice = useCallback(async (text: string, characterId: string, bloomLevel = 50) => {
    if (!voiceEnabledRef.current) return;

    // Pause STT while character is speaking to prevent feedback loop.
    // isSpeakingRef blocks auto-restart from re-enabling the mic during TTS.
    if (sttServiceRef.current?.isListening()) {
      sttWasListeningRef.current = true;
      sttExplicitStopRef.current = true;
      setSTTActive(false);
      sttServiceRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }

    stopCurrentPlayback();

    isSpeakingRef.current = true;
    setIsSpeaking(true);
    setSpeakingCharacterId(characterId);

    try {
      const handle = speakText(text, characterId, bloomLevel);
      await handle.promise;
    } catch (e) {
      console.warn('[Voice] TTS playback failed:', e);
    }

    isSpeakingRef.current = false;
    setIsSpeaking(false);
    setSpeakingCharacterId(null);

    // Resume STT after character finishes speaking.
    // 600ms delay ensures the audio pipeline fully flushes — prevents the mic
    // from picking up residual TTS audio and creating a feedback loop.
    if (sttWasListeningRef.current) {
      sttWasListeningRef.current = false;
      setTimeout(() => {
        if (sttServiceRef.current && voiceEnabledRef.current && !isSpeakingRef.current) {
          setSTTActive(true);
          sttServiceRef.current.start();
          setIsListening(true);
        }
      }, 600);
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
