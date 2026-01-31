
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { EmotionProfile, StoryAnalysis, Voice } from "../types";

const API_KEY = process.env.API_KEY || "";

// In-memory cache for audio data (larger payloads)
const audioCache = new Map<string, string>();

// Persistent cache keys
const ANALYSIS_CACHE_PREFIX = "aether_analysis_";

/**
 * Normalizes text to create a consistent cache key
 */
const getCacheKey = (text: string, voice?: string) => {
  const normalizedText = text.trim().toLowerCase();
  const textId = normalizedText.length > 100 
    ? `${normalizedText.substring(0, 50)}_${normalizedText.length}_${normalizedText.substring(normalizedText.length - 50)}`
    : normalizedText;
  return voice ? `${voice}:${textId}` : textId;
};

/**
 * Wraps raw PCM data into a valid WAV file with a header.
 */
export function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmData.length, true); // File length
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // FMT sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, 1, true); // Number of channels (Mono)
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * 2, true); // Byte rate (SampleRate * Channels * BitsPerSample / 8)
  view.setUint16(32, 2, true); // Block align (Channels * BitsPerSample / 8)
  view.setUint16(34, 16, true); // Bits per sample

  // Data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmData.length, true); // Data length

  return new Blob([header, pcmData], { type: 'audio/wav' });
}

/**
 * Utility to decode base64 to Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Utility to decode raw PCM audio data.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const analyzeTextEmotions = async (text: string): Promise<StoryAnalysis> => {
  const cacheKey = getCacheKey(text);
  const cached = localStorage.getItem(ANALYSIS_CACHE_PREFIX + cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following story text for its emotional trajectory and narration requirements. 
    You must classify emotions using ONLY the following taxonomy:
    - Positive: Happiness, Gratitude, Love, Excitement, Pride, Relief, Amusement
    - Negative: Sadness, Anger, Fear, Disgust, Shame, Jealousy, Boredom
    - Complex: Nostalgia, Empathy, Sympathy, Longing, Bitterness, Melancholy, Anticipation
    - Other: Surprise, Confusion, Frustration, Insecurity, Euphoria

    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          narrationStyle: { type: Type.STRING },
          emotions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                emotion: { type: Type.STRING },
                tone: { type: Type.STRING },
                intensity: { type: Type.NUMBER },
                suggestedVoice: { type: Type.STRING }
              },
              required: ["emotion", "tone", "intensity", "suggestedVoice"]
            }
          }
        },
        required: ["summary", "narrationStyle", "emotions"]
      }
    }
  });

  const result = JSON.parse(response.text);
  try {
    localStorage.setItem(ANALYSIS_CACHE_PREFIX + cacheKey, JSON.stringify(result));
  } catch (e) {}
  return result;
};

export const generateEmotionalTTS = async (
  text: string, 
  analysis: StoryAnalysis,
  voice: Voice
): Promise<string> => {
  const cacheKey = getCacheKey(text, voice);
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!;

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const primaryEmotion = analysis.emotions[0];
  const prompt = `Perform this narration with high emotional intelligence. 
  Current Emotion: ${primaryEmotion.emotion}
  Tone: ${primaryEmotion.tone}
  Intensity: ${primaryEmotion.intensity}/10
  Narration Style: ${analysis.narrationStyle}
  
  Text to speak: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio data");

  audioCache.set(cacheKey, base64Audio);
  return base64Audio;
};
