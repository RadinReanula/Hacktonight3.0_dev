import { CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function AccountsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-auto bg-gradient-to-br from-background via-background to-accent px-4 py-10 sm:px-8">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-bold text-foreground text-lg"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <CreditCard className="size-5" />
        </span>
        Nova Bank
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
