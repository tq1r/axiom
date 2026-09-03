import type { ModelConfig, PricingTier } from './types'

// ============ AXIOM MODEL CATALOG ============
// Provider-agnostic gateway — branded models routed to real LLMs behind the scenes.
export const MODELS: ModelConfig[] = [
  {
    id: 'axiom-pro',
    name: 'Axiom Pro',
    tagline: 'Flagship reasoning',
    description:
      'Our most capable model for complex reasoning, deep analysis, and long-form generation. Excels at multi-step problems, code architecture, and nuanced writing. The default for high-stakes work where quality matters more than latency.',
    contextWindow: '256K tokens',
    capabilities: ['Deep reasoning', 'Long-form writing', 'Code generation', 'Analysis', 'Math'],
    tier: 'pro',
    category: 'reasoning',
    benchmark: [
      { label: 'MMLU', value: '92.4' },
      { label: 'HumanEval', value: '94.1' },
      { label: 'MATH', value: '78.3' },
    ],
    badgeColor: 'from-indigo-500 to-violet-500',
    icon: 'sparkles',
  },
  {
    id: 'axiom-flash',
    name: 'Axiom Flash',
    tagline: 'Fast & efficient',
    description:
      'Optimized for speed and cost. Delivers near-instant responses for everyday tasks — quick questions, summaries, light edits, and high-volume workloads. The smart default when you need answers now.',
    contextWindow: '128K tokens',
    capabilities: ['Fast inference', 'Summarization', 'Q&A', 'Light edits', 'High throughput'],
    tier: 'free',
    category: 'fast',
    benchmark: [
      { label: 'MMLU', value: '82.1' },
      { label: 'HumanEval', value: '85.7' },
      { label: 'MATH', value: '61.2' },
    ],
    badgeColor: 'from-cyan-400 to-sky-500',
    icon: 'zap',
  },
  {
    id: 'axiom-coder',
    name: 'Axiom Coder',
    tagline: 'Code-specialized',
    description:
      'Purpose-built for software engineering. Trained on billions of lines of code with deep understanding of 40+ languages, frameworks, and tooling. The engine behind Axiom Studio agent, inline edits, and codebase Q&A.',
    contextWindow: '200K tokens',
    capabilities: ['Code completion', 'Debugging', 'Refactoring', 'Code review', 'Agent tasks'],
    tier: 'pro',
    category: 'code',
    benchmark: [
      { label: 'HumanEval', value: '96.8' },
      { label: 'MBPP', value: '91.4' },
      { label: 'SWE-bench', value: '38.2' },
    ],
    badgeColor: 'from-emerald-400 to-teal-500',
    icon: 'code',
  },
  {
    id: 'axiom-vision',
    name: 'Axiom Vision',
    tagline: 'Multimodal understanding',
    description:
      'Sees and reasons about images, diagrams, screenshots, and documents alongside text. Upload a UI mockup, a chart, or a handwritten note — Vision understands the content and responds with precision.',
    contextWindow: '128K tokens',
    capabilities: ['Image analysis', 'OCR', 'Diagram reasoning', 'UI feedback', 'Document parsing'],
    tier: 'pro',
    category: 'vision',
    benchmark: [
      { label: 'MMMU', value: '68.7' },
      { label: 'DocVQA', value: '94.2' },
      { label: 'ChartQA', value: '81.5' },
    ],
    badgeColor: 'from-pink-500 to-rose-500',
    icon: 'eye',
  },
]

export function getModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id)
}

export const DEFAULT_CHAT_MODEL = 'axiom-pro'
export const DEFAULT_STUDIO_MODEL = 'axiom-coder'

// ============ PRICING TIERS ============
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'For exploring Axiom and light personal use.',
    features: [
      '50 messages / day on Axiom Flash',
      '5 messages / day on Axiom Pro',
      '1 Studio project',
      'Community support',
      'Single user',
    ],
    cta: 'Start for free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    period: 'month',
    description: 'For power users who live in Axiom every day.',
    features: [
      'Unlimited Axiom Flash messages',
      '500 Axiom Pro messages / month',
      'Unlimited Axiom Coder in Studio',
      'Unlimited Studio projects',
      'Codebase indexing & embeddings',
      'Priority routing (faster responses)',
      'Early access to new models',
    ],
    highlight: true,
    cta: 'Upgrade to Pro',
  },
  {
    id: 'teams',
    name: 'Teams',
    price: 40,
    period: 'user / month',
    description: 'For teams building together with shared context.',
    features: [
      'Everything in Pro',
      'Unlimited Axiom Pro messages',
      'Shared team projects & threads',
      'Admin dashboard & SSO',
      'Usage analytics',
      'Custom retention policies',
      'Priority support',
    ],
    cta: 'Start team trial',
  },
]
