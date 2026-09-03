'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Check,
  Loader2,
  ChevronRight,
  CornerDownLeft,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModelBadge } from '../shared/model-badge'
import { toast } from 'sonner'

interface InlineEditDialogProps {
  open: boolean
  onClose: () => void
  selectedCode: string
  fileName?: string
  onApply: (newCode: string) => void
}

export function InlineEditDialog({
  open,
  onClose,
  selectedCode,
  fileName,
  onApply,
}: InlineEditDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [diff, setDiff] = useState<{ before: string; after: string } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrompt('')
      setDiff(null)
      setLoading(false)
      const t = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setDiff(null)

    // Simulate AI generating a diff
    await new Promise((r) => setTimeout(r, 1200))

    const result = generateEdit(selectedCode, prompt)
    setDiff(result)
    setLoading(false)
  }

  const handleApply = () => {
    if (!diff) return
    onApply(diff.after)
    toast.success('Edit applied', { description: 'The change has been applied to the file.' })
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-11 px-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium">Inline Edit</span>
                <ModelBadge modelId="axiom-coder" size="sm" showName={false} />
                {fileName && (
                  <span className="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {fileName}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Prompt input */}
            <div className="p-4 border-b border-border">
              <label className="text-xs text-muted-foreground block mb-2">Describe the change</label>
              <div className="relative rounded-lg border border-border bg-background focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30 transition-all">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Add error handling, convert to async/await, add JSDoc comments…"
                  rows={2}
                  className="w-full resize-none bg-transparent px-3 pt-2.5 pb-8 text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[9px]">⌘</kbd>
                    <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[9px]">↵</kbd>
                    to generate
                  </span>
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || loading}
                    className="h-7 gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Selected code preview */}
            {!diff && (
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Selected code</div>
                <div className="rounded-lg border border-border bg-[#0d0d0f] p-3 max-h-32 overflow-y-auto axiom-scroll-thin">
                  <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
                    {selectedCode.slice(0, 500)}
                    {selectedCode.length > 500 ? '\n…' : ''}
                  </pre>
                </div>
              </div>
            )}

            {/* Diff view */}
            {diff && (
              <div className="p-4 max-h-[40vh] overflow-y-auto axiom-scroll-thin">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  Proposed change
                  <span className="text-emerald-400">+{countLines(diff.after)}</span>
                  <span className="text-red-400">-{countLines(diff.before)}</span>
                </div>
                <div className="rounded-lg border border-border bg-[#0d0d0f] overflow-hidden">
                  <pre className="text-[12px] font-mono leading-relaxed">
                    {diff.before.split('\n').map((line, i) => (
                      <div key={`b-${i}`} className="px-3 py-0.5 text-red-400 bg-red-500/5">
                        <span className="text-muted-foreground select-none">- </span>
                        {line || ' '}
                      </div>
                    ))}
                    {diff.after.split('\n').map((line, i) => (
                      <div key={`a-${i}`} className="px-3 py-0.5 text-emerald-400 bg-emerald-500/5">
                        <span className="text-muted-foreground select-none">+ </span>
                        {line || ' '}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            )}

            {/* Footer */}
            {diff && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
                <span className="text-xs text-muted-foreground">Review the diff before applying</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDiff(null)}>
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleApply} className="gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function countLines(s: string): number {
  return s.split('\n').length
}

function generateEdit(original: string, prompt: string): { before: string; after: string } {
  const p = prompt.toLowerCase()

  // Error handling
  if (p.includes('error') || p.includes('try') || p.includes('catch')) {
    return {
      before: original,
      after: `try {
${original.split('\n').map((l) => '  ' + l).join('\n')}
} catch (err) {
  console.error('Operation failed:', err)
  throw new Error(\`Failed to execute: \${err instanceof Error ? err.message : 'unknown error'}\`)
}`,
    }
  }

  // Add types
  if (p.includes('type') || p.includes('typescript') || p.includes('interface')) {
    return {
      before: original,
      after: `/**
 * TODO: Add proper TypeScript types
 */
${original.replace(/function\s+(\w+)\s*\(([^)]*)\)/, 'function $1($2: Record<string, unknown>)')}`,
    }
  }

  // Add comments / JSDoc
  if (p.includes('comment') || p.includes('jsdoc') || p.includes('document')) {
    return {
      before: original,
      after: `/**
 * ${prompt.replace(/^(add|with)\s+/i, '').replace(/\s+(comments?|jsdoc|documentation?)$/i, '')}
 *
 * @example
 * \`\`\`
 * // Usage example
 * \`\`\`
 */
${original}`,
    }
  }

  // Convert to async
  if (p.includes('async') || p.includes('await')) {
    return {
      before: original,
      after: original
        .replace(/function\s+/g, 'async function ')
        .replace(/=>\s*{/g, '=> { /* now async */')
        .replace(/return\s+/g, 'return await '),
    }
  }

  // Default: wrap with a comment
  return {
    before: original,
    after: `// Refactored per: ${prompt}\n${original}`,
  }
}
