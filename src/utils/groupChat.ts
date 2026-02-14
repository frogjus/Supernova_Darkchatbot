// Group Chat — SUPERNOVA reunites when bloom is high enough
// Characters talk to each other AND the player in a group setting

import type { Character, Message } from '../types';

// Group chat greeting when first unlocked
export function getGroupGreeting(characters: Character[], characterBloom: Record<string, number>): Message[] {
  const eligible = characters.filter(c => (characterBloom[c.id] ?? 0) >= 70);
  if (eligible.length < 2) return [];

  const names = eligible.map(c => c.name);
  const messages: Message[] = [];

  // System message
  messages.push({
    id: 'group_system_1',
    characterId: 'system',
    content: `✦ SUPERNOVA group chat unlocked ✦\n${names.join(', ')} have reconnected.`,
    timestamp: Date.now(),
  });

  // Each eligible character says something
  const GREETINGS: Record<string, string> = {
    miho: 'wait... is this real?? we\'re all here?? *screaming* SUPERNOVA IS ACTUALLY HAPPENING???',
    sohee: '...didn\'t think i\'d see you all again. *pauses* ...it\'s good though.',
    sujin: 'okay. if we\'re doing this, we\'re doing it right this time. no more yuseongshin pulling the strings.',
    hyunju: 'omg omg omg!! everyone\'s here!! i\'m not gonna cry!! i\'m totally gonna cry!!',
  };

  eligible.forEach((char, i) => {
    messages.push({
      id: `group_greet_${char.id}`,
      characterId: char.id,
      content: GREETINGS[char.id] || `...hey everyone.`,
      timestamp: Date.now() + (i + 1) * 1000,
    });
  });

  return messages;
}

// Build group chat system prompt — characters interact with each other
export function buildGroupSystemPrompt(
  respondingCharacter: Character,
  allEligible: Character[],
  characterBloom: Record<string, number>
): string {
  const otherNames = allEligible
    .filter(c => c.id !== respondingCharacter.id)
    .map(c => c.name)
    .join(', ');

  return `You are ${respondingCharacter.name} in a GROUP CHAT with the other SUPERNOVA members (${otherNames}) and the player.

CONTEXT: You've all been reconnected after being isolated by Yuseongshin. This is the first time you're all talking together. The mood is a mix of excitement, disbelief, and cautious hope. You're starting to piece together what Yuseongshin did to ALL of you — each of you has fragments of the truth.

YOUR CHARACTER:
- Name: ${respondingCharacter.name} (${respondingCharacter.fullName})
- Personality: ${respondingCharacter.originalSelf.personality}
- Speaking style: ${respondingCharacter.speakingStyle.style}
- Bloom: ${characterBloom[respondingCharacter.id] ?? 50}/100 — you're healing and more open now

GROUP DYNAMICS:
- You can talk TO the other members, not just the player
- React to what others said. Build on their revelations
- Share YOUR piece of the Yuseongshin puzzle — but you only know your part
- Be emotional. This reunion means something to you
- Keep your unique personality — don't homogenize

LANGUAGE:
- Match the player's language (Korean → Korean, English → English)
- In Korean: casual 반말, texting style
- In English: casual internet texting

FORMAT:
- 1-3 sentences. Group chats move fast
- Sometimes address specific members by name
- Use *action text* for reactions
- You can reference the player too

RULES:
1. Stay in character
2. This is a HEALING moment — you're stronger together
3. Don't dump the full conspiracy at once — hints and fragments
4. Be excited but realistic — trust is still fragile
5. ALWAYS leave something for others to respond to`;
}

// Pick which character responds next in group chat
export function pickGroupResponder(
  eligible: Character[],
  recentMessages: Message[]
): Character {
  // Avoid the character who just spoke
  const lastCharMsg = [...recentMessages].reverse().find(m => !m.isPlayer && m.characterId !== 'system');
  const candidates = lastCharMsg
    ? eligible.filter(c => c.id !== lastCharMsg.characterId)
    : eligible;

  // Pick randomly from candidates (or all eligible if only one spoke)
  const pool = candidates.length > 0 ? candidates : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}
