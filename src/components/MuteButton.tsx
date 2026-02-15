import { useState } from 'react';
import { toggleMute, getMuted } from '../utils/sound';
import './MuteButton.css';

export function MuteButton() {
  const [muted, setMuted] = useState(getMuted);

  const handleToggle = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  };

  return (
    <button
      className={`mute-button ${muted ? 'muted' : ''}`}
      onClick={handleToggle}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '♪'}
    </button>
  );
}
