'use client'

import { useState, useEffect } from 'react'

/**
 * TextShimmer — OpenCode's loading state pattern.
 * Shows an animated shimmering text effect while waiting for the first token.
 */
export function TextShimmer({ text = 'Thinking', className = '' }: { text?: string; className?: string }) {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] bg-clip-text text-transparent ${className}`}
    >
      {text}
    </span>
  )
}

/**
 * ToolBadge — OpenCode's tool usage display.
 * Shows what the AI did before answering (e.g., "Searched the web", "Read 3 files").
 */
export function ToolBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

/**
 * ContextUsage — OpenCode's token/context counter.
 * Shows how much of the context window is being used.
 */
export function ContextUsage({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / total) * 100))
  const color = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono">{pct}%</span>
    </div>
  )
}

/**
 * FollowUpSuggestions — OpenCode's follow-up chips after AI response.
 */
export function FollowUpSuggestions({ suggestions, onPick }: { suggestions: string[]; onPick: (s: string) => void }) {
  if (!suggestions.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onPick(s)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

/**
 * MessageActions — OpenCode's per-message action row.
 * Shows copy, regenerate, share, like/dislike on hover.
 */
export function MessageActions({
  onCopy,
  onRegenerate,
  onShare,
  onLike,
  onDislike,
  feedback,
  copied,
}: {
  onCopy?: () => void
  onRegenerate?: () => void
  onShare?: () => void
  onLike?: () => void
  onDislike?: () => void
  feedback?: 'up' | 'down' | null
  copied?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {onCopy && (
        <button onClick={onCopy} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Copy">
          {copied ? <Check /> : <Copy />}
        </button>
      )}
      {onRegenerate && (
        <button onClick={onRegenerate} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Regenerate">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
      {onShare && (
        <button onClick={onShare} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Share">
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}
      {onLike && (
        <button onClick={onLike} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', feedback === 'up' ? 'text-accent bg-accent/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground')} title="Good response">
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
      )}
      {onDislike && (
        <button onClick={onDislike} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', feedback === 'down' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground')} title="Bad response">
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

import { Check, Copy, RefreshCw, Share2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ModelSelector — OpenCode's inline model picker in the composer.
 */
export function ModelSelector({ currentModel, models, onSelect }: {
  currentModel: string
  models: { id: string; name: string; description: string }[]
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <span className="flex h-3 w-3 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400" />
        {currentModel}
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-border bg-popover shadow-xl z-50 overflow-hidden">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false) }}
                className={cn(
                  'w-full flex items-start gap-3 p-2.5 hover:bg-accent/10 transition-colors text-left',
                  currentModel === m.name && 'bg-accent/5'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.description}</div>
                </div>
                {currentModel === m.name && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * MessageTimeline — OpenCode's virtualized message timeline pattern.
 * Groups messages by turn (user + assistant response = one turn).
 */
export function MessageTimeline({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      {children}
    </div>
  )
}

/**
 * TurnDivider — visual separator between conversation turns.
 */
export function TurnDivider() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

// Add shimmer keyframe (client-side only)
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.id = 'shimmer-keyframes'
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `
  if (!document.getElementById('shimmer-keyframes')) {
    document.head.appendChild(style)
  }
}
