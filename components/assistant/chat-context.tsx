'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState
} from 'react'
import { ChatBubble } from '@/components/assistant/chat-bubble'

type ChatContextValue = {
  resetChat: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatEpoch, setChatEpoch] = useState(0)

  const resetChat = useCallback(() => {
    setChatEpoch((epoch) => epoch + 1)
  }, [])

  return (
    <ChatContext.Provider value={{ resetChat }}>
      {children}
      <ChatBubble key={chatEpoch} />
    </ChatContext.Provider>
  )
}

/** Clears Nova Assist chat history (e.g. on sign out). Safe to call outside ChatProvider. */
export function useResetChat() {
  return useContext(ChatContext)?.resetChat ?? (() => {})
}
