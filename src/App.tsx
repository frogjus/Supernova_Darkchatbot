import { useState, useEffect, useRef, useCallback } from 'react';
import { ChannelTabs } from './components/ChannelTabs';
import { ChatWindow } from './components/ChatWindow';
import { BloomToast } from './components/BloomToast';
import { BloomTransition } from './components/BloomTransition';
import { PixelProps } from './components/PixelProps';
import { DarkVeins } from './components/DarkVeins';
import { useGameState } from './hooks/useGameState';
import './App.css';

// Bloom stage thresholds
const STAGE_THRESHOLDS = [
  { min: 0, max: 20, name: 'wilted' },
  { min: 21, max: 40, name: 'roots' },
  { min: 41, max: 60, name: 'sprout' },
  { min: 61, max: 80, name: 'budding' },
  { min: 81, max: 100, name: 'blooming' },
];

function getStageName(bloom: number): string {
  return STAGE_THRESHOLDS.find(s => bloom >= s.min && bloom <= s.max)?.name || 'wilted';
}

function App() {
  const {
    state,
    characters,
    loading,
    aiLoading,
    lastBloomEvent,
    setCurrentChannel,
    makeChoice,
    sendPlayerMessage,
  } = useGameState();

  // Track bloom stages to detect transitions
  const prevBloomRef = useRef<Record<string, number>>({});
  const [transition, setTransition] = useState<{ characterName: string; stageName: string } | null>(null);

  // Detect bloom stage changes
  useEffect(() => {
    const charId = state.currentChannel;
    const currentBloom = state.characterBloom?.[charId] ?? 0;
    const prevBloom = prevBloomRef.current[charId];

    if (prevBloom !== undefined && prevBloom !== currentBloom) {
      const prevStage = getStageName(prevBloom);
      const newStage = getStageName(currentBloom);

      if (prevStage !== newStage && currentBloom > prevBloom) {
        const character = characters.find(c => c.id === charId);
        if (character) {
          setTransition({ characterName: character.name, stageName: newStage });
        }
      }
    }

    prevBloomRef.current[charId] = currentBloom;
  }, [state.characterBloom, state.currentChannel, characters]);

  const handleTransitionComplete = useCallback(() => {
    setTransition(null);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        {/* Floating pixel props */}
        <div className="loading-props">
          <span className="loading-prop">🦋</span>
          <span className="loading-prop">🔑</span>
          <span className="loading-prop">🌸</span>
          <span className="loading-prop">⭐</span>
          <span className="loading-prop">🎀</span>
          <span className="loading-prop">💌</span>
        </div>

        {/* Pixel dialog window */}
        <div className="loading-window">
          <div className="loading-titlebar">
            <div className="loading-titlebar-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="loading-titlebar-text">supernova.exe</span>
            <div className="loading-titlebar-buttons">
              <span>—</span>
              <span>□</span>
              <span>×</span>
            </div>
          </div>
          <div className="loading-content">
            <div className="loading-title">SUPERNOVA<br />DARKMODE</div>
            <div className="loading-hearts">
              <div className="loading-heart" />
              <div className="loading-heart" />
              <div className="loading-heart" />
            </div>
            <div className="loading-text">loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentBloom = state.characterBloom?.[state.currentChannel] ?? 10;

  return (
    <div className={`app theme-${state.currentChannel}`}>
      {/* Ambient floating pixel props — broken at low bloom */}
      <PixelProps bloomLevel={currentBloom} />

      {/* DARK DECAY: Vignette + pixel corruption at low bloom */}
      <DarkVeins bloomLevel={currentBloom} />

      {/* Bloom feedback toast */}
      <BloomToast event={lastBloomEvent} />

      {/* Bloom stage transition overlay */}
      {transition && (
        <BloomTransition
          characterName={transition.characterName}
          stageName={transition.stageName}
          onComplete={handleTransitionComplete}
        />
      )}

      <ChannelTabs
        characters={characters}
        currentChannel={state.currentChannel}
        onSelectChannel={setCurrentChannel}
        characterBloom={state.characterBloom}
      />

      <div className="app-main">
        <ChatWindow
          messages={state.messages}
          characters={characters}
          currentChannel={state.currentChannel}
          onChoiceSelect={makeChoice}
          onSendMessage={sendPlayerMessage}
          bloomLevel={currentBloom}
          aiLoading={aiLoading}
        />
      </div>
    </div>
  );
}

export default App;
