'use client'

import { Water } from '@paper-design/shaders-react'
import { useEffect, useRef, useState } from 'react'

function cssVarToRgb(name: string): string | null {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  if (!raw) return null
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a === 0) return null
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
}

type WaterColors = {
  back: string
  highlight: string
}

/**
 * Fixed, full-viewport animated water background rendered behind all page
 * content. The Water shader provides caustic, flowing water motion; an
 * oversized wrapper eases toward the pointer (parallax slosh) and a blurred
 * highlight blob follows the cursor for a liquid ripple. Decorative only.
 */
export function LiquidBackground() {
  const [mounted, setMounted] = useState(false)
  const [colors, setColors] = useState<WaterColors | null>(null)
  const waterRef = useRef<HTMLDivElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    const update = () => {
      const back = cssVarToRgb('--background')
      const highlight = cssVarToRgb('--primary')
      if (back && highlight) setColors({ back, highlight })
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Normalised pointer position (0..1), eased toward the real cursor.
    const targetN = { x: 0.5, y: 0.5 }
    const currentN = { x: 0.5, y: 0.5 }
    const blobSize = 560

    const handlePointerMove = (event: PointerEvent) => {
      targetN.x = event.clientX / window.innerWidth
      targetN.y = event.clientY / window.innerHeight
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    let frame = 0
    const tick = () => {
      currentN.x += (targetN.x - currentN.x) * 0.05
      currentN.y += (targetN.y - currentN.y) * 0.05

      const w = window.innerWidth
      const h = window.innerHeight
      if (waterRef.current) {
        const dx = (currentN.x - 0.5) * w * 0.07
        const dy = (currentN.y - 0.5) * h * 0.07
        waterRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
      }
      if (blobRef.current) {
        const bx = currentN.x * w - blobSize / 2
        const by = currentN.y * h - blobSize / 2
        blobRef.current.style.transform = `translate3d(${bx}px, ${by}px, 0)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      observer.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {mounted && colors ? (
        <div
          ref={waterRef}
          className="absolute inset-[-8%] opacity-70 dark:opacity-60 will-change-transform"
        >
          <Water
            className="h-full w-full"
            colorBack={colors.back}
            colorHighlight={colors.highlight}
            highlights={0.6}
            caustic={0.8}
            waves={0.55}
            layering={0.7}
            edges={0.4}
            size={1.4}
            speed={0.7}
          />
        </div>
      ) : null}
      <div
        ref={blobRef}
        className="absolute top-0 left-0 size-[560px] rounded-full bg-primary/20 blur-[120px] will-change-transform dark:bg-primary/15"
      />
      <div className="absolute inset-0 bg-background/45" />
    </div>
  )
}

export default LiquidBackground
