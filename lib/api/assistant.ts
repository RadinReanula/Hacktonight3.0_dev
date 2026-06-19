export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function sendAssistantMessage(messages: ChatMessage[]) {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    message?: string
  }

  if (!res.ok || !data.ok || !data.message) {
    throw new Error(
      data.message || 'Assistant is unavailable. Please try again.'
    )
  }

  return data.message
}
