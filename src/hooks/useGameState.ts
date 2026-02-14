import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Message, Character, Choice, BloomToken } from '../types';
import { createInitialState, applyConsequences, loadCharacters } from '../utils/helpers';
import { generateCharacterResponse } from '../utils/aiService';
import { detectBloomToken } from '../utils/bloomDetector';
import { getGreetingMessage } from '../utils/greetings';
import { getUnpromptedMessage } from '../utils/unprompted';
import { playMessageReceive } from '../utils/sound';
import { getGroupGreeting, pickGroupResponder, buildGroupSystemPrompt } from '../utils/groupChat';
import { GROUP_CHANNEL_ID, GROUP_BLOOM_THRESHOLD } from '../components/ChannelTabs';
import { updateMemory } from '../utils/memoryService';

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

const MESSAGES_KEY = 'supernova_darkmode_messages';

// Save state to localStorage (debounced via caller)
function persistState(state: GameState) {
  try {
    const toSave = {
      characterBloom: state.characterBloom,
      conversationCount: state.conversationCount,
      bloomTokensEarned: state.bloomTokensEarned,
      currentChannel: state.currentChannel,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full or unavailable
  }
}

// Save all message histories to localStorage
function persistMessages(history: Record<string, Message[]>) {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable
  }
}

// Load message histories from localStorage
function loadPersistedMessages(): Record<string, Message[]> {
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Corrupted data, ignore
  }
  return {};
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
    const savedMessages = loadPersistedMessages();
    if (persisted) {
      const channel = (persisted as { currentChannel?: string }).currentChannel || initial.currentChannel;
      return {
        ...initial,
        characterBloom: persisted.characterBloom || initial.characterBloom,
        conversationCount: persisted.conversationCount || initial.conversationCount,
        bloomTokensEarned: persisted.bloomTokensEarned || initial.bloomTokensEarned,
        currentChannel: channel,
        messages: savedMessages[channel] || [],
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

  // Per-character message history — initialized from localStorage
  const messageHistoryRef = useRef<Record<string, Message[]>>(loadPersistedMessages());

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
          // Only inject greeting if no persisted messages exist for this channel
          if (prev.messages.length === 0 && !messageHistoryRef.current[prev.currentChannel]?.length) {
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

  // Persist state + messages (debounced)
  useEffect(() => {
    // Keep messageHistoryRef in sync with current channel's messages
    if (state.currentChannel && state.messages.length > 0) {
      messageHistoryRef.current[state.currentChannel] = state.messages;
    }

    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      persistState(state);
      persistMessages(messageHistoryRef.current);
      // Update memory for current character
      if (state.currentChannel && state.messages.length >= 4) {
        updateMemory(state.currentChannel, state.messages);
      }
    }, 500);
  }, [state.characterBloom, state.conversationCount, state.bloomTokensEarned, state.messages, state.currentChannel]);

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
      // Group chat: pick a responding character from eligible members
      let responderId = item.characterId;
      if (item.characterId === GROUP_CHANNEL_ID) {
        const freshState = stateRef.current;
        const eligible = characters.filter(
          c => (freshState.characterBloom[c.id] ?? 0) >= GROUP_BLOOM_THRESHOLD
        );
        const responder = pickGroupResponder(eligible, freshState.messages);
        responderId = responder.id;
      }

      const character = characters.find(c => c.id === responderId);
      if (character) {
        // Use stateRef for fresh state (avoids stale closure)
        const freshState = stateRef.current;

        // Use group system prompt for group chat
        const isGroup = item.characterId === GROUP_CHANNEL_ID;
        const groupSystemPrompt = isGroup
          ? buildGroupSystemPrompt(
              character,
              characters.filter(c => (freshState.characterBloom[c.id] ?? 0) >= GROUP_BLOOM_THRESHOLD),
              freshState.characterBloom
            )
          : undefined;

        const response = await generateCharacterResponse({
          character,
          gameState: freshState,
          conversationHistory: freshState.messages,
          playerMessage: item.playerMessage,
          systemPromptOverride: groupSystemPrompt,
        });

        // Variable typing delay — longer responses take longer to "type"
        const typingDelay = Math.min(4000, 800 + response.length * 12);
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        playMessageReceive();

        const newMessage: Message = {
          id: `ai_${Date.now()}`,
          characterId: responderId,
          content: response,
          timestamp: Date.now(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, newMessage],
        }));

        // In group chat, sometimes a second character reacts (40% chance)
        if (isGroup && Math.random() < 0.4) {
          const eligible = characters.filter(
            c => (freshState.characterBloom[c.id] ?? 0) >= GROUP_BLOOM_THRESHOLD
          );
          const secondResponder = pickGroupResponder(eligible, [...freshState.messages, newMessage]);
          if (secondResponder.id !== responderId) {
            messageQueueRef.current.push({
              characterId: GROUP_CHANNEL_ID,
              playerMessage: undefined,
            });
          }
        }
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
      // Save current messages to history + update memory
      if (prev.currentChannel && prev.messages.length > 0) {
        messageHistoryRef.current[prev.currentChannel] = prev.messages;
        updateMemory(prev.currentChannel, prev.messages);
      }

      // Restore messages for the new channel
      let restored = messageHistoryRef.current[channel] || [];

      // Group channel — inject group greeting on first visit
      if (channel === GROUP_CHANNEL_ID) {
        if (restored.length === 0) {
          const eligible = characters.filter(
            c => (prev.characterBloom[c.id] ?? 0) >= GROUP_BLOOM_THRESHOLD
          );
          restored = getGroupGreeting(eligible, prev.characterBloom);
          messageHistoryRef.current[channel] = restored;
        }
      } else if (restored.length === 0) {
        // First visit — inject greeting message
        const bloomValue = prev.characterBloom[channel] || 0;
        const greeting = getGreetingMessage(channel, bloomValue);
        if (greeting) {
          restored = [greeting];
          messageHistoryRef.current[channel] = restored;
        }
      } else {
        // ~30% chance: character texted you while you were away
        const bloomValue = prev.characterBloom[channel] || 0;
        const unprompted = getUnpromptedMessage(channel, bloomValue);
        if (unprompted) {
          restored = [...restored, unprompted];
          messageHistoryRef.current[channel] = restored;
        }
      }

      return {
        ...prev,
        currentChannel: channel,
        messages: restored,
      };
    });
  }, [characters]);

  const sendPlayerMessage = useCallback((message: string) => {
    const charId = state.currentChannel;
    if (!charId) return;

    // Group chat: no bloom changes, just add message and queue response
    if (charId === GROUP_CHANNEL_ID) {
      const playerMsg: Message = {
        id: `player_${Date.now()}`,
        characterId: 'player',
        content: message,
        timestamp: Date.now(),
        isPlayer: true,
      };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, playerMsg],
      }));
      messageQueueRef.current.push({
        characterId: GROUP_CHANNEL_ID,
        playerMessage: message,
      });
      return;
    }

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
