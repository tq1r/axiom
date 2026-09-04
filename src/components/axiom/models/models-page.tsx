'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap, Code, Eye, ArrowRight, Check, Cpu, Activity } from 'lucide-react'
import { AppShell } from '../app/app-shell'
import { MODELS } from '@/lib/axiom/models'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useChat } from '@/lib/axiom/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  reasoning: Sparkles,
  fast: Zap,
  code: Code,
  vision: Eye,
}

export function ModelsPage() {
  const { navigate, setActiveThread } = useNav()
  const { createThread } = useChat()

  const tryModel = (modelId: string) => {
    const id = createThread(modelId)
    setActiveThread(id)
    navigate('chat')
  }

  return (
    <AppShell activeView="models">
      <div className="h-full overflow-y-auto axiom-scroll-thin">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Cpu className="h-4 w-4 text-accent" />
              Model Catalog
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Meet the <span className="axiom-gradient-text">Axiom model family</span>.
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
              Four specialized models behind one gateway. Each is tuned for a job —
              pick the right one for the task, or let Axiom choose for you.
            </p>
          </motion.div>

          {/* Gateway info banner */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 p-5 mb-10">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shrink-0">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Provider-agnostic gateway</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Every AI feature calls a single internal gateway. Models are config objects —
                  swap in your own fine-tuned models later with zero frontend changes.
                  Routing, rate limiting, and usage metering happen automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Model cards */}
          <div className="grid lg:grid-cols-2 gap-4">
            {MODELS.map((m, i) => {
              const Icon = CATEGORY_ICONS[m.category]
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group relative rounded-xl border border-border bg-card/40 p-6 hover:bg-card/70 hover:border-border-strong transition-all overflow-hidden"
                >
                  <div className={cn('absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 bg-gradient-to-br', m.badgeColor)} />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br', m.badgeColor)}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className={cn(
                        'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full',
                        m.tier === 'free' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-accent/15 text-accent'
                      )}>
                        {m.tier === 'free' ? 'Free tier' : `${m.tier.toUpperCase()} only`}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold tracking-tight">{m.name}</h3>
                    <p className="text-sm text-accent mt-0.5">{m.tagline}</p>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.description}</p>

                    {/* Capabilities */}
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {m.capabilities.map((c) => (
                        <span key={c} className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md border border-border">
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Specs */}
                    <div className="mt-5 grid grid-cols-2 gap-3 pt-5 border-t border-border">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Context window</div>
                        <div className="text-sm font-mono mt-0.5">{m.contextWindow}</div>
                      </div>
                      {m.benchmark && m.benchmark.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Top benchmark</div>
                          <div className="text-sm font-mono mt-0.5">
                            {m.benchmark[0].label}: <span className="text-accent">{m.benchmark[0].value}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Benchmarks */}
                    {m.benchmark && (
                      <div className="mt-4 space-y-1.5">
                        {m.benchmark.map((b) => (
                          <div key={b.label} className="flex items-center gap-3">
                            <span className="text-[11px] text-muted-foreground w-20 shrink-0">{b.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn('h-full rounded-full bg-gradient-to-r', m.badgeColor)}
                                style={{ width: `${parseFloat(b.value)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono w-10 text-right">{b.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-6 group-hover:bg-foreground group-hover:text-background transition-colors"
                      onClick={() => tryModel(m.id)}
                    >
                      Try {m.name}
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Comparison table */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Compare models</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium">Model</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Context</th>
                    <th className="text-left px-4 py-3 font-medium">Tier</th>
                    <th className="text-left px-4 py-3 font-medium">Best for</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ModelBadge modelId={m.id} size="sm" showName={false} />
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{m.category}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{m.contextWindow}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full',
                          m.tier === 'free' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-accent/15 text-accent'
                        )}>
                          {m.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.capabilities.slice(0, 2).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-10 rounded-xl border border-border bg-card/30 p-6">
            <h3 className="font-semibold text-sm mb-2">Want to use your own models?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Axiom gateway supports custom fine-tunes and self-hosted models.
              Teams plan customers can register private models and route them through the same UI.
              <button onClick={() => navigate('pricing')} className="text-accent hover:underline ml-1">
                See Teams plan →
              </button>
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
