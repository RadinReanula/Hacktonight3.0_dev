import type * as React from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'

type AppShellProps = {
  children: React.ReactNode
  userName?: string
  className?: string
}

export function AppShell({ children, userName, className }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-transparent max-md:flex-col">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userName={userName} />
        <main className={cn('flex-1 overflow-x-hidden p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
