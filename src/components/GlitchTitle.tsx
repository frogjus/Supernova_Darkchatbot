import { useState, useEffect, useRef } from 'react';
import './GlitchTitle.css';

interface GlitchTitleProps {
  /** Normal display text, e.g. "miho_chat.exe" */
  text: string;
  /** 0-100 bloom level. Glitches only below 30. */
  bloomLevel: number;
  className?: string;
}

// Distress messages that flash for a single frame
const GLITCH_TEXTS: Record<string, string[]> = {
  miho: ['dont_leave.exe', 'please_stay.exe', 'am_i_enough.exe', 'everyone_leaves.exe'],
  sohee: ['its_my_fault.exe', 'i_deserve_this.exe', 'dont_look.exe', 'im_nothing.exe'],
  sujin: ['im_sorry.exe', 'let_me_help.exe', 'dont_hate_me.exe', 'i_cant_stop.exe'],
  hyunju: ['am_i_good.exe', 'try_harder.exe', 'smile_more.exe', 'not_enough.exe'],
};

const GENERIC_GLITCHES = ['help_me.exe', 'save_me.exe', 'im_scared.exe', 'dont_go.exe'];

export function GlitchTitle({ text, bloomLevel, className }: GlitchTitleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  useEffect(() => {
    // No glitching above bloom 30
    if (bloomLevel > 30) {
      setDisplayText(text);
      setIsGlitching(false);
      return;
    }

    // Glitch frequency scales with how low bloom is
    // bloom 0: every 4-8s, bloom 30: every 15-25s
    const intensity = 1 - bloomLevel / 30;
    const minInterval = 4000 + (1 - intensity) * 11000;
    const maxInterval = 8000 + (1 - intensity) * 17000;

    const scheduleGlitch = () => {
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      timerRef.current = window.setTimeout(() => {
        // Extract character id from text (e.g. "miho_chat.exe" → "miho")
        const charId = text.split('_')[0];
        const charGlitches = GLITCH_TEXTS[charId] || GENERIC_GLITCHES;
        const allGlitches = [...charGlitches, ...GENERIC_GLITCHES];
        const glitchText = allGlitches[Math.floor(Math.random() * allGlitches.length)];

        // Flash the distress text for 150-300ms
        setDisplayText(glitchText);
        setIsGlitching(true);

        const flashDuration = 150 + Math.random() * 150;
        window.setTimeout(() => {
          setDisplayText(text);
          setIsGlitching(false);
          scheduleGlitch();
        }, flashDuration);
      }, interval);
    };

    scheduleGlitch();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, bloomLevel]);

  return (
    <span className={`glitch-title ${isGlitching ? 'glitching' : ''} ${className || ''}`}>
      {displayText}
    </span>
  );
}
