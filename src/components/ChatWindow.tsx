import { useRef, useEffect, useState } from 'react';
import type { Message, Character, Choice } from '../types';
import { CharacterPanel } from './CharacterPanel';
import { MessageInput } from './MessageInput';
import './ChatWindow.css';

interface ChatWindowProps {
  messages: Message[];
  characters: Character[];
  currentChannel: string;
  onChoiceSelect: (choice: Choice, messageId: string) => void;
  onSendMessage: (message: string) => void;
}

export function ChatWindow({ messages, characters, currentChannel, onChoiceSelect, onSendMessage }: ChatWindowProps) {
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

  const getCharacter = (id: string): Character | undefined => {
    if (id === 'group') return undefined;
    return characters.find(c => c.id === id);
  };

  const currentCharacter = getCharacter(currentChannel);
  const isGroupChat = currentChannel === 'group';

  const renderMessage = (message: Message) => {
    const character = getCharacter(message.characterId);
    const isPlayer = message.isPlayer;
    const showChoices = message.choices && message.choices.length > 0;

    return (
      <div
        key={message.id}
        className={`message ${isPlayer ? 'player' : 'character'} ${character ? '' : 'system'}`}
      >
        {!isPlayer && character && (
          <div className="message-avatar" style={{ borderColor: character.color }}>
            {character.avatar ? (
              <img src={character.avatar} alt={character.name} className="avatar-image" />
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
          <div
            className="message-bubble"
            style={{
              backgroundColor: isPlayer
                ? 'linear-gradient(135deg, #6c5ce7 0%, #5541d7 100%)'
                : character
                ? `linear-gradient(135deg, ${character.color}22 0%, ${character.color}11 100%)`
                : '#1a1a2e',
              borderColor: character?.color || '#2a2a4a',
            }}
          >
            {message.content}
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
      {/* Character Panel - left on desktop, top on mobile */}
      {!isGroupChat && currentCharacter && (
        <div className="character-panel-container">
          <CharacterPanel character={currentCharacter} />
        </div>
      )}

      {/* Chat Panel */}
      <div className="chat-panel">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              {isGroupChat ? (
                <p>Group chat is empty. Start talking!</p>
              ) : (
                <p>Start a conversation with {currentCharacter?.name}...</p>
              )}
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput
          onSend={onSendMessage}
          disabled={isGroupChat}
          placeholder={isGroupChat ? "Group chat - select a character first" : `Message ${currentCharacter?.name}...`}
        />
      </div>
    </div>
  );
}
