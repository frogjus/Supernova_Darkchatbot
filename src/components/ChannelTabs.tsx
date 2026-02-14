import type { Character, CharacterBloom } from '../types';
import './ChannelTabs.css';

interface ChannelTabsProps {
  characters: Character[];
  currentChannel: string;
  onSelectChannel: (channel: string) => void;
  characterBloom?: CharacterBloom;
}

export function ChannelTabs({ characters, currentChannel, onSelectChannel, characterBloom }: ChannelTabsProps) {
  return (
    <div className="channel-tabs">
      <div className="channel-tabs-inner">
        {characters.map(character => {
          const isActive = currentChannel === character.id;
          const bloom = characterBloom?.[character.id] ?? 50;
          const isWilted = bloom <= 20;

          return (
            <button
              key={character.id}
              className={`channel-tab ${isActive ? 'active' : ''} ${isWilted ? 'wilted' : ''}`}
              onClick={() => onSelectChannel(character.id)}
              style={{
                '--char-color': character.color,
              } as React.CSSProperties}
            >
              <span className="tab-avatar">
                {character.avatar ? (
                  <img src={character.avatar} alt="" className={`tab-avatar-img avatar-${character.id}`} />
                ) : (
                  <span className="tab-avatar-fallback">{character.name.charAt(0)}</span>
                )}
              </span>
              <span className="tab-name">{character.name}</span>
              {isActive && (
                <span className="tab-heart">{isWilted ? '💔' : '♥'}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
