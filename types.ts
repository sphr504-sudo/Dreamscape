
export type Voice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type CharacterType = 'newborn' | 'child' | 'adult' | 'elder' | 'ghost' | 'paranormal' | 'machine';

export interface CharacterDef {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'non-binary' | 'unknown';
  ageGroup: CharacterType;
  baseVoice: Voice;
  traits: string;
}

export interface DialogueSegment {
  characterId: string;
  text: string;
  emotion: string;
  intensity: number;
  tone: string;
}

export interface ScriptAnalysis {
  summary: string;
  characters: CharacterDef[];
  segments: DialogueSegment[];
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}
