import { useMemo } from 'react';
import './PixelProps.css';

interface PixelPropsProps {
  /** 0-100 bloom level. Props get darker/broken below 30 */
  bloomLevel?: number;
}

// Healthy dreamcore props — cute, whole, pink world
const HEALTHY_PROPS = ['🦋', '🔑', '🌸', '⭐', '🎀', '💌', '🍰', '🩹', '🍓', '💎', '♡', '✧'];

// Broken/dark props — the cute exterior is cracking
const BROKEN_PROPS = ['🥀', '🔗', '🖤', '💔', '🩸', '🕸️', '🗝️', '🫥', '⛓️', '🌑', '♠', '†'];

// Mixed — transitional state (roots stage)
const MIXED_PROPS = ['🥀', '🔑', '💔', '⭐', '🩹', '🖤', '🍰', '🕸️', '🌸', '🗝️', '♡', '†'];

interface Prop {
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
  index: number;
}

function generatePositions(count: number): Prop[] {
  const props: Prop[] = [];
  for (let i = 0; i < count; i++) {
    props.push({
      x: i % 2 === 0
        ? Math.random() * 15
        : 85 + Math.random() * 15,
      y: 5 + Math.random() * 90,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 4,
      size: 12 + Math.random() * 10,
      index: i,
    });
  }
  return props;
}

function getPool(bloomLevel: number): string[] {
  if (bloomLevel <= 20) return BROKEN_PROPS;
  if (bloomLevel <= 35) return MIXED_PROPS;
  return HEALTHY_PROPS;
}

export function PixelProps({ bloomLevel = 50 }: PixelPropsProps) {
  // Positions are stable — only icons change with bloom
  const positions = useMemo(() => generatePositions(10), []);
  const pool = getPool(bloomLevel);
  const isDark = bloomLevel <= 30;

  return (
    <div className={`pixel-props ${isDark ? 'dark' : ''}`} aria-hidden="true">
      {positions.map((prop) => (
        <span
          key={prop.index}
          className={`pixel-prop ${isDark ? 'prop-dark' : ''}`}
          style={{
            left: `${prop.x}%`,
            top: `${prop.y}%`,
            animationDelay: `${prop.delay}s`,
            animationDuration: `${prop.duration}s`,
            fontSize: `${prop.size}px`,
          }}
        >
          {pool[prop.index % pool.length]}
        </span>
      ))}
    </div>
  );
}
