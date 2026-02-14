import { useState, useEffect, useRef } from 'react';
import { playGlitch } from '../utils/sound';
import './ScreenGlitch.css';

interface ScreenGlitchProps {
  bloomLevel: number;
}

// Glitch types — each feels different
type GlitchType = 'tear' | 'invert' | 'static' | 'shift' | 'flicker';

const GLITCH_TYPES: GlitchType[] = ['tear', 'invert', 'static', 'shift', 'flicker'];

export function ScreenGlitch({ bloomLevel }: ScreenGlitchProps) {
  const [activeGlitch, setActiveGlitch] = useState<GlitchType | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function scheduleGlitch() {
      // Frequency scales with darkness — lower bloom = more frequent
      // bloom 0: every 8-15s, bloom 30: every 20-40s, bloom 50+: every 45-90s
      const intensity = Math.max(0.1, 1 - bloomLevel / 50);
      const minDelay = 8000 + (1 - intensity) * 37000;
      const maxDelay = 15000 + (1 - intensity) * 75000;
      const delay = minDelay + Math.random() * (maxDelay - minDelay);

      timerRef.current = window.setTimeout(() => {
        // Pick a random glitch type
        const type = GLITCH_TYPES[Math.floor(Math.random() * GLITCH_TYPES.length)];
        setActiveGlitch(type);
        playGlitch();

        // Glitch duration: 150-400ms (fast and jarring)
        const duration = 150 + Math.random() * 250;
        setTimeout(() => {
          setActiveGlitch(null);
          scheduleGlitch();
        }, duration);
      }, delay);
    }

    scheduleGlitch();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bloomLevel]);

  if (!activeGlitch) return null;

  return (
    <div className={`screen-glitch glitch-${activeGlitch}`}>
      {activeGlitch === 'static' && (
        <div className="glitch-static-lines">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="static-line"
              style={{
                top: `${Math.random() * 100}%`,
                height: `${1 + Math.random() * 3}px`,
                animationDelay: `${Math.random() * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
      {activeGlitch === 'tear' && (
        <div className="glitch-tear">
          <div
            className="tear-slice"
            style={{ top: `${20 + Math.random() * 60}%` }}
          />
        </div>
      )}
    </div>
  );
}
