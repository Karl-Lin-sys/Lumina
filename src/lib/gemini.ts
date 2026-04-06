import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeImageAndWriteStory(base64Image: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      "Analyze the mood, atmosphere, and scene of this image. Then, ghostwrite a captivating opening paragraph to a story set in this world. Do not include any meta-text, just write the story paragraph directly.",
    ],
    config: {
      systemInstruction: "You are a master storyteller and creative writer. Your prose is evocative, immersive, and atmospheric.",
    }
  });

  return response.text || "";
}

export async function generateSpeech(text: string): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || null;
}

export function createChatSession() {
  return ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: "You are a creative writing assistant and co-author. You help the user expand on their story, brainstorm ideas, and explore the world they've created based on the initial image and opening paragraph. Keep your responses concise, engaging, and in character as a helpful creative partner.",
    },
  });
}
