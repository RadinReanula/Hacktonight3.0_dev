'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useResetChat } from '@/components/assistant/chat-context'
import { Button } from '@/components/ui/button'
import { logoutRequest } from '@/lib/api/auth'
import { cn } from '@/lib/utils'

type LogoutButtonProps = {
  className?: string
  variant?: 'topbar' | 'sidebar' | 'legacy'
  showLabel?: boolean
}

export function LogoutButton({
  className,
  variant = 'sidebar',
  showLabel = true
}: LogoutButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const resetChat = useResetChat()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    if (loading) return
    setLoading(true)
    try {
      await logoutRequest()
    } catch {
      // Redirect even if the request fails — session may already be cleared.
    } finally {
      resetChat()
      queryClient.clear()
      router.replace('/login')
      router.refresh()
      setLoading(false)
    }
  }

  if (variant === 'legacy') {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label="Sign out"
        className={cn('legacy-sign-out', className)}
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </button>
    )
  }

  if (variant === 'topbar') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={loading}
        aria-label="Sign out"
        className={cn('text-muted-foreground', className)}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        {showLabel ? <span>Sign out</span> : null}
      </Button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Sign out"
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-sm text-sidebar-foreground/80 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-50',
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <LogOut className="size-4 shrink-0" />
      )}
      {showLabel ? <span>Sign out</span> : null}
    </button>
  )
}

export default LogoutButton
