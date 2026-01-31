
export type Voice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface EmotionProfile {
  emotion: string;
  tone: string;
  intensity: number; // 1-10
  suggestedVoice: Voice;
}

export interface StoryAnalysis {
  summary: string;
  emotions: EmotionProfile[];
  narrationStyle: string;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}
