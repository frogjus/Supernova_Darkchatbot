import './TimeControls.css';

interface TimeControlsProps {
  day: number;
  timeOfDay: 'morning' | 'noon' | 'night';
  onAdvance: () => void;
}

const timeIcons = {
  morning: '🌅',
  noon: '☀️',
  night: '🌙',
};

const timeLabels = {
  morning: 'Morning',
  noon: 'Noon',
  night: 'Night',
};

export function TimeControls({ day, timeOfDay, onAdvance }: TimeControlsProps) {
  return (
    <div className="time-controls">
      <div className="day-display">
        <span className="day-label">DAY</span>
        <span className="day-number">{day}</span>
      </div>
      <div className="time-display">
        <span className="time-icon">{timeIcons[timeOfDay]}</span>
        <span className="time-label">{timeLabels[timeOfDay]}</span>
      </div>
      <button className="advance-button" onClick={onAdvance}>
        <span className="advance-icon">⏭</span>
        <span className="advance-text">Next</span>
      </button>
    </div>
  );
}
