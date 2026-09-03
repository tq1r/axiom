'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  className?: string
  showWordmark?: boolean
  withGlow?: boolean
}

export function AxiomLogo({ size = 28, className, showWordmark = true, withGlow = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-[10px]',
          withGlow && 'axiom-glow-sm'
        )}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="axiom-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" />
              <stop offset="0.5" stopColor="#818CF8" />
              <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
          </defs>
          {/* Geometric A / spark glyph */}
          <path
            d="M16 3L28 27H22.5L16 12.5L9.5 27H4L16 3Z"
            fill="url(#axiom-grad)"
          />
          <path
            d="M12 21H20V24.5H12V21Z"
            fill="url(#axiom-grad)"
          />
          <circle cx="16" cy="6" r="1.8" fill="#22D3EE" />
        </svg>
      </div>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          Axiom
        </span>
      )}
    </div>
  )
}
