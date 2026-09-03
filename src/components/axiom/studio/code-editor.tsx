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

// Reuse the highlighter logic
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(code: string, lang: string): string {
  let out = escapeHtml(code)

  // Comments — warm muted brown
  if (['ts', 'tsx', 'js', 'jsx', 'typescript', 'javascript', 'go', 'rust', 'java', 'c', 'cpp', 'csharp', 'cs', 'swift', 'kt', 'scss', 'css', 'graphql'].includes(lang)) {
    out = out.replace(/(\/\/[^\n]*)/g, '<span style="color: var(--muted-foreground); font-style: italic;">$1</span>')
  }
  if (['py', 'python', 'rb', 'ruby', 'sh', 'bash', 'shell', 'yaml', 'yml', 'toml'].includes(lang)) {
    out = out.replace(/(#[^\n]*)/g, '<span style="color: var(--muted-foreground); font-style: italic;">$1</span>')
  }
  // Strings — forest green
  out = out.replace(/(['"`])(?:(?=(\\?))\2.)*?\1/g, (m) => `<span style="color: var(--forest);">${m}</span>`)
  // Keywords — tangerine
  const keywords = ['import', 'export', 'from', 'default', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'implements', 'interface', 'type', 'enum', 'async', 'await', 'new', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break', 'continue', 'this', 'super', 'static', 'public', 'private', 'protected', 'readonly', 'get', 'set', 'void', 'null', 'undefined', 'true', 'false', 'def', 'print', 'func', 'fn', 'mut', 'pub', 'struct', 'impl', 'trait', 'use', 'match', 'self', 'in', 'of', 'as', 'is', 'not', 'and', 'or']
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  out = out.replace(kwRegex, '<span style="color: var(--tangerine); font-weight: 500;">$1</span>')
  // Numbers — ochre
  out = out.replace(/\b(\d+\.?\d*)\b/g, '<span style="color: var(--ochre);">$1</span>')
  // Function calls — ink (slightly darker)
  out = out.replace(/\b([a-zA-Z_$][\w$]*)(\s*\()/g, '<span style="color: #4A6FA5;">$1</span>$2')
  // JSX tags — tangerine darker
  if (['tsx', 'jsx'].includes(lang)) {
    out = out.replace(/(&lt;\/?)([A-Za-z][\w.]*)/g, '$1<span style="color: var(--tangerine);">$2</span>')
  }
  return out
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

  const highlighted = useMemo(() => highlight(value + (ghostText ? '\n' + ghostText : ''), language), [value, language, ghostText])

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
