import OpenAI from 'openai'
import { OPENAI_API_KEY } from '../config/env'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

export async function generateAssistantResponse(businessContext: string, recentMessages: any[]) {
  const messages = [
    { role: 'system', content: businessContext },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content }))
  ]

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 300,
    temperature: 0.7
  })

  return response.choices?.[0]?.message?.content || 'Sorry, I could not process that.'
}
