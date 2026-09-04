'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Axiom Blocks — a 4x4 number-merge puzzle (2048-style).
 * Appears as a floating panel when the AI is generating a response.
 */

type Board = number[][]

const SIZE = 4

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function spawnTile(board: Board): Board {
  const empties: [number, number][] = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empties.push([r, c])
    }
  }
  if (empties.length === 0) return board
  const [r, c] = empties[Math.floor(Math.random() * empties.length)]
  const newBoard = board.map((row) => [...row])
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4
  return newBoard
}

function initBoard(): Board {
  let b = emptyBoard()
  b = spawnTile(b)
  b = spawnTile(b)
  return b
}

function slideRow(row: number[]): { row: number[]; gained: number } {
  const nonZero = row.filter((v) => v !== 0)
  const result: number[] = []
  let gained = 0
  for (let i = 0; i < nonZero.length; i++) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2
      result.push(merged)
      gained += merged
      i++
    } else {
      result.push(nonZero[i])
    }
  }
  while (result.length < SIZE) result.push(0)
  return { row: result, gained }
}

function rotateBoard(board: Board): Board {
  const n = board.length
  const rotated = emptyBoard()
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = board[r][c]
    }
  }
  return rotated
}

function move(board: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; gained: number; moved: boolean } {
  let work = board.map((r) => [...r])
  // Rotate so we always slide left
  const rotations = dir === 'left' ? 0 : dir === 'up' ? 1 : dir === 'right' ? 2 : 3
  for (let i = 0; i < rotations; i++) work = rotateBoard(work)

  let gained = 0
  const newBoard = work.map((row) => {
    const { row: newRow, gained: g } = slideRow(row)
    gained += g
    return newRow
  })

  // Rotate back
  let result = newBoard
  for (let i = 0; i < (4 - rotations) % 4; i++) result = rotateBoard(result)

  const moved = JSON.stringify(result) !== JSON.stringify(board)
  return { board: result, gained, moved }
}

function isGameOver(board: Board): boolean {
  // Empty cells exist
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false
    }
  }
  // Any merge possible
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return false
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return false
    }
  }
  return true
}

function tileStyle(v: number): string {
  if (v === 0) return 'bg-transparent text-transparent'
  if (v === 2) return 'bg-[var(--secondary)] text-foreground'
  if (v === 4) return 'bg-[var(--ochre)]/25 text-foreground'
  if (v === 8) return 'bg-[var(--ochre)]/50 text-foreground'
  if (v === 16) return 'bg-[var(--ochre)]/75 text-white'
  if (v === 32) return 'bg-[var(--tangerine)]/40 text-white'
  if (v === 64) return 'bg-[var(--tangerine)]/60 text-white'
  if (v === 128) return 'bg-[var(--tangerine)]/80 text-white'
  if (v === 256) return 'bg-[var(--tangerine)] text-white'
  if (v === 512) return 'bg-[var(--forest)] text-white'
  if (v === 1024) return 'bg-[var(--forest)]/80 text-white text-xs'
  return 'bg-foreground text-background text-xs'
}

interface MiniGameProps {
  onClose?: () => void
  compact?: boolean
}

export function MiniGame({ onClose, compact = false }: MiniGameProps) {
  const [board, setBoard] = useState<Board>(() => initBoard())
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [over, setOver] = useState(false)
  const [moves, setMoves] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (over) return
    setBoard((prev) => {
      const { board: next, gained, moved } = move(prev, dir)
      if (!moved) return prev
      const withTile = spawnTile(next)
      setScore((s) => {
        const newScore = s + gained
        setBest((b) => Math.max(b, newScore))
        return newScore
      })
      setMoves((m) => m + 1)
      if (isGameOver(withTile)) {
        setOver(true)
      }
      return withTile
    })
  }, [over])

  const reset = () => {
    setBoard(initBoard())
    setScore(0)
    setOver(false)
    setMoves(0)
  }

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only capture when the game container is focused or hovered
      if (!containerRef.current?.matches(':hover') && document.activeElement !== containerRef.current) return
      const key = e.key
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'].includes(key)) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (key === 'ArrowLeft' || key === 'a') handleMove('left')
      else if (key === 'ArrowRight' || key === 'd') handleMove('right')
      else if (key === 'ArrowUp' || key === 'w') handleMove('up')
      else if (key === 'ArrowDown' || key === 's') handleMove('down')
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [handleMove])

  // Touch / swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    if (Math.max(absX, absY) < 20) return
    if (absX > absY) handleMove(dx > 0 ? 'right' : 'left')
    else handleMove(dy > 0 ? 'down' : 'up')
    touchStart.current = null
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'paper-card rounded-xl overflow-hidden select-none',
        compact ? 'w-full' : 'w-full max-w-xs'
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b hairline">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--tangerine)]">
            <Trophy className="h-3 w-3 text-white" />
          </div>
          <div>
            <div className="font-serif text-sm font-medium leading-tight">Axiom Blocks</div>
            <div className="text-[10px] text-muted-foreground leading-tight">while you wait</div>
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
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--background-2)] border-b hairline">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="text-center rounded-md bg-[var(--card)] border hairline py-1">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Score</div>
            <div className="font-serif text-base font-medium text-[var(--tangerine)] leading-tight">{score}</div>
          </div>
          <div className="text-center rounded-md bg-[var(--card)] border hairline py-1">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Best</div>
            <div className="font-serif text-base font-medium leading-tight">{best}</div>
          </div>
        </div>
        <button
          onClick={reset}
          className="flex h-9 w-9 items-center justify-center rounded-md border hairline text-muted-foreground hover:text-foreground hover:bg-[var(--secondary)] transition-colors"
          title="New game"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Board */}
      <div className="p-3 bg-[var(--background-2)]">
        <div className="relative">
          <div className="grid grid-cols-4 gap-1.5 bg-[var(--card)]/50 p-1.5 rounded-lg">
            {board.flat().map((v, i) => (
              <motion.div
                key={i}
                layout
                transition={{ duration: 0.12 }}
                className={cn(
                  'aspect-square rounded game-tile',
                  v >= 128 ? 'text-sm' : 'text-base',
                  v >= 1024 && 'text-xs',
                  tileStyle(v)
                )}
              >
                {v > 0 && v}
              </motion.div>
            ))}
          </div>

          {/* Game over overlay */}
          <AnimatePresence>
            {over && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center"
              >
                <div className="font-serif text-xl font-medium mb-1">Game over</div>
                <div className="text-xs text-muted-foreground mb-3">Score: {score} · {moves} moves</div>
                <button
                  onClick={reset}
                  className="px-3 py-1.5 rounded-full bg-[var(--tangerine)] text-white text-xs font-medium hover:bg-[var(--tangerine)]/90 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  Play again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls hint */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <div className="flex items-center gap-1">
            <ArrowUp className="h-2.5 w-2.5" />
            <ArrowDown className="h-2.5 w-2.5" />
            <ArrowLeft className="h-2.5 w-2.5" />
            <ArrowRight className="h-2.5 w-2.5" />
            <span>or swipe</span>
          </div>
          <span>{moves} moves</span>
        </div>
      </div>
    </div>
  )
}
