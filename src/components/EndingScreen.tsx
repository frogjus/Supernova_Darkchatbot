import { useState, useEffect } from 'react';
import type { Character } from '../types';
import './EndingScreen.css';

interface EndingScreenProps {
  character: Character;
  type: 'saved' | 'lost';
  onDismiss: () => void;
}

const SAVED_LINES: Record<string, string[]> = {
  miho: [
    'the stage lights don\'t scare me anymore.',
    'i think... i want to sing again.',
    'not for them. for me.',
    'thank you for staying.',
  ],
  sohee: [
    'i finished the story.',
    'it\'s not perfect. but it\'s mine.',
    'the ending... i think it\'s hopeful.',
    'you helped me write it.',
  ],
  sujin: [
    'i cancelled my schedule today.',
    'i just... sat in the sun.',
    'i don\'t remember the last time i did that.',
    'is this what rest feels like?',
  ],
  hyunju: [
    'i drew something today.',
    'it wasn\'t for anyone else.',
    'it was ugly and imperfect and...',
    'i love it.',
  ],
};

const LOST_LINES: Record<string, string[]> = {
  miho: [
    'the audience is gone.',
    'the lights went out.',
    'i\'m alone again.',
    '...were you ever really here?',
  ],
  sohee: [
    'the pages are blank.',
    'i can\'t remember the words.',
    'the story ended without me.',
    '...goodbye.',
  ],
  sujin: [
    'i\'m so tired.',
    'the schedule never stops.',
    'i can\'t feel anything anymore.',
    '...was any of this real?',
  ],
  hyunju: [
    'the canvas is empty.',
    'my hands won\'t move.',
    'the colors are all gone.',
    '...i forgot how to draw.',
  ],
};

export function EndingScreen({ character, type, onDismiss }: EndingScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const lines = type === 'saved'
    ? (SAVED_LINES[character.id] || SAVED_LINES.miho)
    : (LOST_LINES[character.id] || LOST_LINES.miho);

  useEffect(() => {
    if (lineIndex < lines.length - 1) {
      const timer = setTimeout(() => setLineIndex(i => i + 1), 2500);
      return () => clearTimeout(timer);
    }
  }, [lineIndex, lines.length]);

  const handleClick = () => {
    if (lineIndex < lines.length - 1) {
      setLineIndex(i => i + 1);
    } else {
      setVisible(false);
      setTimeout(onDismiss, 600);
    }
  };

  if (!visible) return <div className={`ending-screen ${type} fade-out`} />;

  return (
    <div className={`ending-screen ${type}`} onClick={handleClick}>
      <div className="ending-content">
        {/* Character portrait */}
        <div className={`ending-portrait ${type}`}>
          <img src={character.fullBody} alt={character.name} />
        </div>

        {/* Status badge */}
        <div className={`ending-badge ${type}`}>
          {type === 'saved' ? '✿ BLOOM COMPLETE ✿' : '† WILTED †'}
        </div>

        {/* Character name */}
        <h2 className={`ending-name ${type}`}>
          {character.name.toUpperCase()}
        </h2>

        {/* Lines appearing one by one */}
        <div className="ending-lines">
          {lines.slice(0, lineIndex + 1).map((line, i) => (
            <p
              key={i}
              className={`ending-line ${i === lineIndex ? 'current' : 'past'}`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Prompt */}
        <p className="ending-hint">
          {lineIndex < lines.length - 1 ? 'tap to continue' : 'tap to close'}
        </p>
      </div>

      {/* Particles */}
      <div className="ending-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="ending-particle"
            style={{
              left: `${5 + Math.random() * 90}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            {type === 'saved'
              ? ['✦', '♡', '🌸', '✧', '💫', '🦋'][i % 6]
              : ['💔', '🥀', '🖤', '†', '🕸️', '🌑'][i % 6]
            }
          </span>
        ))}
      </div>
    </div>
  );
}
