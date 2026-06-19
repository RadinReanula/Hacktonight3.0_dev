'use client'

import {
  ArrowLeftRight,
  FileText,
  HelpCircle,
  LayoutGrid,
  PiggyBank,
  Receipt,
  Settings,
  Wallet
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'
import { LogoutButton } from '@/components/auth/logout-button'
import { BankLogo } from '@/components/bank-logo'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { label: 'Accounts', href: '/bank-accounts', icon: Wallet },
  { label: 'Bank Transfer', href: '/bank-transfer', icon: ArrowLeftRight },
  { label: 'Pay Bills', href: '/pay-bills', icon: Receipt },
  { label: 'Smart Spend', href: '/smart-spend', icon: PiggyBank },
  { label: 'E-Statement', href: '/e-statement', icon: FileText }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between rounded-r-3xl bg-sidebar text-sidebar-foreground max-md:w-full max-md:flex-row max-md:items-center max-md:rounded-none max-md:rounded-b-3xl max-md:px-4 max-md:py-3">
      <div className="flex flex-col gap-8 max-md:flex-1 max-md:flex-row max-md:items-center max-md:gap-4">
        <Link
          href="/dashboard"
          aria-label="Nova Bank home"
          className="flex items-center gap-3 rounded-xl px-6 pt-6 outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring max-md:px-0 max-md:pt-0"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <BankLogo className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-tight max-md:hidden">
            Nova Bank
          </span>
        </Link>

        <nav className="flex flex-col gap-1 px-3 max-md:flex-row max-md:flex-wrap max-md:px-0">
          {navItems.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="max-md:hidden">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 p-4 max-md:p-0">
        <LogoutButton variant="sidebar" className="max-md:hidden" />
        <div className="flex gap-2">
          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-lg p-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Settings className="size-5" />
          </Link>
          <Link
            href="/help"
            aria-label="Help"
            className="rounded-lg p-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <HelpCircle className="size-5" />
          </Link>
          <div className="md:hidden">
            <LogoutButton
              variant="sidebar"
              showLabel={false}
              className="w-auto px-2"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
