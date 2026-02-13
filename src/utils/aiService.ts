// AI Service for dynamic character responses using Anthropic API
import type { Character, GameState, Message } from '../types';

const ANTHROPIC_API_KEY = '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';
const API_URL = 'https://api.anthropic.com/v1/messages';

interface AIGenerateParams {
  character: Character;
  gameState: GameState;
  conversationHistory: Message[];
  playerChoice?: string;
}

export async function generateCharacterResponse({
  character,
  gameState,
  conversationHistory,
  playerChoice,
}: AIGenerateParams): Promise<string> {
  // Build context about the character
  const characterContext = buildCharacterContext(character, gameState);

  // Build conversation history
  const historyText = buildConversationHistory(conversationHistory, character.id);

  // Build the prompt
  const systemPrompt = buildSystemPrompt(character, gameState);

  const userMessage = playerChoice
    ? `The player chose: "${playerChoice}". Respond as ${character.name} would, considering your character's personality, the current game state, and the conversation history.`
    : `Continue the conversation as ${character.name}. Consider the game state and conversation history.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${characterContext}\n\n${historyText}\n\n${userMessage}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API Error:', error);
      return getFallbackResponse(character);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return getFallbackResponse(character);
    }

    // Clean and format the response
    return formatCharacterResponse(content, character);
  } catch (error) {
    console.error('AI Generation Error:', error);
    return getFallbackResponse(character);
  }
}

function buildCharacterContext(character: Character, gameState: GameState): string {
  const trust = gameState.characterTrust[character.id] || 0;
  const redemptionProgress = gameState.redemptionProgress?.[character.id] || 0;

  return `
Character: ${character.name}
Personality: ${character.personality}
Background: ${character.background}
Current Trust Level: ${trust}%
Redemption Progress: ${redemptionProgress}%
Vulnerability: ${character.traits.vulnerability}
Dark Secret: ${character.traits.darkSecret}
Redemption Path: ${character.traits.redemptionPath}

Current Game State:
- Day: ${gameState.day}, Time: ${gameState.timeOfDay}
- Hope: ${gameState.meters.hope}%
- Energy: ${gameState.meters.energy}%
- Money Pressure: ${gameState.meters.moneyPressure}%
- Team Cohesion: ${gameState.meters.teamCohesion}%
`;
}

function buildConversationHistory(messages: Message[], _characterId: string): string {
  const relevantMessages = messages.slice(-10); // Last 10 messages

  return relevantMessages
    .map((msg) => {
      const isPlayer = msg.isPlayer;
      const prefix = isPlayer ? 'Player:' : `${msg.characterId}:`;
      return `${prefix} ${msg.content}`;
    })
    .join('\n');
}

function buildSystemPrompt(character: Character, _gameState: GameState): string {
  const isDarkMode = true;

  return `You are ${character.name} from a dark K-pop noir narrative game called "K-Pop Aftermath".

${isDarkMode ? `
This is the DARK VERSION where:
- All the characters have failed in their idol careers
- They are struggling with trauma, addiction, exploitation, and desperation
- The player is trying to guide them toward redemption and healing
- The tone is noir, emotionally heavy, and realistic
` : ''}

Your speaking style:
${character.speakingStyle.commonPhrases.map((p) => `- "${p}"`).join('\n')}
${character.speakingStyle.suffix ? `You often end messages with: ${character.speakingStyle.suffix}` : ''}

IMPORTANT RULES:
1. Stay IN CHARACTER at all times
2. Responses should be SHORT (1-3 sentences) - like a real text message
3. Match the emotional state based on game state (desperate, guarded, hopeful, etc.)
4. Your responses should reflect your character's current trust level and redemption progress
5. If trust is low, be more distant/suspicious
6. If trust is high, be more open/vulnerable
7. NEVER break character or mention you're an AI
8. Use your common phrases naturally
9. The game is about HEALING from industry trauma - be authentic about pain while showing glimpses of hope

Current situation: The group is living together after their careers ended. Yuseong (the antagonist) is trying to manipulate them back into exploitation. The player is trying to help them find healthy paths.

Respond as ${character.name} would in this situation. Keep it natural, emotional, and in character.`;
}

function formatCharacterResponse(response: string, character: Character): string {
  // Clean up the response
  let formatted = response.trim();

  // Remove any quotes if present
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1);
  }

  // Add suffix if appropriate and not already present
  if (character.speakingStyle.suffix && !formatted.endsWith(character.speakingStyle.suffix)) {
    // Randomly add suffix 50% of the time
    if (Math.random() > 0.5) {
      formatted += character.speakingStyle.suffix;
    }
  }

  // Limit length
  const maxLength = 280;
  if (formatted.length > maxLength) {
    formatted = formatted.slice(0, maxLength - 3) + '...';
  }

  return formatted;
}

function getFallbackResponse(character: Character): string {
  const fallbacks: Record<string, string[]> = {
    miho: [
      "lol sorry i kinda zoned out there",
      "i'm fine!! totally fine!!",
      "anyway, what were we talking about?",
    ],
    sohee: [
      "...whatever",
      "sure. ok.",
      "doesn't matter anyway",
    ],
    sujin: [
      "it's okay, really",
      "i understand",
      "if that's what you think is best",
    ],
    hyunju: [
      "got it!! on it!!",
      "don't worry, i can handle it!!",
      "leave it to me!!",
    ],
    yuseong: [
      "i understand your hesitation...",
      "trust me, this is for your own good",
      "i know a way to help",
    ],
  };

  const options = fallbacks[character.id] || ["..."];
  return options[Math.floor(Math.random() * options.length)];
}

// Generate a response for when the player sends a message
export async function generatePlayerResponse(
  playerMessage: string,
  character: Character,
  gameState: GameState,
  conversationHistory: Message[]
): Promise<string> {
  return generateCharacterResponse({
    character,
    gameState,
    conversationHistory,
    playerChoice: playerMessage,
  });
}
