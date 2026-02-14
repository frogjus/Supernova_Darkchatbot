// Memory Service — compresses conversation history into a summary
// that persists across sessions so characters "remember" the player

import type { Message } from '../types';

const MEMORY_KEY = 'supernova_memory';

interface CharacterMemory {
  summary: string;
  keyFacts: string[];       // things the player shared about themselves
  emotionalMoments: string[]; // significant emotional beats
  lastUpdated: number;
}

type MemoryStore = Record<string, CharacterMemory>;

function loadMemory(): MemoryStore {
  try {
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {};
}

function saveMemory(store: MemoryStore) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(store));
  } catch {
    // storage full
  }
}

/**
 * Extract key facts and emotional moments from recent messages.
 * This runs client-side — no API call needed.
 */
function extractInsights(messages: Message[]): { facts: string[]; moments: string[] } {
  const facts: string[] = [];
  const moments: string[] = [];

  for (const msg of messages) {
    if (!msg.isPlayer) continue;
    const text = msg.content.toLowerCase();

    // Player sharing personal info
    if (text.match(/\b(i am|i'm|my name|i work|i live|i study|i like|i love|i hate|i'm from)\b/i)) {
      facts.push(msg.content.slice(0, 100));
    }

    // Emotional moments
    if (text.match(/\b(sorry|thank|miss you|worried|proud|scared|happy|sad|lonely|tired|love you|care about)\b/i)) {
      moments.push(msg.content.slice(0, 100));
    }

    // Korean emotional markers
    if (text.match(/(고마워|미안|보고싶|걱정|좋아|사랑|외로|힘들|수고)/)) {
      moments.push(msg.content.slice(0, 100));
    }
  }

  return {
    facts: facts.slice(-5),    // keep last 5 facts
    moments: moments.slice(-5), // keep last 5 moments
  };
}

/**
 * Update memory for a character after a conversation session.
 * Call this when switching channels or periodically.
 */
export function updateMemory(characterId: string, messages: Message[]) {
  if (messages.length < 4) return; // not enough to summarize

  const store = loadMemory();
  const existing = store[characterId];
  const { facts, moments } = extractInsights(messages);

  // Build a summary from the last ~8 messages
  const recent = messages.slice(-8);
  const summaryParts: string[] = [];

  for (const msg of recent) {
    const who = msg.isPlayer ? 'Player' : 'Character';
    const snippet = msg.content.slice(0, 60);
    summaryParts.push(`${who}: ${snippet}`);
  }

  const newSummary = summaryParts.join(' | ');

  // Merge with existing memory
  const mergedFacts = existing
    ? [...new Set([...existing.keyFacts, ...facts])].slice(-8)
    : facts;
  const mergedMoments = existing
    ? [...new Set([...existing.emotionalMoments, ...moments])].slice(-8)
    : moments;

  store[characterId] = {
    summary: newSummary,
    keyFacts: mergedFacts,
    emotionalMoments: mergedMoments,
    lastUpdated: Date.now(),
  };

  saveMemory(store);
}

/**
 * Get memory context string to inject into the AI system prompt.
 */
export function getMemoryContext(characterId: string): string {
  const store = loadMemory();
  const memory = store[characterId];
  if (!memory) return '';

  const parts: string[] = ['MEMORY FROM PAST CONVERSATIONS:'];

  if (memory.keyFacts.length > 0) {
    parts.push(`Things the player has shared: ${memory.keyFacts.join('; ')}`);
  }

  if (memory.emotionalMoments.length > 0) {
    parts.push(`Emotional moments between you: ${memory.emotionalMoments.join('; ')}`);
  }

  if (memory.summary) {
    parts.push(`Recent conversation summary: ${memory.summary}`);
  }

  parts.push('Use these memories naturally — reference them when relevant, but don\'t dump them all at once. Let them surface organically, the way a real person would remember things.');

  return parts.join('\n');
}
