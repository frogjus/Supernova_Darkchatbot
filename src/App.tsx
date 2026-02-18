import { useState, useEffect, useRef, useCallback } from 'react';
import { ChannelTabs } from './components/ChannelTabs';
import { ChatWindow } from './components/ChatWindow';
import { BloomToast } from './components/BloomToast';
import { BloomTransition } from './components/BloomTransition';
import { PixelProps } from './components/PixelProps';
import { DarkVeins } from './components/DarkVeins';
import { ScreenGlitch } from './components/ScreenGlitch';
import { MuteButton } from './components/MuteButton';
import { EndingScreen } from './components/EndingScreen';
import { useGameState, setVoiceEnabled } from './hooks/useGameState';
import { useVoiceMode } from './hooks/useVoiceMode';
import { initAudio, startAmbient, setMusicBloom, playTabSwitch, playBloomUp, playBloomDown } from './utils/sound';
import { initConsoleEasterEggs } from './utils/consoleEasterEggs';
import { initEasterEggs, updateBloomEasterEggs } from './utils/easterEggs';
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

  // Voice mode — destructure stable refs to avoid unstable object dependencies
  const voice = useVoiceMode();
  const { voiceEnabled, playCharacterVoice, setOnFinalTranscript } = voice;

  // Sync voice state to game state typing delay
  useEffect(() => {
    setVoiceEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Auto-TTS: when AI finishes responding (aiLoading goes false), speak the last message.
  // IMPORTANT: Depend on stable references (voiceEnabled boolean, playCharacterVoice callback)
  // NOT the entire `voice` object — that's recreated every render, causing the effect to
  // rerun on every state change (isListening, interimTranscript, isSpeaking...) which can
  // desync prevAiLoadingRef and miss the aiLoading true→false transition.
  const prevAiLoadingRef = useRef(false);
  useEffect(() => {
    if (prevAiLoadingRef.current && !aiLoading && voiceEnabled) {
      // AI just finished — find the last character message
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && !lastMsg.isPlayer && lastMsg.characterId !== 'system') {
        const bloom = state.characterBloom?.[lastMsg.characterId] ?? 50;
        playCharacterVoice(lastMsg.content, lastMsg.characterId, bloom);
      }
    }
    prevAiLoadingRef.current = aiLoading;
  }, [aiLoading, state.messages, voiceEnabled, playCharacterVoice]);

  // Wire STT final transcript → auto-send
  useEffect(() => {
    setOnFinalTranscript((text: string) => {
      sendPlayerMessage(text);
    });
  }, [setOnFinalTranscript, sendPlayerMessage]);

  // Channel switch transition
  const [switching, setSwitching] = useState(false);
  const pendingChannelRef = useRef<string | null>(null);

  const handleChannelSwitch = useCallback((ch: string) => {
    if (ch === state.currentChannel) return;
    // Disengage voice mode on channel switch — clean slate for new character
    if (voice.voiceEnabled) voice.toggleVoice();
    voice.stopSpeaking();
    playTabSwitch();
    setSwitching(true);
    pendingChannelRef.current = ch;
    // After fade-out, swap channel and fade-in
    setTimeout(() => {
      setCurrentChannel(ch);
      setTimeout(() => setSwitching(false), 50);
    }, 250);
  }, [state.currentChannel, setCurrentChannel]);

  // Onboarding — first time only
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('supernova_onboarded');
  });
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Splash screen: show for at least 2 seconds, then fade out
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const splashTimerDone = useRef(false);
  const dataReady = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      splashTimerDone.current = true;
      if (dataReady.current) {
        setSplashFading(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      dataReady.current = true;
      if (splashTimerDone.current) {
        setSplashFading(true);
      }
    }
  }, [loading]);

  useEffect(() => {
    if (splashFading) {
      const fadeTimer = setTimeout(() => setSplashVisible(false), 600);
      return () => clearTimeout(fadeTimer);
    }
  }, [splashFading]);

  // Init audio on first user interaction
  const audioInitRef = useRef(false);
  useEffect(() => {
    const handleInteraction = () => {
      if (!audioInitRef.current) {
        audioInitRef.current = true;
        initAudio();
        // Delay startAmbient slightly to let iOS finish unlocking the context
        setTimeout(() => startAmbient(), 100);
        initConsoleEasterEggs();
        initEasterEggs();
      }
    };
    // Use touchend for iOS — it's the most reliable gesture for audio unlock
    window.addEventListener('touchend', handleInteraction, { once: true });
    window.addEventListener('click', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('touchend', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, []);

  // Track bloom stages to detect transitions
  const prevBloomRef = useRef<Record<string, number>>({});
  const [transition, setTransition] = useState<{ characterName: string; stageName: string } | null>(null);

  // Detect bloom stage changes
  useEffect(() => {
    const charId = state.currentChannel;
    const currentBloom = state.characterBloom?.[charId] ?? 0;
    const prevBloom = prevBloomRef.current[charId];

    if (prevBloom !== undefined && prevBloom !== currentBloom) {
      // Play bloom sound
      if (currentBloom > prevBloom) playBloomUp();
      else playBloomDown();

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

  // Ending screen — bloom hits 0 or 100
  const [ending, setEnding] = useState<{ characterId: string; type: 'saved' | 'lost' } | null>(null);
  const endingShownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const charId = state.currentChannel;
    const bloom = state.characterBloom?.[charId] ?? 50;
    const key = `${charId}_${bloom <= 0 ? 'lost' : bloom >= 100 ? 'saved' : ''}`;
    if ((bloom <= 0 || bloom >= 100) && !endingShownRef.current.has(key)) {
      endingShownRef.current.add(key);
      setEnding({ characterId: charId, type: bloom >= 100 ? 'saved' : 'lost' });
    }
  }, [state.characterBloom, state.currentChannel]);

  // Browser tab title corruption
  useEffect(() => {
    const HAUNTED_TITLES = [
      'yuseongshin is watching',
      'close this app',
      'you can\'t save them',
      'he planned all of this',
      'the debut was never real',
      'they remember everything',
      'why did you come back',
      'yuseongshin says hello',
      'none of them were supposed to survive',
      'he\'s still here',
      '...',
    ];

    const currentBloom = state.characterBloom?.[state.currentChannel] ?? 50;
    if (currentBloom > 40) {
      document.title = 'SUPERNOVA DARKMODE';
      return;
    }

    function scheduleCorruption() {
      const intensity = Math.max(0.1, 1 - currentBloom / 40);
      const delay = 15000 + (1 - intensity) * 30000 + Math.random() * 20000;

      return window.setTimeout(() => {
        const title = HAUNTED_TITLES[Math.floor(Math.random() * HAUNTED_TITLES.length)];
        document.title = title;

        setTimeout(() => {
          document.title = 'SUPERNOVA DARKMODE';
        }, 2000 + Math.random() * 3000);
      }, delay);
    }

    const timerId = scheduleCorruption();
    return () => clearTimeout(timerId);
  }, [state.characterBloom, state.currentChannel]);

  // Sync bloom to music engine so melody shifts dark/dream
  const currentBloomForMusic = state.characterBloom?.[state.currentChannel] ?? 10;
  useEffect(() => {
    setMusicBloom(currentBloomForMusic);
    updateBloomEasterEggs(currentBloomForMusic);
  }, [currentBloomForMusic]);

  // Onboarding intro — first time only
  const ONBOARDING_LINES = [
    'supernova never debuted.',
    'the teasers, the fancams, the comeback trailers—',
    'none of it was real.',
    'yuseongshin tricked us.',
    'he made us believe they were going to shine.',
    'but it was always an illusion.',
    'four girls are still trapped inside his dream.',
    'make it real.',
  ];

  if (showOnboarding) {
    return (
      <div
        className="onboarding-screen"
        onClick={() => {
          initAudio();
          if (onboardingStep < ONBOARDING_LINES.length - 1) {
            setOnboardingStep(s => s + 1);
          } else {
            localStorage.setItem('supernova_onboarded', 'true');
            setShowOnboarding(false);
          }
        }}
      >
        <div className="onboarding-content">
          {ONBOARDING_LINES.slice(0, onboardingStep + 1).map((line, i) => (
            <p
              key={i}
              className={`onboarding-line ${i === onboardingStep ? 'current' : 'past'}`}
            >
              {line}
            </p>
          ))}
        </div>
        <p className="onboarding-hint">
          {onboardingStep < ONBOARDING_LINES.length - 1 ? 'tap to continue' : 'tap to enter'}
        </p>
      </div>
    );
  }

  if (splashVisible) {
    return (
      <div className={`loading-screen ${splashFading ? 'fade-out' : ''}`}>
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
            <div className="loading-bar-container">
              <div className="loading-bar" />
            </div>
            <div className="loading-text">loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const isGroupChannel = state.currentChannel === 'supernova';
  const currentBloom = isGroupChannel ? 80 : (state.characterBloom?.[state.currentChannel] ?? 10);

  return (
    <div className={`app theme-${state.currentChannel}`}>
      {/* Ambient floating pixel props — broken at low bloom */}
      <PixelProps bloomLevel={currentBloom} />

      {/* DARK DECAY: Vignette + pixel corruption at low bloom */}
      <DarkVeins bloomLevel={currentBloom} />

      {/* NIGHTMARE: Random screen glitches */}
      <ScreenGlitch bloomLevel={currentBloom} />

      {/* Ending screen — bloom 0 or 100 */}
      {ending && (() => {
        const endChar = characters.find(c => c.id === ending.characterId);
        return endChar ? (
          <EndingScreen
            character={endChar}
            type={ending.type}
            onDismiss={() => setEnding(null)}
          />
        ) : null;
      })()}

      {/* Mute toggle */}
      <MuteButton />

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
        onSelectChannel={handleChannelSwitch}
        characterBloom={state.characterBloom}
      />

      <div className={`app-main ${switching ? 'channel-switching' : ''}`}>
        <ChatWindow
          messages={state.messages}
          characters={characters}
          currentChannel={state.currentChannel}
          onChoiceSelect={makeChoice}
          onSendMessage={sendPlayerMessage}
          bloomLevel={currentBloom}
          aiLoading={aiLoading}
          isSpeaking={voice.isSpeaking}
          speakingCharacterId={voice.speakingCharacterId}
          voiceEnabled={voice.voiceEnabled}
          onToggleVoice={voice.toggleVoice}
          isListening={voice.isListening}
          interimTranscript={voice.interimTranscript}
          sttError={voice.sttError}
          onPhantomVoice={voice.triggerInterruption}
        />
      </div>
    </div>
  );
}

export default App;
