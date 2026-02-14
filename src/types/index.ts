// ==========================================
// BLOOM SYSTEM — The Plant Growth Mechanic
// ==========================================
// Each character has a "bloom" meter (0–100).
// 0 = wilted, broken, dark self
// 100 = full bloom, original self restored
// Progress is SLOW. Each positive interaction
// earns a small number of bloom tokens.
// Negative or careless interactions can wilt.

export interface BloomStage {
  name: string;           // "wilted" | "roots" | "sprout" | "budding" | "blooming"
  range: [number, number]; // [0, 20], [21, 40], etc.
  personality: string;     // How they behave at this stage
  speakingStyle: string;   // How their voice changes
  visualState: string;     // Description for rendering (grayscale → color)
  unlockedTopics: string[]; // What they'll talk about at this stage
  resistanceBehavior: string; // How they push you away at this stage
}

// ==========================================
// CHARACTER DEFINITIONS
// ==========================================

export interface Character {
  id: string;
  name: string;
  fullName: string;
  nicknames: string[];
  tagline: string;
  avatar: string;
  fullBody: string;
  color: string;
  accentColor: string;
  glowColor: string;
  gradientStart: string;
  gradientEnd: string;
  particleColor: string;

  // Identity
  mbti: string;
  age: string;
  birthday: string;
  species: string;
  roleType: string;
  coreFunction: string;
  domainSpecialization: string;

  // Life context
  lifeContext: {
    whereLiveNow: string;
    whereGrewUp: string;
    education: string;
    livingSituation: string;
    relationshipStatus: string;
    culturalIdentity: string;
    bigDreams: string;
    definingMemories: string[];
  };

  // The two selves
  darkSelf: {
    personality: string;
    behavior: string;
    innerMonologue: string;
    defense: string;
  };
  originalSelf: {
    personality: string;
    behavior: string;
    signatureMoment: string;
  };

  // Bloom stages — 5 stages of growth
  bloomStages: BloomStage[];

  // Core character data
  background: string;
  coreTraits: string[];
  strengths: string[];
  weaknesses: string[];
  motivations: string;
  insecurities: string;
  coreValues: string;

  // Interests
  interests: {
    hobbies: string[];
    favFoods: string[];
    leastFavFoods: string[];
    favMovies: string[];
    musicPreferences: string[];
    fashionStyle: string;
    spendingHabits: string;
    bigPassions: string;
    petPeeves: string[];
    phobias: string[];
  };

  // Body characteristics
  appearance: {
    height: string;
    hairColor: string;
    hairLength: string;
    eyeColor: string;
    notableMarks: string;
  };

  // Emotional logic
  emotionalLogic: {
    triggers: string[];
    negativePatterns: string;
    empathyExpression: string;
    conflictStyle: string;
    selfAwareness: string;
    comfortTopics: string[];
    avoidanceTopics: string[];
    copingStyle: string;
    humorType: string;
  };

  // Interaction
  interaction: {
    initialDynamic: string;
    trustTriggers: string;
    frictionTriggers: string;
    inactivityResponse: string;
  };

  // Communication
  speakingStyle: {
    style: string;
    emotionalTone: string;
    conversationHabits: string;
    signaturePhrases: string[];
  };

  // Inter-character relationships
  relationships: {
    characterId: string;
    summary: string;
    tone: string;
    sharedMemories: string[];
  }[];

  // Family
  family: {
    members: string;
    dynamics: string;
  };

  // Traits for game mechanics
  traits: {
    bloomStart: number;
    vulnerability: string;
    darkSecret: string;
    healingPath: string;
  };
}

// ==========================================
// BLOOM TOKEN SYSTEM
// ==========================================

export interface BloomToken {
  type: 'encouragement' | 'compliment' | 'patience' | 'vulnerability' | 'consistency' | 'boundary';
  value: number;       // How many bloom points this earns (1-5)
  description: string; // What the user did to earn it
}

// Token values:
// encouragement: +2 (telling them they can do it)
// compliment: +1 (surface level nice)
// patience: +3 (staying when they push you away)
// vulnerability: +4 (getting them to share something real)
// consistency: +2 (coming back day after day)
// boundary: +3 (calling out unhealthy behavior with care)
// NOTE: Shallow platitudes = +0 or even -1
// Pushing too hard too fast = -2

// ==========================================
// MESSAGES & DIALOGUE
// ==========================================

export interface Message {
  id: string;
  characterId: string;
  content: string;
  timestamp: number;
  choices?: Choice[];
  isPlayer?: boolean;
  bloomEffect?: number; // How much this message affected bloom
}

export interface Choice {
  id: string;
  text: string;
  consequences: ConsequenceEffect[];
  nextMessageId?: string;
}

export interface ConsequenceEffect {
  target: 'meter' | 'unlock' | 'event' | 'bloom';
  stat?: string;
  characterId?: string;
  value: number;
  targetId?: string;
}

// ==========================================
// CHARACTER BLOOM STATE
// ==========================================

export interface CharacterBloom {
  [characterId: string]: number; // 0-100
}

// ==========================================
// GAME STATE
// ==========================================

export interface GameState {
  day: number;
  timeOfDay: 'morning' | 'noon' | 'night';
  characterBloom: CharacterBloom;
  unlockedChannels: string[];
  currentChannel: string;
  choices: string[];
  consequences: ConsequenceItem[];
  messages: Message[];
  conversationCount: {
    [characterId: string]: number; // Total conversations had
  };
  bloomTokensEarned: {
    [characterId: string]: BloomToken[];
  };
}

// ==========================================
// CONSEQUENCE FEED
// ==========================================

export interface ConsequenceItem {
  id: string;
  type: 'rumor' | 'bill' | 'opportunity' | 'threat' | 'positive' | 'breakthrough';
  content: string;
  timestamp: number;
  relatedCharacter?: string;
}

// ==========================================
// DAY CONTENT
// ==========================================

export interface DayContent {
  day: number;
  morning: DayPhase;
  noon: DayPhase;
  night: DayPhase;
}

export interface DayPhase {
  title: string;
  description: string;
  messages: Message[];
}

// ==========================================
// EVENTS
// ==========================================

export interface WeeklyEvent {
  id: string;
  name: string;
  description: string;
  trigger: {
    day: number;
    timeOfDay?: string;
  };
  choices: Choice[];
  meterEffects: ConsequenceEffect[];
}
