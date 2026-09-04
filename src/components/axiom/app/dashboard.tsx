'use client'

import { motion } from 'framer-motion'
import {
  MessageSquare,
  Code2,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  ArrowUpRight,
  FolderGit2,
  Plus,
  Search,
} from 'lucide-react'
import { AppShell } from './app-shell'
import { useNav, useUser, useChat, useStudio } from '@/lib/axiom/store'
import { ModelBadge } from '../shared/model-badge'
import { formatTime } from '@/lib/axiom/sample-data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PROJECT_TEMPLATES } from '@/lib/axiom/sample-data'

export function Dashboard() {
  const { navigate, setActiveThread, setActiveProject, setActiveFile } = useNav()
  const { user } = useUser()
  const { threads, createThread } = useChat()
  const { projects, createProject } = useStudio()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = user?.name?.split(' ')[0] || 'there'
  const creditsPct = user ? Math.round((user.credits / user.creditsTotal) * 100) : 0

  const quickStarts = [
    { label: 'Write code', desc: 'Build a React component', icon: Code2, action: () => navigate('studio'), accent: 'var(--tangerine)' },
    { label: 'Brainstorm', desc: 'Generate product ideas', icon: Sparkles, action: () => { const id = createThread(); setActiveThread(id); navigate('chat') }, accent: 'var(--forest)' },
    { label: 'Analyze data', desc: 'Upload a CSV and ask', icon: TrendingUp, action: () => { const id = createThread(); setActiveThread(id); navigate('chat') }, accent: 'var(--ochre)' },
    { label: 'Explain a concept', desc: 'Ask anything', icon: MessageSquare, action: () => { const id = createThread(); setActiveThread(id); navigate('chat') }, accent: '#4A6FA5' },
  ]

  return (
    <AppShell activeView="dashboard">
      <div className="h-full overflow-y-auto scroll-thin">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--tangerine)]" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="font-serif text-3xl tracking-[-0.02em] font-medium">
              {greeting}, <span className="italic text-[var(--tangerine)]">{firstName}</span>.
            </h1>
            <p className="mt-2 text-muted-foreground">What can we build today?</p>
          </motion.div>

          {/* Quick start cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {quickStarts.map((q, i) => (
              <motion.button
                key={q.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={q.action}
                className="group relative text-left rounded-xl border hairline bg-[var(--card)] p-5 hover:border-[var(--accent)]/30 hover:shadow-sm transition-all overflow-hidden"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg mb-4"
                  style={{ background: q.accent + '18', color: q.accent }}
                >
                  <q.icon className="h-4 w-4" />
                </div>
                <div className="font-medium text-sm">{q.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{q.desc}</div>
                <ArrowUpRight className="absolute top-4 right-4 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>

          {/* Two-column: Recent activity + Usage */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent chats */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent chats</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('chat')} className="text-xs">
                  View all <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {threads.slice(0, 5).map((t, i) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    onClick={() => {
                      setActiveThread(t.id)
                      navigate('chat')
                    }}
                    className="w-full flex items-center gap-4 rounded-xl border hairline bg-[var(--card)]/60 p-4 hover:bg-[var(--card)] hover:hairline-strong transition-all text-left group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--secondary)] shrink-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {t.messages.length} messages · {formatTime(t.updatedAt)}
                      </div>
                    </div>
                    <ModelBadge modelId={t.modelId} size="sm" showName={false} />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
                {threads.length === 0 && (
                  <div className="rounded-xl border border-dashed hairline p-12 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No conversations yet. Start one above.</p>
                  </div>
                )}
              </div>

              {/* Recent projects */}
              <div className="flex items-center justify-between mb-4 mt-8">
                <h2 className="text-lg font-semibold">Recent projects</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('studio')} className="text-xs">
                  View all <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {projects.slice(0, 4).map((p, i) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    onClick={() => {
                      setActiveProject(p.id)
                      setActiveFile(null)
                      navigate('studio')
                    }}
                    className="group text-left rounded-xl border hairline bg-[var(--card)]/60 p-5 hover:bg-[var(--card)] hover:hairline-strong transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-teal-500/20 border border-cyan-400/20">
                        <FolderGit2 className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-[var(--secondary)] px-2 py-0.5 rounded-full">{p.template}</span>
                    </div>
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</div>
                    <div className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(p.updatedAt)}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Templates */}
              <div className="flex items-center justify-between mb-4 mt-8">
                <h2 className="text-lg font-semibold">Start from a template</h2>
              </div>
              <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {PROJECT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      const id = createProject(t.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), t.name)
                      setActiveProject(id)
                      setActiveFile(null)
                      navigate('studio')
                    }}
                    className="group rounded-xl border hairline bg-[var(--card)]/60 p-4 hover:bg-[var(--card)] hover:hairline-strong transition-all text-left"
                  >
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Usage sidebar */}
            <div className="space-y-6">
              <div className="rounded-xl border hairline bg-[var(--card)]/70 p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">Usage this month</h3>
                  <span className="text-[10px] text-muted-foreground bg-[var(--secondary)] px-2 py-0.5 rounded-full">{user.plan.toUpperCase()}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-5">Resets in 12 days</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Credits used</span>
                      <span className="text-xs font-mono">{user.creditsTotal - user.credits} / {user.creditsTotal}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                        style={{ width: `${100 - creditsPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t hairline space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-indigo-400" /> Axiom Pro
                      </span>
                      <span className="font-mono">320 msgs</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-cyan-400" /> Axiom Flash
                      </span>
                      <span className="font-mono">1,840 msgs</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Code2 className="h-3 w-3 text-emerald-400" /> Axiom Coder
                      </span>
                      <span className="font-mono">96 edits</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-5"
                  onClick={() => navigate('pricing')}
                >
                  Upgrade plan
                </Button>
              </div>

              <div className="rounded-xl border hairline bg-gradient-to-br from-[var(--tangerine)]/10 to-[var(--ochre)]/10 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 mb-3">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Tip: Use @codebase in Studio</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mention <span className="font-mono text-[var(--tangerine)]">@codebase</span> in the agent panel to ask questions across your entire project. Axiom indexes your files automatically.
                </p>
              </div>

              <div className="rounded-xl border hairline bg-[var(--card)]/70 p-5">
                <h3 className="font-semibold text-sm mb-3">Keyboard shortcuts</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Command palette</span>
                    <kbd className="font-mono text-[10px] bg-[var(--secondary)] px-1.5 py-0.5 rounded">⌘K</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New chat</span>
                    <kbd className="font-mono text-[10px] bg-[var(--secondary)] px-1.5 py-0.5 rounded">⌘J</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Inline edit (Studio)</span>
                    <kbd className="font-mono text-[10px] bg-[var(--secondary)] px-1.5 py-0.5 rounded">⌘I</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Toggle sidebar</span>
                    <kbd className="font-mono text-[10px] bg-[var(--secondary)] px-1.5 py-0.5 rounded">⌘B</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
