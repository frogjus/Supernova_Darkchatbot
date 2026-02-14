import { useEffect, useRef } from 'react';
import type { Character } from '../types';
import { BloomMeter } from './BloomMeter';
import './CharacterPanel.css';

interface CharacterPanelProps {
  character: Character;
  bloomLevel: number;
}

const SPARKLE_ICONS = ['✦', '♡', '🦋', '⭐', '✧', '🌸', '💫', '🔑'];

export function CharacterPanel({ character, bloomLevel }: CharacterPanelProps) {
  const floatRef = useRef<HTMLDivElement>(null);

  // Gentle floating animation
  useEffect(() => {
    let offset = 0;
    let direction = 1;
    const speed = 0.012;
    const maxOffset = 3;

    const animate = () => {
      if (floatRef.current) {
        offset += speed * direction;
        if (Math.abs(offset) >= maxOffset) {
          direction *= -1;
        }
        floatRef.current.style.transform = `translateX(-50%) translateY(${offset}px)`;
      }
      requestAnimationFrame(animate);
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Bloom-dependent saturation: wilted = grayscale, blooming = full color
  const saturation = Math.min(100, (bloomLevel / 100) * 120 + 20);
  const brightness = Math.min(110, 70 + (bloomLevel / 100) * 40);

  // Dark decay: show scanlines at low bloom
  const showScanlines = bloomLevel <= 35;
  const scanlineOpacity = showScanlines ? Math.max(0, 1 - bloomLevel / 35) * 0.6 : 0;

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

      {/* Floating pixel sparkles — more sparkles at higher bloom */}
      <div className="character-sparkles">
        {SPARKLE_ICONS.slice(0, Math.max(2, Math.floor(bloomLevel / 15))).map((icon, i) => (
          <span key={i} className="sparkle" style={{ '--delay': `${i * 0.7}s` } as React.CSSProperties}>
            {icon}
          </span>
        ))}
      </div>

      {/* Character image — BIG, center */}
      <div className="character-visual" ref={floatRef}>
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
        <p className="character-tagline">{character.tagline}</p>
        <div className="character-accent-line" />
      </div>

      {/* Corner brackets */}
      <div className="corner-bracket top-left" />
      <div className="corner-bracket top-right" />
      <div className="corner-bracket bottom-left" />
      <div className="corner-bracket bottom-right" />

      {/* Animated shine */}
      <div className="character-shine" />
    </div>
  );
}
