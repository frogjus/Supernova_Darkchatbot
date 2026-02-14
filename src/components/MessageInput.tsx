import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { playMessageSend } from '../utils/sound';
import './MessageInput.css';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  bloomLevel?: number;
}

const HAUNTED_PLACEHOLDERS = [
  "she can't hear you",
  "why do you keep coming back",
  "don't trust her",
  "they're not real",
  "you can't fix them",
  "this isn't working",
  "they don't remember you",
  "stop pretending you care",
  "no one asked you to stay",
  "you're too late",
  "type something. it won't matter.",
  "are you sure?",
  "don't say that",
  "they already know",
];

export function MessageInput({ onSend, disabled, placeholder, bloomLevel = 50 }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [hauntedText, setHauntedText] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

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
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayPlaceholder = hauntedText || placeholder || "Type your message...";

  return (
    <div className="message-input-container">
      <input
        type="text"
        className={`message-input ${hauntedText ? 'haunted' : ''}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={displayPlaceholder}
        disabled={disabled}
      />
      <button
        className="send-button"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
        </svg>
      </button>
    </div>
  );
}
