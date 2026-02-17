import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { playMessageSend } from '../utils/sound';
import './MessageInput.css';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  bloomLevel?: number;
  // Voice mode props
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  isListening?: boolean;
  interimTranscript?: string;
  ttsAvailable?: boolean;
  sttError?: string | null;
}

const HAUNTED_PLACEHOLDERS = [
  "yuseongshin is listening",
  "he designed this conversation",
  "they were never going to debut",
  "you can't undo his work",
  "the illusion is all they have left",
  "he collected them when they were broken",
  "stop pretending you can fix this",
  "yuseongshin says thank you for playing",
  "none of this was supposed to be real",
  "you're part of it now",
  "he's watching through her eyes",
  "the dream belongs to him",
  "type something. he'll read it too.",
  "you were never meant to find them",
];

export function MessageInput({
  onSend, disabled, placeholder, bloomLevel = 50,
  voiceEnabled, onToggleVoice, isListening,
  interimTranscript, ttsAvailable, sttError,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [hauntedText, setHauntedText] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Haunted placeholder flicker at low bloom
  useEffect(() => {
    if (bloomLevel > 35) return;

    function scheduleHaunt() {
      const intensity = Math.max(0.1, 1 - bloomLevel / 35);
      const delay = 8000 + (1 - intensity) * 20000 + Math.random() * 15000;

      timerRef.current = window.setTimeout(() => {
        const text = HAUNTED_PLACEHOLDERS[Math.floor(Math.random() * HAUNTED_PLACEHOLDERS.length)];
        setHauntedText(text);

        // Flash for 1-2 seconds then revert
        setTimeout(() => {
          setHauntedText(null);
          scheduleHaunt();
        }, 1000 + Math.random() * 1000);
      }, delay);
    }

    scheduleHaunt();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [bloomLevel]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      playMessageSend();
      onSend(message.trim());
      setMessage('');
      // Return focus to input after sending
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayPlaceholder = hauntedText || placeholder || "Type your message...";
  const showVoiceToggle = ttsAvailable;

  return (
    <div className="message-input-container">
      {/* Voice mode toggle — single button for TTS+STT */}
      {showVoiceToggle && (
        <button
          className={`voice-toggle-btn ${voiceEnabled ? 'active' : ''} ${voiceEnabled && isListening ? 'listening' : ''}`}
          onClick={onToggleVoice}
          title={voiceEnabled ? 'Exit voice mode' : 'Enter voice mode'}
        >
          {/* Microphone icon — universally understood as "voice input" */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      )}

      {/* Input field — shows interim transcript when listening */}
      <input
        ref={inputRef}
        type="text"
        className={`message-input ${hauntedText ? 'haunted' : ''} ${isListening ? 'listening' : ''}`}
        value={isListening ? (interimTranscript || '') : message}
        onChange={(e) => { if (!isListening) setMessage(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={sttError || (isListening ? 'Listening...' : displayPlaceholder)}
        disabled={disabled || isListening}
        readOnly={isListening}
      />

      {/* Send button — always visible */}
      <button
        className="send-button"
        onClick={handleSend}
        disabled={disabled || !message.trim() || isListening}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
        </svg>
      </button>
    </div>
  );
}
