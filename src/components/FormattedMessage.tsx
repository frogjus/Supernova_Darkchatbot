import './FormattedMessage.css';

interface FormattedMessageProps {
  content: string;
}

interface Segment {
  type: 'dialogue' | 'action';
  text: string;
}

/**
 * Parses message content into dialogue vs action segments.
 * Text wrapped in *asterisks* or **double asterisks** = action/description
 * Everything else = spoken dialogue
 */
function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  // Match *text* or **text** — captures the inner text
  const pattern = /\*{1,2}([^*]+)\*{1,2}/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    // Add dialogue before this action
    if (match.index > lastIndex) {
      const dialogue = content.slice(lastIndex, match.index).trim();
      if (dialogue) {
        segments.push({ type: 'dialogue', text: dialogue });
      }
    }
    // Add the action
    segments.push({ type: 'action', text: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining dialogue after last action
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) {
      segments.push({ type: 'dialogue', text: remaining });
    }
  }

  // If no segments found, treat entire content as dialogue
  if (segments.length === 0) {
    segments.push({ type: 'dialogue', text: content });
  }

  return segments;
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  const segments = parseContent(content);

  return (
    <span className="formatted-message">
      {segments.map((segment, i) =>
        segment.type === 'action' ? (
          <span key={i} className="msg-action">{segment.text}</span>
        ) : (
          <span key={i} className="msg-dialogue">{segment.text}</span>
        )
      )}
    </span>
  );
}
