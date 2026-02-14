import { useState, useEffect, useRef, useMemo } from 'react';
import './DarkVeins.css';

interface DarkVeinsProps {
  /** 0-100 bloom level. Decay strongest at 0, invisible above 40 */
  bloomLevel: number;
}

interface CorruptionBlock {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  edge: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Dark Decay overlay — two layers:
 * 1. Vignette: dark purple gradient eating the screen edges
 * 2. Pixel corruption: small blocks that flash at borders like data rot
 */
export function DarkVeins({ bloomLevel }: DarkVeinsProps) {
  if (bloomLevel > 40) return null;

  const intensity = Math.max(0, 1 - bloomLevel / 40);

  return (
    <div className="dark-decay" aria-hidden="true">
      {/* Layer 1: Vignette — void consuming the edges */}
      <div
        className="decay-vignette"
        style={{
          '--vignette-strength': `${intensity * 0.65}`,
          '--vignette-spread': `${12 + intensity * 18}%`,
        } as React.CSSProperties}
      />

      {/* Layer 2: Pixel corruption blocks */}
      <CorruptionLayer intensity={intensity} bloomLevel={bloomLevel} />
    </div>
  );
}

function CorruptionLayer({ intensity, bloomLevel }: { intensity: number; bloomLevel: number }) {
  const [blocks, setBlocks] = useState<CorruptionBlock[]>([]);
  const counterRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // How many corruption blocks and how often they spawn
  const maxBlocks = Math.floor(2 + intensity * 8);
  const spawnInterval = 800 - intensity * 500; // 800ms at low intensity, 300ms at max

  // Stable edge positions — blocks cluster near screen edges
  const generateBlock = useMemo(() => () => {
    const edges: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];
    const edge = edges[Math.floor(Math.random() * edges.length)];

    // Blocks are small pixel-sized rectangles near the chosen edge
    const size = () => 4 + Math.floor(Math.random() * 12);
    let x: number, y: number;

    switch (edge) {
      case 'top':
        x = Math.random() * 100;
        y = Math.random() * 8;
        break;
      case 'bottom':
        x = Math.random() * 100;
        y = 92 + Math.random() * 8;
        break;
      case 'left':
        x = Math.random() * 8;
        y = Math.random() * 100;
        break;
      case 'right':
        x = 92 + Math.random() * 8;
        y = Math.random() * 100;
        break;
    }

    return {
      id: counterRef.current++,
      x,
      y,
      w: size(),
      h: size(),
      edge,
    };
  }, []);

  useEffect(() => {
    if (bloomLevel > 40) return;

    intervalRef.current = window.setInterval(() => {
      setBlocks(prev => {
        const next = [...prev, generateBlock()];
        // Keep only the most recent blocks
        if (next.length > maxBlocks) {
          return next.slice(next.length - maxBlocks);
        }
        return next;
      });
    }, spawnInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bloomLevel, maxBlocks, spawnInterval, generateBlock]);

  return (
    <div className="decay-corruption">
      {blocks.map(block => (
        <span
          key={block.id}
          className="corruption-block"
          style={{
            left: `${block.x}%`,
            top: `${block.y}%`,
            width: `${block.w}px`,
            height: `${block.h}px`,
          }}
        />
      ))}
    </div>
  );
}
