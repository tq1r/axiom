'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, RotateCcw, Target, Zap, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Reaction Rush — a simple, fun reaction-time game.
 * Targets appear on a grid, you click them before they disappear.
 * Simple, addictive, not confusing. Way better than 2048.
 */

interface Target {
  id: number
  x: number
  y: number
  size: number
  born: number
}

interface MiniGameProps {
  onClose?: () => void
  compact?: boolean
}

const GAME_DURATION = 30 // seconds
const TARGET_LIFETIME = 1200 // ms before a target disappears

export function MiniGame({ onClose, compact = false }: MiniGameProps) {
  const [playing, setPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [targets, setTargets] = useState<Target[]>([])
  const [misses, setMisses] = useState(0)
  const targetIdRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const startGame = () => {
    setPlaying(true)
    setGameOver(false)
    setScore(0)
    setMisses(0)
    setTimeLeft(GAME_DURATION)
    setTargets([])

    // Spawn targets
    spawnRef.current = setInterval(() => {
      const area = gameAreaRef.current
      if (!area) return
      const w = area.clientWidth
      const h = area.clientHeight
      const size = 36 + Math.random() * 16
      const target: Target = {
        id: targetIdRef.current++,
        x: Math.random() * (w - size - 20) + 10,
        y: Math.random() * (h - size - 20) + 10,
        size,
        born: Date.now(),
      }
      setTargets((prev) => [...prev, target])
    }, 700)

    // Countdown
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame()
          return 0
        }
        return t - 1
      })
    }, 1000)

    // Remove expired targets (count as misses)
    const expireInterval = setInterval(() => {
      const now = Date.now()
      setTargets((prev) => {
        const expired = prev.filter((t) => now - t.born > TARGET_LIFETIME)
        if (expired.length > 0) {
          setMisses((m) => m + expired.length)
        }
        return prev.filter((t) => now - t.born <= TARGET_LIFETIME)
      })
    }, 100)
    if (intervalRef.current) {
      (intervalRef.current as any)._expire = expireInterval
    }
  }

  const endGame = () => {
    setPlaying(false)
    setGameOver(true)
    setTargets([])
    if (spawnRef.current) clearInterval(spawnRef.current)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      const expire = (intervalRef.current as any)._expire
      if (expire) clearInterval(expire)
    }
    setBest((b) => Math.max(b, score))
  }

  useEffect(() => {
    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const hitTarget = (id: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== id))
    setScore((s) => s + 1)
  }

  return (
    <div
      className={cn(
        'paper-card rounded-xl overflow-hidden select-none',
        compact ? 'w-full' : 'w-full max-w-xs'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b hairline">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--tangerine)]">
            <Target className="h-3 w-3 text-white" />
          </div>
          <div>
            <div className="font-serif text-sm font-medium leading-tight">Reaction Rush</div>
            <div className="text-[10px] text-muted-foreground leading-tight">tap the dots</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-[var(--secondary)] hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--background-2)] border-b hairline">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div className="text-center rounded-md bg-[var(--card)] border hairline py-1">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Score</div>
            <div className="font-serif text-base font-medium text-[var(--tangerine)] leading-tight">{score}</div>
          </div>
          <div className="text-center rounded-md bg-[var(--card)] border hairline py-1">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Time</div>
            <div className="font-serif text-base font-medium leading-tight">{timeLeft}s</div>
          </div>
          <div className="text-center rounded-md bg-[var(--card)] border hairline py-1">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Best</div>
            <div className="font-serif text-base font-medium leading-tight">{best}</div>
          </div>
        </div>
        {playing && (
          <button
            onClick={endGame}
            className="flex h-9 w-9 items-center justify-center rounded-md border hairline text-muted-foreground hover:text-foreground hover:bg-[var(--secondary)] transition-colors"
            title="Stop"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Game area */}
      <div className="p-3 bg-[var(--background-2)]">
        <div
          ref={gameAreaRef}
          className="relative bg-[var(--card)] rounded-lg overflow-hidden"
          style={{ height: 200 }}
        >
          {!playing && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tangerine)] anim-float">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Tap the dots before they vanish</div>
                <div className="text-xs text-muted-foreground mt-0.5">30 seconds. How many can you hit?</div>
              </div>
              <button
                onClick={startGame}
                className="px-5 py-1.5 rounded-full bg-[var(--tangerine)] text-white text-xs font-medium hover:bg-[var(--tangerine)]/90 transition-colors"
              >
                Start
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--card)]/95">
              <Trophy className="h-8 w-8 text-[var(--ochre)] mb-1" />
              <div className="font-serif text-xl font-medium">{score} hits</div>
              <div className="text-xs text-muted-foreground">
                {misses} misses · {score > 0 ? Math.round((score / (score + misses)) * 100) : 0}% accuracy
              </div>
              <button
                onClick={startGame}
                className="mt-2 px-5 py-1.5 rounded-full bg-[var(--tangerine)] text-white text-xs font-medium hover:bg-[var(--tangerine)]/90 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Play again
              </button>
            </div>
          )}

          {playing && targets.map((t) => (
            <motion.button
              key={t.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => hitTarget(t.id)}
              className="absolute rounded-full bg-[var(--tangerine)] hover:bg-[var(--tangerine-bright)] active:scale-90 transition-transform shadow-md"
              style={{
                left: t.x,
                top: t.y,
                width: t.size,
                height: t.size,
              }}
            >
              <span className="absolute inset-1 rounded-full bg-white/30" />
            </motion.button>
          ))}
        </div>

        {/* Status */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          {playing ? (
            <>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--tangerine)] animate-pulse" />
                {misses} misses
              </span>
              <span>{targets.length} active</span>
            </>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {compact ? 'Click start to play' : '30-second rounds'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
