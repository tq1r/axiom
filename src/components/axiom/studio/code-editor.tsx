'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  value: string
  language: string
  onChange?: (v: string) => void
  readOnly?: boolean
  /** Ghost text suggestion for inline completions */
  ghostText?: string
  onAcceptGhost?: () => void
}

// Use the shared single-pass tokenizer
import { highlightCode as highlightTokens } from '@/lib/axiom/highlight'
function highlight(code: string, lang: string): string {
  return highlightTokens(code, lang)
}

export function CodeEditor({ value, language, onChange, readOnly, ghostText, onAcceptGhost }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const [lineCount, setLineCount] = useState(value.split('\n').length)

  useEffect(() => {
    setLineCount(value.split('\n').length)
  }, [value])

  // Sync scroll
  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const highlighted = useMemo(() => highlight(value, language), [value, language])

  // Handle Tab key and ghost text acceptance
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && ghostText && onAcceptGhost) {
      e.preventDefault()
      onAcceptGhost()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange?.(newValue)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const lineNumbers = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')
  }, [lineCount])

  return (
    <div className="relative h-full flex bg-[var(--paper-bright)] font-mono text-[13px] leading-[1.6] overflow-hidden">
      {/* Line numbers */}
      <div className="shrink-0 select-none py-3 px-3 text-right text-muted-foreground/60 bg-[var(--background-2)] border-r hairline">
        <pre className="whitespace-pre">{lineNumbers}</pre>
      </div>

      {/* Editor area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Highlighted pre (background) */}
        <pre
          ref={preRef}
          aria-hidden
          className="absolute inset-0 m-0 py-3 px-4 whitespace-pre overflow-auto pointer-events-none scroll-thin"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />

        {/* Textarea (transparent, on top) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="absolute inset-0 w-full h-full py-3 px-4 bg-transparent text-transparent resize-none outline-none whitespace-pre overflow-auto scroll-thin"
          style={{ caretColor: 'var(--tangerine)' }}
        />

        {/* Ghost text hint */}
        {ghostText && (
          <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground bg-[var(--card)] px-2 py-0.5 rounded border hairline pointer-events-none">
            Tab to accept
          </div>
        )}
      </div>
    </div>
  )
}
