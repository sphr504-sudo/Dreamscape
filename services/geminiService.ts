
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { CharacterDef, DialogueSegment, ScriptAnalysis } from "../types";

const API_KEY = process.env.API_KEY || "";

/**
 * Helper to handle retries for API calls with exponential backoff.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 5,
  delay: number = 3000,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimited = 
      error.message?.includes("429") || 
      error.message?.includes("RESOURCE_EXHAUSTED");

    if (retries > 0 && isRateLimited) {
      if (onRetry) onRetry(6 - retries, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2, onRetry);
    }
    throw error;
  }
}

/**
 * Merges multiple PCM base64 strings into a single WAV Blob.
 */
export function mergeAudioSegments(base64Segments: string[], sampleRate: number = 24000): Blob {
  const buffers = base64Segments.map(b64 => {
    const binaryString = atob(b64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  });

  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    combined.set(buf, offset);
    offset += buf.length;
  }

  // Create WAV Header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + totalLength, true); 
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); 
  view.setUint32(16, 16, true); 
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true); 
  view.setUint32(28, sampleRate * 2, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  view.setUint32(36, 0x64617461, false); 
  view.setUint32(40, totalLength, true); 

  return new Blob([header, combined], { type: 'audio/wav' });
}

export const analyzeScript = async (text: string, onStatusUpdate?: (msg: string) => void): Promise<ScriptAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a deep linguistic analysis. Identify characters, age groups, genders, and emotions for each line.
      
      Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  gender: { type: Type.STRING, enum: ['male', 'female', 'non-binary', 'unknown'] },
                  ageGroup: { type: Type.STRING, enum: ['newborn', 'child', 'adult', 'elder', 'ghost', 'paranormal', 'machine'] },
                  traits: { type: Type.STRING },
                  suggestedVoice: { type: Type.STRING, enum: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] }
                },
                required: ["id", "name", "gender", "ageGroup", "suggestedVoice"]
              }
            },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterId: { type: Type.STRING },
                  text: { type: Type.STRING },
                  emotion: { type: Type.STRING },
                  intensity: { type: Type.NUMBER },
                  tone: { type: Type.STRING }
                },
                required: ["characterId", "text", "emotion", "intensity", "tone"]
              }
            }
          },
          required: ["summary", "characters", "segments"]
        }
      }
    });

    return JSON.parse(response.text);
  }, 3, 2000, (attempt) => {
    if (onStatusUpdate) onStatusUpdate(`Analyzing Script (Attempt ${attempt})...`);
  });
};

export const synthesizeSegment = async (
  segment: DialogueSegment,
  character: CharacterDef,
  onStatusUpdate?: (msg: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const personaPrompt = `Speak this line as "${character.name}" (${character.ageGroup} ${character.gender}).
  Emotion: ${segment.emotion} (Level ${segment.intensity}/10).
  Line: "${segment.text}"`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: personaPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: character.assignedVoiceName || 'Kore' },
          },
        },
      },
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("Empty audio payload");
    return base64;
  }, 5, 4000, (attempt) => {
    if (onStatusUpdate) onStatusUpdate(`Throttled: Waiting for Free Tier (Retry ${attempt})...`);
  });
};
