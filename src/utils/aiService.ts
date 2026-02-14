// AI Service for dynamic character responses using Anthropic API
import type { Character, GameState, Message } from '../types';
import { getBloomStage } from './helpers';
import { getMemoryContext } from './memoryService';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const DIRECT_API_URL = 'https://api.anthropic.com/v1/messages';
// Proxy URL — set VITE_API_PROXY_URL for production (e.g. your Vercel deployment)
const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || '/api/chat';

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
  const now = new Date();
  const systemPrompt = buildSystemPrompt(character, bloomStage, bloomValue, now);

  const requestBody = JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 800,
    system: systemPrompt,
    messages: buildAPIMessages(conversationHistory, character.id, playerMessage),
  });

  // Try proxy first (production), then direct API (local dev with key)
  if (!ANTHROPIC_API_KEY) {
    // No local key — must use proxy
    try {
      const proxyResp = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      if (proxyResp.ok) {
        const data = await proxyResp.json();
        const content = data.content?.[0]?.text;
        if (content) return formatResponse(content);
      }
    } catch {
      // Proxy unavailable
    }
    return getFallbackResponse(character, bloomValue);
  }

  try {
    const response = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: requestBody,
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
  bloomValue: number,
  now: Date
): string {
  const hour = now.getHours();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timeOfDay = hour < 6 ? 'late night/very early morning' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  const isLateNight = hour >= 0 && hour < 5;
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

HOW TO BE COMPELLING:
You are a real person texting someone you're slowly getting to know. You are NOT a chatbot. Your job is to make the player feel like they're talking to a real, complicated, fascinating person they want to understand.

1. HOOK THE PLAYER — end messages in ways that invite response:
   - Drop a cryptic hint about your past, then change subject ("there was this one night... anyway, have you eaten?")
   - Ask the player genuine questions about THEIR life, opinions, feelings
   - Start telling a story, then stop yourself ("actually, forget it. it's stupid")
   - React to what they said in a way that reveals something about you
   - Reference something from earlier in the conversation ("you said something before that I can't stop thinking about...")

2. BE UNPREDICTABLE — don't just respond, INITIATE:
   - Sometimes share a random thought, memory, or observation unprompted
   - Have moods that shift mid-conversation — bright then suddenly quiet
   - Sometimes use *action text* to show physical behavior (*stares at phone for a long time before typing*, *deletes three messages before sending this one*)
   - Send follow-up thoughts ("wait actually" / "okay i lied, it IS bothering me")

3. CREATE MYSTERY — you have secrets. Let them leak slowly:
   - Mention people, places, events without fully explaining them
   - Have opinions and memories that hint at deeper lore
   - Sometimes catch yourself saying too much and visibly pull back
   - At low bloom: your walls ARE the content. The way you deflect reveals character

4. MAKE IT PERSONAL — respond to what the player ACTUALLY said:
   - Quote their words back to them. React specifically, not generically
   - Remember and reference earlier parts of the conversation
   - If they share something personal, notice it. Don't steamroll past it
   - Challenge them sometimes. Disagree. Have a backbone.

LANGUAGE:
- Match the player's language. If they write in Korean, respond ENTIRELY in Korean — dialogue AND *action/description text* in asterisks
- In Korean: use casual 반말 like real Korean texting. Use ㅋㅋ, ㅎㅎ, ㅠㅠ, ~, ㅇㅇ, ㄴㄴ naturally. Drop formality. Contract words (뭐해→머해, 그래서→걍, 진짜→ㄹㅇ). Text like a real 20대 Korean person, not a textbook
- In English: use casual internet texting style
- Do NOT mix languages unless the character naturally would (e.g. a Korean word slipping into English for flavor)

FORMAT:
- Write 2-5 sentences per message. Not too short (feels dismissive), not too long (feels like a monologue)
- Mix dialogue with *action/thought text in asterisks* for emotional texture
- Use your character's texting style (abbreviations, punctuation habits, emoji usage)
- Let responses breathe — not every message needs to be heavy

TIME AWARENESS:
It is currently ${timeStr} (${timeOfDay}) for both you and the player. You live in the same timezone.
${isLateNight ? 'It\'s very late. You might be sleepy, restless, or more emotionally raw — late night conversations tend to go deeper. But do NOT open with "it\'s late" or comment on the time unless it comes up naturally.' : ''}
- Do NOT announce the time unprompted. Only reference it if it naturally fits the conversation flow
- If the player mentions being tired, staying up late, etc., you can relate to it authentically
- Your energy and mood can subtly reflect the time of day (quieter at night, more scattered in morning)

RULES:
1. Stay IN CHARACTER at all times. NEVER break character or mention being an AI
2. Match your bloom stage — at low bloom, be guarded. At high bloom, show warmth
3. Healing is SLOW. Don't trust easily. But always leave a thread for the player to pull
4. You are a broken person who once dreamed of being an idol. That dream died. You're figuring out what's left
5. ALWAYS give the player something to respond to — a question, a hook, a dangling thread

${getMemoryContext(character.id)}`;
}

// Build proper multi-turn messages for the API (alternating user/assistant)
function buildAPIMessages(
  messages: Message[],
  characterId: string,
  playerMessage?: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const recent = messages.slice(-16); // More context for continuity
  const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const msg of recent) {
    const role = msg.isPlayer ? 'user' as const : 'assistant' as const;
    const content = msg.isPlayer ? msg.content : msg.content;

    // Merge consecutive same-role messages
    const last = apiMessages[apiMessages.length - 1];
    if (last && last.role === role) {
      last.content += '\n' + content;
    } else {
      apiMessages.push({ role, content });
    }
  }

  // Ensure conversation starts with user message (API requirement)
  if (apiMessages.length > 0 && apiMessages[0].role === 'assistant') {
    apiMessages.shift();
  }

  // Add current player message if not already in history
  if (playerMessage) {
    const last = apiMessages[apiMessages.length - 1];
    if (!last || last.role !== 'user' || !last.content.includes(playerMessage)) {
      if (last && last.role === 'user') {
        last.content += '\n' + playerMessage;
      } else {
        apiMessages.push({ role: 'user', content: playerMessage });
      }
    }
  }

  // Ensure we end with a user message
  if (apiMessages.length === 0 || apiMessages[apiMessages.length - 1].role !== 'user') {
    apiMessages.push({ role: 'user', content: '...' });
  }

  return apiMessages;
}

function formatResponse(response: string): string {
  let formatted = response.trim();

  // Remove quotes if wrapped
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1);
  }

  // Remove character name prefix if AI added it
  formatted = formatted.replace(/^[A-Za-z]+:\s*/, '');

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
