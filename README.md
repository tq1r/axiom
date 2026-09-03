# Axiom

> Ask anything. Build anything.

Axiom is an AI platform with two flagship products under one brand:
- **Axiom Chat** — a ChatGPT-class AI assistant
- **Axiom Studio** — a Windsurf-class AI-native IDE

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Framer Motion for animations
- Zustand for state (with localStorage persistence)
- z-ai-web-dev-sdk for the chat API (falls back to simulated responses if unconfigured)

## Develop

```bash
bun install
bun run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import this repo
3. Vercel auto-detects Next.js — just click Deploy
4. Live in ~2 minutes at `your-project.vercel.app`

No environment variables required for the demo. The chat API automatically falls back to high-quality simulated responses when the AI SDK isn't configured.

## Features

- 8 views: Landing, Auth, Dashboard, Chat, Studio, Models, Pricing, Settings
- Real-time streaming chat (SSE)
- Markdown rendering with syntax-highlighted code, KaTeX math, Mermaid diagrams
- "Open in Studio" button on every code block
- Studio IDE: file explorer, code editor, AI agent with checkpoints, terminal, preview
- Cmd+I inline edits with red/green diffs
- Agent approval gates on terminal commands
- Mini-game (Axiom Blocks, 2048-style) that appears while AI streams
- Command palette (Cmd+K)
- Keyboard shortcuts overlay (?)
- Light/dark theme (warm paper/ink aesthetic, not generic dark)

## License

MIT
