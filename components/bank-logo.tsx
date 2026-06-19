import { cn } from '@/lib/utils'

type BankLogoProps = {
  className?: string
}

/**
 * Animated bank logo. A classic columned bank facade drawn with currentColor
 * so it inherits whatever text color its container sets. The pillars gently
 * pulse and the whole mark floats (disabled under prefers-reduced-motion via
 * the `.bank-logo` styles in globals.css).
 */
export function BankLogo({ className }: BankLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nova Bank"
      className={cn('bank-logo size-5', className)}
    >
      {/* Roof / pediment */}
      <path d="M12 2.5 22 8H2L12 2.5Z" fill="currentColor" />
      <circle cx="12" cy="6" r="1.1" className="roof-dot fill-background/80" />
      {/* Architrave */}
      <rect x="3" y="9" width="18" height="1.6" rx="0.6" fill="currentColor" />
      {/* Pillars */}
      <g className="pillars">
        <rect
          className="pillar"
          x="5"
          y="11"
          width="2"
          height="7"
          rx="0.4"
          fill="currentColor"
        />
        <rect
          className="pillar"
          x="9"
          y="11"
          width="2"
          height="7"
          rx="0.4"
          fill="currentColor"
        />
        <rect
          className="pillar"
          x="13"
          y="11"
          width="2"
          height="7"
          rx="0.4"
          fill="currentColor"
        />
        <rect
          className="pillar"
          x="17"
          y="11"
          width="2"
          height="7"
          rx="0.4"
          fill="currentColor"
        />
      </g>
      {/* Base */}
      <rect
        x="2.5"
        y="18.6"
        width="19"
        height="2.4"
        rx="0.7"
        fill="currentColor"
      />
    </svg>
  )
}

export default BankLogo
