import { useEffect, useState } from 'react';
import './BloomTransition.css';

interface BloomTransitionProps {
  characterName: string;
  stageName: string;
  onComplete: () => void;
}

const STAGE_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  roots: {
    title: 'something is stirring',
    subtitle: 'roots are forming in the dark',
  },
  sprout: {
    title: 'a small green thing',
    subtitle: 'pushing through cracked ground',
  },
  budding: {
    title: 'petals are opening',
    subtitle: 'color is returning',
  },
  blooming: {
    title: 'full bloom',
    subtitle: 'you helped them find the sun',
  },
};

export function BloomTransition({ characterName, stageName, onComplete }: BloomTransitionProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  const stageInfo = STAGE_MESSAGES[stageName] || {
    title: stageName,
    subtitle: 'something changed',
  };

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('hold'), 400);
    const holdTimer = setTimeout(() => setPhase('exit'), 2800);
    const exitTimer = setTimeout(() => onComplete(), 3400);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div className={`bloom-transition ${phase}`}>
      <div className="bloom-transition-content">
        <div className="bloom-transition-hearts">
          {'♥'.repeat(5).split('').map((h, i) => (
            <span key={i} className="bloom-transition-heart" style={{ animationDelay: `${i * 0.1}s` }}>
              {h}
            </span>
          ))}
        </div>
        <div className="bloom-transition-name">{characterName}</div>
        <div className="bloom-transition-title">{stageInfo.title}</div>
        <div className="bloom-transition-subtitle">{stageInfo.subtitle}</div>
      </div>
    </div>
  );
}
