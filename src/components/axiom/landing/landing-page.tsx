'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Code2,
  MessageSquare,
  Zap,
  Cpu,
  Eye,
  GitBranch,
  Terminal,
  Play,
  Check,
  Star,
  ChevronRight,
  Cmd,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react'
import { AxiomLogo } from '../shared/logo'
import { ThemeToggle } from '../shared/theme-toggle'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useChat, useStudio, useUser } from '@/lib/axiom/store'
import { MODELS, PRICING_TIERS } from '@/lib/axiom/models'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function LandingPage() {
  const { navigate, setAuth, setAuthMode } = useNav()
  const { createThread, setActiveThread } = useChat()
  const { createProject, setActiveProject, setActiveFile } = useStudio()
  const { user } = useUser()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 120])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  const handleStart = () => {
    if (user) {
      navigate('dashboard')
    } else {
      setAuthMode('signup')
      setAuth(true)
      navigate('auth')
    }
  }

  const handleOpenChat = () => {
    const id = createThread()
    setActiveThread(id)
    navigate('chat')
  }

  const handleOpenStudio = () => {
    const id = createProject('untitled-project', 'Vite + React')
    setActiveProject(id)
    setActiveFile(null)
    navigate('studio')
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="axiom-glass border-b border-border/50">
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <AxiomLogo size={28} />
            <nav className="hidden md:flex items-center gap-1">
              <button onClick={() => navigate('models')} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">Models</button>
              <button onClick={() => navigate('pricing')} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">Pricing</button>
              <button onClick={() => navigate('studio')} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">Studio</button>
              <button onClick={() => navigate('chat')} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">Chat</button>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                onClick={() => { setAuthMode('signin'); navigate('auth') }}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={handleStart}
              >
                Get started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background grid + radial glow */}
        <div className="absolute inset-0 axiom-grid-bg axiom-radial-fade opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-400/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto max-w-5xl px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground mb-8"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now with Axiom Studio — your AI-native IDE
            <ChevronRight className="h-3 w-3" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05]"
          >
            Ask anything.
            <br />
            <span className="axiom-gradient-text">Build anything.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed"
          >
            Axiom is one platform with two flagship products: a ChatGPT-class AI assistant
            and a Windsurf-class AI-native IDE. One brand. One account. Infinite possibilities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="group h-12 px-6 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleStart}
            >
              Start building free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 border-border bg-background/50 backdrop-blur"
              onClick={() => navigate('studio')}
            >
              <Play className="mr-2 h-4 w-4" />
              Try the demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Free tier included</span>
            <span className="hidden sm:flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Cancel anytime</span>
          </motion.div>
        </motion.div>

        {/* Hero product preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 mx-auto max-w-6xl px-6"
        >
          <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-xl overflow-hidden axiom-glow">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
                <AxiomLogo size={16} showWordmark={false} />
                <span className="font-mono">axiom.dev/studio</span>
              </div>
            </div>
            <div className="grid grid-cols-12 h-[420px]">
              {/* File explorer */}
              <div className="col-span-3 border-r border-border bg-muted/30 p-3 hidden md:block">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-2">Explorer</div>
                {['src', '  App.tsx', '  components', '    Card.tsx', '  lib', '    api.ts', 'package.json', 'README.md'].map((f, i) => (
                  <div key={i} className={cn(
                    'flex items-center gap-1.5 px-2 py-1 text-xs rounded',
                    i === 1 ? 'bg-accent/15 text-accent' : 'text-muted-foreground'
                  )}>
                    {f.startsWith('  ') ? <span className="h-3 w-3" /> : <Code2 className="h-3 w-3" />}
                    <span className="font-mono truncate">{f.trim()}</span>
                  </div>
                ))}
              </div>
              {/* Editor */}
              <div className="col-span-12 md:col-span-6 bg-background/40 p-4 font-mono text-xs overflow-hidden">
                <div className="flex gap-2 border-b border-border pb-2 mb-3">
                  <div className="px-3 py-1 rounded-t-md bg-card border-t border-x border-border text-foreground">App.tsx</div>
                  <div className="px-3 py-1 text-muted-foreground">Card.tsx</div>
                </div>
                <pre className="text-muted-foreground leading-relaxed">
<span className="text-violet-400">import</span> {'{ useState }'} <span className="text-violet-400">from</span> <span className="text-emerald-400">'react'</span>{'\n'}
<span className="text-violet-400">import</span> {'{ Card }'} <span className="text-violet-400">from</span> <span className="text-emerald-400">'./Card'</span>{'\n\n'}
<span className="text-violet-400">export default function</span> <span className="text-cyan-400">App</span>() {'{'}{'\n'}
{'  '}<span className="text-violet-400">const</span> [count, setCount] = <span className="text-cyan-400">useState</span>(<span className="text-orange-400">0</span>){'\n'}
{'  '}<span className="text-violet-400">return</span> ({'\n'}
{'    '}<span className="text-pink-400">{'<div'}</span> <span className="text-yellow-400">className</span>=<span className="text-emerald-400">"min-h-screen"</span><span className="text-pink-400">{'>'}</span>{'\n'}
{'      '}<span className="text-pink-400">{'<Card'}</span> <span className="text-yellow-400">label</span>=<span className="text-emerald-400">"Count"</span> <span className="text-yellow-400">value</span>=<span className="text-pink-400">{'{count}'}</span> <span className="text-pink-400">{'/>'}</span>{'\n'}
{'    '}<span className="text-pink-400">{'</div>'}</span>{'\n'}
{'  '}){'\n'}
{'}'}
                </pre>
              </div>
              {/* AI panel */}
              <div className="col-span-12 md:col-span-3 border-l border-border bg-card/30 p-4 hidden md:flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium">Agent</span>
                  <ModelBadge modelId="axiom-coder" size="sm" showName={false} />
                </div>
                <div className="space-y-2 flex-1 overflow-hidden">
                  <div className="rounded-md border border-border bg-background/40 p-2.5">
                    <div className="text-[10px] text-muted-foreground mb-1">PLAN</div>
                    <div className="text-xs">1. Create Card component ✓</div>
                    <div className="text-xs">2. Add state to App ✓</div>
                    <div className="text-xs text-accent">3. Wire up counter logic…</div>
                  </div>
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                    <div className="text-[10px] text-emerald-400 mb-1">DIFF</div>
                    <div className="text-xs font-mono text-emerald-400">+ const [count, setCount]</div>
                    <div className="text-xs font-mono text-red-400">- const count = 0</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <div className="flex-1 rounded-md bg-accent text-accent-foreground text-xs py-1.5 text-center">Apply</div>
                  <div className="px-3 rounded-md border border-border text-xs py-1.5">Discard</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trusted by strip */}
      <section className="border-y border-border/50 py-8 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by builders at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50">
            {['Vercel', 'Linear', 'Stripe', 'Notion', 'Figma', 'Supabase'].map((n) => (
              <span key={n} className="text-lg font-semibold tracking-tight text-foreground/70">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature split: Chat + Studio */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-medium text-accent mb-3">Two products. One platform.</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              The assistant and the workbench.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Axiom Chat answers anything you can ask. Axiom Studio builds anything you can imagine.
              They share models, context, and your account — so moving between thinking and making is seamless.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Chat card */}
            <button
              onClick={handleOpenChat}
              className="group relative text-left rounded-2xl border border-border bg-card/50 backdrop-blur p-8 hover:border-border-strong transition-all overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl group-hover:from-indigo-500/30 transition-all" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 mb-6">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">Axiom Chat</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  A ChatGPT-class assistant with streaming responses, multimodal input,
                  markdown + code rendering, branching conversations, and shareable links.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {['Real-time token streaming', 'GitHub-flavored Markdown + KaTeX + Mermaid', 'Upload PDFs, CSVs, images', 'Branch & fork any conversation', '"Open in Studio" on every code block'].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center gap-2 text-sm font-medium text-accent group-hover:gap-3 transition-all">
                  Open Axiom Chat
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* Studio card */}
            <button
              onClick={handleOpenStudio}
              className="group relative text-left rounded-2xl border border-border bg-card/50 backdrop-blur p-8 hover:border-border-strong transition-all overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl group-hover:from-cyan-400/30 transition-all" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 mb-6">
                  <Code2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">Axiom Studio</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  A Windsurf-class AI-native IDE. Monaco editor, inline ghost completions,
                  agent mode with checkpoints, codebase indexing, and a live preview with one-click deploy.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {['Inline completions — Tab to accept', 'Cmd+I inline edits with red/green diffs', 'Agent mode with step-by-step plan', '@file, @folder, @codebase, @web mentions', 'Approval gates before destructive actions'].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center gap-2 text-sm font-medium text-accent group-hover:gap-3 transition-all">
                  Open Axiom Studio
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Model showcase */}
      <ModelShowcase />

      {/* Feature grid */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Every detail considered.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built to the standard of ChatGPT, Cursor, and Linear. No placeholder UI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: '< 300ms to first token', desc: 'Optimistic UI everywhere. Input never blocks during generation.' },
              { icon: GitBranch, title: 'Checkpoints & undo', desc: 'Every AI edit in Studio is reversible. Approval gates on terminal commands.' },
              { icon: Cpu, title: 'Provider-agnostic models', desc: 'One gateway, four branded models. Swap fine-tunes later with zero frontend changes.' },
              { icon: Terminal, title: 'Real execution sandbox', desc: 'Run web projects in WebContainers. Containerized Python/Node backends.' },
              { icon: Eye, title: 'Designed empty states', desc: 'No raw spinners or browser alerts. Every loading, error, and offline state is crafted.' },
              { icon: Sparkles, title: 'World-class polish', desc: '150–250ms springy motion. Visible focus rings. WCAG AA contrast. 60fps editor.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card/30 p-6 hover:bg-card/60 transition-colors">
                <f.icon className="h-5 w-5 text-accent mb-4" />
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Simple, honest pricing.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you're hooked.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {PRICING_TIERS.map((t) => (
              <div
                key={t.id}
                className={cn(
                  'rounded-xl border p-6',
                  t.highlight
                    ? 'border-accent/40 bg-accent/5 axiom-glow-sm'
                    : 'border-border bg-card/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{t.name}</h3>
                  {t.highlight && (
                    <span className="text-[10px] uppercase tracking-wider bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Popular</span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-semibold">${t.price}</span>
                  <span className="text-sm text-muted-foreground">/{t.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t.description}</p>
                <ul className="space-y-2 mb-6">
                  {t.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={t.highlight ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('pricing')}
                >
                  {t.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-400/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 blur-[120px] rounded-full" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-tight">
            Start building with <span className="axiom-gradient-text">Axiom</span> today.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Join thousands of builders shipping faster with the AI platform that thinks and makes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleStart}
            >
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8"
              onClick={() => navigate('models')}
            >
              Explore models
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

function ModelShowcase() {
  const { navigate } = useNav()
  return (
    <section className="py-24 px-6 border-t border-border/50 bg-muted/5">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <p className="text-sm font-medium text-accent mb-3">The model gateway</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Four models. One brain.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Every AI feature calls a single gateway. Models are config objects —
              swap in your own fine-tunes later with zero frontend changes.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('models')} className="shrink-0">
            View all models <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODELS.map((m) => (
            <div
              key={m.id}
              className="group rounded-xl border border-border bg-card/40 p-5 hover:border-border-strong hover:bg-card/70 transition-all cursor-pointer"
              onClick={() => navigate('models')}
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br mb-4', m.badgeColor)}>
                {m.category === 'reasoning' && <Sparkles className="h-5 w-5 text-white" />}
                {m.category === 'fast' && <Zap className="h-5 w-5 text-white" />}
                {m.category === 'code' && <Code2 className="h-5 w-5 text-white" />}
                {m.category === 'vision' && <Eye className="h-5 w-5 text-white" />}
              </div>
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{m.tagline}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Context</div>
                <div className="text-sm font-mono mt-0.5">{m.contextWindow}</div>
              </div>
              <div className="mt-2">
                <span className={cn(
                  'inline-block text-[10px] px-2 py-0.5 rounded-full',
                  m.tier === 'free' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-accent/15 text-accent'
                )}>
                  {m.tier === 'free' ? 'Free tier' : `${m.tier.toUpperCase()} only`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { navigate } = useNav()
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <AxiomLogo size={28} />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Ask anything. Build anything. One AI platform for thinking and making.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><button onClick={() => navigate('chat')} className="hover:text-foreground transition-colors">Axiom Chat</button></li>
              <li><button onClick={() => navigate('studio')} className="hover:text-foreground transition-colors">Axiom Studio</button></li>
              <li><button onClick={() => navigate('models')} className="hover:text-foreground transition-colors">Models</button></li>
              <li><button onClick={() => navigate('pricing')} className="hover:text-foreground transition-colors">Pricing</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Docs</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Axiom, Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
