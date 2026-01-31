
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { EmotionProfile, StoryAnalysis, Voice } from "../types";

const API_KEY = process.env.API_KEY || "";

/**
 * Utility to decode base64 to Uint8Array manually as requested.
 */
function decodeBase64(base64: string): Uint8Array {
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
                emotion: { 
                  type: Type.STRING,
                  description: "The specific emotion from the provided taxonomy."
                },
                tone: { 
                  type: Type.STRING,
                  description: "A descriptive adjective for the vocal tone (e.g., 'breathy', 'harsh', 'gentle')."
                },
                intensity: { 
                  type: Type.NUMBER,
                  description: "Intensity from 1-10."
                },
                suggestedVoice: { 
                  type: Type.STRING,
                  description: "One of: Kore, Puck, Charon, Fenrir, Zephyr"
                }
              },
              required: ["emotion", "tone", "intensity", "suggestedVoice"]
            }
          }
        },
        required: ["summary", "narrationStyle", "emotions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateEmotionalTTS = async (
  text: string, 
  analysis: StoryAnalysis,
  voice: Voice
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Construct a prompt that includes the newly defined complex emotion context
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
          prebuiltVoiceConfig: { 
            voiceName: voice
          },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio data");
  return base64Audio;
};
