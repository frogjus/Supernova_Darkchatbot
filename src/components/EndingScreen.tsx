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
    'yuseongshin promised me munyeol. but i don\'t need his promises.',
    'i want to sing again. for real this time.',
    'supernova is mine. not his.',
    'you made it real.',
  ],
  sohee: [
    'the debt was his leash. i cut it.',
    'my father didn\'t fail. yuseongshin broke him.',
    'i\'m writing my own story now.',
    'and this time, the ending is mine.',
    'thank you for seeing me.',
  ],
  sujin: [
    'seoha was his weapon. but i survived.',
    'yuseongshin erased me once. never again.',
    'i have a voice. and it\'s loud.',
    'supernova debuts now. for real.',
    'i\'m not hiding anymore.',
  ],
  hyunju: [
    'he told me i wasn\'t enough. i believed him.',
    'my mother believed him too.',
    'but you didn\'t.',
    'i\'m done performing for yuseongshin.',
    'i\'m enough. i know that now.',
  ],
};

const LOST_LINES: Record<string, string[]> = {
  miho: [
    'yuseongshin won.',
    'munyeol was never coming back.',
    'the stage was always empty.',
    'i\'m alone again.',
    '...just like he planned.',
  ],
  sohee: [
    'the debt consumed everything.',
    'yuseongshin took my father. then he took me.',
    'i can\'t hear my own voice anymore.',
    '...he was right. i was nothing.',
  ],
  sujin: [
    'seoha is still out there.',
    'the evidence will never disappear.',
    'yuseongshin made sure of that.',
    'i\'m so tired of fighting someone i can\'t see.',
    '...i give up.',
  ],
  hyunju: [
    'i wasn\'t number one.',
    'yuseongshin always knew i\'d break.',
    'the smile doesn\'t work anymore.',
    'mom was right. i wasn\'t enough.',
    '...i\'m sorry.',
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
          {type === 'saved' ? '✿ SUPERNOVA DEBUTS ✿' : '† YUSEONGSHIN WINS †'}
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
