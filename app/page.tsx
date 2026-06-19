import {
  ArrowLeftRight,
  CreditCard,
  PiggyBank,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: ArrowLeftRight,
    title: 'Instant transfers',
    description: 'Move money between accounts securely in seconds.'
  },
  {
    icon: PiggyBank,
    title: 'Smart Spend',
    description: 'Understand your spending with clear insights.'
  },
  {
    icon: ShieldCheck,
    title: 'Bank-grade security',
    description:
      'Protected sessions, hashed credentials, PIN-verified payments.'
  }
]

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-br from-background via-background to-accent">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CreditCard className="size-5" />
          </span>
          Nova Bank
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-6xl">
          Banking that works for you
        </h1>
        <p className="mt-6 max-w-xl text-balance text-muted-foreground text-lg">
          Manage accounts, transfer money, pay bills, and track your spending —
          all in one secure place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">Open an account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="text-left">
                <CardContent className="flex flex-col gap-3 pt-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="font-semibold">{feature.title}</h2>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </main>
  )
}
