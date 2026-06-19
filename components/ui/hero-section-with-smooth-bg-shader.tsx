'use client'

import { MeshGradient } from '@paper-design/shaders-react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * CSS custom properties (oklch) pulled from the app theme. The shader library
 * only understands #hex / rgb() / hsl(), so these are converted to sRGB at
 * runtime via a canvas. Re-resolved whenever the documentElement class list
 * changes so the gradient tracks light/dark mode.
 */
const THEME_COLOR_VARS = [
  '--primary',
  '--accent',
  '--chart-1',
  '--background'
] as const

function cssColorToRgb(value: string): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  // Paint the resolved color and read it back as sRGB bytes. This normalises
  // any input the browser supports (oklch, lab, etc.) to an rgba() string,
  // which is one of the formats the shader library can parse.
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a === 0) return null
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
}

function readThemeColors(): string[] {
  const styles = getComputedStyle(document.documentElement)
  const colors: string[] = []
  for (const name of THEME_COLOR_VARS) {
    const raw = styles.getPropertyValue(name).trim()
    if (!raw) continue
    const rgb = cssColorToRgb(raw)
    if (rgb) colors.push(rgb)
  }
  return colors
}

interface HeroSectionWithSmoothBgShaderProps {
  eyebrow?: string
  headline?: string
  subhead?: string
  primaryCtaText?: string
  primaryCtaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
}

export function HeroSectionWithSmoothBgShader({
  eyebrow = 'Trusted online banking',
  headline = 'Banking that moves at the speed of your life',
  subhead = 'Open an account, move money, and pay bills — all in one secure place built around how you actually bank.',
  primaryCtaText = 'Open an account',
  primaryCtaHref = '/sign-up',
  secondaryCtaText = 'Sign in',
  secondaryCtaHref = '/login'
}: HeroSectionWithSmoothBgShaderProps) {
  const [mounted, setMounted] = useState(false)
  const [colors, setColors] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    const update = () => setColors(readThemeColors())
    update()

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative isolate w-full overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-accent/20 to-background">
        {mounted && colors.length > 0 ? (
          <MeshGradient
            className="absolute inset-0 h-full w-full"
            colors={colors}
            distortion={0.85}
            swirl={0.55}
            speed={0.25}
          />
        ) : null}
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/20 to-background" />

      <div className="mx-auto flex min-h-[34rem] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center sm:min-h-[40rem] sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-1.5 font-medium text-muted-foreground text-sm backdrop-blur-sm">
          <ShieldCheck className="size-4 text-primary" />
          {eyebrow}
        </span>

        <h1 className="mt-6 text-balance font-bold text-4xl tracking-tight sm:text-6xl">
          {headline}
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          {subhead}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="group rounded-full">
            <Link href={primaryCtaHref}>
              {primaryCtaText}
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full bg-card/70 backdrop-blur-sm"
          >
            <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HeroSectionWithSmoothBgShader
