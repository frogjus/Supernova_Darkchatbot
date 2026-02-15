import { useEffect, useState, useRef } from 'react';
import type { BloomEvent } from '../hooks/useGameState';
import './BloomToast.css';

interface BloomToastProps {
  event: BloomEvent | null;
}

const TOKEN_LABELS: Record<string, string> = {
  encouragement: 'encouragement',
  compliment: 'compliment',
  patience: 'patience',
  vulnerability: 'vulnerability',
  consistency: 'consistency',
  boundary: 'healthy boundary',
};

export function BloomToast({ event }: BloomToastProps) {
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<BloomEvent | null>(null);
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (event && event.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = event.timestamp;
      setCurrentEvent(event);
      setVisible(true);

      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [event]);

  if (!visible || !currentEvent) return null;

  const isPositive = currentEvent.delta > 0;
  const isNegative = currentEvent.delta < 0;

  return (
    <div className={`bloom-toast ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}>
      <span className="bloom-toast-icon">
        {isPositive ? '♥' : '♡'}
      </span>
      <span className="bloom-toast-text">
        {isPositive && currentEvent.token
          ? `+${currentEvent.delta} ${TOKEN_LABELS[currentEvent.token.type] || currentEvent.token.type}`
          : `${currentEvent.delta} bloom`}
      </span>
    </div>
  );
}
