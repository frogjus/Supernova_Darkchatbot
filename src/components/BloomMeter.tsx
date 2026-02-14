import { getBloomHearts } from '../utils/helpers';
import './BloomMeter.css';

interface BloomMeterProps {
  bloomLevel: number; // 0-100
  characterName?: string;
}

export function BloomMeter({ bloomLevel, characterName }: BloomMeterProps) {
  const { filled, partial } = getBloomHearts(bloomLevel);
  const totalHearts = 5;

  // Dark decay: hearts bleed at low bloom
  const isBleeding = bloomLevel <= 30;
  const isWilted = bloomLevel <= 20;
  const isDecayed = bloomLevel <= 30;

  return (
    <div className={`bloom-meter ${isDecayed ? 'decayed' : ''}`}>
      {characterName && (
        <span className="bloom-label">{characterName}</span>
      )}
      <div className="bloom-hearts">
        {Array.from({ length: totalHearts }).map((_, i) => {
          let state: 'filled' | 'cracked' | 'empty' = 'empty';
          if (i < filled) state = 'filled';
          else if (i === filled && partial) state = 'cracked';

          // Decay modifiers
          const bleeding = isBleeding && state === 'empty';
          const crackedBleeding = isBleeding && state === 'cracked';
          const wiltedFilled = isWilted && state === 'filled';

          const classes = [
            'bloom-heart',
            state,
            bleeding ? 'bleeding' : '',
            crackedBleeding ? 'bleeding' : '',
            wiltedFilled ? 'wilted' : '',
          ].filter(Boolean).join(' ');

          return (
            <span
              key={i}
              className={classes}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          );
        })}
      </div>
      <span className="bloom-value">{bloomLevel}</span>
    </div>
  );
}
