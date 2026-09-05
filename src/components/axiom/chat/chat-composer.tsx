'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  Code2,
  Image as ImageIcon,
  Mic,
  Slash,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  Eye,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat } from '@/lib/axiom/store'
import { MODELS } from '@/lib/axiom/models'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useStudio } from '@/lib/axiom/store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface ChatComposerProps {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
  placeholder?: string
}

const SLASH_COMMANDS = [
  { cmd: '/explain', desc: 'Explain a concept or code', icon: Sparkles },
  { cmd: '/summarize', desc: 'Summarize a long text or document', icon: Zap },
  { cmd: '/imagine', desc: 'Generate an image from a prompt', icon: ImageIcon },
  { cmd: '/code', desc: 'Write code for a specific task', icon: Code2 },
]

const TOOLS = [
  { id: 'web', label: 'Web search', icon: Globe, desc: 'Search the web for current info' },
  { id: 'code', label: 'Code interpreter', icon: Code2, desc: 'Run code in a sandbox' },
  { id: 'image', label: 'Image generation', icon: ImageIcon, desc: 'Generate images from text' },
]

export function ChatComposer({ onSend, onStop, isStreaming, disabled, placeholder }: ChatComposerProps) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<{ name: string; type: string }[]>([])
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { activeThreadId, setThreadModel } = useChat()
  const { threads } = useChat()
  const thread = threads.find((t) => t.id === activeThreadId)
  const [modelOpen, setModelOpen] = useState(false)

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [text])

  // Slash command detection — derived directly, no setState in effect
  const lines = text.split('\n')
  const lastLine = lines[lines.length - 1]
  const showSlashComputed = lastLine.startsWith('/') && !lastLine.includes(' ')

  const handleSend = () => {
    if (!text.trim() || isStreaming || disabled) return
    onSend(text.trim())
    setText('')
    setAttachments([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((f) => {
      setAttachments((prev) => [...prev, { name: f.name, type: f.type }])
    })
    e.target.value = ''
  }

  const toggleTool = (id: string) => {
    setActiveTools((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const insertSlash = (cmd: string) => {
    const lines = text.split('\n')
    lines[lines.length - 1] = cmd + ' '
    setText(lines.join('\n'))
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t hairline bg-[var(--card)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {/* Slash command popover */}
        {showSlashComputed && (
          <div className="mb-2 rounded-lg border hairline bg-[var(--popover)] shadow-lg overflow-hidden">
            {SLASH_COMMANDS.map((sc) => (
              <button
                key={sc.cmd}
                onClick={() => insertSlash(sc.cmd)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--accent)]/10 transition-colors text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--muted)]">
                  <sc.icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono font-medium">{sc.cmd}</div>
                  <div className="text-xs text-muted-foreground">{sc.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-muted/50 pl-2 pr-1 py-1">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs truncate max-w-[140px]">{a.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="flex h-4 w-4 items-center justify-center rounded hover:bg-background"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Active tools */}
        {activeTools.size > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {Array.from(activeTools).map((id) => {
              const tool = TOOLS.find((t) => t.id === id)
              if (!tool) return null
              return (
                <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] px-2 py-0.5 text-[11px]">
                  <tool.icon className="h-3 w-3" />
                  {tool.label}
                  <button onClick={() => toggleTool(id)} className="ml-0.5 hover:opacity-70">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* Input area */}
        <div className="relative rounded-xl border hairline bg-[var(--background)] focus-within:border-[var(--accent)]/50 focus-within:ring-1 focus-within:ring-[var(--accent)]/20 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Message Axiom…'}
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[0.95rem] placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-0.5">
              {/* Attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--secondary)] hover:text-foreground transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFile}
                className="hidden"
                accept="image/*,.pdf,.csv,.txt,.md,.json,.ts,.js,.tsx,.jsx,.py"
              />

              {/* Model picker */}
              <Popover open={modelOpen} onOpenChange={setModelOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 h-8 px-2 rounded-md text-xs text-muted-foreground hover:bg-[var(--secondary)] hover:text-foreground transition-colors">
                    {thread && <ModelBadge modelId={thread.modelId} size="sm" showName={false} />}
                    <span className="hidden sm:inline">
                      {MODELS.find((m) => m.id === thread?.modelId)?.name || 'Axiom Pro'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Select model</div>
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (activeThreadId) setThreadModel(activeThreadId, m.id)
                        setModelOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-start gap-3 rounded-md p-2 hover:bg-[var(--accent)]/10 transition-colors text-left',
                        thread?.modelId === m.id && 'bg-[var(--accent)]/5'
                      )}
                    >
                      <ModelBadge modelId={m.id} size="md" showName={false} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{m.name}</span>
                          {thread?.modelId === m.id && <Check className="h-3 w-3 text-[var(--accent)]" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.tagline} · {m.contextWindow}</div>
                      </div>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Tools */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 h-8 px-2 rounded-md text-xs text-muted-foreground hover:bg-[var(--secondary)] hover:text-foreground transition-colors">
                    <Slash className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Tools</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Tools</div>
                  {TOOLS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTool(t.id)}
                      className="w-full flex items-start gap-3 rounded-md p-2 hover:bg-[var(--accent)]/10 transition-colors text-left"
                    >
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
                        activeTools.has(t.id) ? 'bg-accent text-[var(--accent)]-foreground' : 'bg-[var(--muted)] text-muted-foreground'
                      )}>
                        <t.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {t.label}
                          {activeTools.has(t.id) && <Check className="h-3 w-3 text-[var(--accent)]" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Voice (UI ready) */}
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--secondary)] hover:text-foreground transition-colors"
                title="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>

              {/* Send / Stop */}
              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-full bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Square className="h-3 w-3 fill-current" />
                  Stop
                </button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!text.trim() || disabled}
                  className="h-8 w-8 p-0 bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span><kbd className="font-mono">Enter</kbd> to send</span>
          <span><kbd className="font-mono">Shift+Enter</kbd> for newline</span>
          <span className="hidden sm:inline">Axiom can make mistakes. Verify important info.</span>
        </div>
      </div>
    </div>
  )
}
