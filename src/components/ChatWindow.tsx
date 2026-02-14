import { useRef, useEffect, useState } from 'react';
import type { Message, Character, Choice } from '../types';
import { CharacterPanel } from './CharacterPanel';
import { MessageInput } from './MessageInput';
import { GlitchTitle } from './GlitchTitle';
import { FormattedMessage } from './FormattedMessage';
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentCharacter = characters.find(c => c.id === currentChannel);

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
            <span className="message-sender" style={{ color: character.color }}>
              {character.name}
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
                <span className="message-sender" style={{ color: currentCharacter.color }}>
                  {currentCharacter.name}
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <MessageInput
          onSend={onSendMessage}
          placeholder={currentCharacter ? `Message ${currentCharacter.name}...` : 'Type a message...'}
          disabled={aiLoading}
        />
      </div>
    </div>
  );
}
