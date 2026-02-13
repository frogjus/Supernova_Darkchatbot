import { useState, useCallback, useEffect } from 'react';
import type { GameState, Message, Character, DayContent, WeeklyEvent, Choice, ConsequenceItem } from '../types';
import { createInitialState, applyConsequences, advanceTime, loadCharacters, loadDays, loadEvents } from '../utils/helpers';

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [characters, setCharacters] = useState<Character[]>([]);
  const [days, setDays] = useState<DayContent[]>([]);
  const [events, setEvents] = useState<WeeklyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [chars, daysData, eventsData] = await Promise.all([
          loadCharacters(),
          loadDays(),
          loadEvents(),
        ]);
        setCharacters(chars);
        setDays(daysData);
        setEvents(eventsData);

        // Load initial messages for day 1
        const day1 = daysData.find(d => d.day === 1);
        if (day1) {
          setState(prev => ({
            ...prev,
            messages: day1.morning.messages.filter(m => m.characterId !== 'group')
          }));
        }
      } catch (error) {
        console.error('Failed to load game data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getCharacter = useCallback((id: string): Character | undefined => {
    return characters.find(c => c.id === id);
  }, [characters]);

  const setCurrentChannel = useCallback((channel: string) => {
    setState(prev => ({ ...prev, currentChannel: channel }));
  }, []);

  const makeChoice = useCallback((choice: Choice, _messageId: string) => {
    setState(prev => {
      let newState = applyConsequences(prev, choice.consequences);
      newState = {
        ...newState,
        choices: [...newState.choices, choice.id],
      };
      return newState;
    });
  }, []);

  const advanceTimeOfDay = useCallback(() => {
    setState(prev => {
      const newState = advanceTime(prev);

      // Load messages for new time period
      const dayContent = days.find(d => d.day === newState.day);
      if (dayContent) {
        const messages = dayContent[newState.timeOfDay].messages.filter(m =>
          m.characterId === newState.currentChannel || m.characterId === 'group'
        );
        return { ...newState, messages };
      }

      return newState;
    });
  }, [days]);

  const addConsequence = useCallback((content: string, type: string, relatedCharacter?: string) => {
    const consequence: ConsequenceItem = {
      id: `c_${Date.now()}`,
      type: type as ConsequenceItem['type'],
      content,
      timestamp: Date.now(),
      relatedCharacter,
    };
    setState(prev => ({
      ...prev,
      consequences: [consequence, ...prev.consequences].slice(0, 20),
    }));
  }, []);

  const getMessagesForCurrentChannel = useCallback((): Message[] => {
    const dayContent = days.find(d => d.day === state.day);
    if (!dayContent) return [];

    const phase = dayContent[state.timeOfDay];
    return phase.messages.filter(m =>
      m.characterId === state.currentChannel ||
      m.characterId === 'group' ||
      (state.currentChannel === 'group' && !characters.find(c => c.id === m.characterId))
    );
  }, [days, state.day, state.timeOfDay, state.currentChannel, characters]);

  return {
    state,
    characters,
    days,
    events,
    loading,
    getCharacter,
    setCurrentChannel,
    makeChoice,
    advanceTimeOfDay,
    addConsequence,
    getMessagesForCurrentChannel,
  };
}
