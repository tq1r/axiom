'use client'

import { useMemo, useState, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Check, Copy, Code2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNav, useStudio } from '@/lib/axiom/store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Math as MathExpr } from './math'
import { MermaidDiagram } from './mermaid'

interface MarkdownProps {
  content: string
  streaming?: boolean
}

const LANGUAGE_LABELS: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript React',
  typescript: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript React',
  javascript: 'JavaScript',
  py: 'Python',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  cs: 'C#',
  rb: 'Ruby',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  md: 'Markdown',
  markdown: 'Markdown',
  dockerfile: 'Dockerfile',
  graphql: 'GraphQL',
  toml: 'TOML',
  xml: 'XML',
}

// Very lightweight syntax highlighting — colors common tokens.
function highlightCode(code: string, lang: string): string {
  // We do token-based replacement on spans, being careful to avoid HTML injection.
  // First, escape HTML.
  let out = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Comments
  if (['ts', 'tsx', 'js', 'jsx', 'typescript', 'javascript', 'go', 'rust', 'java', 'c', 'cpp', 'csharp', 'cs', 'swift', 'kt', 'scss', 'css', 'graphql'].includes(lang)) {
    out = out.replace(/(\/\/[^\n]*)/g, '<span class="text-zinc-500 italic">$1</span>')
  }
  if (['py', 'python', 'rb', 'ruby', 'sh', 'bash', 'shell', 'yaml', 'yml', 'toml'].includes(lang)) {
    out = out.replace(/(#[^\n]*)/g, '<span class="text-zinc-500 italic">$1</span>')
  }

  // Strings
  out = out.replace(/(['"`])(?:(?=(\\?))\2.)*?\1/g, (m) => `<span class="text-emerald-400">${m}</span>`)

  // Keywords
  const keywords = ['import', 'export', 'from', 'default', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'implements', 'interface', 'type', 'enum', 'async', 'await', 'new', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break', 'continue', 'this', 'super', 'static', 'public', 'private', 'protected', 'readonly', 'get', 'set', 'void', 'null', 'undefined', 'true', 'false', 'def', 'print', 'func', 'fn', 'let', 'mut', 'pub', 'struct', 'impl', 'trait', 'use', 'match', 'self']
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  out = out.replace(kwRegex, '<span class="text-violet-400">$1</span>')

  // Numbers
  out = out.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>')

  // Booleans / nulls (already covered above, but ensure not double-wrapped by limiting)

  // Function calls (word followed by paren)
  out = out.replace(/\b([a-zA-Z_$][\w$]*)(\s*\()/g, '<span class="text-cyan-400">$1</span>$2')

  // JSX tags
  if (['tsx', 'jsx'].includes(lang)) {
    out = out.replace(/(&lt;\/?)([A-Za-z][\w.]*)/g, '$1<span class="text-pink-400">$2</span>')
  }

  return out
}

export function Markdown({ content, streaming }: MarkdownProps) {
  const [openInStudioCode, setOpenInStudioCode] = useState<{ code: string; lang: string } | null>(null)
  const { navigate } = useNav()
  const { createProject, setActiveProject, setActiveFile } = useStudio()

  // Preprocess: split content into math and non-math segments so we can render
  // $$...$$ as display math and $...$ as inline math.
  const segments = useMemo(() => preprocessMath(content), [content])

  const components = useMemo(
    () => ({
      code({ inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        const lang = match?.[1] || 'text'
        const code = String(children).replace(/\n$/, '')

        if (inline) {
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-[0.85em] font-mono text-accent" {...props}>
              {children}
            </code>
          )
        }

        // Mermaid diagrams
        if (lang === 'mermaid') {
          return <MermaidDiagram code={code} />
        }

        return <CodeBlock code={code} lang={lang} onOpenInStudio={() => setOpenInStudioCode({ code, lang })} />
      },
      a({ children, href }: any) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent/80">
            {children}
          </a>
        )
      },
      table({ children }: any) {
        return (
          <div className="my-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        )
      },
    }),
    []
  )

  const handleOpenInStudio = () => {
    if (!openInStudioCode) return
    const id = createProject('ai-snippet', 'Vite + React')
    setActiveProject(id)
    setActiveFile(null)
    navigate('studio')
    setOpenInStudioCode(null)
  }

  return (
    <>
      <div className="axiom-prose">
        {segments.map((seg, i) => {
          if (seg.type === 'display-math') {
            return <MathExpr key={i} expression={seg.content} display />
          }
          if (seg.type === 'inline-math') {
            return <MathExpr key={i} expression={seg.content} />
          }
          return (
            <ReactMarkdown key={i} components={components as any}>
              {seg.content}
            </ReactMarkdown>
          )
        })}
        {streaming && <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse rounded-sm" />}
      </div>

      <Dialog open={!!openInStudioCode} onOpenChange={(o) => !o && setOpenInStudioCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open in Axiom Studio</DialogTitle>
            <DialogDescription>
              This will create a new Studio project and drop the code into a file so you can edit, run, and iterate with the AI agent.
            </DialogDescription>
          </DialogHeader>
          {openInStudioCode && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-48 overflow-y-auto axiom-scroll-thin">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {openInStudioCode.code.slice(0, 400)}
                {openInStudioCode.code.length > 400 ? '\n…' : ''}
              </pre>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenInStudioCode(null)}>
              Cancel
            </Button>
            <Button onClick={handleOpenInStudio} className="bg-foreground text-background hover:bg-foreground/90">
              <Code2 className="mr-2 h-4 w-4" />
              Open in Studio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CodeBlock({ code, lang, onOpenInStudio }: { code: string; lang: string; onOpenInStudio: () => void }) {
  const [copied, setCopied] = useState(false)
  const label = LANGUAGE_LABELS[lang] || lang.toUpperCase()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const highlighted = useMemo(() => highlightCode(code, lang), [code, lang])

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border bg-[#0d0d0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground ml-1">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenInStudio}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-accent hover:bg-accent/10 transition-colors"
            title="Open this code in Axiom Studio"
          >
            <Code2 className="h-3 w-3" />
            Open in Studio
          </button>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {/* Code */}
      <div className="overflow-x-auto axiom-scroll-thin">
        <pre className="p-4 text-[13px] leading-relaxed font-mono">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  )
}

/**
 * Split content into segments: display math ($$...$$), inline math ($...$),
 * and regular markdown text. Avoids splitting inside code spans and fenced blocks.
 */
function preprocessMath(content: string): Array<{ type: 'text' | 'display-math' | 'inline-math'; content: string }> {
  const segments: Array<{ type: 'text' | 'display-math' | 'inline-math'; content: string }> = []
  let remaining = content

  while (remaining.length > 0) {
    // Find the next code fence or inline code — we must not process math inside code
    const fenceStart = remaining.search(/```/)
    const inlineCodeStart = remaining.search(/(?<!`)`[^`]/)

    // Find display math $$...$$
    const displayStart = remaining.indexOf('$$')
    // Find inline math $...$  (not preceded by $, not $$ )
    const inlineMatch = remaining.match(/(?<!\$)\$(?!\$)([^\$\n]+?)\$/)

    // Determine which comes first
    const candidates: Array<{ idx: number; type: 'fence' | 'inline-code' | 'display' | 'inline' }> = []
    if (fenceStart >= 0) candidates.push({ idx: fenceStart, type: 'fence' })
    if (inlineCodeStart >= 0) candidates.push({ idx: inlineCodeStart, type: 'inline-code' })
    if (displayStart >= 0) candidates.push({ idx: displayStart, type: 'display' })
    if (inlineMatch && inlineMatch.index !== undefined) candidates.push({ idx: inlineMatch.index, type: 'inline' })

    if (candidates.length === 0) {
      segments.push({ type: 'text', content: remaining })
      break
    }

    candidates.sort((a, b) => a.idx - b.idx)
    const first = candidates[0]

    // Emit any text before this segment
    if (first.idx > 0) {
      segments.push({ type: 'text', content: remaining.slice(0, first.idx) })
      remaining = remaining.slice(first.idx)
    }

    if (first.type === 'fence') {
      // Find the closing fence
      const closeIdx = remaining.indexOf('```', 3)
      const end = closeIdx >= 0 ? closeIdx + 3 : remaining.length
      segments.push({ type: 'text', content: remaining.slice(0, end) })
      remaining = remaining.slice(end)
    } else if (first.type === 'inline-code') {
      // Find the closing backtick
      const closeIdx = remaining.indexOf('`', 1)
      const end = closeIdx >= 0 ? closeIdx + 1 : remaining.length
      segments.push({ type: 'text', content: remaining.slice(0, end) })
      remaining = remaining.slice(end)
    } else if (first.type === 'display') {
      // $$...$$
      const closeIdx = remaining.indexOf('$$', 2)
      if (closeIdx >= 0) {
        segments.push({ type: 'display-math', content: remaining.slice(2, closeIdx).trim() })
        remaining = remaining.slice(closeIdx + 2)
      } else {
        // No closing — treat as text
        segments.push({ type: 'text', content: remaining })
        break
      }
    } else if (first.type === 'inline' && inlineMatch) {
      segments.push({ type: 'inline-math', content: inlineMatch[1].trim() })
      remaining = remaining.slice(inlineMatch.index! + inlineMatch[0].length)
    }
  }

  // Merge adjacent text segments for efficiency
  const merged: typeof segments = []
  for (const seg of segments) {
    const last = merged[merged.length - 1]
    if (last && last.type === 'text' && seg.type === 'text') {
      last.content += seg.content
    } else {
      merged.push({ ...seg })
    }
  }
  return merged
}
