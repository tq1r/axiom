'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
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
  Github,
  Twitter,
  Linkedin,
  Quote,
} from 'lucide-react'
import { AxiomLogo } from '../shared/logo'
import { ThemeToggle } from '../shared/theme-toggle'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useChat, useStudio, useUser } from '@/lib/axiom/store'
import { MODELS, PRICING_TIERS } from '@/lib/axiom/models'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  const { navigate, setAuthMode } = useNav()
  const { createThread, setActiveThread } = useChat()
  const { createProject, setActiveProject, setActiveFile } = useStudio()
  const { user } = useUser()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 80])

  const handleStart = () => {
    if (user) {
      navigate('dashboard')
    } else {
      setAuthMode('signup')
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
      {/* Nav — editorial, thin, with a hairline rule */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b hairline">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <AxiomLogo size={26} />
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <button onClick={() => navigate('models')} className="text-muted-foreground hover:text-foreground transition-colors">Models</button>
            <button onClick={() => navigate('pricing')} className="text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => navigate('studio')} className="text-muted-foreground hover:text-foreground transition-colors">Studio</button>
            <button onClick={() => navigate('chat')} className="text-muted-foreground hover:text-foreground transition-colors">Chat</button>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => { setAuthMode('signin'); navigate('auth') }}
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </button>
            <Button
              size="sm"
              onClick={handleStart}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
            >
              Get started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* HERO — editorial, asymmetric, no centered everything */}
      <section className="relative pt-20 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            {/* Left — headline takes 7 cols */}
            <motion.div
              style={{ y: heroY }}
              className="lg:col-span-7"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-8 text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--tangerine)]" />
                Issue 01 · September 2026
                <span className="text-[var(--rule)]">/</span>
                <span>Now with Axiom Studio</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="font-serif text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] leading-[0.95] tracking-[-0.02em] font-medium"
              >
                Ask anything.
                <br />
                <span className="italic text-[var(--tangerine)]">Build</span> anything.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mt-8 max-w-md text-lg text-muted-foreground leading-relaxed"
              >
                Two products, one account. <span className="text-foreground">Axiom Chat</span> thinks with you. <span className="text-foreground">Axiom Studio</span> builds with you. Pick a tool, or use both — they share a brain.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="h-12 px-6 bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90 rounded-full group"
                >
                  Start building
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <button
                  onClick={() => navigate('studio')}
                  className="h-12 px-5 text-sm font-medium text-foreground hover:text-[var(--tangerine)] transition-colors flex items-center gap-2"
                >
                  <Play className="h-3.5 w-3.5" />
                  Try the demo
                </button>
              </motion.div>
            </motion.div>

            {/* Right — a "specimen card" with the product preview, 5 cols */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:col-span-5"
            >
              <SpecimenCard />
            </motion.div>
          </div>

          {/* Stats bar — like a magazine masthead */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 pt-8 border-t hairline grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {[
              { n: '< 300ms', l: 'to first token' },
              { n: '4', l: 'specialized models' },
              { n: '256K', l: 'context window' },
              { n: '10K+', l: 'builders this month' },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-serif text-3xl font-medium text-foreground">{s.n}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PULL QUOTE — editorial break */}
      <section className="py-20 border-y hairline bg-[var(--background-2)]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Quote className="h-8 w-8 text-[var(--tangerine)] mx-auto mb-6" />
          <p className="font-serif text-2xl sm:text-3xl leading-relaxed italic text-foreground">
            "The first AI platform where the chat assistant and the IDE feel like they were made by the same people. Because they were."
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            — <span className="ink-underline">The Verge</span>, on Axiom's launch
          </div>
        </div>
      </section>

      {/* TWO PRODUCTS — asymmetric, not a boring grid */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--tangerine)] mb-3">№ 01 — The Products</div>
            <h2 className="font-serif text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.05] font-medium">
              An assistant and a workbench, <span className="italic">sharing one mind.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Chat — taller, more prominent */}
            <button
              onClick={handleOpenChat}
              className="group text-left paper-card rounded-xl p-8 hover:glow-tangerine transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-[var(--tangerine)] text-white rounded-bl-lg">
                Product 01
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--tangerine)] mb-6">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-serif text-3xl tracking-tight mb-2">Axiom Chat</h3>
              <p className="text-sm text-[var(--tangerine)] font-mono mb-4">/the assistant</p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                A thinking partner that streams in real time. Upload anything, branch any conversation, render any format. When you see code you like, send it straight to Studio with one click.
              </p>
              <ul className="space-y-2 mb-8">
                {['Real-time token streaming', 'Markdown · KaTeX · Mermaid · code', 'Branch, fork, share, export', 'Multimodal: PDF, CSV, images'].map((f) => (
                  <li key={f} className="flex items-baseline gap-2 text-sm">
                    <span className="text-[var(--tangerine)]">—</span>
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--tangerine)] group-hover:gap-3 transition-all">
                Open Chat
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            {/* Studio — with a code preview inside */}
            <button
              onClick={handleOpenStudio}
              className="group text-left paper-card rounded-xl p-8 hover:glow-tangerine transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-foreground text-background rounded-bl-lg">
                Product 02
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground mb-6">
                <Code2 className="h-5 w-5 text-background" />
              </div>
              <h3 className="font-serif text-3xl tracking-tight mb-2">Axiom Studio</h3>
              <p className="text-sm text-muted-foreground font-mono mb-4">/the workbench</p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                A full IDE where the AI is a teammate, not a chatbot. Ghost-text completions as you type. Inline edits with diffs you approve. An agent that plans, codes, and runs commands — with checkpoints at every step.
              </p>
              <ul className="space-y-2 mb-8">
                {['Tab to accept ghost completions', '⌘I inline edits with red/green diffs', 'Agent mode with undoable checkpoints', '@file @folder @codebase @web mentions'].map((f) => (
                  <li key={f} className="flex items-baseline gap-2 text-sm">
                    <span className="text-[var(--tangerine)]">—</span>
                    <span className="text-foreground/85 font-mono text-xs">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--tangerine)] group-hover:gap-3 transition-all">
                Open Studio
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* MODELS — editorial list, not cards */}
      <section className="py-24 px-6 border-t hairline bg-[var(--background-2)]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--tangerine)] mb-3">№ 02 — The Models</div>
              <h2 className="font-serif text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.05] font-medium">
                Four specialists, <span className="italic">one gateway.</span>
              </h2>
            </div>
            <button onClick={() => navigate('models')} className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
              All models <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="border-t hairline">
            {MODELS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => navigate('models')}
                className="group w-full grid grid-cols-12 gap-4 py-6 border-b hairline items-center text-left hover:bg-[var(--card)] transition-colors px-2 -mx-2 rounded-lg"
              >
                <div className="col-span-1 text-xs font-mono text-muted-foreground">0{i + 1}</div>
                <div className="col-span-3 sm:col-span-2">
                  <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br', m.badgeColor)}>
                    {m.category === 'reasoning' && <Sparkles className="h-3.5 w-3.5 text-white" />}
                    {m.category === 'fast' && <Zap className="h-3.5 w-3.5 text-white" />}
                    {m.category === 'code' && <Code2 className="h-3.5 w-3.5 text-white" />}
                    {m.category === 'vision' && <Eye className="h-3.5 w-3.5 text-white" />}
                  </span>
                </div>
                <div className="col-span-8 sm:col-span-4">
                  <div className="font-serif text-xl font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.tagline}</div>
                </div>
                <div className="hidden sm:block col-span-3 text-sm text-muted-foreground">{m.contextWindow}</div>
                <div className="hidden sm:flex col-span-2 justify-end">
                  <span className={cn(
                    'text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full',
                    m.tier === 'free' ? 'bg-[var(--forest)]/15 text-[var(--forest)]' : 'bg-[var(--tangerine)]/15 text-[var(--tangerine)]'
                  )}>
                    {m.tier}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE — big editorial moment */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--tangerine)] mb-3">№ 03 — The Details</div>
              <h2 className="font-serif text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.05] font-medium mb-6">
                Every edge considered. <span className="italic">No filler.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                We obsessed over the parts most products skip. The empty states. The loading shimmers. The keyboard shortcuts. The diff you see before an edit lands. The checkpoint you can undo to. The mini-game you can play while the agent thinks.
              </p>
              <div className="space-y-4">
                {[
                  { n: '01', t: 'Checkpoints before any edit', d: 'Every AI file change in Studio is reversible. Approval gates on terminal commands.' },
                  { n: '02', t: 'Designed empty states', d: 'No raw spinners, no browser alerts. Every loading, error, and offline state is crafted.' },
                  { n: '03', t: 'A game while you wait', d: 'Generating a long response? A mini puzzle appears. Beat your high score.' },
                ].map((f) => (
                  <div key={f.n} className="flex gap-4">
                    <div className="font-serif text-2xl text-[var(--tangerine)] font-medium shrink-0 w-8">{f.n}</div>
                    <div>
                      <div className="font-medium text-foreground">{f.t}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{f.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <MiniGamePreview />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING — single column, honest */}
      <section className="py-24 px-6 border-t hairline bg-[var(--background-2)]">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--tangerine)] mb-3">№ 04 — The Price</div>
            <h2 className="font-serif text-4xl sm:text-5xl tracking-[-0.02em] leading-[1.05] font-medium">
              Simple. <span className="italic">Honest.</span>
            </h2>
          </div>

          <div className="space-y-px">
            {PRICING_TIERS.map((t) => (
              <div
                key={t.id}
                className={cn(
                  'paper-card rounded-xl p-6 mb-3 flex flex-col sm:flex-row sm:items-center gap-4',
                  t.highlight && 'glow-tangerine border-[var(--tangerine)]/30'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-xl font-medium">{t.name}</h3>
                    {t.highlight && (
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-[var(--tangerine)] text-white px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </div>
                <div className="sm:text-right">
                  <div className="font-serif text-3xl font-medium">${t.price}</div>
                  <div className="text-xs text-muted-foreground">/{t.period}</div>
                </div>
                <Button
                  variant={t.highlight ? 'default' : 'outline'}
                  size="sm"
                  className={cn('rounded-full', t.highlight && 'bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90')}
                  onClick={() => navigate('pricing')}
                >
                  {t.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — quiet, confident */}
      <section className="py-32 px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-4xl sm:text-6xl tracking-[-0.02em] leading-[1.05] font-medium mb-6">
            Start building <span className="italic text-[var(--tangerine)]">today.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            No credit card. No catch. Just a tool that wants you to make something.
          </p>
          <Button
            size="lg"
            onClick={handleStart}
            className="h-12 px-8 bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90 rounded-full"
          >
            Get started free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function SpecimenCard() {
  return (
    <div className="paper-card rounded-xl overflow-hidden">
      {/* Window chrome — minimal */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b hairline bg-[var(--background-2)]">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--tangerine)]/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--ochre)]/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--forest)]/60" />
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">axiom · chat</div>
        <div className="w-8" />
      </div>
      {/* Content — a real exchange */}
      <div className="p-5 space-y-4">
        <div className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--secondary)] text-[10px] font-medium font-mono">YO</div>
          <div className="flex-1 text-sm">
            <div className="text-xs text-muted-foreground mb-0.5">You</div>
            <p>Write a hook for debouncing a value.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--tangerine)]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 text-sm">
            <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
              Axiom · <ModelBadge modelId="axiom-coder" size="sm" showName={false} />
            </div>
            <div className="rounded-lg border hairline bg-[var(--background-2)] p-3 font-mono text-[11px] leading-relaxed overflow-hidden">
              <div><span className="text-[var(--tangerine)]">export function</span> <span className="text-[var(--forest)]">useDebounce</span>&lt;T&gt;(</div>
              <div className="pl-3">value: T, delay = <span className="text-[var(--ochre)]">300</span></div>
              <div>) {'{'}</div>
              <div className="pl-3"><span className="text-[var(--tangerine)]">const</span> [debounced, setDebounced] =</div>
              <div className="pl-6"><span className="text-[var(--forest)]">useState</span>(value);</div>
              <div className="pl-3"><span className="text-[var(--tangerine)]">return</span> debounced;</div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Composer hint */}
      <div className="border-t hairline px-4 py-2.5 bg-[var(--background-2)] flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-mono">Reply to Axiom…</div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--tangerine)] animate-pulse" />
          <span className="text-[10px] text-muted-foreground">streaming</span>
        </div>
      </div>
    </div>
  )
}

function MiniGamePreview() {
  return (
    <div className="paper-card rounded-xl p-6 relative">
      <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[var(--ochre)] text-white text-[10px] font-mono uppercase tracking-wider rounded">
        While you wait
      </div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-serif text-lg font-medium">Axiom Blocks</div>
          <div className="text-xs text-muted-foreground">A mini puzzle. Appears when the AI is thinking.</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Score</div>
          <div className="font-serif text-2xl font-medium text-[var(--tangerine)]">128</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 bg-[var(--background-2)] p-2 rounded-lg">
        {[
          { v: 2, bg: 'bg-[var(--secondary)]' },
          { v: 4, bg: 'bg-[var(--ochre)]/30' },
          { v: 0, bg: 'bg-transparent' },
          { v: 8, bg: 'bg-[var(--ochre)]/60' },
          { v: 0, bg: 'bg-transparent' },
          { v: 16, bg: 'bg-[var(--tangerine)]/40' },
          { v: 4, bg: 'bg-[var(--ochre)]/30' },
          { v: 0, bg: 'bg-transparent' },
          { v: 0, bg: 'bg-transparent' },
          { v: 2, bg: 'bg-[var(--secondary)]' },
          { v: 0, bg: 'bg-transparent' },
          { v: 32, bg: 'bg-[var(--tangerine)]/70 text-white' },
          { v: 0, bg: 'bg-transparent' },
          { v: 0, bg: 'bg-transparent' },
          { v: 2, bg: 'bg-[var(--secondary)]' },
          { v: 0, bg: 'bg-transparent' },
        ].map((t, i) => (
          <div
            key={i}
            className={cn(
              'aspect-square rounded game-tile text-sm',
              t.v > 0 ? t.bg : 'bg-[var(--card)]/50'
            )}
          >
            {t.v > 0 && t.v}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-xs text-muted-foreground font-mono">
        ↑ ↓ ← → to play
      </div>
    </div>
  )
}

function Footer() {
  const { navigate } = useNav()
  return (
    <footer className="border-t hairline bg-[var(--background-2)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <AxiomLogo size={26} />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed font-serif italic">
              Ask anything. Build anything.
            </p>
            <div className="mt-5 flex gap-2">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-md border hairline text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-md border hairline text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Github className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-md border hairline text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('chat')} className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Chat</button></li>
              <li><button onClick={() => navigate('studio')} className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Studio</button></li>
              <li><button onClick={() => navigate('models')} className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Models</button></li>
              <li><button onClick={() => navigate('pricing')} className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Pricing</button></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Company</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">About</a></li>
              <li><a href="#" className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Blog</a></li>
              <li><a href="#" className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Resources</div>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Docs</a></li>
              <li><a href="#" className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Changelog</a></li>
              <li><a href="#" className="text-foreground/80 hover:text-[var(--tangerine)] transition-colors">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 Axiom, Inc. Made with intention.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
