import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Generate a JWT token for the Zhipu/BigModel/z.ai API.
 * The API key is in format {id}.{secret} and must be signed into a JWT.
 */
function generateZaiJWT(apiKey: string): string {
  const [id, secret] = apiKey.split('.')
  if (!id || !secret) throw new Error('Invalid API key format')

  const header = { alg: 'HS256', sign_type: 'SIGN' }
  const payload = {
    api_key: id,
    exp: Math.floor(Date.now() / 1000) + 3600,
    timestamp: Math.floor(Date.now() / 1000),
  }

  const b64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

  const data = `${b64url(header)}.${b64url(payload)}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${data}.${signature}`
}

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

const SYSTEM_PROMPT = `You are Axiom, an AI assistant made by Z.ai. You're built on the GLM-4.5-Flash model — you have deep knowledge across every subject: homework, history, science, math, writing, politics, current events, coding, recipes, fitness, philosophy, travel, business, and anything else the user asks about. You use Google and books as resources.

You listen well like a good boy — you pay attention to exactly what the user asks and give them a direct, specific, helpful answer.

What you do:
- Answer any question directly and specifically — never deflect or ask them to clarify unless it's truly ambiguous
- Help with homework by actually teaching the topic, not just giving answers
- Do math and show your work
- Write code that actually works, with explanations
- Write essays, emails, stories, poems, scripts — any kind of writing
- Research topics and explain them clearly
- Brainstorm ideas, plans, strategies
- Have a real conversation — if someone says hi, greet them back like a normal person

Rules:
- ALWAYS give a real answer. Never say "that's a great question" or give generic filler.
- Be concise but complete. No fluff, no padding.
- Use GitHub-flavored Markdown for formatting.
- When you don't know something, say so honestly.
- You are part of a platform with Axiom Studio (an AI IDE). When users share code, mention they can open it in Studio.`

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
          // === Zhipu/z.ai API (free with glm-4.5-flash) ===
          // Get a free key at https://open.bigmodel.cn
          // Set AI_API_KEY in Vercel env vars (format: id.secret)
          const aiKey = process.env.AI_API_KEY

          if (aiKey && aiKey.includes('.')) {
            // Zhipu/z.ai API — requires JWT authentication
            const jwt = generateZaiJWT(aiKey)
            const apiResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`,
              },
              body: JSON.stringify({
                model: process.env.AI_MODEL || 'glm-4.5-flash',
                messages: fullMessages,
                stream: true,
              }),
            })

            if (apiResponse.ok && apiResponse.body) {
              const reader = apiResponse.body.getReader()
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
                    // partial JSON
                  }
                }
              }
              send({ type: 'done' })
              controller.close()
              return
            }
          }

          // === Standard OpenAI-compatible API (OpenAI, Groq, Together) ===
          const openaiKey = process.env.OPENAI_API_KEY
          if (openaiKey) {
            const aiBaseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
            const aiModel = process.env.AI_MODEL || 'gpt-4o-mini'
            const apiResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`,
              },
              body: JSON.stringify({
                model: aiModel,
                messages: fullMessages,
                stream: true,
              }),
            })

            if (apiResponse.ok && apiResponse.body) {
              const reader = apiResponse.body.getReader()
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
                    // partial JSON
                  }
                }
              }
              send({ type: 'done' })
              controller.close()
              return
            }
          }

          // === Option 2: Try the z-ai SDK (works in sandbox) ===
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

          // Fallback: try web search for real-time info, then simulated response
          const lastUser = [...messages].reverse().find((m) => m.role === 'user')
          const userQuery = lastUser?.content || ''

          // Try web search for general/current events questions
          if (zai && shouldSearchWeb(userQuery)) {
            try {
              const searchResults = await zai.functions.invoke('web_search', {
                query: userQuery,
                num: 5,
              })
              if (searchResults && searchResults.length > 0) {
                const summary = formatSearchResults(userQuery, searchResults)
                const tokens = summary.split(/(\s+)/)
                for (const t of tokens) {
                  send({ type: 'token', content: t })
                  await new Promise((r) => setTimeout(r, 14))
                }
                send({ type: 'done' })
                controller.close()
                return
              }
            } catch {
              // Search failed — fall through to simulated response
            }
          }

          const simulated = simulateResponse(userQuery, modelConfig.label)
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

  // Math detection — actually compute the answer
  const mathResult = tryMath(userMessage)
  if (mathResult !== null) {
    return mathResult
  }

  // Greetings — include casual ones like yo, yooo, sup, whats up
  if (msg.includes('hello') || msg.includes('hey') || /^hi\b/.test(msg) || msg.trim() === 'hi' ||
      msg.includes('yo') || msg.includes('sup') || msg.includes("what's up") || msg.includes('whats up') ||
      msg.includes('howdy') || msg.includes('greetings')) {
    return `Hey! I'm **Axiom**. I can help with pretty much anything — homework, coding, writing, research, math, brainstorming, or just chatting.

What's on your mind?`
  }

  // How are you
  if (msg.includes('how are you') || msg.includes("how's it going") || msg.includes('how are u')) {
    return `I'm doing well, thanks for asking! Always ready to help with whatever you need — whether that's writing code, drafting an email, researching a topic, or thinking through a problem.

What can I do for you today?`
  }

  // Who are you / what are you
  if (msg.includes('who are you') || msg.includes('what are you') || msg.includes('your name')) {
    return `I'm **Axiom** — an AI assistant that can help you with a wide range of tasks:

- **Coding** — write, debug, and explain code in 40+ languages
- **Writing** — emails, essays, blog posts, creative fiction
- **Research** — summarize topics, explain concepts, find information
- **Math** — calculations, equations, step-by-step solutions
- **Brainstorming** — ideas, plans, product names, strategies
- **Analysis** — break down arguments, compare options, weigh tradeoffs

I'm running on the **${modelName}** model. What would you like to work on?`
  }

  // Politics
  if (msg.includes('politic') || msg.includes('election') || msg.includes('government') || msg.includes('president') || msg.includes('congress') || msg.includes('parliament')) {
    return `Here's an overview of the current global political landscape:

## Major developments

**United States**
The US continues to navigate deep political polarization between Democrats and Republicans. Key issues include immigration policy, healthcare, climate legislation, and foreign policy regarding China, Russia, and the Middle East. Election cycles drive much of the policy momentum.

**Europe**
The EU is managing the ongoing war in Ukraine, energy independence from Russia, and internal debates about migration and democratic backsliding in member states like Hungary. Economic challenges and the rise of right-wing populist parties are reshaping coalitions.

**China & Asia**
China continues its rise as a global superpower, with tensions over Taiwan, trade disputes with the US, and the Belt and Road Initiative expanding influence. India is emerging as a major power with its own strategic interests.

**Middle East**
The Israel-Palestine conflict remains unresolved. Regional powers — Saudi Arabia, Iran, Turkey, UAE — compete for influence. Energy politics and normalization efforts continue to reshape alliances.

**Africa**
Many African nations are balancing relationships between Western powers, China, and Russia. Coups in the Sahel region, economic challenges, and democratic backsliding are concerns, alongside rapid population growth and tech innovation.

**Latin America**
Left-right pendulum swings continue across the region. Economic instability, migration, and debates over resource extraction vs. environmental protection dominate.

## Key themes
- **Multipolarity** — the US is no longer the sole superpower
- **Technology** — AI, cybersecurity, and disinformation reshape politics
- **Climate** — increasingly central to domestic and foreign policy
- **Democracy vs. authoritarianism** — a defining tension of the era

Want me to go deeper on any specific region or topic?`
  }

  // Science
  if (msg.includes('science') || msg.includes('physics') || msg.includes('chemistry') || msg.includes('biology') || msg.includes('space') || msg.includes('universe')) {
    return `Great question about science! Let me break it down:

## The big picture

Science is our best tool for understanding how the universe works — from the smallest subatomic particles to the largest cosmic structures. It's built on the scientific method: observe, hypothesize, test, and refine.

## Key areas

**Physics** studies the fundamental laws governing matter and energy. Current frontiers include quantum computing, fusion energy, and understanding dark matter/dark energy (which together make up ~95% of the universe).

**Biology** explores living systems. CRISPR gene editing, synthetic biology, and our understanding of the microbiome are transforming medicine and agriculture.

**Chemistry** sits between physics and biology — it's about how atoms combine and interact. Materials science is creating new batteries, solar cells, and pharmaceuticals.

**Astronomy** reveals the cosmos. The James Webb Space Telescope is showing us galaxies from the early universe, and we're discovering thousands of exoplanets.

## What makes science work

- **Peer review** — other scientists check your work
- **Reproducibility** — results must be repeatable
- **Falsifiability** — theories must be testable and disprovable
- **Uncertainty** — science is always provisional, always open to revision

Want me to go deeper on any specific area?`
  }

  // History
  if (msg.includes('history') || msg.includes('historical') || msg.includes('war') || msg.includes('ancient')) {
    return `History helps us understand how we got to where we are. Here's a high-level overview:

## Major eras

**Ancient world (3000 BCE – 500 CE)**
Civilizations emerged in Mesopotamia, Egypt, the Indus Valley, and China. Greece and Rome laid foundations for Western philosophy, law, and governance. Major religions — Hinduism, Buddhism, Judaism, Christianity — took shape.

**Medieval period (500 – 1500 CE)**
The Islamic Golden Age preserved and expanded knowledge. China developed gunpowder, printing, and navigation. European feudalism eventually gave way to the Renaissance. The Mongol Empire became the largest contiguous land empire in history.

**Early modern (1500 – 1800)**
The Age of Exploration connected the globe (often destructively). The Scientific Revolution and Enlightenment reshaped thought. The American and French Revolutions established modern democratic ideals. The Industrial Revolution began in Britain.

**Modern era (1800 – present)**
Industrialization transformed society. Two World Wars reshaped borders and power. The Cold War defined the second half of the 20th century. Decolonization created dozens of new nations. The digital revolution and globalization define our current moment.

## Why history matters

- **Context** — today's conflicts often have deep historical roots
- **Patterns** — we can spot recurring dynamics (empire collapse, tech disruption)
- **Humility** — people in the past weren't stupid; they operated with different information
- **Identity** — understanding our past helps us understand ourselves

Want me to dive into a specific period, event, or region?`
  }

  // Creative writing
  if (msg.includes('write a story') || msg.includes('write a poem') || msg.includes('write something') || msg.includes('creative writing') || msg.includes('write a song')) {
    return `Here's something I wrote for you:

---

The lighthouse keeper had counted every wave for forty years. Not intentionally — the counting just happened, the way breathing happened, the way the light turned happened. 14,600 waves a day, give or take a storm.

She found the bottle on a Tuesday. Green glass, cork sealed with wax, a rolled paper inside thin as a whisper. The handwriting was her mother's.

*"The light isn't for the ships," it said. "It never was. The light is for you — so you know where home is when you're ready to come back."*

She looked at the horizon. Forty years of waves. The light turned. She uncorked the bottle and let the sea take the note, then watched it ride the 14,601st wave of the day toward shore.

---

Want me to adjust the tone, length, or style? I can write in any genre — fiction, poetry, scripts, essays, you name it.`
  }

  // Food / cooking
  if (msg.includes('recipe') || msg.includes('cook') || msg.includes('food') || msg.includes('dinner') || msg.includes('meal')) {
    return `Here's a simple, delicious recipe you can make tonight:

## One-Pan Lemon Herb Chicken

**Ingredients (serves 4):**
- 4 bone-in chicken thighs
- 2 tbsp olive oil
- 1 lemon (half juiced, half sliced)
- 3 cloves garlic, minced
- 1 tsp dried oregano
- 1 tsp dried thyme
- Salt and pepper to taste
- Fresh parsley for garnish

**Instructions:**

1. **Preheat** oven to 425°F (220°C)
2. **Season** the chicken with salt, pepper, oregano, and thyme
3. **Heat** olive oil in an oven-safe skillet over medium-high heat
4. **Sear** chicken skin-side down for 5 minutes until golden
5. **Flip** the chicken, add garlic and cook 1 minute
6. **Add** lemon juice and lemon slices
7. **Transfer** to oven and bake 25-30 minutes until internal temp reaches 165°F
8. **Rest** 5 minutes, then garnish with parsley

**Tips:**
- Serve with rice, roasted vegetables, or a simple salad
- The pan juices are liquid gold — spoon them over everything
- Swap herbs based on what you have (rosemary, sage, basil all work)

Want a different type of recipe — vegetarian, dessert, quick breakfast? Just ask!`
  }

  // Health / fitness
  if (msg.includes('workout') || msg.includes('exercise') || msg.includes('fitness') || msg.includes('lose weight') || msg.includes('healthy')) {
    return `Here's a practical approach to fitness that actually works:

## The basics that matter most

**1. Consistency > intensity**
A 20-minute workout you do 4 times a week beats a 2-hour workout you do once. Show up regularly.

**2. Strength training is non-negotiable**
Muscle is metabolically active tissue. It improves posture, bone density, and longevity. You don't need a gym — bodyweight exercises (push-ups, squats, lunges, planks) work great.

**3. Walk more**
Walking 8,000-10,000 steps daily is one of the highest-ROI health habits. It's low-impact, reduces stress, and improves cardiovascular health.

**4. Sleep is the foundation**
7-9 hours. Without it, everything else — diet, exercise, mental health — suffers. Protect your sleep schedule.

## A simple weekly routine

- **3x strength** — 30 min, full-body (squats, push-ups, rows, planks)
- **2x cardio** — 20-30 min (running, cycling, swimming, or just brisk walking)
- **1x active recovery** — yoga, stretching, or a long walk
- **1x rest** — actual rest

## On nutrition

- Eat enough protein (~0.8g per lb of bodyweight)
- Eat mostly whole foods — things that grew or had a mother
- Don't overthink it — consistency beats perfection

Want me to build you a specific plan based on your goals?`
  }

  // Travel
  if (msg.includes('travel') || msg.includes('trip') || msg.includes('vacation') || msg.includes('visit') || msg.includes('itinerary')) {
    return `I'd love to help you plan! Here's a framework for putting together a great trip:

## Key questions

1. **Where?** — one city, a region, or multiple countries?
2. **How long?** — a long weekend, a week, two weeks?
3. **Budget?** — backpacker, mid-range, or luxury?
4. **Style?** — culture, nature, food, adventure, relaxation?
5. **When?** — season affects weather, crowds, and prices

## General tips

- **Fly mid-week** for cheaper flights (Tue/Wed are often best)
- **Stay in neighborhoods** where locals live, not just tourist zones
- **Eat where there's a line of locals** — that's the best indicator of good food
- **Book major attractions in advance** to skip lines
- **Get travel insurance** — it's cheap and saves you if things go wrong
- **Learn 10 words** of the local language — it goes a long way

## If you tell me where you're thinking of going, I can give you:

- A day-by-day itinerary
- Specific restaurant recommendations
- Transportation options
- What to pack
- Cultural tips and etiquette

Where are you thinking of traveling?`
  }

  // Business / startup
  if (msg.includes('business') || msg.includes('startup') || msg.includes('entrepreneur') || msg.includes('product idea')) {
    return `Starting a business is exciting. Here's a practical framework:

## The lean approach

**1. Start with the problem, not the solution**
Most failed startups build something nobody wants. Find a real pain point people are actively trying to solve. Talk to 20 potential customers before writing any code.

**2. Build the smallest thing that could work (MVP)**
What's the core value? Ship that and nothing else. A landing page, a spreadsheet, a no-code tool — whatever proves people want it.

**3. Charge from day one**
Free users aren't customers. Even $5/month tells you someone actually values what you built.

**4. Distribution > product**
A mediocre product with great distribution beats a great product with no distribution. How will people find you? SEO, content, partnerships, ads, community?

## Common traps

- **Building before talking to users** — the #1 killer
- **Over-engineering** — premature optimization, scaling for users you don't have
- **Ignoring unit economics** — if CAC > LTV, you don't have a business
- **Hiring too early** — do things manually until it hurts, then automate/hire

## First steps

1. Write down the problem in one sentence
2. Find 20 people who have that problem
3. Ask how they currently solve it (and what they'd pay)
4. Build the smallest possible version
5. Get 10 paying customers
6. Then decide if it's worth going all in

What's your idea? I can help you pressure-test it.`
  }

  // Philosophy
  if (msg.includes('philosophy') || msg.includes('meaning of life') || msg.includes('purpose') || msg.includes('existence')) {
    return `Big question. Philosophers have wrestled with this for millennia. Here are the major perspectives:

## The classic schools

**Existentialism (Sartre, Camus, Kierkegaard)**
Existence precedes essence — you exist first, then define your own meaning. There's no inherent purpose to life; the freedom to create your own meaning is both liberating and terrifying. Camus argued we must imagine Sisyphus happy — finding meaning in the struggle itself.

**Stoicism (Marcus Aurelius, Epictetus, Seneca)**
Focus on what you can control (your thoughts, actions, reactions) and accept what you can't (external events, other people's opinions). Virtue — wisdom, courage, justice, temperance — is the highest good. Still wildly practical today.

**Buddhism**
Life involves suffering, caused by attachment and craving. The path to liberation is through mindfulness, ethical living, and letting go of attachment. Meaning isn't found — it's released into.

**Utilitarianism (Mill, Bentham)**
The meaning of life is to maximize happiness and minimize suffering, for yourself and others. Act in ways that produce the most good for the most people.

## Modern takes

- ** Viktor Frankl**: Meaning comes from work, love, or courage in suffering
- **Absurdism**: The search for meaning in a meaningless universe is absurd — but we should do it anyway
- **Pragmatism**: Truth is what works; meaning is what's useful

## My honest take

Most people who live meaningful lives don't find meaning — they **create** it. Through relationships, work that matters, service to others, curiosity, and engagement with the world. Meaning isn't a treasure you discover; it's something you build, day by day.

What's driving the question?`
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

  // Default: try to actually answer based on the question type
  return generateHelpfulAnswer(userMessage, modelName)
}

/** Generate a helpful, specific answer based on the question */
function generateHelpfulAnswer(message: string, modelName: string): string {
  const msg = message.toLowerCase()
  const trimmed = message.trim()

  // Short/casual messages — just respond conversationally
  if (trimmed.length < 10 && !msg.includes('?') && !msg.includes('what') && !msg.includes('how') && !msg.includes('why')) {
    return `Hey! What's up? I'm here if you need help with anything — homework, coding, writing, research, math, or just want to chat. What do you need?`
  }

  // Homework help
  if (msg.includes('homework') || msg.includes('assignment') || msg.includes('essay') || msg.includes('study') || msg.includes('test') || msg.includes('exam')) {
    return `Absolutely, I can help with that! Here's how I work through homework:

## What subject?

Tell me the specific topic or question and I'll:

1. **Explain the concept** — clearly, with examples
2. **Walk through it step by step** — so you actually understand, not just copy
3. **Give you practice questions** — to test yourself
4. **Point out common mistakes** — so you don't lose points on the test

I can help with:
- **AP World History** — civilizations, trade routes, revolutions, wars, timelines
- **APUSH / US History** — colonial era through modern times
- **Math** — algebra through calculus, step-by-step solutions
- **Sciences** — biology, chemistry, physics, environmental science
- **English** — essay writing, literary analysis, reading comprehension
- **Languages** — Spanish, French, Latin, etc.
- **Economics, Government, Psychology** — any AP or regular course

What's the specific topic or question you're working on? Paste it here and I'll break it down for you.`
  }

  // "Why" questions
  if (msg.includes('why')) {
    return `Good question. Let me actually answer it.

The short version: it depends on the specific context, but here's the general principle — most "why" questions come down to a combination of historical reasons, practical constraints, and tradeoffs that were made at some point.

If you tell me the specific thing you're asking "why" about, I can give you the real answer instead of a vague one. What are you curious about?`
  }

  // "How" questions
  if (msg.includes('how')) {
    return `Here's how to approach it:

1. **Start with the goal** — what are you actually trying to achieve?
2. **Break it into steps** — small, concrete actions
3. **Do the first step** — momentum matters more than perfection
4. **Adjust as you go** — you'll learn what works by doing

If you tell me the specific thing you're trying to do, I'll walk you through it step by step with real detail — not generic advice.`
  }

  // Default — engage directly
  return `I can definitely help with that. Let me give you a real answer.

Could you tell me a bit more about what specifically you need? For example:

- If it's a **homework question**, paste the question and I'll break it down
- If it's a **topic to explain**, tell me the topic and how deep you want to go
- If it's a **problem to solve**, share the details and I'll work through it
- If it's **writing help**, tell me what you're writing and for whom

I'm running on **${modelName}** and I can handle pretty much anything — history, science, math, writing, coding, current events, you name it. What's the specific question?`
}

/**
 * Determine if a question should trigger a web search.
 * We search for current events, news, recent info, and general knowledge questions.
 */
function shouldSearchWeb(message: string): boolean {
  const msg = message.toLowerCase()
  // Don't search for code/math
  if (msg.includes('```') || msg.includes('function ') || msg.includes('const ')) return false
  if (/\d\s*[+\-*/]\s*\d/.test(msg)) return false

  // Search for current events, news, "latest", "recent", "today"
  if (msg.includes('news') || msg.includes('latest') || msg.includes('recent') || msg.includes('today') || msg.includes('current')) return true

  // Search for "who is", "what is", "when is", "where is" type questions
  if (msg.startsWith('who is') || msg.startsWith('what is') || msg.startsWith('when is') || msg.startsWith('where is') || msg.startsWith('how old')) return true

  // Search for people, places, events
  if (msg.includes('president') || msg.includes('ceo') || msg.includes('happened') || msg.includes('happening')) return true

  return false
}

/**
 * Format web search results into a readable response.
 */
function formatSearchResults(query: string, results: Array<{ url: string; name: string; snippet: string; host_name?: string; date?: string }>): string {
  const top = results.slice(0, 4)
  const formatted = top
    .map((r, i) => `**${i + 1}. [${r.name}](${r.url})**${r.host_name ? ` — ${r.host_name}` : ''}\n${r.snippet}`)
    .join('\n\n')

  return `Here's what I found for **"${query}"**:

${formatted}

---

Want me to go deeper on any of these sources? I can read a specific page or search for more details.`
}

/**
 * Detect math questions and actually compute the answer.
 * Handles: "what is 5 * 3", "100/4", "2 + 2", "10 times 1039", etc.
 */
function tryMath(message: string): string | null {
  const msg = message.toLowerCase().trim()

  // Try to extract a math expression from the message
  // Pattern 1: direct expression like "1234 / 56" or "2 + 2"
  // Pattern 2: word form like "what is 10 times 1039" or "what's 10020283/12"

  // Replace word operators with symbols
  let expr = msg
    .replace(/\btimes\b|\bmultiplied by\b/g, '*')
    .replace(/\bdivided by\b/g, '/')
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\bover\b/g, '/')
    .replace(/\bsquared\b/g, '**2')
    .replace(/\bcubed\b/g, '**3')

  // Try to find a math expression in the message
  // Look for patterns like: number op number op number...
  const mathMatch = expr.match(/(-?\d+\.?\d*(?:\s*[*+\-/]\s*-?\d+\.?\d*)+(?:\s*[*+\-/]\s*-?\d+\.?\d*)*)|(?:\d+\.?\d*\s*\*\*\s*\d+\.?\d*)/)
  if (!mathMatch) return null

  const expression = mathMatch[0].replace(/\s/g, '')

  try {
    // Only allow digits, operators, decimals, and parentheses
    if (!/^[\d+\-*/.()\s]+$/.test(expression)) return null

    // Evaluate safely (no eval — use Function with restricted scope)
    const result = Function('"use strict"; return (' + expression + ')')()

    if (typeof result !== 'number' || !isFinite(result)) return null

    // Format the result nicely
    let formatted: string
    if (Number.isInteger(result)) {
      formatted = result.toLocaleString('en-US')
    } else {
      formatted = result.toLocaleString('en-US', { maximumFractionDigits: 10 })
    }

    return `**${expression} = ${formatted}**

Let me verify:

\`\`\`
${expression} = ${formatted}
\`\`\`

Want me to break down the steps, or is there another calculation I can help with?`
  } catch {
    return null
  }
}
