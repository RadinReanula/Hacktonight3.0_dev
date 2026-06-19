'use client'

import { Bell, Search } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { cn } from '@/lib/utils'

type TopBarProps = {
  userName?: string
  className?: string
}

export function TopBar({ userName, className }: TopBarProps) {
  const initials = userName
    ? userName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NB'

  return (
    <header
      className={cn(
        'flex items-center justify-between gap-4 border-b bg-card px-6 py-4',
        className
      )}
    >
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search transactions, payees..."
          aria-label="Search"
          className="h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <LogoutButton variant="topbar" />
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
            {initials}
          </div>
          {userName ? (
            <span className="hidden font-medium text-sm sm:inline">
              {userName}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default TopBar
