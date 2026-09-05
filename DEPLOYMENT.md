# Axiom — Deployment Guide

## Environment Variables (for AI to work)

The app supports TWO AI providers. Set ONE of these:

### Option 1: OpenCode Zen (RECOMMENDED — has free models)
1. Go to https://opencode.ai/auth → sign in → API keys
2. Set `OPENCODE_API_KEY` = your key (starts with `sk-`)
3. Optional: set `AI_MODEL` = `deepseek-v4-flash` (free) or `claude-sonnet-4-6` (paid)

Free models available: `deepseek-v4-flash-free`, `nemotron-3-ultra-free`

### Option 2: Zhipu/z.ai (your existing key)
1. Set `AI_API_KEY` = your z.ai key (format: `id.secret`)
2. Default model: `glm-4.5-flash` (free)

Set these in: Vercel → Settings → Environment Variables → Redeploy

## Studio Features (like OpenCode)

- **Plan/Build mode toggle** — click Plan to get a plan without making changes, click Build to execute
- **@file mentions** — type @file in the agent input to reference project files
- **Web search** — AI searches Google for factual questions before answering
- **Narrative updates** — agent tells you what it's doing, doesn't dump code in chat
- **Todo list** — inline checkboxes showing task completion
- **Clear project** — trash icon in file explorer or ask the agent to clear

## Chat Features

- Flat full-width messages (no SMS bubbles)
- Thinking indicator while waiting for first token
- Streaming with prominent stop button
- Auto-scroll with "Jump to latest" button
- Markdown, code highlighting, math, Mermaid diagrams
- Mini-game (Reaction Rush) while waiting for AI

## What Doesn't Work (honestly)

- Email sending — needs Resend/SendGrid API key
- Discord webhooks — needs webhook URL + backend route
- Real code execution — needs Docker sandbox
- Real OAuth — needs Google/GitHub client IDs

