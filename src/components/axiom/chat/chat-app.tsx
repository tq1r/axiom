'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  RefreshCw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Share2,
  GitBranch,
  ChevronDown,
  Sparkles,
  Code2,
  PenLine,
  Lightbulb,
  Globe,
  Gamepad2,
  X,
} from 'lucide-react'
import { ChatSidebar } from './chat-sidebar'
import { ChatComposer } from './chat-composer'
import { Markdown } from './markdown'
import { MiniGame } from './mini-game'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useChat, useUser } from '@/lib/axiom/store'
import { uid } from '@/lib/axiom/sample-data'
import type { ChatMessage } from '@/lib/axiom/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

const SUGGESTIONS = [
  { icon: Code2, title: 'Write code', prompt: 'Write a React hook for debouncing a value', accent: 'var(--tangerine)' },
  { icon: Lightbulb, title: 'Brainstorm ideas', prompt: 'Brainstorm 5 product ideas for a solo developer', accent: 'var(--forest)' },
  { icon: PenLine, title: 'Draft an email', prompt: 'Write a professional email requesting a deadline extension', accent: 'var(--ochre)' },
  { icon: Globe, title: 'Explain a concept', prompt: 'Explain how WebSockets work and when to use them', accent: '#4A6FA5' },
]

export function ChatApp() {
  const { navigate, activeThreadId, setActiveThread } = useNav()
  const {
    threads,
    createThread,
    addMessage,
    updateMessage,
    removeMessage,
    truncateAfter,
    setMessageFeedback,
  } = useChat()
  const { consumeCredit } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [gameDismissed, setGameDismissed] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll: only scroll to bottom if user is near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const atBottom = distance < 100
    setIsAtBottom(atBottom)
    setShowJumpButton(!atBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    setIsAtBottom(true)
    setShowJumpButton(false)
  }, [])

  const activeThread = threads.find((t) => t.id === activeThreadId)

  // Ensure there's a thread to show
  useEffect(() => {
    if (!activeThread && threads.length > 0) {
      setActiveThread(threads[0].id)
    } else if (!activeThread && threads.length === 0) {
      const id = createThread()
      setActiveThread(id)
    }
  }, [activeThreadId, threads.length])

  // Auto-scroll to bottom only when user is at the bottom
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [activeThread?.messages, isAtBottom])

  const streamResponse = useCallback(
    async (threadId: string, messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
      const assistantId = 'm_' + uid()
      const placeholder: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        isStreaming: true,
        isThinking: true,
        model: threads.find((t) => t.id === threadId)?.modelId,
      }
      addMessage(threadId, placeholder)
      setIsStreaming(true)
      setGameDismissed(false)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            model: threads.find((t) => t.id === threadId)?.modelId || 'axiom-pro',
          }),
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        if (!res.body) throw new Error('No response body')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let acc = ''
        let gotFirstToken = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            try {
              const data = JSON.parse(trimmed.slice(5).trim())
              if (data.type === 'token') {
                if (!gotFirstToken) {
                  gotFirstToken = true
                  updateMessage(threadId, assistantId, { isThinking: false })
                }
                acc += data.content
                updateMessage(threadId, assistantId, { content: acc, isStreaming: true })
              } else if (data.type === 'done') {
                updateMessage(threadId, assistantId, { isStreaming: false, isThinking: false })
              } else if (data.type === 'error') {
                updateMessage(threadId, assistantId, {
                  content: `⚠️ ${data.content}`,
                  isStreaming: false,
                })
              }
            } catch {
              // partial JSON, ignore
            }
          }
        }
        updateMessage(threadId, assistantId, { isStreaming: false })
        consumeCredit(1)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          updateMessage(threadId, assistantId, { isStreaming: false })
        } else {
          updateMessage(threadId, assistantId, {
            content: '⚠️ Failed to get a response. Please try again.',
            isStreaming: false,
          })
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [threads, addMessage, updateMessage, consumeCredit]
  )

  const handleSend = (text: string) => {
    if (!activeThread) return
    const userMsg: ChatMessage = {
      id: 'm_' + uid(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    addMessage(activeThread.id, userMsg)

    const history = [...activeThread.messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))
    streamResponse(activeThread.id, history)
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleRegenerate = (msgId: string) => {
    if (!activeThread || isStreaming) return
    const idx = activeThread.messages.findIndex((m) => m.id === msgId)
    if (idx === -1) return
    // Find the preceding user message
    const preceding = activeThread.messages.slice(0, idx)
    const history = preceding.map((m) => ({ role: m.role, content: m.content }))
    // Remove the old assistant message
    removeMessage(activeThread.id, msgId)
    streamResponse(activeThread.id, history)
  }

  const handleEditUser = (msgId: string) => {
    if (!activeThread || isStreaming) return
    const msg = activeThread.messages.find((m) => m.id === msgId)
    if (!msg) return
    setEditingMsgId(msgId)
    setEditValue(msg.content)
  }

  const commitEdit = () => {
    if (!activeThread || !editingMsgId) return
    const msg = activeThread.messages.find((m) => m.id === editingMsgId)
    if (!msg) return
    // Truncate everything after this message
    truncateAfter(activeThread.id, editingMsgId)
    // Update the message content
    updateMessage(activeThread.id, editingMsgId, { content: editValue })
    // Re-stream
    const idx = activeThread.messages.findIndex((m) => m.id === editingMsgId)
    const history = [
      ...activeThread.messages.slice(0, idx),
      { ...msg, content: editValue },
    ].map((m) => ({ role: m.role, content: m.content }))
    setEditingMsgId(null)
    setEditValue('')
    streamResponse(activeThread.id, history)
  }

  const handleShare = () => {
    toast.success('Shareable link copied to clipboard', {
      description: 'Anyone with the link can view this conversation read-only.',
    })
  }

  const handleBranch = () => {
    if (!activeThread) return
    const id = createThread(activeThread.modelId)
    // Copy messages
    activeThread.messages.forEach((m) => {
      addMessage(id, { ...m, id: 'm_' + uid() })
    })
    setActiveThread(id)
    toast.success('Branched conversation', {
      description: 'Created a fork from this point.',
    })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const hasMessages = activeThread && activeThread.messages.length > 0

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-4 border-b hairline shrink-0 bg-[var(--card)]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--secondary)]"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-medium truncate">
                {activeThread?.title || 'New conversation'}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {activeThread && <ModelBadge modelId={activeThread.modelId} size="sm" />}
                <span>·</span>
                <span>{activeThread?.messages.length || 0} messages</span>
              </div>
            </div>
          </div>
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleBranch}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <GitBranch className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Branch conversation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleShare}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Share link</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </header>

          {/* Messages or empty state */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin relative" onScroll={handleScroll}>
            {!hasMessages ? (
              <EmptyState onPick={handleSend} />
            ) : (
              <div className="mx-auto max-w-3xl px-6 pb-32">
                {activeThread!.messages.map((msg, i) => (
                  <MessageRow
                    key={msg.id}
                    msg={msg}
                    isLast={i === activeThread!.messages.length - 1}
                    onRegenerate={() => handleRegenerate(msg.id)}
                    onEdit={() => handleEditUser(msg.id)}
                    onCopy={() => handleCopy(msg.content)}
                    onFeedback={(fb) => activeThreadId && setMessageFeedback(activeThreadId, msg.id, fb)}
                    editing={editingMsgId === msg.id}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onCommitEdit={commitEdit}
                    onCancelEdit={() => { setEditingMsgId(null); setEditValue('') }}
                    canRegenerate={!isStreaming && msg.role === 'assistant'}
                    canEdit={!isStreaming && msg.role === 'user'}
                  />
                ))}
                <div ref={bottomRef} className="h-4" />
              </div>
            )}

            {/* Mini-game widget — appears when streaming and not dismissed */}
            {isStreaming && !gameDismissed && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="fixed bottom-32 right-6 z-40 shadow-xl"
                style={{ width: 260 }}
              >
                <MiniGame onClose={() => setGameDismissed(true)} compact />
              </motion.div>
            )}

            {/* Jump to latest button */}
            {showJumpButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-[var(--card)] border hairline shadow-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[var(--secondary)] transition-colors z-30"
              >
                <ChevronDown className="h-3 w-3" />
                Jump to latest
              </button>
            )}
          </div>

          {/* Composer */}
          <ChatComposer
            onSend={handleSend}
            onStop={handleStop}
            isStreaming={isStreaming}
            placeholder={hasMessages ? 'Reply to Axiom…' : 'Ask anything to start…'}
          />
      </div>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl w-full"
        >
          {/* Hero headline */}
          <h1 className="font-serif text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.1] font-medium text-foreground">
            What can I <span className="italic text-[var(--tangerine)]">build</span> for you?
          </h1>
          <p className="mt-4 text-muted-foreground">
            Interact with Axiom and explore the boundless creative world.
          </p>

          {/* Suggestion chips — horizontal pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                onClick={() => onPick(s.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border hairline bg-[var(--card)] px-3.5 py-1.5 text-sm text-foreground/80 hover:border-[var(--tangerine)]/40 hover:text-[var(--tangerine)] transition-colors"
              >
                <s.icon className="h-3.5 w-3.5" style={{ color: s.accent }} />
                {s.title}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

interface MessageRowProps {
  msg: ChatMessage
  isLast: boolean
  onRegenerate: () => void
  onEdit: () => void
  onCopy: () => void
  onFeedback: (fb: 'up' | 'down' | null) => void
  editing: boolean
  editValue: string
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  canRegenerate: boolean
  canEdit: boolean
}

function MessageRow({
  msg,
  isLast,
  onRegenerate,
  onEdit,
  onCopy,
  onFeedback,
  editing,
  editValue,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  canRegenerate,
  canEdit,
}: MessageRowProps) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group py-5"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[10px] font-medium">
              {useUser.getState().user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'YO'}
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tangerine)]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Message content — flat, full-width, no bubbles */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-semibold text-foreground">{isUser ? 'You' : 'Axiom'}</span>
            {!isUser && msg.model && <ModelBadge modelId={msg.model} size="sm" showName={false} />}
            {msg.toolBadge && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-[var(--secondary)] px-1.5 py-0.5 rounded">
                <Globe className="h-2.5 w-2.5" /> {msg.toolBadge}
              </span>
            )}
          </div>

          {editing ? (
            <div className="rounded-lg border hairline bg-[var(--card)] p-3">
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm resize-none min-h-[60px]"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
                <Button size="sm" onClick={onCommitEdit} className="bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90">
                  Send
                </Button>
              </div>
            </div>
          ) : isUser ? (
            <div className="text-[0.95rem] leading-[1.6] text-foreground whitespace-pre-wrap">
              {msg.content}
            </div>
          ) : (
            <>
              {/* Thinking indicator — shown while waiting for first token */}
              {msg.isThinking && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[var(--tangerine)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[var(--tangerine)] animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[var(--tangerine)] animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              )}
              {(!msg.isThinking || msg.content) && (
                <>
                  <Markdown content={msg.content} streaming={msg.isStreaming} />
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-[var(--tangerine)] ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </>
              )}
            </>
          )}

          {/* Actions */}
          {!editing && !msg.isStreaming && !msg.isThinking && (
            <div className={cn(
              'flex items-center gap-0.5 mt-2 transition-opacity',
              isLast ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}>
              <ActionButton onClick={handleCopy} title="Copy">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </ActionButton>
              {isUser ? (
                canEdit && (
                  <ActionButton onClick={onEdit} title="Edit & resend">
                    <Pencil className="h-3.5 w-3.5" />
                  </ActionButton>
                )
              ) : (
                <>
                  {canRegenerate && (
                    <ActionButton onClick={onRegenerate} title="Regenerate">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </ActionButton>
                  )}
                  <ActionButton
                    onClick={() => onFeedback(msg.feedback === 'up' ? null : 'up')}
                    title="Good response"
                    active={msg.feedback === 'up'}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </ActionButton>
                  <ActionButton
                    onClick={() => onFeedback(msg.feedback === 'down' ? null : 'down')}
                    title="Bad response"
                    active={msg.feedback === 'down'}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </ActionButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ActionButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
        active && 'text-accent bg-accent/10'
      )}
    >
      {children}
    </button>
  )
}
