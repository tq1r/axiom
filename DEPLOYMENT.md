# Axiom — Deployment Guide

## Current Status

The app is live on Vercel. If you're seeing an old version, force a redeploy:

1. Go to https://vercel.com → your project
2. Click "Deployments" 
3. Find the latest deployment
4. Click the "..." menu → "Redeploy"
5. Check the build logs for errors

## Environment Variables (REQUIRED for AI to work)

Without these, the chat falls back to simulated responses (which is why it feels "dumb"):

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `AI_API_KEY` | Your z.ai key (format: `id.secret`) | https://open.bigmodel.cn → API Keys |
| `AI_MODEL` | `glm-4.5-flash` (free) | Already defaulted |

Set these in: Vercel → Settings → Environment Variables

## What Works

- ✅ Real AI chat (GLM-4.5-Flash via z.ai API) — when AI_API_KEY is set
- ✅ Thinking/reasoning display
- ✅ Streaming responses with stop button
- ✅ Email auth (localStorage-based)
- ✅ Google/GitHub OAuth (simulated)
- ✅ Studio agent that generates real code files
- ✅ Inline code editing (Cmd+I)
- ✅ Mini-game (Reaction Rush) during AI wait
- ✅ Chat history with search
- ✅ Markdown rendering with syntax highlighting
- ✅ Math (KaTeX), Mermaid diagrams
- ✅ Export to HTML for Netlify
- ✅ Login persistence across reloads

## What Doesn't Work (and why)

- ❌ **Email sending** — requires a backend email service (SendGrid/Mailgun). Would need API keys + server routes.
- ❌ **Discord webhooks** — same, needs backend integration with Discord's API.
- ❌ **Real code execution** — requires a sandbox (Docker/WebContainers). The terminal in Studio is simulated.
- ❌ **Self-error-checking** — the AI can review code but can't actually run it to check for runtime errors.
- ❌ **Real OAuth** — the Google/GitHub buttons create simulated accounts. Real OAuth needs client IDs + secrets.

## How to Make It Better

1. **Set the AI_API_KEY env var** — this is the #1 reason the AI feels dumb. Without it, you get simulated responses.
2. **Add a custom domain** — vercel.app URLs get blocked by school filters. Buy a $10 domain from Namecheap.
3. **For email sending**: sign up for Resend.com (free tier), add `RESEND_API_KEY` env var, and I can add a `/api/send-email` route.
4. **For real code execution**: this would need a Docker-based sandbox or WebContainers integration — significant infrastructure.
