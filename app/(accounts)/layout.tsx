import Link from 'next/link'
import { BankLogo } from '@/components/bank-logo'
import { ThemeToggle } from '@/components/theme-toggle'

export default function AccountsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-auto bg-transparent px-4 py-10 sm:px-8">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-bold text-foreground text-lg"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BankLogo className="size-5" />
        </span>
        Nova Bank
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
