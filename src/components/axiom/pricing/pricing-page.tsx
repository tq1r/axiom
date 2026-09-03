'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Building2, ArrowRight, CreditCard, HelpCircle } from 'lucide-react'
import { AppShell } from '../app/app-shell'
import { PRICING_TIERS } from '@/lib/axiom/models'
import { useNav, useUser } from '@/lib/axiom/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  free: Zap,
  pro: Sparkles,
  teams: Building2,
}

const FAQ = [
  { q: 'What is a credit?', a: 'Credits are the unit of usage across Axiom. Each model call consumes credits based on the model and token count — Axiom Flash uses fewer credits than Axiom Pro. You can see your real-time usage in Settings → Billing.' },
  { q: 'Can I switch plans anytime?', a: 'Yes. Upgrades take effect immediately and you get the new quota right away. Downgrades take effect at the end of your current billing cycle so you keep what you paid for.' },
  { q: 'Do unused credits roll over?', a: 'On the Free plan, daily credits reset every 24 hours. On Pro and Teams, monthly credits reset at the start of each billing cycle. Unused credits do not roll over.' },
  { q: 'Is my data used to train models?', a: 'Never. We do not use your conversations, code, or project data to train any model — ours or third-party. Your data is yours, full stop.' },
  { q: 'How does the Teams plan work?', a: 'Teams is billed per user per month. You get a shared workspace with team projects, an admin dashboard, SSO, and centralized billing. Minimum 3 seats.' },
  { q: 'Can I bring my own API keys?', a: 'Yes. Teams plan customers can configure custom model endpoints and API keys through the gateway, and route Axiom features to their own infrastructure.' },
]

export function PricingPage() {
  const { navigate } = useNav()
  const { user } = useUser()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const handleUpgrade = (tierId: string) => {
    if (tierId === 'free') {
      toast.info("You're on the Free plan", { description: 'Upgrade to unlock more.' })
      return
    }
    toast.success(`Redirecting to checkout…`, {
      description: `${tierId === 'pro' ? 'Pro' : 'Teams'} plan · ${billing === 'monthly' ? '$20/mo' : '$200/yr'}`,
    })
  }

  return (
    <AppShell activeView="pricing">
      <div className="h-full overflow-y-auto axiom-scroll-thin">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <CreditCard className="h-4 w-4 text-accent" />
              Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Pricing that scales with you.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you're hooked. Cancel anytime — no questions asked.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center rounded-full border border-border bg-card/50 p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-full transition-colors',
                  billing === 'monthly' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5',
                  billing === 'yearly' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Yearly
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">-17%</span>
              </button>
            </div>
          </motion.div>

          {/* Tiers */}
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            {PRICING_TIERS.map((t, i) => {
              const Icon = TIER_ICONS[t.id] || Zap
              const price = billing === 'yearly' && t.price > 0 ? Math.round(t.price * 12 * 0.83) : t.price
              const period = billing === 'yearly' && t.price > 0 ? '/yr' : t.period === 'forever' ? 'forever' : '/' + t.period
              const isCurrent = user.plan === t.id

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={cn(
                    'relative rounded-xl border p-6 flex flex-col',
                    t.highlight
                      ? 'border-accent/40 bg-accent/5 axiom-glow-sm'
                      : 'border-border bg-card/40'
                  )}
                >
                  {t.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider bg-accent text-accent-foreground px-3 py-1 rounded-full font-medium">
                      Most popular
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      t.highlight ? 'bg-gradient-to-br from-indigo-500 to-cyan-400' : 'bg-muted'
                    )}>
                      <Icon className={cn('h-4 w-4', t.highlight ? 'text-white' : 'text-muted-foreground')} />
                    </div>
                    <h3 className="text-lg font-semibold">{t.name}</h3>
                  </div>

                  <div className="mb-1">
                    <span className="text-4xl font-semibold">${price}</span>
                    <span className="text-sm text-muted-foreground ml-1">{period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">{t.description}</p>

                  <Button
                    variant={t.highlight ? 'default' : 'outline'}
                    size="sm"
                    className="w-full mb-6"
                    onClick={() => handleUpgrade(t.id)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Current plan' : t.cta}
                    {!isCurrent && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
                  </Button>

                  <div className="space-y-2.5 flex-1">
                    {t.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-sm">
                        <Check className={cn('h-4 w-4 mt-0.5 shrink-0', t.highlight ? 'text-accent' : 'text-emerald-400')} />
                        <span className="text-foreground/80">{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Usage metering section */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 p-8 mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-3">
                  Per-model usage metering
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Every model call is metered to the token. See exactly where your credits go,
                  set spending limits, and get alerts before you run out. The Stripe billing
                  portal lets you manage payment methods and download invoices anytime.
                </p>
                <ul className="mt-5 space-y-2">
                  {['Real-time usage dashboard', 'Per-model cost breakdown', 'Spending alerts & limits', 'Stripe billing portal access'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card/60 p-5">
                <div className="text-xs text-muted-foreground mb-4">This month's usage</div>
                <div className="space-y-3">
                  {[
                    { label: 'Axiom Pro', value: 320, max: 500, color: 'from-indigo-500 to-violet-500' },
                    { label: 'Axiom Flash', value: 1840, max: 9999, color: 'from-cyan-400 to-sky-500' },
                    { label: 'Axiom Coder', value: 96, max: 9999, color: 'from-emerald-400 to-teal-500' },
                  ].map((u) => (
                    <div key={u.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{u.label}</span>
                        <span className="font-mono">{u.value} / {u.max === 9999 ? '∞' : u.max}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full bg-gradient-to-r', u.color)}
                          style={{ width: `${u.max === 9999 ? 18 : (u.value / u.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <HelpCircle className="h-4 w-4 text-accent" />
                FAQ
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">Questions, answered.</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-lg border border-border bg-card/30 px-4">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* CTA */}
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              Still on the fence?
            </h2>
            <p className="text-muted-foreground mb-6">
              Start free — no credit card required. Upgrade only when you're ready.
            </p>
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90"
              onClick={() => navigate('dashboard')}
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
