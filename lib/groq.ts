import Groq from 'groq-sdk'

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function generateWithGroq(prompt: string): Promise<string> {
  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content:
          'You are a senior QA engineer. Generate structured test cases as a valid JSON array only. No explanation, no markdown, just raw JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  return completion.choices[0]?.message?.content ?? '[]'
}
