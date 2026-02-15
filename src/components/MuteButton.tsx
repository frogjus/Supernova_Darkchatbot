import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toggleMute, getMuted } from '../utils/sound';
import './MuteButton.css';

export function MuteButton() {
  const [muted, setMuted] = useState(getMuted);

  const handleToggle = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  };

  // Render via portal into document.body so position:fixed works on iOS
  return createPortal(
    <button
      className={`mute-button ${muted ? 'muted' : ''}`}
      onClick={handleToggle}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '♪'}
    </button>,
    document.body
  );
}
