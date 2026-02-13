import type { GameState, Character, DayContent, WeeklyEvent, Message, ConsequenceEffect } from '../types';

// Load characters from JSON
export async function loadCharacters(): Promise<Character[]> {
  const data = await import('../../data/characters/characters.json');
  return data.characters;
}

// Load days content
export async function loadDays(): Promise<DayContent[]> {
  const data = await import('../../data/days/days.json');
  return data.days as DayContent[];
}

// Load events
export async function loadEvents(): Promise<WeeklyEvent[]> {
  const data = await import('../../data/events/events.json');
  return data.events as WeeklyEvent[];
}

// Load consequences
export async function loadConsequences() {
  const data = await import('../../data/consequences/consequences.json');
  return data.consequences;
}

// Get messages for a specific day and time
export function getMessagesForPhase(dayContent: DayContent, timeOfDay: 'morning' | 'noon' | 'night'): Message[] {
  return dayContent[timeOfDay].messages;
}

// Apply consequences to game state
export function applyConsequences(
  state: GameState,
  consequences: ConsequenceEffect[]
): GameState {
  const newState = { ...state };

  consequences.forEach((effect) => {
    if (effect.target === 'meter' && effect.stat) {
      const meterKey = effect.stat as keyof typeof newState.meters;
      if (meterKey in newState.meters) {
        newState.meters[meterKey] = Math.max(0, Math.min(100, newState.meters[meterKey] + effect.value));
      }
    } else if (effect.target === 'unlock' && effect.targetId) {
      if (!newState.unlockedChannels.includes(effect.targetId)) {
        newState.unlockedChannels.push(effect.targetId);
      }
    } else if (effect.target === 'event') {
      newState.eventActive = true;
      newState.eventType = effect.targetId || undefined;
    }
  });

  return newState;
}

// Generate initial game state
export function createInitialState(): GameState {
  return {
    day: 1,
    timeOfDay: 'morning',
    meters: {
      energy: 80,
      moneyPressure: 30,
      exposureRisk: 10,
      teamCohesion: 50,
    },
    characterTrust: {
      miho: 40,
      sohee: 30,
      sujin: 35,
      hyunju: 45,
      yuseong: 20,
    },
    unlockedChannels: ['miho', 'sohee', 'sujin', 'hyunju', 'group'],
    currentChannel: 'miho',
    choices: [],
    consequences: [],
    messages: [],
    eventActive: false,
  };
}

// Format meter value for display
export function formatMeter(value: number): string {
  return `${Math.round(value)}%`;
}

// Get meter color based on value
export function getMeterColor(value: number, type: 'positive' | 'negative' | 'neutral'): string {
  if (type === 'positive') {
    if (value >= 70) return '#4CAF50';
    if (value >= 40) return '#FFC107';
    return '#f44336';
  }
  if (type === 'negative') {
    if (value >= 70) return '#f44336';
    if (value >= 40) return '#FFC107';
    return '#4CAF50';
  }
  return '#2196F3';
}

// Parse message with character styling
export function styleMessage(content: string, character: Character | undefined): string {
  if (!character) return content;

  // Add random common phrase occasionally
  if (Math.random() < 0.3 && character.speakingStyle.commonPhrases.length > 0) {
    const phrase = character.speakingStyle.commonPhrases[
      Math.floor(Math.random() * character.speakingStyle.commonPhrases.length)
    ];
    return `${content} ${phrase}`;
  }

  return content;
}

// Advance time of day
export function advanceTime(state: GameState): GameState {
  const timeOrder: ('morning' | 'noon' | 'night')[] = ['morning', 'noon', 'night'];
  const currentIndex = timeOrder.indexOf(state.timeOfDay);

  if (currentIndex < 2) {
    return { ...state, timeOfDay: timeOrder[currentIndex + 1] };
  }

  // Advance to next day
  return {
    ...state,
    day: state.day + 1,
    timeOfDay: 'morning',
  };
}

// Check if an event should trigger
export function shouldTriggerEvent(state: GameState, event: WeeklyEvent): boolean {
  return state.day === event.trigger.day &&
    (!event.trigger.timeOfDay || state.timeOfDay === event.trigger.timeOfDay);
}
