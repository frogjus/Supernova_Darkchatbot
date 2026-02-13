import { useState } from 'react';
import type { ConsequenceItem } from '../types';
import './ConsequenceFeed.css';

interface ConsequenceFeedProps {
  consequences: ConsequenceItem[];
}

const typeIcons: Record<string, string> = {
  rumor: '💬',
  bill: '📄',
  opportunity: '✨',
  threat: '⚠️',
  positive: '💖',
};

const typeColors: Record<string, string> = {
  rumor: '#f39c12',
  bill: '#e74c3c',
  opportunity: '#2ecc71',
  threat: '#9b59b6',
  positive: '#3498db',
};

export function ConsequenceFeed({ consequences }: ConsequenceFeedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (consequences.length === 0) {
    return null;
  }

  return (
    <div className={`consequence-feed ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="feed-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="feed-icon">📰</span>
        <span className="feed-label">Feed</span>
        <span className="feed-count">{consequences.length}</span>
        <span className="feed-arrow">{isExpanded ? '▼' : '▲'}</span>
      </button>

      {isExpanded && (
        <div className="feed-content">
          {consequences.map(item => (
            <div
              key={item.id}
              className="feed-item"
              style={{ '--item-color': typeColors[item.type] } as React.CSSProperties}
            >
              <span className="feed-item-icon">{typeIcons[item.type]}</span>
              <span className="feed-item-content">{item.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
