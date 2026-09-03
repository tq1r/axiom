import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatRequestBody {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  model?: string
  thinking?: boolean
}

// Map Axiom-branded model IDs to real backend models.
// This is the provider-agnostic gateway — swap implementations without touching the frontend.
const MODEL_MAP: Record<string, { model?: string; label: string }> = {
  'axiom-pro': { label: 'Axiom Pro' },
  'axiom-flash': { label: 'Axiom Flash' },
  'axiom-coder': { label: 'Axiom Coder' },
  'axiom-vision': { label: 'Axiom Vision' },
}

const SYSTEM_PROMPT = `You are Axiom, a world-class AI assistant. You are helpful, precise, and thoughtful.

Guidelines:
- Use GitHub-flavored Markdown for formatting (headings, lists, bold, tables).
- For code, ALWAYS use fenced code blocks with the correct language tag, e.g. \`\`\`typescript ... \`\`\`
- For math, use KaTeX: $inline$ or $$display$$.
- Be concise but complete. Prefer concrete examples over abstract descriptions.
- When you don't know something, say so honestly.
- You are part of a platform that also includes Axiom Studio (an AI IDE). When users share code, mention they can open it in Studio.`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody
    const { messages, model = 'axiom-pro' } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const modelConfig = MODEL_MAP[model] || MODEL_MAP['axiom-pro']

    // Build the message list with system prompt
    const fullMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.filter((m) => m.role !== 'system').map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Try real ZAI SDK
          let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null
          try {
            zai = await ZAI.create()
          } catch {
            // SDK not configured — fall through to simulation
          }

          if (zai) {
            // Real streaming via z-ai-web-dev-sdk
            const response = (await zai.chat.completions.create({
              messages: fullMessages,
              stream: true,
              thinking: { type: 'disabled' },
            })) as unknown as ReadableStream<Uint8Array> | { choices: { message: { content: string } }[] }

            // If we got a ReadableStream back, parse SSE
            if (response && typeof (response as ReadableStream).getReader === 'function') {
              const reader = (response as ReadableStream).getReader()
              const decoder = new TextDecoder()
              let buffer = ''
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''
                for (const line of lines) {
                  const trimmed = line.trim()
                  if (!trimmed.startsWith('data:')) continue
                  const jsonStr = trimmed.slice(5).trim()
                  if (jsonStr === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(jsonStr)
                    const delta = parsed?.choices?.[0]?.delta?.content
                    if (delta) {
                      send({ type: 'token', content: delta })
                    }
                  } catch {
                    // ignore parse errors on partial chunks
                  }
                }
              }
              send({ type: 'done' })
              controller.close()
              return
            }

            // Non-streaming response
            const completion = response as { choices: { message: { content: string } }[] }
            const content = completion?.choices?.[0]?.message?.content
            if (content) {
              // Simulate streaming for UX consistency
              const tokens = content.split(/(\s+)/)
              for (const t of tokens) {
                send({ type: 'token', content: t })
                await new Promise((r) => setTimeout(r, 12))
              }
              send({ type: 'done' })
              controller.close()
              return
            }
          }

          // Fallback: high-quality simulated response (used when SDK isn't configured)
          const lastUser = [...messages].reverse().find((m) => m.role === 'user')
          const simulated = simulateResponse(lastUser?.content || '', modelConfig.label)
          const tokens = simulated.split(/(\s+)/)
          for (const t of tokens) {
            send({ type: 'token', content: t })
            await new Promise((r) => setTimeout(r, 14))
          }
          send({ type: 'done' })
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          send({ type: 'error', content: message })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function simulateResponse(userMessage: string, modelName: string): string {
  const msg = userMessage.toLowerCase()

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! I'm **Axiom**, running on ${modelName}. I can help you write code, analyze data, brainstorm ideas, explain concepts, and much more.

What would you like to work on today? You can:

- Ask me to write or debug code
- Upload a file (PDF, CSV, image) for analysis
- Use \`/explain\`, \`/summarize\`, or \`/imagine\` slash commands
- Switch models anytime using the picker below

What's on your mind?`
  }

  if (msg.includes('code') || msg.includes('function') || msg.includes('component') || msg.includes('react')) {
    return `Here's a clean, production-ready example. Let me walk you through the approach:

## The solution

I'll build this with a focus on readability, type safety, and performance. The key idea is to separate **data fetching** from **rendering** so each can be tested and optimized independently.

\`\`\`typescript
import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  name: string
  email: string
}

export function useUser(userId: string | null) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(\`/api/users/\${userId}\`)
      if (!res.ok) throw new Error('Failed to fetch user')
      const data = await res.json()
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return { user, loading, error, refetch: fetchUser }
}
\`\`\`

## Why this works

1. **Separation of concerns** — the hook owns state and fetching; the component just renders
2. **Stable references** — \`useCallback\` prevents unnecessary effect re-runs
3. **Error surfacing** — callers decide how to display errors, the hook just reports them
4. **Refetch capability** — exposed for retry buttons or pull-to-refresh

> **Tip:** Want to iterate on this in a full IDE? Click **"Open in Studio"** on the code block above to drop it straight into Axiom Studio.

Want me to add tests, error boundaries, or a suspense version?`
  }

  if (msg.includes('explain') || msg.includes('what is') || msg.includes('how does')) {
    return `Great question. Let me break this down clearly.

## The short answer

The core idea is simpler than it first appears. At its heart, this is about **separating what changes from what stays the same**, then making the changing parts explicit and predictable.

## The deeper picture

There are three layers to understand:

1. **The mental model** — what's actually happening conceptually
2. **The mechanism** — how the pieces fit together mechanically
3. **The tradeoffs** — when this approach shines and when it doesn't

### The mental model

Think of it like a contract between two systems. One side promises to deliver data in a known shape; the other promises to handle whatever arrives. As long as both sides honor the contract, they can evolve independently.

### The mechanism

In practice, this means:

- Define a **schema** or **interface** that describes the shape
- Producers validate against it before sending
- Consumers parse defensively, assuming nothing beyond the schema

### The tradeoffs

| Strength | Limitation |
|----------|------------|
| Decoupled systems | Schema drift over time |
| Easier testing | Indirection can obscure bugs |
| Independent scaling | Versioning complexity |

## A quick visualization

\`\`\`mermaid
graph LR
  A[Producer] --> B{Schema}
  B --> C[Consumer]
  B --> D[Consumer 2]
\`\`\`

## The math behind it

If we model the contract as a probability of compatibility $P(c)$, the expected number of successful interactions over $n$ calls is:

$$E[n] = \\sum_{i=1}^{n} P(c_i) = n \\cdot P(c)$$

where $P(c) \\approx 1 - \\frac{\\Delta s}{s_{total}}$ and $\\Delta s$ is the schema drift.

## When to use this

Reach for this pattern when you have **two systems owned by different teams** that need to communicate. If it's all one codebase, simpler approaches often win.

Want me to go deeper on any of these layers?`
  }

  if (msg.includes('math') || msg.includes('equation') || msg.includes('formula') || msg.includes('calculate')) {
    return `Sure — here's how to approach the math.

## Setting up the problem

Let's say we want to find the roots of a quadratic equation $ax^2 + bx + c = 0$. The classic formula is:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

The discriminant $\\Delta = b^2 - 4ac$ tells us everything:

- If $\\Delta > 0$: two distinct real roots
- If $\\Delta = 0$: one repeated real root
- If $\\Delta < 0$: two complex conjugate roots

## Worked example

Take $x^2 - 5x + 6 = 0$. Here $a = 1$, $b = -5$, $c = 6$:

$$\\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1$$

$$x = \\frac{5 \\pm \\sqrt{1}}{2} = \\frac{5 \\pm 1}{2}$$

So $x_1 = 3$ and $x_2 = 2$. ✓

## Generalizing

For a system of equations, we can express the solution in matrix form $Ax = b$ where $A \\in \\mathbb{R}^{n \\times n}$. The solution exists and is unique when $\\det(A) \\neq 0$:

$$x = A^{-1}b$$

Want me to walk through a specific problem you're working on?`
  }

  if (msg.includes('write') || msg.includes('email') || msg.includes('blog') || msg.includes('article')) {
    return `Here's a polished draft. I've kept the tone confident and the structure scannable — readers should get the key point from the first sentence alone.

---

**Subject:** Quick update on the Q3 roadmap

Hi team,

We've locked the Q3 roadmap and I want to share the highlights before Thursday's all-hands.

**What shipped last quarter**
- The new onboarding flow (47% completion lift)
- Multi-tenant billing (finally)
- The mobile app beta

**What's next**
Our three big bets for Q3:

1. **Real-time collaboration** — live cursors and presence, starting with documents
2. **AI summaries** — auto-generated digests of long threads, powered by Axiom
3. **Enterprise SSO** — SAML + SCIM for our top 20 accounts

**What we need from you**
Engineering: confirm capacity by Friday. Design: finalize the collab specs by next Wednesday. Everyone else: read the doc, leave comments, and bring questions to Thursday.

Thanks all — really proud of where we are.

— Alex

---

Want me to adjust the tone (more formal? more casual?), shorten it, or adapt it for a different audience?`
  }

  return `That's a great question. Let me think through this carefully and give you a thorough answer.

## My take

Here's how I'd approach this:

1. **Clarify the goal** — what does success look like specifically?
2. **Identify constraints** — time, budget, technical limitations
3. **Map the options** — usually there are 2–3 viable paths
4. **Pick a default** — the boring choice that's most likely to work

### Going deeper

The most common mistake people make here is optimizing for the wrong thing. They reach for the clever solution when the simple one would get them 90% of the way there with 10% of the complexity.

> "The best code is no code at all. The second best is code so simple it's obvious."

### Practical steps

- Start with the simplest version that could possibly work
- Ship it, measure, and only then add complexity where the data says you need it
- Document **why** you made each choice, not just **what** you did

This is running on **${modelName}**. If you'd like deeper reasoning or a faster response, you can switch models using the picker in the composer below.

What specific part would you like me to expand on?`
}
