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
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('relative flex items-center justify-center')}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hand-drawn style A glyph with tangerine ink */}
          <path
            d="M5 27L16 4L27 27"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground"
            fill="none"
          />
          {/* The crossbar — tangerine, slightly off-center for character */}
          <path
            d="M10.5 20.5L21.5 20.5"
            stroke="var(--tangerine)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Ink dot — like a period, a stamp */}
          <circle cx="16" cy="30" r="1.2" fill="var(--tangerine)" />
        </svg>
      </div>
      {showWordmark && (
        <span
          className="font-serif font-semibold tracking-tight text-foreground"
          style={{ fontSize: size * 0.62 }}
        >
          Axiom
        </span>
      )}
    </div>
  )
}
