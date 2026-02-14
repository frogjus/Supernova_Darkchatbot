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
      "i had that dream again. the one where everyone's watching me but i can't hear the music",
      "do you ever look at someone and think... nevermind forget i said anything haha",
      "i counted the ceiling tiles. there are 47. just in case you were wondering!!",
      "were you talking to the others? that's fine!! totally fine!! i'm not jealous haha",
      "*sent you 3 messages and deleted all of them*",
    ],
    growing: [
      "i was thinking about something you said earlier... you actually listen, don't you?",
      "hey. i made something. it's probably stupid but... i want to show you later",
      "the sky is really pretty right now. i wish you could see it",
      "i tried being quiet for 5 minutes today. it was terrifying. but i did it.",
      "do you believe people can actually change? like actually?",
    ],
  },
  sohee: {
    wilted: [
      "...",
      "forget it.",
      "i wrote something. then i deleted it. doesn't matter.",
      "the apartment is too quiet today",
      "*typing...*",
    ],
    growing: [
      "i heard a song today that didn't make me want to disappear. that's... something",
      "hey. i thought of you. that's it. that's the message.",
      "i wrote two whole lines today. they might even be good.",
      "*left a voice note but it's just 8 seconds of silence and then a sigh*",
      "do you ever read something and feel like someone reached inside your chest?",
    ],
  },
  sujin: {
    wilted: [
      "everything's handled. you don't need to worry about me.",
      "i reorganized my desk again. third time today. it's fine.",
      "sorry for bothering you. you're probably busy.",
      "i should have done better today. i'll try harder tomorrow.",
      "do you need anything? i can help.",
    ],
    growing: [
      "i said no to something today. my hands were shaking but i said no.",
      "is it selfish to want things for yourself? genuinely asking.",
      "someone told me i work too hard and i... didn't argue. that felt weird.",
      "i've been thinking about what i actually want. not what everyone needs from me. just... what i want.",
      "hey. i didn't clean today. on purpose. the world didn't end.",
    ],
  },
  hyunju: {
    wilted: [
      "sorry!! i know i'm a lot!! i'll try to be less!!",
      "i drew something but it's not good enough to show anyone",
      "do you think i'm annoying?? you can be honest!! i can take it!! probably!!",
      "i practiced my smile in the mirror for 20 minutes. is that normal??",
      "everyone else seems to know how to just... be. how do they do that??",
    ],
    growing: [
      "i drew something ugly on purpose today and i didn't throw it away",
      "hey... is it okay if i just talk to you without being cheerful? just this once?",
      "i think i've been performing my whole life. what if the real me is boring?",
      "someone said my drawing was bad and i only cried for like 5 minutes. growth!!",
      "i don't think i have to be perfect to deserve nice things. maybe. possibly. we'll see.",
    ],
  },
};

// Track last unprompted time per character to prevent spam
const lastUnprompted: Record<string, number> = {};

export function getUnpromptedMessage(characterId: string, bloomValue: number): Message | null {
  // 30% chance
  if (Math.random() > 0.3) return null;

  // Minimum 60 seconds between unprompted messages per character
  const now = Date.now();
  const lastTime = lastUnprompted[characterId] || 0;
  if (now - lastTime < 60000) return null;

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
