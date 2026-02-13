import { useEffect, useRef } from 'react';
import type { Character } from '../types';
import './CharacterPanel.css';

interface CharacterPanelProps {
  character: Character;
}

export function CharacterPanel({ character }: CharacterPanelProps) {
  const floatRef = useRef<HTMLDivElement>(null);

  // Floating animation with subtle parallax
  useEffect(() => {
    let offset = 0;
    let direction = 1;
    const speed = 0.015;
    const maxOffset = 3;

    const animate = () => {
      if (floatRef.current) {
        offset += speed * direction;
        if (Math.abs(offset) >= maxOffset) {
          direction *= -1;
        }
        floatRef.current.style.transform = `translateY(${offset}px)`;
      }
      requestAnimationFrame(animate);
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className="character-panel"
      style={{
        '--glow-color': character.glowColor,
        '--gradient-start': character.gradientStart,
        '--gradient-end': character.gradientEnd,
        '--particle-color': character.particleColor,
      } as React.CSSProperties}
    >
      {/* Background glow */}
      <div className="character-glow" />

      {/* Particle field */}
      <div className="character-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="particle" style={{ '--delay': `${i * 0.3}s` } as React.CSSProperties} />
        ))}
      </div>

      {/* Character container */}
      <div className="character-visual" ref={floatRef}>
        <img
          src={character.fullBody}
          alt={character.name}
          className="character-image"
        />
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
