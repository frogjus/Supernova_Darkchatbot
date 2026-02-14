// Initial greeting messages per character
// These are bloom-stage-aware: characters start wilted, so greetings are guarded
// Multiple options per character — one is chosen randomly

import type { Message } from '../types';

interface GreetingSet {
  wilted: string[];   // bloom 0-20
  roots: string[];    // bloom 21-40
  sprout: string[];   // bloom 41-60
  budding: string[];  // bloom 61-80
  blooming: string[]; // bloom 81-100
}

const GREETINGS: Record<string, GreetingSet> = {
  miho: {
    wilted: [
      "oh... another one. hi hi~ welcome to the miho show!! 🎉 ...haha just kidding. what do you want?",
      "hiii~! i'm miho! i'm totally fine and having a great day!! ...why are you looking at me like that?",
      "lol hey. don't mind the mess. or me. i'm great!! everything's great!! ✨",
    ],
    roots: [
      "oh hey... you're back. i didn't think you would be.",
      "hi again. i was just... sitting here. it's fine. what's up?",
    ],
    sprout: [
      "hey! i actually kinda hoped you'd come by today.",
      "oh! you're here~ i was just thinking about something you said last time.",
    ],
    budding: [
      "you know what, i'm actually happy to see you. is that weird? that's probably weird.",
      "hiii~ okay so i have to tell you about this thing that happened—",
    ],
    blooming: [
      "hey you 💕 i've been looking forward to this all day.",
      "you're here! okay okay sit down, i have so much to tell you~",
    ],
  },
  sohee: {
    wilted: [
      "...hi.",
      "oh. you're here. ...okay.",
      "what do you want.",
    ],
    roots: [
      "...hey. i guess you're back.",
      "hi. ...sorry, i'm not great at this.",
    ],
    sprout: [
      "hey. ...it's kind of nice that you keep showing up.",
      "hi. i made tea. there's enough for two. if you want.",
    ],
    budding: [
      "hey. i was actually hoping you'd come by.",
      "hi... i wrote something today. maybe i'll show you. maybe.",
    ],
    blooming: [
      "hey. i'm glad you're here. i mean it.",
      "hi. ...i smiled when i saw you were here. don't tell anyone.",
    ],
  },
  sujin: {
    wilted: [
      "oh— hi. sorry, were you waiting? i should have been ready. i'm sorry.",
      "hello. is there something you need? i can help. just tell me what to do.",
      "hi. i'm fine. everything's handled. don't worry about me.",
    ],
    roots: [
      "hi. ...you don't have to check on me, you know. but... thanks.",
      "oh, hello. i was just cleaning. again. it helps me think.",
    ],
    sprout: [
      "hey. i've been thinking about what you said. about it not being my fault.",
      "hi. ...i tried something today. saying no. it was terrifying.",
    ],
    budding: [
      "hey! i... actually did something for myself today. just for me.",
      "hi. i have a question. is it okay to want things? for yourself?",
    ],
    blooming: [
      "hey. i'm learning that i don't have to earn the right to exist.",
      "hi. i said no to something today and the world didn't end. imagine that.",
    ],
  },
  hyunju: {
    wilted: [
      "hi!! oh gosh sorry am i too much?? i can be quieter!! sorry!!",
      "hello~!! i'm hyunju!! i'll do my best!! ...is that okay?? am i doing this right??",
      "hi!! don't worry about me i'm totally fine haha!! anyway how are YOU??",
    ],
    roots: [
      "oh hi... sorry, i'm a little tired today. but i'm fine!! totally fine.",
      "hey... is it okay if i'm not super energetic right now?",
    ],
    sprout: [
      "hi! ...you know, i've been thinking. maybe i don't have to be 'on' all the time.",
      "hey. i didn't practice smiling before you came today. that's... new.",
    ],
    budding: [
      "hey! i messed up a drawing today and i didn't throw it away. progress?",
      "hi~ i tried being honest with someone today instead of just agreeing. it was scary.",
    ],
    blooming: [
      "hey 🌸 i'm not perfect and i think that might actually be okay.",
      "hi! i drew something ugly on purpose today and i LOVED it.",
    ],
  },
};

function getBloomTier(bloomValue: number): keyof GreetingSet {
  if (bloomValue <= 20) return 'wilted';
  if (bloomValue <= 40) return 'roots';
  if (bloomValue <= 60) return 'sprout';
  if (bloomValue <= 80) return 'budding';
  return 'blooming';
}

export function getGreetingMessage(characterId: string, bloomValue: number): Message | null {
  const charGreetings = GREETINGS[characterId];
  if (!charGreetings) return null;

  const tier = getBloomTier(bloomValue);
  const options = charGreetings[tier];
  if (!options || options.length === 0) return null;

  const content = options[Math.floor(Math.random() * options.length)];

  return {
    id: `greeting_${characterId}_${Date.now()}`,
    characterId,
    content,
    timestamp: Date.now(),
  };
}
