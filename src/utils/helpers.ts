import type { GameState, Character, ConsequenceEffect } from '../types';

// Load characters from JSON, prefixing asset paths with Vite's base
export async function loadCharacters(): Promise<Character[]> {
  const data = await import('../../data/characters/characters.json');
  const base = import.meta.env.BASE_URL || '/';

  return (data.characters as unknown as Character[]).map(char => ({
    ...char,
    avatar: char.avatar.startsWith('/') ? `${base}${char.avatar.slice(1)}` : char.avatar,
    fullBody: char.fullBody.startsWith('/') ? `${base}${char.fullBody.slice(1)}` : char.fullBody,
  }));
}

// Apply consequences to game state
export function applyConsequences(
  state: GameState,
  consequences: ConsequenceEffect[]
): GameState {
  const newState = { ...state };

  consequences.forEach((effect) => {
    if (effect.target === 'bloom' && effect.characterId) {
      const current = newState.characterBloom[effect.characterId] || 0;
      newState.characterBloom = {
        ...newState.characterBloom,
        [effect.characterId]: Math.max(0, Math.min(100, current + effect.value)),
      };
    } else if (effect.target === 'unlock' && effect.targetId) {
      if (!newState.unlockedChannels.includes(effect.targetId)) {
        newState.unlockedChannels = [...newState.unlockedChannels, effect.targetId];
      }
    }
  });

  return newState;
}

// Generate initial game state
export function createInitialState(): GameState {
  return {
    day: 1,
    timeOfDay: 'morning',
    characterBloom: {
      miho: 8,
      sohee: 5,
      sujin: 12,
      hyunju: 10,
    },
    unlockedChannels: ['miho', 'sohee', 'sujin', 'hyunju'],
    currentChannel: 'miho',
    choices: [],
    consequences: [],
    messages: [],
    conversationCount: {
      miho: 0,
      sohee: 0,
      sujin: 0,
      hyunju: 0,
    },
    bloomTokensEarned: {
      miho: [],
      sohee: [],
      sujin: [],
      hyunju: [],
    },
  };
}

// Get the current bloom stage for a character
export function getBloomStage(character: Character, bloomValue: number) {
  return character.bloomStages?.find(
    (stage) => bloomValue >= stage.range[0] && bloomValue <= stage.range[1]
  ) || character.bloomStages?.[0];
}

// Get bloom level as a fraction of 5 hearts
export function getBloomHearts(bloomValue: number): { filled: number; partial: boolean } {
  const heartValue = bloomValue / 20; // Each heart = 20 points
  const filled = Math.floor(heartValue);
  const partial = heartValue % 1 >= 0.5;
  return { filled, partial };
}
