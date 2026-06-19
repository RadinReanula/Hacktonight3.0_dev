import { z } from 'zod'
import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/assistant/system-prompt'
import { serviceFailure } from '@/lib/db'
import { clientKey, rateLimit } from '@/lib/rate-limit'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000)
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20)
})

type OpenAIChatResponse = {
  choices?: Array<{
    message?: { content?: string }
  }>
  error?: { message?: string }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json(
        { ok: false, message: 'Assistant is not configured.' },
        { status: 503 }
      )
    }

    if (!rateLimit(clientKey(request, 'assistant'), 20, 60_000)) {
      return Response.json(
        { ok: false, message: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: 'Invalid message.' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
          ...parsed.data.messages
        ]
      })
    })

    const data = (await response.json().catch(() => ({}))) as OpenAIChatResponse

    if (!response.ok) {
      console.error('[assistant]', data.error?.message ?? response.statusText)
      return Response.json(
        { ok: false, message: 'Assistant is temporarily unavailable.' },
        { status: 502 }
      )
    }

    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      return Response.json(
        { ok: false, message: 'No response from assistant.' },
        { status: 502 }
      )
    }

    return Response.json({ ok: true, message: reply })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
