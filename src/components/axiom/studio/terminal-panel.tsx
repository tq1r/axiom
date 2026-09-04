'use client'

import { useState, useRef, useEffect } from 'react'
import { Terminal as TerminalIcon, AlertCircle, FileOutput, Eye, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudio } from '@/lib/axiom/store'
import { Button } from '@/components/ui/button'

type PanelTab = 'terminal' | 'problems' | 'output' | 'preview'

interface TerminalPanelProps {
  onClose: () => void
}

export function TerminalPanel({ onClose }: TerminalPanelProps) {
  const { bottomPanel, setBottomPanel } = useStudio()
  const [lines, setLines] = useState<{ type: 'in' | 'out' | 'err'; text: string }[]>([
    { type: 'out', text: 'Axiom Studio · Terminal · zsh' },
    { type: 'out', text: 'Type "help" for available commands.' },
    { type: 'out', text: '' },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const tabs: { id: PanelTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
    { id: 'problems', label: 'Problems', icon: AlertCircle },
    { id: 'output', label: 'Output', icon: FileOutput },
    { id: 'preview', label: 'Preview', icon: Eye },
  ]

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    const cmd = input.trim()
    if (!cmd) return
    setLines((prev) => [...prev, { type: 'in', text: cmd }])
    setInput('')

    // Simulate command output
    setTimeout(() => {
      const output = simulateCommand(cmd)
      output.forEach((line) => {
        setLines((prev) => [...prev, { type: line.type, text: line.text }])
      })
    }, 100)
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background-2)] text-foreground">
      {/* Tabs */}
      <div className="flex items-center justify-between h-9 border-b hairline shrink-0">
        <div className="flex items-center h-full">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setBottomPanel(t.id)}
              className={cn(
                'flex items-center gap-1.5 h-full px-3 text-xs transition-colors border-b-2',
                bottomPanel === t.id
                  ? 'text-foreground border-accent bg-white/[0.02]'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
              {t.id === 'problems' && (
                <span className="ml-1 text-[9px] bg-red-500/20 text-red-400 px-1 rounded">2</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 pr-2">
          <button
            onClick={() => {}}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-[var(--secondary)]"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-[var(--secondary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {bottomPanel === 'terminal' && (
          <div
            className="h-full flex flex-col cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin p-3 font-mono text-[12px] leading-relaxed">
              {lines.map((line, i) => (
                <div key={i} className={cn(
                  'whitespace-pre-wrap break-all',
                  line.type === 'in' && 'text-foreground',
                  line.type === 'out' && 'text-muted-foreground',
                  line.type === 'err' && 'text-red-500'
                )}>
                  {line.type === 'in' && <span style={{ color: 'var(--forest)' }}>❯ </span>}
                  {line.text || '\u00A0'}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 font-mono text-[12px] border-t hairline">
              <span style={{ color: 'var(--forest)' }}>❯</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleCommand}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                placeholder="Type a command…"
                autoFocus
              />
            </div>
          </div>
        )}

        {bottomPanel === 'problems' && (
          <div className="h-full overflow-y-auto scroll-thin p-3 font-mono text-[12px] space-y-2">
            <div className="flex items-start gap-2 text-red-500">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <div>src/App.tsx:14:8 — Property 'data' does not exist on type 'null'.</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">Type 'null' has no property 'data'.</div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-amber-600">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <div>src/lib/api.ts:3:15 — Unused variable 'API_BASE'.</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">Consider removing or using this variable.</div>
              </div>
            </div>
          </div>
        )}

        {bottomPanel === 'output' && (
          <div className="h-full overflow-y-auto scroll-thin p-3 font-mono text-[12px] text-muted-foreground space-y-1">
            <div>[12:04:32] Dev server starting…</div>
            <div>[12:04:32] Loading vite.config.ts</div>
            <div>[12:04:33] ✓ Dependencies optimized</div>
            <div style={{ color: 'var(--forest)' }}>[12:04:33] ✓ Ready in 412ms</div>
            <div>[12:04:33] → Local: http://localhost:5173</div>
            <div>[12:04:33] → Network: use --host to expose</div>
            <div style={{ color: '#4A6FA5' }}>[12:04:34] [hmr] Connected.</div>
          </div>
        )}

        {bottomPanel === 'preview' && (
          <div className="h-full flex items-center justify-center text-center p-6">
            <div>
              <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Live Preview</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Running on http://localhost:5173. Hot reload is active — changes appear instantly.
              </p>
              <Button size="sm" variant="outline" className="mt-4">
                <Eye className="mr-2 h-3.5 w-3.5" />
                Open preview
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function simulateCommand(cmd: string): { type: 'in' | 'out' | 'err'; text: string }[] {
  const c = cmd.toLowerCase()
  if (c === 'help') {
    return [
      { type: 'out', text: 'Available commands:' },
      { type: 'out', text: '  ls          List files' },
      { type: 'out', text: '  pwd         Print working directory' },
      { type: 'out', text: '  npm run dev Start dev server' },
      { type: 'out', text: '  git status  Show git status' },
      { type: 'out', text: '  clear       Clear terminal' },
    ]
  }
  if (c === 'ls') {
    return [{ type: 'out', text: 'src  package.json  README.md  tsconfig.json  vite.config.ts' }]
  }
  if (c === 'pwd') {
    return [{ type: 'out', text: '/workspace/axiom-dashboard' }]
  }
  if (c.startsWith('npm run dev') || c === 'npm dev' || c === 'yarn dev') {
    return [
      { type: 'out', text: '> axiom-dashboard@1.0.0 dev' },
      { type: 'out', text: '> vite' },
      { type: 'out', text: '' },
      { type: 'out', text: '  VITE v5.2.0  ready in 412 ms' },
      { type: 'out', text: '' },
      { type: 'out', text: '  ➜  Local:   http://localhost:5173/' },
      { type: 'out', text: '  ➜  Network: use --host to expose' },
      { type: 'out', text: '  ➜  press h + enter to show help' },
    ]
  }
  if (c === 'git status') {
    return [
      { type: 'out', text: 'On branch main' },
      { type: 'out', text: "Changes not staged for commit:" },
      { type: 'out', text: '  (use "git add <file>..." to update what will be committed)' },
      { type: 'out', text: '' },
      { type: 'out', text: '        modified:   src/App.tsx' },
      { type: 'out', text: '        modified:   src/components/Header.tsx' },
      { type: 'out', text: '' },
      { type: 'out', text: 'no changes added to commit (use "git add" and/or "git commit -a")' },
    ]
  }
  if (c === 'clear') {
    setTimeout(() => {
      const event = new CustomEvent('clear-terminal')
      window.dispatchEvent(event)
    }, 0)
    return []
  }
  if (c === 'echo hello') {
    return [{ type: 'out', text: 'hello' }]
  }
  return [{ type: 'err', text: `command not found: ${cmd.split(' ')[0]}` }]
}
