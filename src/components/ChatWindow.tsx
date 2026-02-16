import { useRef, useEffect, useState, useMemo } from 'react';
import type { Message, Character, Choice } from '../types';
import { CharacterPanel } from './CharacterPanel';
import { MessageInput } from './MessageInput';
import { GlitchTitle } from './GlitchTitle';
import { FormattedMessage } from './FormattedMessage';
import { zalgoify } from '../utils/zalgo';
import { redactMessage } from '../utils/redact';
import './ChatWindow.css';

interface ChatWindowProps {
  messages: Message[];
  characters: Character[];
  currentChannel: string;
  onChoiceSelect: (choice: Choice, messageId: string) => void;
  onSendMessage: (message: string) => void;
  bloomLevel: number;
  aiLoading?: boolean;
  // Voice mode props
  isSpeaking?: boolean;
  speakingCharacterId?: string | null;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  isListening?: boolean;
  onStartListening?: () => void;
  onStopListening?: () => void;
  interimTranscript?: string;
  sttSupported?: boolean;
  ttsAvailable?: boolean;
  sttError?: string | null;
  onPhantomVoice?: (text: string) => void;
}

export function ChatWindow({
  messages,
  characters,
  currentChannel,
  onChoiceSelect,
  onSendMessage,
  bloomLevel,
  aiLoading,
  isSpeaking,
  speakingCharacterId,
  voiceEnabled,
  onToggleVoice,
  isListening,
  onStartListening,
  onStopListening,
  interimTranscript,
  sttSupported,
  ttsAvailable,
  sttError,
  onPhantomVoice,
}: ChatWindowProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [phantomMessage, setPhantomMessage] = useState<string | null>(null);
  const phantomTimerRef = useRef<number | null>(null);

  // Phantom messages — appear briefly then vanish at very low bloom
  const PHANTOM_MESSAGES: Record<string, string[]> = {
    miho: ['he promised me munyeol', 'yuseongshin lied', 'the stage was never real', 'i can still hear him laughing', 'help me', 'don\'t leave me alone with him'],
    sohee: ['he ruined my father', 'the debt was his design', 'yuseongshin took everything', 'this isn\'t real', 'i was bait', 'none of us were supposed to debut'],
    sujin: ['seoha worked for him', 'the photo was his idea', 'yuseongshin broke me on purpose', 'i\'m so tired of being good', 'he collected broken girls', 'the evidence came from inside'],
    hyunju: ['he told my mother i wasn\'t enough', 'yuseongshin designed this', 'i was never going to debut', 'the smile hurts', 'he watches through the screen', 'am i even real?'],
  };

  useEffect(() => {
    if (bloomLevel > 20) {
      setPhantomMessage(null);
      return;
    }

    function schedulePhantom() {
      const delay = 45000 + Math.random() * 60000;
      phantomTimerRef.current = window.setTimeout(() => {
        const pool = PHANTOM_MESSAGES[currentChannel] || PHANTOM_MESSAGES.miho;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        setPhantomMessage(msg);

        // Trigger Yuseongshin voice if voice mode is on
        if (voiceEnabled && onPhantomVoice) {
          onPhantomVoice(msg);
        }

        // Vanish after 2-3 seconds
        setTimeout(() => {
          setPhantomMessage(null);
          schedulePhantom();
        }, 2000 + Math.random() * 1000);
      }, delay);
    }

    schedulePhantom();
    return () => { if (phantomTimerRef.current) clearTimeout(phantomTimerRef.current); };
  }, [bloomLevel, currentChannel]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom when messages change, AI typing starts/stops,
  // or phantom messages appear. Three-layer approach:
  //   1. Immediate scroll + double rAF for layout-safe deferred scroll
  //   2. MutationObserver: catches any DOM child changes (typing dots, phantoms)
  //   3. ResizeObserver: catches viewport/keyboard changes on mobile
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let rafId1: number;
    let rafId2: number;

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    const deferredScrollToBottom = () => {
      // Double rAF ensures layout is fully computed (critical on mobile Safari)
      rafId1 = requestAnimationFrame(() => {
        scrollToBottom();
        rafId2 = requestAnimationFrame(scrollToBottom);
      });
    };

    // Scroll immediately for the state change that triggered this effect
    scrollToBottom();
    // Plus deferred scroll after browser layout completes
    deferredScrollToBottom();

    // MutationObserver: catches typing indicator / phantom messages appearing
    // in the DOM even if React batching delays the state-driven scroll
    const mutationObserver = new MutationObserver(() => {
      // Only auto-scroll if user hasn't intentionally scrolled up
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 150) {
        deferredScrollToBottom();
      }
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    // ResizeObserver: catches keyboard dismiss, viewport rotation,
    // dynamic toolbar changes on mobile Safari
    const resizeObserver = new ResizeObserver(scrollToBottom);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [messages, aiLoading, phantomMessage]);

  const currentCharacter = characters.find(c => c.id === currentChannel);

  // Zalgo corruption intensity — kicks in at bloom < 20
  const zalgoIntensity = bloomLevel < 20 ? (1 - bloomLevel / 20) : 0;

  // Re-corrupt names periodically for a flickering effect
  const [zalgoTick, setZalgoTick] = useState(0);
  useEffect(() => {
    if (zalgoIntensity <= 0) return;
    const interval = setInterval(() => setZalgoTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, [zalgoIntensity]);

  const corruptName = useMemo(() => {
    return (name: string) => zalgoIntensity > 0 ? zalgoify(name, zalgoIntensity) : name;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zalgoIntensity, zalgoTick]);

  const isGroupChat = currentChannel === 'supernova';

  const renderMessage = (message: Message) => {
    // System messages (group chat announcements)
    if (message.characterId === 'system') {
      return (
        <div key={message.id} className="message system-message">
          <div className="system-message-content">{message.content}</div>
        </div>
      );
    }

    const character = characters.find(c => c.id === message.characterId);
    const isPlayer = message.isPlayer;
    const showChoices = message.choices && message.choices.length > 0;

    return (
      <div
        key={message.id}
        className={`message ${isPlayer ? 'player' : 'character'}`}
      >
        {!isPlayer && character && (
          <div className="message-avatar" style={{ borderColor: character.color }}>
            {character.avatar ? (
              <img src={bloomLevel >= 70 ? `/characters/${character.id.toUpperCase()}_HAPPY.png` : character.avatar} alt={character.name} className={`avatar-image avatar-${character.id}`} />
            ) : (
              <div className="avatar-fallback" style={{ backgroundColor: character.color }}>
                {character.name.charAt(0)}
              </div>
            )}
          </div>
        )}
        <div className="message-content">
          {!isPlayer && character && (
            <span className={`message-sender ${zalgoIntensity > 0 ? 'zalgo' : ''}`} style={{ color: character.color }}>
              {corruptName(character.name)}
            </span>
          )}
          <div className="message-bubble">
            {/* Speaking indicator */}
            {!isPlayer && isSpeaking && speakingCharacterId === message.characterId && message.id === messages.filter(m => m.characterId === message.characterId).slice(-1)[0]?.id && (
              <span className="speaking-indicator" title="Speaking...">
                <span /><span /><span />
              </span>
            )}
            {!isPlayer && bloomLevel <= 25 ? (() => {
              const { text: redacted, wasRedacted } = redactMessage(message.content, bloomLevel);
              return (
                <>
                  <FormattedMessage content={redacted} />
                  {wasRedacted && <span className="redact-hint">[ signal lost ]</span>}
                </>
              );
            })() : (
              <FormattedMessage content={message.content} />
            )}
          </div>

          {showChoices && (
            <div className="message-choices">
              {message.choices!.map(choice => (
                <button
                  key={choice.id}
                  className="choice-button"
                  onClick={() => onChoiceSelect(choice, message.id)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`chat-container ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Character Panel — hidden in group chat */}
      {currentCharacter && !isGroupChat && (
        <div className="character-panel-container">
          <CharacterPanel
            character={currentCharacter}
            bloomLevel={bloomLevel}
          />
        </div>
      )}

      {/* Chat Panel — pixel dialog window */}
      <div className={`chat-panel ${bloomLevel <= 30 ? 'decayed' : ''} ${isGroupChat ? 'group-chat' : ''}`}>
        {/* Title bar */}
        <div className="chat-titlebar">
          <div className="chat-titlebar-hearts">
            <span>{isGroupChat ? '✦' : '♥'}</span>
            <span>{isGroupChat ? '✦' : '♥'}</span>
            <span>{isGroupChat ? '✦' : '♥'}</span>
          </div>
          <GlitchTitle
            text={isGroupChat ? 'supernova_reunion.exe' : (currentCharacter ? `${currentCharacter.name.toLowerCase()}_chat.exe` : 'chat.exe')}
            bloomLevel={isGroupChat ? 80 : bloomLevel}
            className="chat-titlebar-text"
          />
          <div className="chat-titlebar-buttons">
            <button className="chat-titlebar-btn">—</button>
            <button className="chat-titlebar-btn">□</button>
            <button className="chat-titlebar-btn">×</button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">💌</span>
              <p className="empty-state-text">
                {isGroupChat
                  ? 'SUPERNOVA is together again...'
                  : currentCharacter
                  ? `Say something to ${currentCharacter.name}...`
                  : 'Select a character to begin'}
              </p>
              <p className="empty-state-hint">{isGroupChat ? 'yuseongshin can\'t stop this' : 'be gentle with them'}</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          {/* Typing indicator */}
          {aiLoading && (currentCharacter || isGroupChat) && (
            <div className="message character typing">
              <div className="message-avatar" style={{ borderColor: isGroupChat ? '#FFD700' : currentCharacter?.color }}>
                {isGroupChat ? (
                  <div className="avatar-fallback" style={{ backgroundColor: '#1a0a2e', color: '#FFD700', fontSize: '14px' }}>✦</div>
                ) : currentCharacter?.avatar ? (
                  <img src={currentCharacter.avatar} alt={currentCharacter.name} className={`avatar-image avatar-${currentCharacter.id}`} />
                ) : (
                  <div className="avatar-fallback" style={{ backgroundColor: currentCharacter?.color }}>
                    {currentCharacter?.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="message-content">
                <span className={`message-sender ${zalgoIntensity > 0 ? 'zalgo' : ''}`} style={{ color: isGroupChat ? '#FFD700' : currentCharacter?.color }}>
                  {isGroupChat ? 'SUPERNOVA' : corruptName(currentCharacter!.name)}
                </span>
                <div className="message-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Phantom message — appears briefly then vanishes */}
          {phantomMessage && currentCharacter && (
            <div className="message character phantom">
              <div className="message-avatar" style={{ borderColor: currentCharacter.color }}>
                {currentCharacter.avatar ? (
                  <img src={currentCharacter.avatar} alt={currentCharacter.name} className={`avatar-image avatar-${currentCharacter.id}`} />
                ) : (
                  <div className="avatar-fallback" style={{ backgroundColor: currentCharacter.color }}>
                    {currentCharacter.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="message-content">
                <span className={`message-sender ${zalgoIntensity > 0 ? 'zalgo' : ''}`} style={{ color: currentCharacter.color }}>
                  {corruptName(currentCharacter.name)}
                </span>
                <div className="message-bubble phantom-bubble">
                  {phantomMessage}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <MessageInput
          onSend={onSendMessage}
          placeholder={isGroupChat ? 'Message SUPERNOVA...' : currentCharacter ? `Message ${currentCharacter.name}...` : 'Type a message...'}
          disabled={aiLoading}
          bloomLevel={bloomLevel}
          voiceEnabled={voiceEnabled}
          onToggleVoice={onToggleVoice}
          isListening={isListening}
          onStartListening={onStartListening}
          onStopListening={onStopListening}
          interimTranscript={interimTranscript}
          sttSupported={sttSupported}
          ttsAvailable={ttsAvailable}
          sttError={sttError}
        />
      </div>
    </div>
  );
}
