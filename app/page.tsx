import {
  ArrowLeftRight,
  Award,
  Globe2,
  Lock,
  PiggyBank,
  ScrollText,
  ShieldCheck,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { BankLogo } from '@/components/bank-logo'
import { ContactSection } from '@/components/contact-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { HeroSectionWithSmoothBgShader } from '@/components/ui/hero-section-with-smooth-bg-shader'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
  { label: 'Terms', href: '#terms' }
]

const aboutStats = [
  { icon: Users, value: '2.5M+', label: 'Customers served' },
  { icon: Globe2, value: '40+', label: 'Countries supported' },
  { icon: Award, value: '15 yrs', label: 'Of trusted banking' },
  { icon: Lock, value: '99.99%', label: 'Platform uptime' }
]

const termsItems = [
  {
    title: 'Account agreement',
    description:
      'By opening an account you agree to our deposit account terms, including eligibility, identity verification, and acceptable use of the platform.'
  },
  {
    title: 'Privacy & data use',
    description:
      'We protect your personal and financial data and only use it to operate your accounts and improve your experience, as described in our Privacy Policy.'
  },
  {
    title: 'Security responsibilities',
    description:
      'Keep your credentials and PIN confidential. Sessions are protected and payments are PIN-verified to help keep your money safe.'
  },
  {
    title: 'Fees & disclosures',
    description:
      'Applicable fees and service disclosures are presented before you confirm any action. Review them carefully before completing a transaction.'
  }
]

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
    <main className="flex min-h-dvh flex-col bg-transparent">
      <header className="glass-panel sticky top-0 z-50 flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BankLogo className="size-5" />
          </span>
          Nova Bank
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="max-sm:hidden">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </header>

      <HeroSectionWithSmoothBgShader />

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

        <div id="features" className="mt-16 grid w-full gap-4 sm:grid-cols-3">
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

      <section
        id="about"
        className="border-border/60 border-t bg-background px-6 py-20 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <span className="font-semibold text-primary text-sm uppercase tracking-wide">
              About us
            </span>
            <h2 className="mt-3 text-balance font-bold text-3xl tracking-tight sm:text-4xl">
              Banking built on trust and modern technology
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nova Bank brings together secure, reliable infrastructure and a
              simple, human experience. We help people and businesses manage
              their money with confidence — from everyday transfers to long-term
              goals.
            </p>
            <p className="mt-4 text-muted-foreground">
              Our mission is to make banking transparent and accessible, backed
              by strong security and a support team that is always ready to
              help.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aboutStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="flex flex-col gap-2 pt-6">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <p className="font-bold text-2xl tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <ContactSection />

      <section
        id="terms"
        className="border-border/60 border-t bg-background px-6 py-20 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 font-semibold text-primary text-sm uppercase tracking-wide">
              <ScrollText className="size-4" />
              Terms &amp; services
            </span>
            <h2 className="mt-3 text-balance font-bold text-3xl tracking-tight sm:text-4xl">
              Clear terms you can rely on
            </h2>
            <p className="mt-4 text-muted-foreground">
              A summary of the key terms that govern your use of Nova Bank. This
              overview is provided for convenience and does not replace the full
              legal agreements.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {termsItems.map((item) => (
              <Card key={item.title} className="text-left">
                <CardContent className="flex flex-col gap-2 pt-6">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-border/60 border-t bg-sidebar px-6 py-12 text-sidebar-foreground sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                <BankLogo className="size-5" />
              </span>
              Nova Bank
            </div>
            <p className="mt-4 text-sidebar-foreground/70 text-sm">
              Secure online banking for everyday money management. Member
              services available worldwide.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Company</span>
              <a
                href="#about"
                className="text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
              >
                About us
              </a>
              <a
                href="#contact"
                className="text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
              >
                Contact us
              </a>
              <a
                href="#terms"
                className="text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
              >
                Terms &amp; services
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Get started</span>
              <Link
                href="/sign-up"
                className="text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
              >
                Open an account
              </Link>
              <Link
                href="/login"
                className="text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
              >
                Sign in
              </Link>
            </div>
          </nav>
        </div>
        <div className="mx-auto mt-10 max-w-5xl border-sidebar-border border-t pt-6 text-sidebar-foreground/60 text-xs">
          © {new Date().getFullYear()} Nova Bank. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
