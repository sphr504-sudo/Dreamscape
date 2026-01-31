
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { CharacterDef, DialogueSegment, ScriptAnalysis, Voice } from "../types";

const API_KEY = process.env.API_KEY || "";

/**
 * Wraps raw PCM data into a valid WAV file for external playback.
 */
export function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmData.length, true); 
  view.setUint32(8, 0x57415645, false); // "WAVE"
  
  // "fmt " sub-chunk
  view.setUint32(12, 0x666d7420, false); 
  view.setUint32(16, 16, true); 
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true); 
  view.setUint32(28, sampleRate * 2, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  
  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false); 
  view.setUint32(40, pcmData.length, true); 
  
  return new Blob([header, pcmData], { type: 'audio/wav' });
}

export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Aether: Failed to decode base64 string", e);
    return new Uint8Array(0);
  }
}

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
      // Normalize 16-bit PCM to float [-1, 1]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const analyzeScript = async (text: string): Promise<ScriptAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse this script or story into distinct character dialogues.
    If it's a plain story with no speakers, treat it as a single 'Narrator' character.
    Identify all distinct characters. Assign each a profile: gender, ageGroup (newborn, child, adult, elder, ghost, paranormal, machine), and a suggested baseVoice (Kore, Puck, Charon, Fenrir, Zephyr).
    For each line, identify emotion and tone.

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
                baseVoice: { type: Type.STRING, enum: ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] },
                traits: { type: Type.STRING }
              },
              required: ["id", "name", "gender", "ageGroup", "baseVoice"]
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

  try {
    const result = JSON.parse(response.text);
    if (!result.segments || result.segments.length === 0) {
      throw new Error("No dialogue segments found.");
    }
    return result;
  } catch (e) {
    console.error("Aether: Analysis parsing error", e);
    // Minimal fallback structure
    return {
      summary: "Manual Narration Fallback",
      characters: [{ id: "n1", name: "Narrator", gender: "unknown", ageGroup: "adult", baseVoice: "Zephyr", traits: "Clear narrator" }],
      segments: [{ characterId: "n1", text: text.substring(0, 1000), emotion: "Neutral", intensity: 5, tone: "Steady" }]
    };
  }
};

export const synthesizeSegment = async (
  segment: DialogueSegment,
  character: CharacterDef
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const personaPrompt = `
    Narrate this line as the character "${character.name}".
    Persona: ${character.ageGroup} ${character.gender}.
    Traits: ${character.traits}.
    Emotion: ${segment.emotion} (Intensity ${segment.intensity}/10).
    Tone: ${segment.tone}.
    
    SPECIAL STYLING:
    - If GHOST/PARANORMAL: Wispy, ethereal, echoing, hollow vocalizations.
    - If NEWBORN: Soft babbling, high-pitched cooing, minimal consonants.
    - If ELDER: Raspy, slow, wise, slight vocal tremor.
    
    Line to speak: "${segment.text}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: personaPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: character.baseVoice },
        },
      },
    },
  });

  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) {
    console.warn("Aether: Synthesis returned no audio data for segment", segment.text.substring(0, 20));
    return "";
  }
  return base64;
};
