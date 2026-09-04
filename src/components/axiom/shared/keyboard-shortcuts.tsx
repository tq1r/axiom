'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'

interface ShortcutGroup {
  category: string
  shortcuts: { keys: string[]; label: string }[]
}

const GROUPS: ShortcutGroup[] = [
  {
    category: 'Global',
    shortcuts: [
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['⌘', 'B'], label: 'Toggle sidebar' },
      { keys: ['?'], label: 'Show this help' },
      { keys: ['Esc'], label: 'Close dialog / cancel' },
    ],
  },
  {
    category: 'Chat',
    shortcuts: [
      { keys: ['⌘', 'J'], label: 'New chat' },
      { keys: ['Enter'], label: 'Send message' },
      { keys: ['Shift', 'Enter'], label: 'New line in message' },
      { keys: ['/'], label: 'Slash commands' },
    ],
  },
  {
    category: 'Studio',
    shortcuts: [
      { keys: ['⌘', 'I'], label: 'Inline edit (AI)' },
      { keys: ['⌘', 'S'], label: 'Save file' },
      { keys: ['Tab'], label: 'Accept ghost text suggestion' },
      { keys: ['⌘', 'P'], label: 'Quick open file' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['⌘', '1'], label: 'Go to Dashboard' },
      { keys: ['⌘', '2'], label: 'Go to Chat' },
      { keys: ['⌘', '3'], label: 'Go to Studio' },
      { keys: ['⌘', ','], label: 'Go to Settings' },
    ],
  },
]

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">Keyboard shortcuts</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid sm:grid-cols-2 gap-x-8 gap-y-6 max-h-[70vh] overflow-y-auto axiom-scroll-thin">
              {GROUPS.map((group) => (
                <div key={group.category}>
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                    {group.category}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((sc) => (
                      <div key={sc.label} className="flex items-center justify-between text-sm">
                        <span className="text-foreground/80">{sc.label}</span>
                        <div className="flex items-center gap-1">
                          {sc.keys.map((k, i) => (
                            <kbd
                              key={i}
                              className="font-mono text-[10px] bg-muted border border-border px-1.5 py-0.5 rounded shadow-sm"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-muted/20 text-center">
              <span className="text-xs text-muted-foreground">
                Press <kbd className="font-mono bg-muted border border-border px-1 py-0.5 rounded text-[10px]">?</kbd> anywhere to toggle this help
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
