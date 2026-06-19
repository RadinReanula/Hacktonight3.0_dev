'use client'

import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type ChatMessage, sendAssistantMessage } from '@/lib/api/assistant'
import { cn } from '@/lib/utils'

const WELCOME =
  "Hi! I'm Nova Assist. Ask me anything about Nova Bank — transfers, bill pay, Smart Spend, e-statements, and more."

const SUGGESTIONS = [
  'How do I transfer money?',
  'How do I pay a bill?',
  'What is Smart Spend?'
]

export function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayMessages: ChatMessage[] =
    messages.length === 0 ? [{ role: 'assistant', content: WELCOME }] : messages

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    })
  }

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    })
  }, [open])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const history = [...messages, userMessage]

    setMessages(history)
    setInput('')
    setError(null)
    setLoading(true)
    scrollToBottom()

    try {
      const reply = await sendAssistantMessage(history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    await sendMessage(input)
  }

  function handleSuggestion(question: string) {
    void sendMessage(question)
  }

  return (
    <>
      {open ? (
        <div
          className="fixed right-4 bottom-20 z-50 flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:right-6 sm:bottom-24"
          role="dialog"
          aria-label="Nova Assist chat"
        >
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5" aria-hidden />
              <div>
                <p className="font-semibold text-sm">Nova Assist</p>
                <p className="text-primary-foreground/80 text-xs">FAQ helper</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div
            ref={scrollRef}
            className="flex max-h-80 flex-col gap-3 overflow-y-auto p-4"
          >
            {displayMessages.map((message) => (
              <div
                key={`${message.role}:${message.content}`}
                className={cn(
                  'max-w-[90%] rounded-2xl px-3 py-2 text-sm',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {message.content}
              </div>
            ))}

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            ) : null}
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2 border-t px-4 py-3">
              {SUGGESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="rounded-full border bg-background px-3 py-1 text-muted-foreground text-xs transition-colors hover:border-primary/40 hover:text-foreground"
                  onClick={() => handleSuggestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t p-3"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              maxLength={500}
              aria-label="Your question"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <Button
        type="button"
        size="icon"
        className="fixed right-4 bottom-4 z-50 size-14 rounded-full shadow-lg sm:right-6 sm:bottom-6"
        aria-label={open ? 'Close Nova Assist' : 'Open Nova Assist'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>
    </>
  )
}
