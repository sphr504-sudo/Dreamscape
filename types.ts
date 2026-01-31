
export type CharacterType = 'newborn' | 'child' | 'adult' | 'elder' | 'ghost' | 'paranormal' | 'machine';
export type Voice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface CharacterDef {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'non-binary' | 'unknown';
  ageGroup: CharacterType;
  traits: string;
  assignedVoiceName?: Voice;
  suggestedVoice?: Voice;
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
