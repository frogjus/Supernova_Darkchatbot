// Bloom Token Detector
// Analyzes player messages to detect bloom-worthy interactions
// Uses keyword matching (fast, no API needed)
// Returns bloom token type + value, or null if no bloom effect

import type { BloomToken } from '../types';

interface DetectionResult {
  token: BloomToken | null;
  bloomDelta: number; // Can be negative for harmful messages
}

// Pattern sets for each token type
const PATTERNS: Record<string, { keywords: string[]; phrases: string[] }> = {
  encouragement: {
    keywords: ['believe', 'proud', 'strong', 'brave', 'amazing', 'capable', 'can do', 'got this', 'keep going', 'worth it', 'matters'],
    phrases: [
      'you can do',
      'i believe in',
      'you\'re stronger than',
      'don\'t give up',
      'you\'re not alone',
      'i\'m here for you',
      'you deserve',
      'you\'re doing great',
      'it gets better',
      'you matter',
      'rooting for you',
    ],
  },
  compliment: {
    keywords: ['pretty', 'beautiful', 'talented', 'smart', 'funny', 'cool', 'awesome', 'sweet', 'kind', 'cute'],
    phrases: [
      'you\'re so',
      'i like your',
      'i love your',
      'that\'s really',
      'you look',
      'you sound',
    ],
  },
  patience: {
    keywords: ['okay', 'understand', 'take your time', 'no rush', 'whenever', 'ready', 'no pressure'],
    phrases: [
      'it\'s okay',
      'that\'s okay',
      'take your time',
      'no rush',
      'i\'ll wait',
      'when you\'re ready',
      'no pressure',
      'i understand',
      'it\'s alright',
      'don\'t worry about it',
      'i\'m not going anywhere',
      'still here',
      'i\'ll be here',
    ],
  },
  vulnerability: {
    keywords: [],
    phrases: [
      'tell me about',
      'what happened',
      'how do you feel',
      'what\'s wrong',
      'want to talk about',
      'can you tell me',
      'i want to understand',
      'what are you afraid of',
      'what hurts',
      'how are you really',
    ],
  },
  boundary: {
    keywords: [],
    phrases: [
      'that\'s not okay',
      'you shouldn\'t have to',
      'that\'s not your fault',
      'you don\'t have to pretend',
      'stop blaming yourself',
      'it\'s not your job to',
      'you don\'t owe',
      'that\'s not fair to you',
      'you\'re being too hard on yourself',
      'it wasn\'t your fault',
      'you deserve better',
    ],
  },
};

// Negative patterns that HURT bloom
const NEGATIVE_PATTERNS = {
  platitude: {
    phrases: [
      'just be happy',
      'cheer up',
      'just smile',
      'it could be worse',
      'other people have it worse',
      'just get over it',
      'stop being sad',
      'just think positive',
      'everything happens for a reason',
      'you\'ll be fine',
      'just relax',
    ],
    value: -1,
  },
  pushing: {
    phrases: [
      'just tell me',
      'why won\'t you',
      'stop being',
      'you need to',
      'you have to',
      'just do it',
      'stop crying',
      'grow up',
      'get over',
      'move on already',
      'snap out of it',
    ],
    value: -2,
  },
};

const TOKEN_VALUES: Record<string, number> = {
  encouragement: 2,
  compliment: 1,
  patience: 3,
  vulnerability: 4,
  consistency: 2,
  boundary: 3,
};

export function detectBloomToken(playerMessage: string, conversationCount: number): DetectionResult {
  const msg = playerMessage.toLowerCase().trim();

  // Check negative patterns first
  for (const [_type, pattern] of Object.entries(NEGATIVE_PATTERNS)) {
    for (const phrase of pattern.phrases) {
      if (msg.includes(phrase)) {
        return {
          token: null,
          bloomDelta: pattern.value,
        };
      }
    }
  }

  // Check positive patterns — find the BEST match (highest value)
  let bestMatch: { type: string; score: number } | null = null;

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    let score = 0;

    // Check phrases (stronger signal)
    for (const phrase of pattern.phrases) {
      if (msg.includes(phrase)) {
        score += 3;
      }
    }

    // Check keywords (weaker signal)
    for (const keyword of pattern.keywords) {
      if (msg.includes(keyword)) {
        score += 1;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { type, score };
    }
  }

  if (bestMatch) {
    const tokenType = bestMatch.type as BloomToken['type'];
    const value = TOKEN_VALUES[tokenType] || 1;

    return {
      token: {
        type: tokenType,
        value,
        description: playerMessage.slice(0, 80),
      },
      bloomDelta: value,
    };
  }

  // Consistency bonus — every 5th message in a conversation
  if (conversationCount > 0 && conversationCount % 5 === 0) {
    return {
      token: {
        type: 'consistency',
        value: TOKEN_VALUES.consistency,
        description: `Conversation #${conversationCount} — you keep coming back`,
      },
      bloomDelta: TOKEN_VALUES.consistency,
    };
  }

  // No match — neutral message, no bloom change
  return { token: null, bloomDelta: 0 };
}
