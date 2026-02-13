import type { Character } from '../types';
import './ChannelTabs.css';

interface ChannelTabsProps {
  characters: Character[];
  currentChannel: string;
  onSelectChannel: (channel: string) => void;
}

interface Channel {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isGroup: boolean;
}

export function ChannelTabs({ characters, currentChannel, onSelectChannel }: ChannelTabsProps) {
  const channels: Channel[] = [
    { id: 'group', name: 'Group', icon: '👥', isGroup: true },
    ...characters.filter(c => c.id !== 'yuseong').map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      isGroup: false,
    })),
  ];

  return (
    <div className="channel-tabs">
      {channels.map(channel => {
        const isActive = currentChannel === channel.id;
        const char = !channel.isGroup ? characters.find(c => c.id === channel.id) : null;

        return (
          <button
            key={channel.id}
            className={`channel-tab ${isActive ? 'active' : ''} ${channel.isGroup ? 'group' : ''}`}
            onClick={() => onSelectChannel(channel.id)}
            style={{
              '--channel-color': channel.isGroup ? '#6c5ce7' : char?.color,
            } as React.CSSProperties}
          >
            <span className="channel-icon">{channel.icon || '💬'}</span>
            <span className="channel-name">{channel.name}</span>
          </button>
        );
      })}
    </div>
  );
}
