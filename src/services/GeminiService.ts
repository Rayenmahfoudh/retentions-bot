import { prisma } from "@core/db";
import { TokenNotFoundError } from "@errors/TokenNotFoundError";
import { GoogleGenAI } from "@google/genai";

export async function promptGemini(prompt: string, userId: number) {
  const gemini_api_key = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gemini_token: true,
    },
  });

  if (!gemini_api_key?.gemini_token || gemini_api_key.gemini_token == null) {
    throw new TokenNotFoundError("User token not found");
  }

  const ai = new GoogleGenAI({ apiKey: gemini_api_key.gemini_token });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: prompt,
  });

  const text = response.text;

  return text;
}
