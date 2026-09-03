'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  X,
  Check,
  CheckCircle2,
  XCircle,
  Loader2,
  FileEdit,
  Terminal,
  ChevronRight,
  GitBranch,
  AtSign,
  Brain,
  ListChecks,
  RotateCcw,
  CornerDownLeft,
  Code2,
  Globe,
  Folder,
  Files,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStudio, useNav } from '@/lib/axiom/store'
import { ModelBadge } from '../shared/model-badge'
import { uid } from '@/lib/axiom/sample-data'
import type { AgentStep } from '@/lib/axiom/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

const CONTEXT_MENTIONS = [
  { id: 'file', label: '@file', desc: 'Reference a specific file', icon: FileEdit },
  { id: 'folder', label: '@folder', desc: 'Reference a folder', icon: Folder },
  { id: 'codebase', label: '@codebase', desc: 'Search entire project via embeddings', icon: Files },
  { id: 'web', label: '@web', desc: 'Search the web for docs', icon: Globe },
  { id: 'docs', label: '@docs', desc: 'Search official documentation', icon: Brain },
  { id: 'terminal', label: '@terminal', desc: 'Include terminal output as context', icon: Terminal },
]

// Approval gate mechanism — command steps pause here until the user clicks Approve/Reject
const approvalResolvers = new Map<string, { resolve: (v: boolean) => void }>()

function waitForApproval(stepId: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    approvalResolvers.set(stepId, { resolve })
    // Auto-approve after 8s for demo smoothness (real product would wait indefinitely)
    setTimeout(() => {
      if (approvalResolvers.has(stepId)) {
        approvalResolvers.delete(stepId)
        resolve(true)
      }
    }, 8000)
  })
}

function resolveApproval(stepId: string, approved: boolean) {
  const entry = approvalResolvers.get(stepId)
  if (entry) {
    approvalResolvers.delete(stepId)
    entry.resolve(approved)
  }
}

const AGENT_PLANS: Record<string, string[]> = {
  'landing': [
    'Analyze project structure and dependencies',
    'Create a responsive Header component',
    'Build a Hero section with gradient background',
    'Add a Features grid with 3-column layout',
    'Create a Pricing table with dark mode toggle',
    'Wire up smooth scroll and animations',
    'Run dev server to verify build',
  ],
  'todo': [
    'Create a Todo type and store',
    'Build the Todo input form',
    'Add list rendering with filters',
    'Implement toggle and delete actions',
    'Add localStorage persistence',
    'Verify with the dev server',
  ],
  'default': [
    'Analyze current project structure',
    'Plan the required changes',
    'Create or edit necessary files',
    'Run tests and verify',
    'Confirm completion',
  ],
}

export function AiPanel({ onClose }: { onClose: () => void }) {
  const {
    agentSteps,
    agentRunning,
    setAgentRunning,
    addAgentStep,
    updateAgentStep,
    clearAgentSteps,
  } = useStudio()
  const [input, setInput] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [activeMentions, setActiveMentions] = useState<string[]>([])
  const [checkpointDialog, setCheckpointDialog] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [agentSteps])

  const handleSend = async () => {
    if (!input.trim() || agentRunning) return
    const prompt = input.trim()
    setInput('')

    // Determine plan based on prompt
    const planKey = prompt.toLowerCase().includes('landing') || prompt.toLowerCase().includes('page')
      ? 'landing'
      : prompt.toLowerCase().includes('todo')
        ? 'todo'
        : 'default'
    const planSteps = AGENT_PLANS[planKey]

    // Add plan step
    const planStepId = 's_' + uid()
    addAgentStep({
      id: planStepId,
      type: 'plan',
      title: 'Plan',
      detail: prompt,
      status: 'done',
      timestamp: Date.now(),
    })

    setAgentRunning(true)

    // Execute steps with realistic timing
    for (let i = 0; i < planSteps.length; i++) {
      const stepId = 's_' + uid()
      const step = planSteps[i]
      const isFileStep = step.includes('Create') || step.includes('Build') || step.includes('Add') || step.includes('Implement') || step.includes('Wire')
      const isCommandStep = step.includes('Run') || step.includes('Verify')

      addAgentStep({
        id: stepId,
        type: isFileStep ? 'file' : isCommandStep ? 'command' : 'thought',
        title: step,
        status: 'running',
        timestamp: Date.now(),
        fileName: isFileStep ? guessFileName(step, i) : undefined,
        command: isCommandStep ? 'npm run dev' : undefined,
      })

      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600))

      // For file steps, show a diff
      if (isFileStep) {
        updateAgentStep(stepId, {
          status: 'done',
          diff: generateSampleDiff(step),
        })
      } else if (isCommandStep) {
        // Command needs approval — pause until user approves
        updateAgentStep(stepId, {
          status: 'pending',
          detail: 'Approval required to run this command in the sandbox.',
        })
        // Wait for approval (max 60s then auto-approve for demo)
        const approved = await waitForApproval(stepId)
        if (approved) {
          updateAgentStep(stepId, { status: 'running', detail: undefined })
          await new Promise((r) => setTimeout(r, 800))
          updateAgentStep(stepId, {
            status: 'done',
            output: '✓ Ready in 412ms\n  Local: http://localhost:5173\n  Network: use --host to expose',
          })
        } else {
          updateAgentStep(stepId, { status: 'error', detail: 'Command rejected by user.' })
          break
        }
      } else {
        updateAgentStep(stepId, { status: 'done' })
      }
    }

    // Complete
    addAgentStep({
      id: 's_' + uid(),
      type: 'complete',
      title: 'Done',
      detail: 'All changes applied. Review the diffs above and undo any step if needed.',
      status: 'done',
      timestamp: Date.now(),
    })

    setAgentRunning(false)
    toast.success('Agent finished', { description: 'All steps completed successfully.' })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === '@') {
      setShowMentions(true)
    }
  }

  const insertMention = (mention: typeof CONTEXT_MENTIONS[number]) => {
    setInput((prev) => prev + mention.label + ' ')
    setActiveMentions((prev) => [...new Set([...prev, mention.id])])
    setShowMentions(false)
  }

  const handleUndo = (stepId: string) => {
    updateAgentStep(stepId, { status: 'pending' })
    toast.info('Checkpoint restored', { description: 'Reverted to before this step.' })
  }

  return (
    <div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-cyan-400">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-medium">Agent</span>
          <ModelBadge modelId="axiom-coder" size="sm" showName={false} />
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Steps timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto axiom-scroll-thin p-3">
        {agentSteps.length === 0 ? (
          <EmptyAgent />
        ) : (
          <div className="space-y-1">
            {agentSteps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                onUndo={() => handleUndo(step.id)}
                isLast={i === agentSteps.length - 1}
              />
            ))}
            {agentRunning && (
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Working…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context mentions bar */}
      {activeMentions.length > 0 && (
        <div className="px-3 py-1.5 border-t border-sidebar-border flex flex-wrap gap-1">
          {activeMentions.map((id) => {
            const m = CONTEXT_MENTIONS.find((c) => c.id === id)
            if (!m) return null
            return (
              <span key={id} className="inline-flex items-center gap-1 text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                <m.icon className="h-2.5 w-2.5" />
                {m.label}
                <button onClick={() => setActiveMentions((prev) => prev.filter((x) => x !== id))}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t border-sidebar-border shrink-0">
        {showMentions && (
          <div className="mb-2 rounded-lg border border-sidebar-border bg-popover shadow-lg overflow-hidden">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Add context</div>
            {CONTEXT_MENTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => insertMention(m)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 hover:bg-accent/10 transition-colors text-left"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                  <m.icon className="h-3 w-3 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono">{m.label}</div>
                  <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="relative rounded-lg border border-sidebar-border bg-sidebar-accent/50 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to build…"
            rows={2}
            className="w-full resize-none bg-transparent px-3 pt-2.5 pb-8 text-sm placeholder:text-muted-foreground focus:outline-none"
            style={{ minHeight: '56px', maxHeight: '120px' }}
          />
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
            <button
              onClick={() => setShowMentions(!showMentions)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
            >
              <AtSign className="h-3 w-3" />
              Context
            </button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || agentRunning}
              className="h-6 w-6 p-0 bg-foreground text-background hover:bg-foreground/90"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Agent mode · Axiom Coder</span>
          {agentSteps.length > 0 && !agentRunning && (
            <button
              onClick={clearAgentSteps}
              className="hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyAgent() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 mb-4 axiom-glow-sm">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-sm font-semibold">Build with the agent</h3>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[220px]">
        Describe a goal in plain English. The agent will plan, edit files, run commands, and self-correct — with approval gates and undoable checkpoints.
      </p>
      <div className="mt-5 w-full space-y-1.5">
        {[
          'Build a responsive landing page with a pricing table and dark mode',
          'Add a todo list with localStorage persistence',
          'Create a reusable Button component with variants',
        ].map((s) => (
          <div key={s} className="rounded-md border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-1.5 text-[11px] text-muted-foreground text-left">
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepCard({ step, index, onUndo, isLast }: { step: AgentStep; index: number; onUndo: () => void; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true)
  const isPendingApproval = step.type === 'command' && step.status === 'pending'

  const Icon = step.type === 'plan' ? ListChecks
    : step.type === 'file' ? FileEdit
    : step.type === 'command' ? Terminal
    : step.type === 'complete' ? Check
    : Brain

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation()
    resolveApproval(step.id, true)
  }
  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    resolveApproval(step.id, false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-lg border bg-sidebar-accent/30 overflow-hidden',
        step.status === 'error' ? 'border-red-500/30' : 'border-sidebar-border',
        step.type === 'complete' && 'border-emerald-500/30 bg-emerald-500/5'
      )}
    >
      {/* Step header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-sidebar-accent/50 transition-colors"
      >
        <div className={cn(
          'flex h-5 w-5 items-center justify-center rounded shrink-0',
          step.status === 'done' && step.type === 'complete' ? 'bg-emerald-500/20 text-emerald-400'
          : step.status === 'done' ? 'bg-accent/20 text-accent'
          : step.status === 'running' ? 'bg-yellow-500/20 text-yellow-400'
          : step.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
          : step.status === 'error' ? 'bg-red-500/20 text-red-400'
          : 'bg-muted text-muted-foreground'
        )}>
          {step.status === 'running' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : step.status === 'pending' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
          ) : step.status === 'done' ? (
            <Check className="h-3 w-3" />
          ) : step.status === 'error' ? (
            <XCircle className="h-3 w-3" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
        </div>
        <span className="flex-1 text-xs font-medium truncate">{step.title}</span>
        {step.fileName && (
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {step.fileName}
          </span>
        )}
        {step.type !== 'complete' && (
          <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        )}
      </button>

      {/* Step detail */}
      <AnimatePresence>
        {expanded && (step.detail || step.diff || step.output || step.command) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2.5 pt-0 space-y-2">
              {step.detail && (
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">{step.detail}</p>
              )}
              {step.diff && (
                <div className="rounded border border-sidebar-border bg-[#0d0d0f] overflow-hidden ml-7">
                  <div className="px-2 py-1 text-[10px] text-muted-foreground border-b border-sidebar-border bg-muted/30 font-mono">
                    {step.fileName}
                  </div>
                  <pre className="p-2 text-[11px] font-mono leading-relaxed overflow-x-auto axiom-scroll-thin">
                    {step.diff.split('\n').map((line, i) => (
                      <div
                        key={i}
                        className={cn(
                          line.startsWith('+') && 'text-emerald-400 bg-emerald-500/5',
                          line.startsWith('-') && 'text-red-400 bg-red-500/5',
                          !line.startsWith('+') && !line.startsWith('-') && 'text-zinc-400'
                        )}
                      >
                        {line || ' '}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
              {step.command && (
                <div className={cn(
                  'ml-7 rounded border px-2 py-1.5',
                  isPendingApproval ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-sidebar-border bg-[#0d0d0f]'
                )}>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                    <Terminal className="h-3 w-3" />
                    <span className="text-foreground">{step.command}</span>
                  </div>
                  {step.output && (
                    <pre className="mt-1.5 text-[10px] font-mono text-emerald-400 whitespace-pre-wrap">{step.output}</pre>
                  )}
                  {isPendingApproval && (
                    <div className="mt-2 pt-2 border-t border-yellow-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                          Approval required
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleReject}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-sidebar-border text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                          <button
                            onClick={handleApprove}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Action buttons for completed file steps */}
              {step.status === 'done' && step.type === 'file' && (
                <div className="flex items-center gap-1.5 ml-7">
                  <button
                    onClick={onUndo}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Undo
                  </button>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">Checkpoint #{index + 1}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function guessFileName(step: string, index: number): string {
  const lower = step.toLowerCase()
  if (lower.includes('header')) return 'src/components/Header.tsx'
  if (lower.includes('hero')) return 'src/components/Hero.tsx'
  if (lower.includes('features') || lower.includes('grid')) return 'src/components/Features.tsx'
  if (lower.includes('pricing')) return 'src/components/Pricing.tsx'
  if (lower.includes('todo') || lower.includes('store')) return 'src/store/todo.ts'
  if (lower.includes('form') || lower.includes('input')) return 'src/components/TodoInput.tsx'
  if (lower.includes('button')) return 'src/components/Button.tsx'
  if (lower.includes('animation') || lower.includes('scroll')) return 'src/lib/animations.ts'
  return `src/components/Feature${index}.tsx`
}

function generateSampleDiff(step: string): string {
  const lower = step.toLowerCase()
  if (lower.includes('header')) {
    return `- <header className="bg-zinc-900">
-   <h1>Old Title</h1>
- </header>
+ <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
+   <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
+     <Logo />
+     <nav className="hidden md:flex gap-8 text-sm text-zinc-400">
+       <a href="#features">Features</a>
+       <a href="#pricing">Pricing</a>
+     </nav>
+     <ThemeToggle />
+   </div>
+ </header>`
  }
  if (lower.includes('hero')) {
    return `+ <section className="relative pt-32 pb-24 overflow-hidden">
+   <div className="absolute inset-0 axiom-grid-bg opacity-40" />
+   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]
+     bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 blur-[120px] rounded-full" />
+   <div className="relative text-center">
+     <h1 className="text-6xl font-semibold tracking-tight">
+       Build <span className="axiom-gradient-text">anything</span>
+     </h1>
+   </div>
+ </section>`
  }
  if (lower.includes('pricing')) {
    return `+ <div className="grid md:grid-cols-3 gap-4">
+   {tiers.map((t) => (
+     <PricingCard key={t.id} tier={t} highlight={t.highlight} />
+   ))}
+ </div>`
  }
  if (lower.includes('todo')) {
    return `+ export interface Todo {
+   id: string
+   text: string
+   done: boolean
+   createdAt: number
+ }
+
+ export const useTodos = () => {
+   const [todos, setTodos] = useState<Todo[]>(() => {
+     const saved = localStorage.getItem('todos')
+     return saved ? JSON.parse(saved) : []
+   })
+   useEffect(() => {
+     localStorage.setItem('todos', JSON.stringify(todos))
+   }, [todos])
+   return { todos, setTodos }
+ }`
  }
  return `+ // ${step}
+ export function Feature() {
+   return <div>Implementation ready</div>
+ }`
}
