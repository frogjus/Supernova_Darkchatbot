import { useState, useEffect } from 'react';
import type { Character, CharacterBloom } from '../types';
import './ChannelTabs.css';

interface ChannelTabsProps {
  characters: Character[];
  currentChannel: string;
  onSelectChannel: (channel: string) => void;
  characterBloom?: CharacterBloom;
}

const GROUP_CHANNEL_ID = 'supernova';
const GROUP_BLOOM_THRESHOLD = 70;
const GROUP_MIN_MEMBERS = 2;

export { GROUP_CHANNEL_ID, GROUP_BLOOM_THRESHOLD, GROUP_MIN_MEMBERS };

export function ChannelTabs({ characters, currentChannel, onSelectChannel, characterBloom }: ChannelTabsProps) {
  // Count how many characters have bloom >= threshold
  const eligibleCount = characters.filter(
    c => (characterBloom?.[c.id] ?? 0) >= GROUP_BLOOM_THRESHOLD
  ).length;
  const groupUnlocked = eligibleCount >= GROUP_MIN_MEMBERS;

  // Unlock notification flash
  const [groupFlash, setGroupFlash] = useState(false);
  const [wasUnlocked, setWasUnlocked] = useState(false);

  useEffect(() => {
    if (groupUnlocked && !wasUnlocked) {
      setWasUnlocked(true);
      setGroupFlash(true);
      const timer = setTimeout(() => setGroupFlash(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [groupUnlocked, wasUnlocked]);

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

        {/* SUPERNOVA group chat — unlocks when 2+ characters bloom >= 70 */}
        {groupUnlocked && (
          <button
            className={`channel-tab group-tab ${currentChannel === GROUP_CHANNEL_ID ? 'active' : ''} ${groupFlash ? 'group-flash' : ''}`}
            onClick={() => onSelectChannel(GROUP_CHANNEL_ID)}
            style={{ '--char-color': '#FFD700' } as React.CSSProperties}
          >
            <span className="tab-avatar group-avatar">✦</span>
            <span className="tab-name group-name">SUPERNOVA</span>
            {currentChannel === GROUP_CHANNEL_ID && (
              <span className="tab-heart">✿</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
