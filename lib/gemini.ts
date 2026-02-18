import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

export const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

// Model mappings - Gemini 3 only (Google AI Studio)
export const GEMINI_FLASH_MODEL = "gemini-3-flash-preview";
export const GEMINI_PRO_MODEL = "gemini-3-pro-preview";

export const defaultGenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

/**
 * Helper to generate JSON using Gemini.
 * Forces responseMimeType to 'application/json' and parses the result.
 */
export async function generateJSON<T = any>(
  prompt: string,
  modelName: string = GEMINI_FLASH_MODEL,
  temperature: number = 0.1
): Promise<T> {
  try {
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature,
      }
    });

    const text = result.text || '';
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Gemini JSON generation error:", error);
    throw error;
  }
}
