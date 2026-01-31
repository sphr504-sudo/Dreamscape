
import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis } from "../types";

const API_KEY = process.env.API_KEY || "";

/**
 * Helper to handle retries for API calls with exponential backoff.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = 
      error.message?.includes("429") || 
      error.message?.includes("RESOURCE_EXHAUSTED");

    if (retries > 0 && isRetryable) {
      if (onRetry) onRetry(4 - retries, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2, onRetry);
    }
    throw error;
  }
}

export const analyzeScript = async (text: string, onStatusUpdate?: (msg: string) => void): Promise<ScriptAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a deep linguistic analysis on this text.
      Identify distinct characters. If no speakers are evident, use 'Narrator'.
      Assign profiles: gender, ageGroup (newborn, child, adult, elder, ghost, paranormal, machine).
      Segment the text by character. Assign an emotion, intensity (1-10), and vocal tone.

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
                  traits: { type: Type.STRING }
                },
                required: ["id", "name", "gender", "ageGroup"]
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

    const result = JSON.parse(response.text);
    return result;
  }, 3, 2000, (attempt) => {
    if (onStatusUpdate) onStatusUpdate(`Analyzing Script (Attempt ${attempt})...`);
  });
};
