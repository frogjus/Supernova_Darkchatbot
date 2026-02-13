import type { Meters, CharacterTrust } from '../types';
import './Meters.css';

interface MetersProps {
  meters: Meters;
  trust: CharacterTrust;
  characters: { id: string; name: string; color: string }[];
}

export function MetersDisplay({ meters, trust, characters }: MetersProps) {
  const meterConfig = [
    { key: 'energy', label: 'Energy', type: 'positive' as const, icon: '⚡' },
    { key: 'moneyPressure', label: 'Money Pressure', type: 'negative' as const, icon: '💰' },
    { key: 'exposureRisk', label: 'Exposure Risk', type: 'negative' as const, icon: '👁️' },
    { key: 'teamCohesion', label: 'Team', type: 'positive' as const, icon: '💜' },
  ];

  const getColor = (value: number, type: 'positive' | 'negative') => {
    if (type === 'positive') {
      if (value >= 70) return '#4CAF50';
      if (value >= 40) return '#FFC107';
      return '#f44336';
    } else {
      if (value >= 70) return '#f44336';
      if (value >= 40) return '#FFC107';
      return '#4CAF50';
    }
  };

  return (
    <div className="meters-container">
      <div className="meters-section">
        <h3 className="meters-title">STATUS</h3>
        <div className="meters-grid">
          {meterConfig.map(config => (
            <div key={config.key} className="meter-item">
              <div className="meter-header">
                <span className="meter-icon">{config.icon}</span>
                <span className="meter-label">{config.label}</span>
                <span className="meter-value">{Math.round(meters[config.key as keyof Meters])}%</span>
              </div>
              <div className="meter-bar-bg">
                <div
                  className="meter-bar-fill"
                  style={{
                    width: `${meters[config.key as keyof Meters]}%`,
                    backgroundColor: getColor(meters[config.key as keyof Meters], config.type),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trust-section">
        <h3 className="meters-title">TRUST</h3>
        <div className="trust-grid">
          {characters
            .filter(c => c.id !== 'yuseong' && c.id !== 'group')
            .map(char => (
              <div key={char.id} className="trust-item">
                <span className="trust-name" style={{ color: char.color }}>{char.name}</span>
                <div className="trust-bar-bg">
                  <div
                    className="trust-bar-fill"
                    style={{
                      width: `${trust[char.id] || 50}%`,
                      backgroundColor: char.color,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
