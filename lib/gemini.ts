import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  })
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const model = getGeminiModel()
  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text()
}
