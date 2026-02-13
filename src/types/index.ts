// Character definitions
export interface Character {
  id: string;
  name: string;
  avatar: string;
  color: string;
  accentColor: string;
  personality: string;
  background: string;
  speakingStyle: {
    prefix: string;
    suffix: string;
    commonPhrases: string[];
  };
  traits: {
    trustStart: number;
    energyCost: number;
    vulnerability: string;
    darkSecret: string;
    redemptionPath: string;
  };
}

// Message and dialogue types
export interface Message {
  id: string;
  characterId: string;
  content: string;
  timestamp: number;
  choices?: Choice[];
  isPlayer?: boolean;
}

export interface Choice {
  id: string;
  text: string;
  consequences: ConsequenceEffect[];
  nextMessageId?: string;
}

export interface ConsequenceEffect {
  target: 'meter' | 'unlock' | 'event';
  stat?: string;
  value: number;
  targetId?: string;
}

// Meters
export interface Meters {
  energy: number;
  moneyPressure: number;
  exposureRisk: number;
  teamCohesion: number;
  hope: number;
}

export interface CharacterTrust {
  [characterId: string]: number;
}

// Game state
export interface GameState {
  day: number;
  timeOfDay: 'morning' | 'noon' | 'night';
  meters: Meters;
  characterTrust: CharacterTrust;
  unlockedChannels: string[];
  currentChannel: string;
  choices: string[];
  consequences: ConsequenceItem[];
  messages: Message[];
  eventActive: boolean;
  eventType?: string;
  eventProgress?: number;
  redemptionProgress: {
    [characterId: string]: number;
  };
}

// Consequence feed
export interface ConsequenceItem {
  id: string;
  type: 'rumor' | 'bill' | 'opportunity' | 'threat' | 'positive' | 'breakthrough';
  content: string;
  timestamp: number;
  relatedCharacter?: string;
}

// Day content
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

// Events
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
