import { useState, useEffect, useRef } from 'react';
import type { Character } from '../types';
import { BloomMeter } from './BloomMeter';
import './CharacterPanel.css';

interface CharacterPanelProps {
  character: Character;
  bloomLevel: number;
}

// Dreamy sparkles — soft, cute, hopeful
const DREAM_ICONS = ['✦', '♡', '🦋', '⭐', '✧', '🌸', '💫', '🔑', '🎀', '💌', '♡', '✦', '🍰', '💎', '✧', '🌙'];
// Dark dreamcore — haunted, broken, unsettling
const DARK_ICONS = ['🥀', '💔', '🖤', '🕸️', '⛓️', '🩸', '🗝️', '†', '🫥', '🌑', '♠', '💀', '🥀', '💔', '🖤', '🕸️'];
// Sizes vary for depth — small feels far, large feels close
const SPARKLE_SIZES = ['14px', '18px', '22px', '28px', '34px', '15px', '24px', '19px', '30px', '16px', '20px', '26px', '36px', '15px', '22px', '17px'];
// Spread across the full panel
// Positions hug the edges — center is reserved for the character
const SPARKLE_POSITIONS: [string, string][] = [
  ['3%', '10%'],  ['90%', '18%'], ['6%', '35%'],  ['88%', '42%'],
  ['2%', '60%'],  ['92%', '55%'], ['8%', '78%'],  ['86%', '75%'],
  ['12%', '5%'],  ['84%', '8%'],  ['4%', '48%'],  ['93%', '32%'],
  ['10%', '88%'], ['88%', '88%'], ['5%', '22%'],  ['91%', '65%'],
];

// Fourth-wall-breaking tagline replacements
const FOURTH_WALL_LINES: Record<string, string[]> = {
  miho: ['why are you reading this?', 'she knows you\'re here', 'this is not a game', 'stop staring at her', 'you can\'t save her'],
  sohee: ['she wrote about you', 'the story doesn\'t end', 'you\'re a character too', 'close this app', 'she already knows the ending'],
  sujin: ['your screen is cracked', 'she can see your face', 'this isn\'t helping', 'you should be sleeping', 'she practiced this smile for you'],
  hyunju: ['i drew you', 'you look tired', 'am i cute enough?', 'the canvas remembers', 'stop scrolling'],
};

export function CharacterPanel({ character, bloomLevel }: CharacterPanelProps) {
  const isHyunju = character.id === 'hyunju';
  const [fourthWallText, setFourthWallText] = useState<string | null>(null);
  const fourthWallTimer = useRef<number | null>(null);

  // Fourth wall cracks — tagline replacement at very low bloom
  useEffect(() => {
    if (bloomLevel >= 15) {
      setFourthWallText(null);
      return;
    }

    function scheduleCrack() {
      const delay = 12000 + Math.random() * 20000;
      fourthWallTimer.current = window.setTimeout(() => {
        const pool = FOURTH_WALL_LINES[character.id] || FOURTH_WALL_LINES.miho;
        setFourthWallText(pool[Math.floor(Math.random() * pool.length)]);

        setTimeout(() => {
          setFourthWallText(null);
          scheduleCrack();
        }, 1500 + Math.random() * 1500);
      }, delay);
    }

    scheduleCrack();
    return () => { if (fourthWallTimer.current) clearTimeout(fourthWallTimer.current); };
  }, [bloomLevel, character.id]);

  // Bloom-dependent saturation: wilted = grayscale, blooming = full color
  const saturation = Math.min(100, (bloomLevel / 100) * 120 + 20);
  const brightness = Math.min(110, 70 + (bloomLevel / 100) * 40);

  // Dark decay: show scanlines at low bloom
  const showScanlines = bloomLevel <= 35;
  const scanlineOpacity = showScanlines ? Math.max(0, 1 - bloomLevel / 35) * 0.6 : 0;

  // Dark mode (bloom ≤ 35): only dark icons. Above: only dream icons.
  const isDark = bloomLevel <= 35;
  const icons = isDark ? DARK_ICONS : DREAM_ICONS;
  const count = Math.max(8, Math.min(16, Math.floor(bloomLevel / 8) + 6));

  return (
    <div
      className="character-panel"
      style={{
        '--glow-color': character.glowColor || 'rgba(255, 105, 180, 0.3)',
      } as React.CSSProperties}
    >
      {/* Background glow */}
      <div className="character-glow" />

      {/* DARK DECAY: Scanline interference at low bloom */}
      {showScanlines && (
        <div
          className="character-scanlines"
          style={{ opacity: scanlineOpacity }}
        />
      )}

      {/* Floating dreamcore sparkles — varying sizes, more density */}
      <div className="character-sparkles">
        {icons.slice(0, count).map((icon, i) => (
          <span
            key={i}
            className={`sparkle sparkle-${i % 3 === 0 ? 'slow' : i % 3 === 1 ? 'mid' : 'fast'}`}
            style={{
              '--delay': `${i * 0.6}s`,
              '--size': SPARKLE_SIZES[i],
              left: SPARKLE_POSITIONS[i][0],
              top: SPARKLE_POSITIONS[i][1],
            } as React.CSSProperties}
          >
            {icon}
          </span>
        ))}
      </div>

      {/* Character image — BIG, center */}
      <div className={`character-visual ${isHyunju ? '' : 'zoomed'}`}>
        <img
          src={character.fullBody}
          alt={character.name}
          className="character-image"
          style={{
            filter: `saturate(${saturation}%) brightness(${brightness}%)`,
          }}
        />
      </div>

      {/* Bloom meter — top right corner */}
      <div className="character-bloom-container">
        <BloomMeter bloomLevel={bloomLevel} />
      </div>

      {/* Character info overlay */}
      <div className="character-info">
        <h2 className="character-name">{character.name.toUpperCase()}</h2>
        <p className={`character-tagline ${fourthWallText ? 'fourth-wall' : ''}`}>
          {fourthWallText || character.tagline}
        </p>
        <div className="character-accent-line" />
      </div>

    </div>
  );
}
