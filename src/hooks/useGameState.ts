import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Message, Character, Choice, BloomToken } from '../types';
import { createInitialState, applyConsequences, loadCharacters } from '../utils/helpers';
import { generateCharacterResponse } from '../utils/aiService';
import { detectBloomToken } from '../utils/bloomDetector';
import { getGreetingMessage } from '../utils/greetings';

const STORAGE_KEY = 'supernova_darkmode_state';

// Load persisted state from localStorage
function loadPersistedState(): Partial<GameState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Corrupted data, ignore
  }
  return null;
}

// Save state to localStorage (debounced via caller)
function persistState(state: GameState) {
  try {
    const toSave = {
      characterBloom: state.characterBloom,
      conversationCount: state.conversationCount,
      bloomTokensEarned: state.bloomTokensEarned,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full or unavailable
  }
}

export interface BloomEvent {
  token: BloomToken | null;
  delta: number;
  characterId: string;
  timestamp: number;
}

interface QueueItem {
  characterId: string;
  playerMessage?: string;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    const initial = createInitialState();
    const persisted = loadPersistedState();
    if (persisted) {
      return {
        ...initial,
        characterBloom: persisted.characterBloom || initial.characterBloom,
        conversationCount: persisted.conversationCount || initial.conversationCount,
        bloomTokensEarned: persisted.bloomTokensEarned || initial.bloomTokensEarned,
      };
    }
    return initial;
  });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastBloomEvent, setLastBloomEvent] = useState<BloomEvent | null>(null);

  // Queue stores both character ID and the player's message text
  const messageQueueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);

  // Per-character message history stored separately
  const messageHistoryRef = useRef<Record<string, Message[]>>({});

  // Ref to always have fresh state for async operations
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load characters + inject initial greeting
  useEffect(() => {
    async function loadData() {
      try {
        const chars = await loadCharacters();
        setCharacters(chars);

        setState(prev => {
          if (prev.messages.length === 0) {
            const bloomValue = prev.characterBloom[prev.currentChannel] || 0;
            const greeting = getGreetingMessage(prev.currentChannel, bloomValue);
            if (greeting) {
              messageHistoryRef.current[prev.currentChannel] = [greeting];
              return { ...prev, messages: [greeting] };
            }
          }
          return prev;
        });
      } catch (error) {
        console.error('Failed to load characters:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Persist bloom state (debounced)
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      persistState(state);
    }, 500);
  }, [state.characterBloom, state.conversationCount, state.bloomTokensEarned]);

  // Process AI message queue
  const processQueue = useCallback(async () => {
    if (messageQueueRef.current.length === 0 || processingRef.current) return;

    processingRef.current = true;
    const item = messageQueueRef.current.shift();
    if (!item) {
      processingRef.current = false;
      return;
    }

    setAiLoading(true);
    try {
      const character = characters.find(c => c.id === item.characterId);
      if (character) {
        // Use stateRef for fresh state (avoids stale closure)
        const freshState = stateRef.current;

        const response = await generateCharacterResponse({
          character,
          gameState: freshState,
          conversationHistory: freshState.messages,
          playerMessage: item.playerMessage,
        });

        const newMessage: Message = {
          id: `ai_${Date.now()}`,
          characterId: item.characterId,
          content: response,
          timestamp: Date.now(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, newMessage],
        }));
      }
    } catch (error) {
      console.error('AI response error:', error);
    }
    setAiLoading(false);
    processingRef.current = false;

    // Process next item if queue has more
    if (messageQueueRef.current.length > 0) {
      processQueue();
    }
  }, [characters]);

  // Trigger queue processing when messages change (new player message added)
  useEffect(() => {
    if (messageQueueRef.current.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [state.messages, processQueue]);

  const setCurrentChannel = useCallback((channel: string) => {
    setState(prev => {
      // Save current messages to history
      if (prev.currentChannel && prev.messages.length > 0) {
        messageHistoryRef.current[prev.currentChannel] = prev.messages;
      }

      // Restore messages for the new channel
      let restored = messageHistoryRef.current[channel] || [];

      // First visit — inject greeting message
      if (restored.length === 0) {
        const bloomValue = prev.characterBloom[channel] || 0;
        const greeting = getGreetingMessage(channel, bloomValue);
        if (greeting) {
          restored = [greeting];
          messageHistoryRef.current[channel] = restored;
        }
      }

      return {
        ...prev,
        currentChannel: channel,
        messages: restored,
      };
    });
  }, []);

  const sendPlayerMessage = useCallback((message: string) => {
    const charId = state.currentChannel;
    if (!charId) return;

    // Detect bloom token from player message
    const convCount = (state.conversationCount[charId] || 0) + 1;
    const detection = detectBloomToken(message, convCount);

    // Add player message with bloom effect
    const playerMsg: Message = {
      id: `player_${Date.now()}`,
      characterId: 'player',
      content: message,
      timestamp: Date.now(),
      isPlayer: true,
      bloomEffect: detection.bloomDelta,
    };

    setState(prev => {
      const currentBloom = prev.characterBloom[charId] || 0;
      const newBloom = Math.max(0, Math.min(100, currentBloom + detection.bloomDelta));

      const newTokens = detection.token
        ? [...(prev.bloomTokensEarned[charId] || []), detection.token]
        : prev.bloomTokensEarned[charId] || [];

      return {
        ...prev,
        messages: [...prev.messages, playerMsg],
        characterBloom: {
          ...prev.characterBloom,
          [charId]: newBloom,
        },
        conversationCount: {
          ...prev.conversationCount,
          [charId]: convCount,
        },
        bloomTokensEarned: {
          ...prev.bloomTokensEarned,
          [charId]: newTokens,
        },
      };
    });

    // Emit bloom event for UI feedback
    if (detection.bloomDelta !== 0) {
      setLastBloomEvent({
        token: detection.token,
        delta: detection.bloomDelta,
        characterId: charId,
        timestamp: Date.now(),
      });
    }

    // Queue AI response WITH the player's message text
    messageQueueRef.current.push({
      characterId: charId,
      playerMessage: message,
    });
  }, [state.currentChannel, state.conversationCount]);

  const makeChoice = useCallback((choice: Choice, _messageId: string) => {
    setState(prev => {
      let newState = applyConsequences(prev, choice.consequences);
      newState = {
        ...newState,
        choices: [...newState.choices, choice.id],
      };
      return newState;
    });

    messageQueueRef.current.push({ characterId: state.currentChannel });
  }, [state.currentChannel]);

  return {
    state,
    characters,
    loading,
    aiLoading,
    lastBloomEvent,
    setCurrentChannel,
    makeChoice,
    sendPlayerMessage,
  };
}
