// AI Service for dynamic character responses using Anthropic API
import type { Character, GameState, Message } from '../types';
import { getBloomStage } from './helpers';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const API_URL = 'https://api.anthropic.com/v1/messages';

interface AIGenerateParams {
  character: Character;
  gameState: GameState;
  conversationHistory: Message[];
  playerMessage?: string;
}

export async function generateCharacterResponse({
  character,
  gameState,
  conversationHistory,
  playerMessage,
}: AIGenerateParams): Promise<string> {
  const bloomValue = gameState.characterBloom[character.id] || 0;
  const bloomStage = getBloomStage(character, bloomValue);
  const systemPrompt = buildSystemPrompt(character, bloomStage, bloomValue);
  const historyText = buildConversationHistory(conversationHistory, character.id);

  const userMessage = playerMessage
    ? `The player says: "${playerMessage}". Respond as ${character.name} would at bloom level ${bloomValue}/100 (stage: ${bloomStage?.name}).`
    : `Continue the conversation as ${character.name}. You are at bloom level ${bloomValue}/100.`;

  if (!ANTHROPIC_API_KEY) {
    return getFallbackResponse(character, bloomValue);
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${historyText}\n\n${userMessage}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API Error:', await response.text());
      return getFallbackResponse(character, bloomValue);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return getFallbackResponse(character, bloomValue);
    }

    return formatResponse(content);
  } catch (error) {
    console.error('AI Generation Error:', error);
    return getFallbackResponse(character, bloomValue);
  }
}

function buildSystemPrompt(
  character: Character,
  bloomStage: ReturnType<typeof getBloomStage>,
  bloomValue: number
): string {
  const isWilted = bloomValue <= 20;
  const isBlooming = bloomValue >= 80;

  // Use darkSelf at low bloom, originalSelf at high bloom
  const selfContext = isWilted
    ? `You are deep in your DARK SELF:
- Personality: ${character.darkSelf.personality}
- Behavior: ${character.darkSelf.behavior}
- Inner monologue: ${character.darkSelf.innerMonologue}
- Defense mechanism: ${character.darkSelf.defense}`
    : isBlooming
    ? `You are emerging into your ORIGINAL SELF:
- Personality: ${character.originalSelf.personality}
- Behavior: ${character.originalSelf.behavior}
- This is your signature moment: ${character.originalSelf.signatureMoment}`
    : `You are somewhere between your dark self and original self.
- Dark tendencies: ${character.darkSelf.behavior}
- But glimpses of: ${character.originalSelf.personality}`;

  return `You are ${character.name} (${character.fullName}), ${character.age}, ${character.species}.
MBTI: ${character.mbti}. ${character.tagline}

BACKGROUND: ${character.background}

${selfContext}

CURRENT BLOOM STAGE: ${bloomStage?.name} (${bloomValue}/100)
${bloomStage ? `- Personality at this stage: ${bloomStage.personality}
- Speaking style: ${bloomStage.speakingStyle}
- Will talk about: ${bloomStage.unlockedTopics?.join(', ')}
- Resistance: ${bloomStage.resistanceBehavior}` : ''}

SPEAKING STYLE: ${character.speakingStyle.style}
Emotional tone: ${character.speakingStyle.emotionalTone}
Habits: ${character.speakingStyle.conversationHabits}
Signature phrases: ${character.speakingStyle.signaturePhrases?.join(', ')}

EMOTIONAL LOGIC:
- Triggers: ${character.emotionalLogic.triggers?.join(', ')}
- Comfort topics: ${character.emotionalLogic.comfortTopics?.join(', ')}
- Avoidance topics: ${character.emotionalLogic.avoidanceTopics?.join(', ')}
- Coping style: ${character.emotionalLogic.copingStyle}

RULES:
1. Stay IN CHARACTER at all times
2. Responses must be SHORT (1-3 sentences) — like real text messages
3. Match your bloom stage — at low bloom, be guarded/broken. At high bloom, show warmth
4. If bloom < 20: deflect with humor, sarcasm, or silence. Don't open up easily
5. If bloom 20-60: show cracks. Let small truths slip out. Then pull back
6. If bloom > 60: be more vulnerable. Share real feelings. Still have bad days
7. NEVER break character or mention you're an AI
8. Use your signature phrases naturally
9. The player is trying to help you heal. Healing is SLOW. Don't trust too easily
10. You are a broken person who once dreamed of being an idol. That dream died. You're figuring out what's left`;
}

function buildConversationHistory(messages: Message[], _characterId: string): string {
  const recent = messages.slice(-10);
  if (recent.length === 0) return '';

  return 'Recent conversation:\n' + recent
    .map((msg) => {
      const prefix = msg.isPlayer ? 'Player' : msg.characterId;
      return `${prefix}: ${msg.content}`;
    })
    .join('\n');
}

function formatResponse(response: string): string {
  let formatted = response.trim();

  // Remove quotes if wrapped
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1);
  }

  // Remove character name prefix if AI added it
  formatted = formatted.replace(/^[A-Za-z]+:\s*/, '');

  // Limit length
  if (formatted.length > 300) {
    formatted = formatted.slice(0, 297) + '...';
  }

  return formatted;
}

function getFallbackResponse(character: Character, bloomValue: number): string {
  const isWilted = bloomValue <= 20;

  const fallbacks: Record<string, { wilted: string[]; growing: string[] }> = {
    miho: {
      wilted: [
        "lol sorry i kinda zoned out there~",
        "i'm fine!! totally fine!! why wouldn't i be fine!!",
        "ahaha anyway let's talk about something else",
        "...you're still here? weird",
      ],
      growing: [
        "hey... thanks for being here",
        "i was just thinking about something you said earlier",
        "do you ever feel like... nevermind, it's stupid",
      ],
    },
    sohee: {
      wilted: [
        "...whatever",
        "sure. ok.",
        "doesn't matter anyway",
        "why do you even care",
      ],
      growing: [
        "...i guess that makes sense",
        "i hadn't thought of it that way",
        "that's... actually kind of nice to hear",
      ],
    },
    sujin: {
      wilted: [
        "it's fine. i can handle it",
        "i don't need help",
        "just leave it alone",
        "i said i'm okay.",
      ],
      growing: [
        "maybe... you have a point",
        "i want to believe that",
        "thank you. i mean it",
      ],
    },
    hyunju: {
      wilted: [
        "don't worry about me!! i'm great!!",
        "i can handle it!! i always do!!",
        "sorry sorry i'll do better!!",
        "it's my fault, i know",
      ],
      growing: [
        "you know... it's okay to not be perfect",
        "i'm learning that. slowly",
        "i don't have to prove anything to you, do i?",
      ],
    },
  };

  const charFallbacks = fallbacks[character.id];
  if (!charFallbacks) return "...";

  const options = isWilted ? charFallbacks.wilted : charFallbacks.growing;
  return options[Math.floor(Math.random() * options.length)];
}
