import { useRef, useEffect, useState, useMemo } from 'react';
import type { Message, Character, Choice } from '../types';
import { CharacterPanel } from './CharacterPanel';
import { MessageInput } from './MessageInput';
import { GlitchTitle } from './GlitchTitle';
import { FormattedMessage } from './FormattedMessage';
import { zalgoify } from '../utils/zalgo';
import './ChatWindow.css';

interface ChatWindowProps {
  messages: Message[];
  characters: Character[];
  currentChannel: string;
  onChoiceSelect: (choice: Choice, messageId: string) => void;
  onSendMessage: (message: string) => void;
  bloomLevel: number;
  aiLoading?: boolean;
}

export function ChatWindow({
  messages,
  characters,
  currentChannel,
  onChoiceSelect,
  onSendMessage,
  bloomLevel,
  aiLoading,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [phantomMessage, setPhantomMessage] = useState<string | null>(null);
  const phantomTimerRef = useRef<number | null>(null);

  // Phantom messages — appear briefly then vanish at very low bloom
  const PHANTOM_MESSAGES: Record<string, string[]> = {
    miho: ['help me', 'i remember what happened', 'don\'t leave me alone with them', 'the stage lights are still on', 'munyeol?'],
    sohee: ['i can hear it', 'the words won\'t stop', 'this isn\'t real', 'i wrote the ending already', 'nobody reads anymore'],
    sujin: ['i\'m so tired of being good', 'let me rest', 'it\'s never enough', 'i can\'t hold this together', 'who am i without the schedule'],
    hyunju: ['am i real?', 'the smile hurts', 'i don\'t want to perform anymore', 'please don\'t look at me', 'i drew something terrible'],
  };

  useEffect(() => {
    if (bloomLevel > 20) {
      setPhantomMessage(null);
      return;
    }

    function schedulePhantom() {
      const delay = 25000 + Math.random() * 35000;
      phantomTimerRef.current = window.setTimeout(() => {
        const pool = PHANTOM_MESSAGES[currentChannel] || PHANTOM_MESSAGES.miho;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        setPhantomMessage(msg);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const renderMessage = (message: Message) => {
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
              <img src={character.avatar} alt={character.name} className={`avatar-image avatar-${character.id}`} />
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
            <FormattedMessage content={message.content} />
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
      {/* Character Panel */}
      {currentCharacter && (
        <div className="character-panel-container">
          <CharacterPanel
            character={currentCharacter}
            bloomLevel={bloomLevel}
          />
        </div>
      )}

      {/* Chat Panel — pixel dialog window */}
      <div className={`chat-panel ${bloomLevel <= 30 ? 'decayed' : ''}`}>
        {/* Title bar */}
        <div className="chat-titlebar">
          <div className="chat-titlebar-hearts">
            <span>♥</span>
            <span>♥</span>
            <span>♥</span>
          </div>
          <GlitchTitle
            text={currentCharacter ? `${currentCharacter.name.toLowerCase()}_chat.exe` : 'chat.exe'}
            bloomLevel={bloomLevel}
            className="chat-titlebar-text"
          />
          <div className="chat-titlebar-buttons">
            <button className="chat-titlebar-btn">—</button>
            <button className="chat-titlebar-btn">□</button>
            <button className="chat-titlebar-btn">×</button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">💌</span>
              <p className="empty-state-text">
                {currentCharacter
                  ? `Say something to ${currentCharacter.name}...`
                  : 'Select a character to begin'}
              </p>
              <p className="empty-state-hint">be gentle with them</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          {/* Typing indicator */}
          {aiLoading && currentCharacter && (
            <div className="message character typing">
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <MessageInput
          onSend={onSendMessage}
          placeholder={currentCharacter ? `Message ${currentCharacter.name}...` : 'Type a message...'}
          disabled={aiLoading}
          bloomLevel={bloomLevel}
        />
      </div>
    </div>
  );
}
