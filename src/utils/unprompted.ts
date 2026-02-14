// Unprompted messages — characters text you while you're away
// ~30% chance when switching back to their channel
// These make them feel alive, like real people who think about you

import type { Message } from '../types';

interface UnpromptedSet {
  wilted: string[];
  growing: string[];
}

const UNPROMPTED: Record<string, UnpromptedSet> = {
  miho: {
    wilted: [
      "hey are you there?? hello?? lol sorry i'm not being clingy i just",
      "i had that dream again. the one where he's standing backstage, smiling. yuseongshin.",
      "do you ever look at someone and think... nevermind forget i said anything haha",
      "he said munyeol would be at the showcase. i believed him. i'm so stupid.",
      "were you talking to the others? that's fine!! totally fine!! i'm not jealous haha",
      "*sent you 3 messages and deleted all of them*",
    ],
    growing: [
      "i was thinking about something you said earlier... you actually listen, don't you?",
      "hey. i realized something about yuseongshin today. about the promises he made.",
      "the sky is really pretty right now. yuseongshin can't have this.",
      "i tried being quiet for 5 minutes today. it was terrifying. but i did it.",
      "do you think supernova could still happen? like... for real this time?",
    ],
  },
  sohee: {
    wilted: [
      "...",
      "forget it.",
      "i found something. about my father's business partner. forget i said anything.",
      "the apartment is too quiet today",
      "*typing...*",
    ],
    growing: [
      "i heard a song today that didn't make me want to disappear. yuseongshin doesn't own music.",
      "hey. i thought of you. that's it. that's the message.",
      "i've been looking into what happened to my father's company. the timing... it wasn't an accident.",
      "*left a voice note but it's just 8 seconds of silence and then a sigh*",
      "do you think someone can owe a debt to a person who set them up?",
    ],
  },
  sujin: {
    wilted: [
      "everything's handled. you don't need to worry about me.",
      "i keep finding seoha's name in places it shouldn't be. connected to people it shouldn't be.",
      "sorry for bothering you. you're probably busy.",
      "i should have fought back then. i should have said his name.",
      "do you need anything? i can help.",
    ],
    growing: [
      "i said no to something today. my hands were shaking but i said no.",
      "seoha didn't act alone. i'm starting to see the whole picture now.",
      "someone told me i work too hard and i... didn't argue. that felt weird.",
      "yuseongshin picked us because we were already broken. but what if we're not?",
      "hey. i wrote a rap today. about him. about all of it. and i didn't delete it.",
    ],
  },
  hyunju: {
    wilted: [
      "sorry!! i know i'm a lot!! i'll try to be less!!",
      "yuseongshin told my mom things. about my trainee evaluations. things that weren't true.",
      "do you think i'm annoying?? you can be honest!! i can take it!! probably!!",
      "i practiced my smile in the mirror for 20 minutes. is that normal??",
      "everyone else seems to know how to just... be. how do they do that??",
    ],
    growing: [
      "i drew something ugly on purpose today and i didn't throw it away",
      "hey... my mom called. she said yuseongshin used to call her too. she didn't know.",
      "i think i've been performing for someone who wanted me to fail",
      "someone said my drawing was bad and i only cried for like 5 minutes. growth!!",
      "what if being enough was never the problem? what if the system was rigged?",
    ],
  },
};

// Track last unprompted time per character to prevent spam
const lastUnprompted: Record<string, number> = {};

export function getUnpromptedMessage(characterId: string, bloomValue: number): Message | null {
  // 15% chance — enough to feel alive without being overwhelming
  if (Math.random() > 0.15) return null;

  // Minimum 3 minutes between unprompted messages per character
  const now = Date.now();
  const lastTime = lastUnprompted[characterId] || 0;
  if (now - lastTime < 180000) return null;

  const charMessages = UNPROMPTED[characterId];
  if (!charMessages) return null;

  const isWilted = bloomValue <= 30;
  const pool = isWilted ? charMessages.wilted : charMessages.growing;
  const content = pool[Math.floor(Math.random() * pool.length)];

  lastUnprompted[characterId] = now;

  return {
    id: `unprompted_${characterId}_${Date.now()}`,
    characterId,
    content,
    timestamp: Date.now(),
  };
}
