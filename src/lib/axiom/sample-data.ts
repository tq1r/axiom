import type { ChatThread, StudioProject } from './types'

export function uid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

export function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  if (day < 7) return `${day}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============ SAMPLE CHAT THREADS ============
export const SAMPLE_THREADS: ChatThread[] = [
  {
    id: 't_sample_1',
    title: 'Designing a rate limiter for our API',
    modelId: 'axiom-pro',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    pinned: true,
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'I need to design a rate limiter for our REST API. We expect about 10K requests per second at peak. What approach would you recommend?',
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'm2',
        role: 'assistant',
        model: 'axiom-pro',
        content: `For 10K RPS at peak, I'd recommend a **token bucket** algorithm backed by **Redis** with a sliding-window approximation. Here's my reasoning:

## Why Token Bucket?

Token bucket is the best fit for your scale because:

1. **Burst tolerance** — it allows short bursts above the average rate while still enforcing a long-term ceiling
2. **Memory efficient** — each bucket is just two numbers (tokens, last refill time), so you can track millions of keys cheaply
3. **Atomic operations** — Redis can refill and consume in a single Lua script, eliminating race conditions without distributed locks

## Architecture

\`\`\`typescript
// rate-limiter.ts — atomic token bucket in Redis
const LUA_SCRIPT = \`
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])  -- tokens per second
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'timestamp')
local tokens = tonumber(bucket[1]) or capacity
local last = tonumber(bucket[2]) or now

-- Refill based on elapsed time
local elapsed = math.max(0, now - last)
tokens = math.min(capacity, tokens + elapsed * refill_rate)

local allowed = tokens >= requested
if allowed then
  tokens = tokens - requested
end

redis.call('HMSET', key, 'tokens', tokens, 'timestamp', now)
redis.call('EXPIRE', key, 3600)

return { allowed and 1 or 0, tokens }
\`
\`\`\`

## Per-client vs. global limits

At 10K RPS you'll want **tiered limits**: a per-API-key bucket (e.g. 100 RPS sustained, 200 burst) plus a global bucket on each backend instance as a safety net. This prevents a single noisy client from starving everyone else.

## Sharding strategy

Use **consistent hashing** on the API key to distribute buckets across a Redis cluster. With 10K RPS you likely need 3-5 Redis shards — each Lua call is sub-millisecond, so the bottleneck will be network, not compute.

Want me to sketch the TypeScript wrapper or the observability layer (Prometheus metrics, dashboards)?`,
        createdAt: Date.now() - 3540000,
        feedback: 'up',
      },
    ],
  },
  {
    id: 't_sample_2',
    title: 'Explain React Server Components',
    modelId: 'axiom-flash',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 80000000,
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'Can you explain React Server Components in simple terms?',
        createdAt: Date.now() - 86400000,
      },
      {
        id: 'm4',
        role: 'assistant',
        model: 'axiom-flash',
        content: `**React Server Components (RSC)** are components that run only on the server and never ship their JavaScript to the browser. Think of them as a way to render parts of your UI on the server, permanently, without hydrating them on the client.

## The mental model

- **Server Components** — fetch data, read files, talk to your database directly. They render to HTML on the server and send a special serialized format to the client. No JS bundle cost.
- **Client Components** — the React you already know. They handle interactivity: \`useState\`, event handlers, effects. Mark them with \`"use client"\`.

The two can interleave: a Server Component can import a Client Component and pass it server-fetched data as props. A Client Component can render a Server Component via children, but cannot import one directly.

## Why it matters

1. **Smaller bundles** — heavy data-fetching libraries (database drivers, SDKs) stay on the server
2. **Direct data access** — no API boilerplate between your DB and your UI
3. **Progressive enhancement** — the page works before any client JS loads

The tradeoff: Server Components can't use hooks, event handlers, or browser APIs. You split your tree by what needs interactivity (client) vs. what just displays data (server).`,
        createdAt: Date.now() - 86000000,
      },
    ],
  },
  {
    id: 't_sample_3',
    title: 'Trip itinerary: 3 days in Lisbon',
    modelId: 'axiom-pro',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 170000000,
    messages: [],
  },
  {
    id: 't_sample_4',
    title: 'Review my startup pitch deck',
    modelId: 'axiom-pro',
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 250000000,
    archived: false,
    messages: [],
  },
]

// ============ SAMPLE STUDIO PROJECT ============
const APP_TSX = `import { useState, useEffect } from 'react'
import { Card } from './components/Card'
import { Header } from './components/Header'
import { fetchStats } from './lib/api'

export default function App() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats().then((data) => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header title="Axiom Dashboard" />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, Alex
        </h1>
        <p className="mt-2 text-zinc-400">
          Here's what's happening with your projects today.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <p>Loading stats…</p>
          ) : (
            stats?.map((s) => (
              <Card key={s.label} label={s.label} value={s.value} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
`

const CARD_TSX = `interface CardProps {
  label: string
  value: string | number
}

export function Card({ label, value }: CardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}
`

const HEADER_TSX = `interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-lg font-semibold">{title}</h1>
        <nav className="flex gap-4 text-sm text-zinc-400">
          <a href="#" className="hover:text-zinc-100">Overview</a>
          <a href="#" className="hover:text-zinc-100">Projects</a>
          <a href="#" className="hover:text-zinc-100">Settings</a>
        </nav>
      </div>
    </header>
  )
}
`

const API_TS = `const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export async function fetchStats() {
  const res = await fetch(\`\${API_BASE}/stats\`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchProjects() {
  const res = await fetch(\`\${API_BASE}/projects\`)
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}
`

const PACKAGE_JSON = `{
  "name": "axiom-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
`

const README_MD = `# Axiom Dashboard

A minimal analytics dashboard built with React + Vite.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Structure

- \`src/App.tsx\` — root component, fetches and displays stats
- \`src/components/\` — presentational components (Card, Header)
- \`src/lib/api.ts\` — data fetching helpers

## Built with Axiom Studio

This project was scaffolded and iterated on inside [Axiom Studio](https://axiom.dev/studio).
`

export const SAMPLE_PROJECT: StudioProject = {
  id: 'p_sample_1',
  name: 'axiom-dashboard',
  template: 'Vite + React',
  description: 'A minimal analytics dashboard built with React + Vite.',
  createdAt: Date.now() - 7200000,
  updatedAt: Date.now() - 600000,
  language: 'typescript',
  framework: 'vite-react',
  files: [
    {
      id: 'f_src',
      name: 'src',
      path: 'src',
      content: '',
      language: 'directory',
      isDirectory: true,
      children: [
        {
          id: 'f_app',
          name: 'App.tsx',
          path: 'src/App.tsx',
          content: APP_TSX,
          language: 'tsx',
        },
        {
          id: 'f_components',
          name: 'components',
          path: 'src/components',
          content: '',
          language: 'directory',
          isDirectory: true,
          children: [
            {
              id: 'f_card',
              name: 'Card.tsx',
              path: 'src/components/Card.tsx',
              content: CARD_TSX,
              language: 'tsx',
            },
            {
              id: 'f_header',
              name: 'Header.tsx',
              path: 'src/components/Header.tsx',
              content: HEADER_TSX,
              language: 'tsx',
            },
          ],
        },
        {
          id: 'f_lib',
          name: 'lib',
          path: 'src/lib',
          content: '',
          language: 'directory',
          isDirectory: true,
          children: [
            {
              id: 'f_api',
              name: 'api.ts',
              path: 'src/lib/api.ts',
              content: API_TS,
              language: 'typescript',
            },
          ],
        },
      ],
    },
    {
      id: 'f_pkg',
      name: 'package.json',
      path: 'package.json',
      content: PACKAGE_JSON,
      language: 'json',
    },
    {
      id: 'f_readme',
      name: 'README.md',
      path: 'README.md',
      content: README_MD,
      language: 'markdown',
    },
  ],
}

export const PROJECT_TEMPLATES = [
  { id: 'vite-react', name: 'Vite + React', desc: 'Fast SPA with React 19 + TypeScript', icon: '⚡' },
  { id: 'nextjs', name: 'Next.js', desc: 'Full-stack React framework with App Router', icon: '▲' },
  { id: 'node-api', name: 'Node API', desc: 'Express/Fastify REST API server', icon: '🟢' },
  { id: 'python', name: 'Python', desc: 'Python script or Flask/FastAPI service', icon: '🐍' },
  { id: 'blank', name: 'Blank', desc: 'Start from an empty workspace', icon: '○' },
]
