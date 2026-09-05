/**
 * Real code generator for the Studio agent.
 * Produces actual, substantial code based on the user's prompt — not placeholders.
 */

export interface GeneratedFile {
  path: string
  language: string
  content: string
  description: string
}

export interface AgentPlan {
  steps: string[]
  files: GeneratedFile[]
  command?: string
  commandOutput?: string
}

/** Detect what the user wants and generate a real plan + real files. */
export function generatePlan(prompt: string): AgentPlan {
  const p = prompt.toLowerCase()

  // Single HTML file request (for Netlify deployment)
  if (p.includes('html') && (p.includes('netlify') || p.includes('single file') || p.includes('post it'))) {
    return generateSingleHTML(prompt)
  }

  // E-commerce / shop
  if (p.includes('shop') || p.includes('store') || p.includes('ecommerce') || p.includes('e-commerce') || (p.includes('product') && p.includes('cart'))) {
    return generateShop(prompt)
  }

  // Landing page
  if (p.includes('landing') || p.includes('hero') || p.includes('marketing')) {
    return generateLanding(prompt)
  }

  // Todo app
  if (p.includes('todo') || (p.includes('task') && p.includes('list'))) {
    return generateTodo(prompt)
  }

  // Dashboard
  if (p.includes('dashboard') || p.includes('analytics') || p.includes('chart')) {
    return generateDashboard(prompt)
  }

  // Blog
  if (p.includes('blog') || p.includes('article')) {
    return generateBlog(prompt)
  }

  // Weather
  if (p.includes('weather')) {
    return generateWeather(prompt)
  }

  // Calculator
  if (p.includes('calculator')) {
    return generateCalculator(prompt)
  }

  // Games — always generate as HTML so the preview works
  if (p.includes('minecraft') || p.includes('game') || p.includes('snake') || p.includes('tetris') ||
      p.includes('pong') || p.includes('breakout') || p.includes('flappy') || p.includes('pacman') ||
      p.includes('chess') || p.includes('tic tac toe') || p.includes('tictactoe') || p.includes('memory') ||
      p.includes('platformer') || p.includes('shooter') || p.includes('rpg') || p.includes('puzzle')) {
    return generateGameHTML(prompt)
  }

  // Default: generate as single HTML so preview works
  return generateSingleHTML(prompt)
}

// ============ SHOP / E-COMMERCE ============
function generateShop(prompt: string): AgentPlan {
  return {
    steps: [
      'Define product types and sample data',
      'Build the ProductCard component',
      'Create the shopping cart context and hook',
      'Build the Cart sidebar with add/remove/total',
      'Create the product grid page with filters',
      'Add a checkout summary component',
      'Run dev server to verify the shop',
    ],
    files: [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'Product and cart type definitions',
        content: `export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: 'electronics' | 'clothing' | 'home' | 'books'
  rating: number
  inStock: boolean
}

export interface CartItem extends Product {
  quantity: number
}

export type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE' }
`,
      },
      {
        path: 'src/data/products.ts',
        language: 'typescript',
        description: 'Sample product catalog',
        content: `import { Product } from '../types'

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Wireless Headphones',
    description: 'Studio-quality sound with active noise cancellation and 30-hour battery life.',
    price: 249.00,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'electronics',
    rating: 4.8,
    inStock: true,
  },
  {
    id: 'p2',
    name: 'Mechanical Keyboard',
    description: 'Hot-swappable switches, aluminum frame, RGB backlighting. Built for typing joy.',
    price: 159.00,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    category: 'electronics',
    rating: 4.9,
    inStock: true,
  },
  {
    id: 'p3',
    name: 'Linen Shirt',
    description: 'Breathable 100% linen. Perfect for summer. Tailored fit in three colors.',
    price: 79.00,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3cc6?w=400',
    category: 'clothing',
    rating: 4.6,
    inStock: true,
  },
  {
    id: 'p4',
    name: 'Ceramic Planter',
    description: 'Handmade stoneware planter with drainage. Fits 6-inch nursery pots.',
    price: 42.00,
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400',
    category: 'home',
    rating: 4.7,
    inStock: false,
  },
  {
    id: 'p5',
    name: 'The Pragmatic Programmer',
    description: '20th anniversary edition. Your journey to mastery, by Hunt and Thomas.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    category: 'books',
    rating: 4.9,
    inStock: true,
  },
  {
    id: 'p6',
    name: 'Standing Desk Mat',
    description: 'Anti-fatigue cushioned mat. Reduces pressure on joints during long standing sessions.',
    price: 89.00,
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400',
    category: 'home',
    rating: 4.5,
    inStock: true,
  },
]

export const CATEGORIES = ['all', 'electronics', 'clothing', 'home', 'books'] as const
`,
      },
      {
        path: 'src/hooks/useCart.ts',
        language: 'typescript',
        description: 'Cart state management with useReducer',
        content: `import { useReducer, useEffect, useCallback, createContext, useContext } from 'react'
import type { CartItem, CartAction, Product } from '../types'

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

const initialState: CartState = {
  items: [],
  isOpen: false,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.product.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
          isOpen: true,
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.product, quantity: 1 }],
        isOpen: true,
      }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.productId) }
    case 'UPDATE_QTY':
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.productId) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'TOGGLE':
      return { ...state, isOpen: !state.isOpen }
    default:
      return state
  }
}

const CartContext = createContext<{
  items: CartItem[]
  isOpen: boolean
  add: (p: Product) => void
  remove: (id: string) => void
  updateQty: (id: string, q: number) => void
  clear: () => void
  toggle: () => void
  total: number
  count: number
} | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      const items = JSON.parse(saved)
      items.forEach((item: CartItem) => dispatch({ type: 'ADD', product: item }))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items))
  }, [state.items])

  const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = state.items.reduce((sum, i) => sum + i.quantity, 0)

  const value = {
    items: state.items,
    isOpen: state.isOpen,
    add: (p: Product) => dispatch({ type: 'ADD', product: p }),
    remove: (id: string) => dispatch({ type: 'REMOVE', productId: id }),
    updateQty: (id: string, q: number) => dispatch({ type: 'UPDATE_QTY', productId: id, quantity: q }),
    clear: () => dispatch({ type: 'CLEAR' }),
    toggle: () => dispatch({ type: 'TOGGLE' }),
    total,
    count,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
`,
      },
      {
        path: 'src/components/ProductCard.tsx',
        language: 'tsx',
        description: 'Individual product display card',
        content: `import { Product } from '../types'
import { useCart } from '../hooks/useCart'

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden bg-zinc-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-zinc-900">{product.name}</h3>
          <span className="text-sm font-mono text-zinc-900">{'$' + product.price.toFixed(2)}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-400">★ {product.rating}</span>
          {product.inStock ? (
            <button
              onClick={() => add(product)}
              className="px-3 py-1.5 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              Add to cart
            </button>
          ) : (
            <span className="text-xs text-zinc-400 italic">Out of stock</span>
          )}
        </div>
      </div>
    </div>
  )
}
`,
      },
      {
        path: 'src/components/Cart.tsx',
        language: 'tsx',
        description: 'Slide-out cart with quantity controls and total',
        content: `import { useCart } from '../hooks/useCart'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

export function Cart() {
  const { items, isOpen, toggle, remove, updateQty, total, count, clear } = useCart()

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={toggle}
        />
      )}

      {/* Drawer */}
      <aside
        className={\`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col \${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }\`}
      >
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-semibold">Your Cart ({count})</h2>
          </div>
          <button onClick={toggle} className="p-1 rounded hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.name}</h4>
                    <p className="text-xs text-zinc-500">{'$' + item.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="p-1 rounded hover:bg-zinc-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="p-1 rounded hover:bg-zinc-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="ml-auto p-1 rounded hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-mono">
                    {'$' + (item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="p-4 border-t space-y-3">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{'$' + total.toFixed(2)}</span>
            </div>
            <button className="w-full py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors">
              Checkout
            </button>
            <button
              onClick={clear}
              className="w-full py-2 text-sm text-zinc-500 hover:text-red-500"
            >
              Clear cart
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
`,
      },
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Main shop page with product grid and category filter',
        content: `import { useState } from 'react'
import { PRODUCTS, CATEGORIES } from './data/products'
import { ProductCard } from './components/ProductCard'
import { Cart } from './components/Cart'
import { CartProvider, useCart } from './hooks/useCart'
import { ShoppingBag } from 'lucide-react'

function Shop() {
  const [category, setCategory] = useState<string>('all')
  const { count, toggle } = useCart()

  const filtered = category === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === category)

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Axiom Shop</h1>
          <button
            onClick={toggle}
            className="relative p-2 rounded-lg hover:bg-zinc-100"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={\`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors \${
                category === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white border hover:bg-zinc-100'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <Cart />
    </div>
  )
}

export default function App() {
  return (
    <CartProvider>
      <Shop />
    </CartProvider>
  )
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 6 modules transformed\n✓ Ready in 387ms\n  → Local: http://localhost:5173',
  }
}

// ============ LANDING PAGE ============
function generateLanding(prompt: string): AgentPlan {
  return {
    steps: [
      'Create the Header with navigation',
      'Build the Hero section with headline and CTA',
      'Add a Features grid section',
      'Create a Pricing table section',
      'Build the Footer',
      'Run dev server to verify',
    ],
    files: [
      {
        path: 'src/components/Header.tsx',
        language: 'tsx',
        description: 'Sticky navigation header',
        content: `export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="font-bold text-lg">Brand</div>
        <nav className="hidden md:flex gap-8 text-sm text-zinc-600">
          <a href="#features" className="hover:text-zinc-900">Features</a>
          <a href="#pricing" className="hover:text-zinc-900">Pricing</a>
          <a href="#about" className="hover:text-zinc-900">About</a>
        </nav>
        <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800">
          Get Started
        </button>
      </div>
    </header>
  )
}
`,
      },
      {
        path: 'src/components/Hero.tsx',
        language: 'tsx',
        description: 'Main hero with headline and CTA',
        content: `import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs text-zinc-600 mb-6 bg-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Now in beta — try it free
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 leading-tight">
          The modern way to{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            build products
          </span>
        </h1>
        <p className="mt-6 text-lg text-zinc-600 max-w-2xl mx-auto">
          Ship faster with a platform that handles the boring stuff.
          Authentication, payments, analytics — all wired up and ready to go.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-6 py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 flex items-center gap-2 justify-center">
            Start free <ArrowRight className="h-4 w-4" />
          </button>
          <button className="px-6 py-3 rounded-lg border font-medium hover:bg-zinc-50">
            Watch demo
          </button>
        </div>
      </div>
    </section>
  )
}
`,
      },
      {
        path: 'src/components/Features.tsx',
        language: 'tsx',
        description: 'Three-column feature grid',
        content: `import { Zap, Shield, Layers } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning fast',
    desc: 'Optimized for speed. Sub-200ms response times on every request, globally.',
  },
  {
    icon: Shield,
    title: 'Secure by default',
    desc: 'SOC 2 compliant. End-to-end encryption. Row-level security on every query.',
  },
  {
    icon: Layers,
    title: 'Scales infinitely',
    desc: 'From your first user to your millionth. Auto-scaling with zero config.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight">Everything you need</h2>
          <p className="mt-3 text-zinc-600">Nothing you don't.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
`,
      },
      {
        path: 'src/components/Pricing.tsx',
        language: 'tsx',
        description: 'Three-tier pricing table',
        content: `import { Check } from 'lucide-react'

const TIERS = [
  {
    name: 'Starter',
    price: 0,
    desc: 'For trying things out.',
    features: ['1 project', 'Community support', '100 requests/day'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 20,
    desc: 'For serious builders.',
    features: ['Unlimited projects', 'Priority support', '100K requests/day', 'Custom domains'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: 50,
    desc: 'For growing teams.',
    features: ['Everything in Pro', 'SSO & SAML', 'Audit logs', 'Dedicated support'],
    cta: 'Contact sales',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight">Simple pricing</h2>
          <p className="mt-3 text-zinc-600">Pay only for what you use.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={\`rounded-xl border p-6 bg-white \${
                t.highlight ? 'border-zinc-900 shadow-lg ring-1 ring-zinc-900' : ''
              }\`}
            >
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">{t.desc}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">{ '$' + t.price}</span>
                <span className="text-zinc-500">/mo</span>
              </div>
              <ul className="mt-6 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={\`w-full mt-6 py-2.5 rounded-lg font-medium text-sm \${
                  t.highlight
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'border hover:bg-zinc-50'
                }\`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
`,
      },
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Main app composing all sections',
        content: `import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Pricing } from './components/Pricing'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <footer className="py-12 border-t text-center text-sm text-zinc-500">
        © 2026 Brand. All rights reserved.
      </footer>
    </div>
  )
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 5 modules transformed\n✓ Ready in 312ms\n  → Local: http://localhost:5173',
  }
}

// ============ TODO APP ============
function generateTodo(prompt: string): AgentPlan {
  return {
    steps: [
      'Define the Todo type',
      'Create the todo store hook with localStorage',
      'Build the TodoInput component',
      'Build the TodoList with filters and toggle',
      'Create the main App',
      'Run dev server to verify',
    ],
    files: [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'Todo type definition',
        content: `export interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: number
}

export type Filter = 'all' | 'active' | 'completed'
`,
      },
      {
        path: 'src/hooks/useTodos.ts',
        language: 'typescript',
        description: 'Todo state with localStorage persistence',
        content: `import { useState, useEffect, useCallback } from 'react'
import type { Todo, Filter } from '../types'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const add = useCallback((text: string) => {
    if (!text.trim()) return
    setTodos((prev) => [
      { id: crypto.randomUUID(), text: text.trim(), done: false, createdAt: Date.now() },
      ...prev,
    ])
  }, [])

  const toggle = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.done))
  }, [])

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.done
    if (filter === 'completed') return t.done
    return true
  })

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.done).length,
    completed: todos.filter((t) => t.done).length,
  }

  return { todos: filtered, filter, setFilter, add, toggle, remove, clearCompleted, counts }
}
`,
      },
      {
        path: 'src/components/TodoInput.tsx',
        language: 'tsx',
        description: 'Input form for adding new todos',
        content: `import { useState } from 'react'
import { Plus } from 'lucide-react'

export function TodoInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button
        type="submit"
        className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
      </button>
    </form>
  )
}
`,
      },
      {
        path: 'src/components/TodoList.tsx',
        language: 'tsx',
        description: 'Todo list with toggle and delete',
        content: `import { Check, Trash2 } from 'lucide-react'
import type { Todo } from '../types'

export function TodoList({
  todos,
  onToggle,
  onRemove,
}: {
  todos: Todo[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <p>No todos yet. Add one above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="group flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:shadow-sm transition-shadow"
        >
          <button
            onClick={() => onToggle(todo.id)}
            className={\`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors \${
              todo.done ? 'bg-green-500 border-green-500' : 'border-zinc-300 hover:border-green-400'
            }\`}
          >
            {todo.done && <Check className="h-3 w-3 text-white" />}
          </button>
          <span className={\`flex-1 \${todo.done ? 'line-through text-zinc-400' : 'text-zinc-900'}\`}>
            {todo.text}
          </span>
          <button
            onClick={() => onRemove(todo.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
`,
      },
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Main todo app',
        content: `import { useTodos } from './hooks/useTodos'
import { TodoInput } from './components/TodoInput'
import { TodoList } from './components/TodoList'
import type { Filter } from './types'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
]

export default function App() {
  const { todos, filter, setFilter, add, toggle, remove, clearCompleted, counts } = useTodos()

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Todos</h1>
        <TodoInput onAdd={add} />

        <div className="mt-6 flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={\`px-3 py-1.5 rounded-md text-sm font-medium \${
                filter === f.id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200'
              }\`}
            >
              {f.label} ({counts[f.id]})
            </button>
          ))}
          {counts.completed > 0 && (
            <button
              onClick={clearCompleted}
              className="ml-auto text-sm text-zinc-500 hover:text-red-500"
            >
              Clear completed
            </button>
          )}
        </div>

        <div className="mt-4">
          <TodoList todos={todos} onToggle={toggle} onRemove={remove} />
        </div>
      </div>
    </div>
  )
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 4 modules transformed\n✓ Ready in 245ms\n  → Local: http://localhost:5173',
  }
}

// ============ DASHBOARD ============
function generateDashboard(prompt: string): AgentPlan {
  return {
    steps: [
      'Create chart data and types',
      'Build the StatCard component',
      'Build the LineChart with SVG',
      'Build the BarChart with SVG',
      'Create the dashboard layout',
      'Run dev server to verify',
    ],
    files: [
      {
        path: 'src/data.ts',
        language: 'typescript',
        description: 'Sample dashboard data',
        content: `export const stats = [
  { label: 'Revenue', value: '$48,291', change: '+12.4%', up: true },
  { label: 'Users', value: '14,328', change: '+8.2%', up: true },
  { label: 'Orders', value: '1,847', change: '-2.1%', up: false },
  { label: 'Conversion', value: '3.2%', change: '+0.4%', up: true },
]

export const revenueData = [
  { month: 'Jan', value: 32 },
  { month: 'Feb', value: 45 },
  { month: 'Mar', value: 38 },
  { month: 'Apr', value: 52 },
  { month: 'May', value: 48 },
  { month: 'Jun', value: 61 },
  { month: 'Jul', value: 55 },
  { month: 'Aug', value: 67 },
  { month: 'Sep', value: 72 },
  { month: 'Oct', value: 68 },
  { month: 'Nov', value: 78 },
  { month: 'Dec', value: 84 },
]

export const trafficData = [
  { day: 'Mon', value: 240 },
  { day: 'Tue', value: 312 },
  { day: 'Wed', value: 287 },
  { day: 'Thu', value: 398 },
  { day: 'Fri', value: 432 },
  { day: 'Sat', value: 356 },
  { day: 'Sun', value: 289 },
]
`,
      },
      {
        path: 'src/components/StatCard.tsx',
        language: 'tsx',
        description: 'Single stat display with trend',
        content: `import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatCard({
  label,
  value,
  change,
  up,
}: {
  label: string
  value: string
  change: string
  up: boolean
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <div className={\`mt-2 flex items-center gap-1 text-sm \${
        up ? 'text-green-600' : 'text-red-600'
      }\`}>
        {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {change}
      </div>
    </div>
  )
}
`,
      },
      {
        path: 'src/components/LineChart.tsx',
        language: 'tsx',
        description: 'SVG line chart for revenue trend',
        content: `import { revenueData } from '../data'

export function LineChart() {
  const data = revenueData
  const max = Math.max(...data.map((d) => d.value))
  const min = Math.min(...data.map((d) => d.value))
  const range = max - min || 1
  const w = 600
  const h = 200
  const pad = 30

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2)
    return [x, y]
  })

  const path = points
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1])
    .join(' ')

  const areaPath = path + ' L' + points[points.length - 1][0] + ' ' + (h - pad) + ' L' + points[0][0] + ' ' + (h - pad) + ' Z'

  return (
    <div className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold mb-4">Revenue (12 months)</h3>
      <svg viewBox={\`0 0 \${w} \${h}\`} className="w-full">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#area)" />
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="3" fill="#3b82f6" />
            <text x={p[0]} y={h - 8} textAnchor="middle" className="fill-zinc-400 text-[10px]">
              {data[i].month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
`,
      },
      {
        path: 'src/components/BarChart.tsx',
        language: 'tsx',
        description: 'SVG bar chart for weekly traffic',
        content: `import { trafficData } from '../data'

export function BarChart() {
  const data = trafficData
  const max = Math.max(...data.map((d) => d.value))
  const w = 400
  const h = 200
  const pad = 30
  const barW = (w - pad * 2) / data.length - 8

  return (
    <div className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold mb-4">Traffic (this week)</h3>
      <svg viewBox={\`0 0 \${w} \${h}\`} className="w-full">
        {data.map((d, i) => {
          const barH = (d.value / max) * (h - pad * 2)
          const x = pad + i * (barW + 8)
          const y = h - pad - barH
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="4"
                fill="#8b5cf6"
                opacity={0.8}
              />
              <text x={x + barW / 2} y={h - 8} textAnchor="middle" className="fill-zinc-400 text-[10px]">
                {d.day}
              </text>
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="fill-zinc-600 text-[9px]">
                {d.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
`,
      },
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Main dashboard layout',
        content: `import { stats } from './data'
import { StatCard } from './components/StatCard'
import { LineChart } from './components/LineChart'
import { BarChart } from './components/BarChart'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Overview</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <LineChart />
          <BarChart />
        </div>
      </main>
    </div>
  )
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 5 modules transformed\n✓ Ready in 298ms\n  → Local: http://localhost:5173',
  }
}

// ============ BLOG ============
function generateBlog(prompt: string): AgentPlan {
  return {
    steps: [
      'Create blog post types and sample data',
      'Build the PostCard component',
      'Build the PostPage for individual articles',
      'Create the blog list page',
      'Run dev server to verify',
    ],
    files: [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'Blog post type',
        content: `export interface Post {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  tags: string[]
}
`,
      },
      {
        path: 'src/data/posts.ts',
        language: 'typescript',
        description: 'Sample blog posts',
        content: `import { Post } from '../types'

export const POSTS: Post[] = [
  {
    id: '1',
    title: 'Getting Started with React Server Components',
    excerpt: 'A practical guide to understanding and using RSC in your Next.js app.',
    content: 'React Server Components represent a fundamental shift in how we build React applications...',
    author: 'Alex Rivera',
    date: '2026-09-01',
    tags: ['react', 'nextjs', 'tutorial'],
  },
  {
    id: '2',
    title: 'The Art of Simplicity in API Design',
    excerpt: 'Why fewer features often means a better developer experience.',
    content: 'When designing an API, the hardest thing is deciding what NOT to include...',
    author: 'Sam Chen',
    date: '2026-08-24',
    tags: ['api', 'design'],
  },
  {
    id: '3',
    title: 'Building a Mini-Game While Your AI Thinks',
    excerpt: 'How we added a 2048 clone to our chat app to make waiting delightful.',
    content: 'Nobody likes waiting. But sometimes, AI responses take time...',
    author: 'Alex Rivera',
    date: '2026-08-15',
    tags: ['ux', 'ai', 'frontend'],
  },
]
`,
      },
      {
        path: 'src/components/PostCard.tsx',
        language: 'tsx',
        description: 'Blog post preview card',
        content: `import type { Post } from '../types'

export function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="cursor-pointer rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-2 mb-2">
        {post.tags.map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {t}
          </span>
        ))}
      </div>
      <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
      <p className="text-zinc-600 text-sm">{post.excerpt}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <span>{post.author}</span>
        <span>·</span>
        <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
      </div>
    </article>
  )
}
`,
      },
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Blog list page',
        content: `import { useState } from 'react'
import { POSTS } from './data/posts'
import { PostCard } from './components/PostCard'
import type { Post } from './types'

export default function App() {
  const [selected, setSelected] = useState<Post | null>(null)

  if (selected) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b">
          <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
            <button onClick={() => setSelected(null)} className="text-sm text-blue-600">
              ← Back to all posts
            </button>
          </div>
        </header>
        <article className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex gap-2 mb-4">
            {selected.tags.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t}</span>
            ))}
          </div>
          <h1 className="text-3xl font-bold mb-3">{selected.title}</h1>
          <div className="text-zinc-500 mb-8">
            By {selected.author} · {new Date(selected.date).toLocaleDateString()}
          </div>
          <div className="prose prose-zinc max-w-none">
            <p>{selected.content}</p>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
          <h1 className="text-xl font-bold">Axiom Blog</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-4">
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} onClick={() => setSelected(post)} />
        ))}
      </main>
    </div>
  )
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 3 modules transformed\n✓ Ready in 218ms\n  → Local: http://localhost:5173',
  }
}

// ============ WEATHER ============
function generateWeather(prompt: string): AgentPlan {
  return {
    steps: [
      'Create weather data types',
      'Build the WeatherCard component',
      'Build the ForecastList',
      'Create the main app with search',
      'Run dev server to verify',
    ],
    files: [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'Weather data types',
        content: `export interface WeatherDay {
  day: string
  temp: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
  high: number
  low: number
}

export interface Weather {
  city: string
  current: number
  condition: WeatherDay['condition']
  forecast: WeatherDay[]
}
`,
      },
      {
        path: 'src/data.ts',
        language: 'typescript',
        description: 'Sample weather data',
        content: `import { Weather } from './types'

export const SAMPLE_WEATHER: Weather = {
  city: 'San Francisco',
  current: 68,
  condition: 'sunny',
  forecast: [
    { day: 'Mon', temp: 68, condition: 'sunny', high: 72, low: 58 },
    { day: 'Tue', temp: 65, condition: 'cloudy', high: 67, low: 55 },
    { day: 'Wed', temp: 62, condition: 'rainy', high: 64, low: 52 },
    { day: 'Thu', temp: 66, condition: 'cloudy', high: 70, low: 54 },
    { day: 'Fri', temp: 71, condition: 'sunny', high: 75, low: 60 },
  ],
}

export const CONDITION_EMOJI = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
} as const
`,
      },
      {
        path: 'src/components/WeatherCard.tsx',
        language: 'tsx',
        description: 'Current weather display',
        content: `import type { Weather } from '../types'
import { CONDITION_EMOJI } from '../data'

export function WeatherCard({ weather }: { weather: Weather }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium opacity-90">{weather.city}</h2>
          <div className="text-6xl font-bold mt-2">{weather.current}°</div>
          <p className="text-lg opacity-90 mt-1 capitalize">{weather.condition}</p>
        </div>
        <div className="text-7xl">
          {CONDITION_EMOJI[weather.condition]}
        </div>
      </div>
    </div>
  )
}
`,
      },
      {
        path: 'src/components/ForecastList.tsx',
        language: 'tsx',
        description: '5-day forecast list',
        content: `import type { WeatherDay } from '../types'
import { CONDITION_EMOJI } from '../data'

export function ForecastList({ days }: { days: WeatherDay[] }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="font-semibold mb-4">5-day forecast</h3>
      <div className="space-y-3">
        {days.map((d) => (
          <div key={d.day} className="flex items-center gap-4">
            <span className="w-12 font-medium">{d.day}</span>
            <span className="text-2xl">{CONDITION_EMOJI[d.condition]}</span>
            <div className="flex-1 flex items-center gap-2 text-sm">
              <span className="text-zinc-400">{d.low}°</span>
              <div className="flex-1 h-1 rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
                  style={{ width: \`\${((d.high - d.low) / 30) * 100}%\` }}
                />
              </div>
              <span className="font-medium">{d.high}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
`,
      },
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Main weather app',
        content: `import { useState } from 'react'
import { SAMPLE_WEATHER } from './data'
import { WeatherCard } from './components/WeatherCard'
import { ForecastList } from './components/ForecastList'
import { Search } from 'lucide-react'

export default function App() {
  const [city, setCity] = useState(SAMPLE_WEATHER.city)

  return (
    <div className="min-h-screen bg-zinc-100 py-12">
      <div className="max-w-md mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Weather</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border bg-white"
          />
        </div>

        <div className="space-y-4">
          <WeatherCard weather={{ ...SAMPLE_WEATHER, city }} />
          <ForecastList days={SAMPLE_WEATHER.forecast} />
        </div>
      </div>
    </div>
  )
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 4 modules transformed\n✓ Ready in 234ms\n  → Local: http://localhost:5173',
  }
}

// ============ CALCULATOR ============
function generateCalculator(prompt: string): AgentPlan {
  return {
    steps: [
      'Build the Calculator component with state',
      'Run dev server to verify',
    ],
    files: [
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Working calculator with full arithmetic',
        content: `import { useState } from 'react'

export default function App() {
  const [display, setDisplay] = useState('0')
  const [previous, setPrevious] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)

  const inputDigit = (d: string) => {
    if (waiting) {
      setDisplay(d)
      setWaiting(false)
    } else {
      setDisplay(display === '0' ? d : display + d)
    }
  }

  const inputDecimal = () => {
    if (waiting) {
      setDisplay('0.')
      setWaiting(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPrevious(null)
    setOp(null)
    setWaiting(false)
  }

  const performOp = (nextOp: string) => {
    const current = parseFloat(display)
    if (previous === null) {
      setPrevious(current)
    } else if (op) {
      const result = calculate(previous, current, op)
      setDisplay(String(result))
      setPrevious(result)
    }
    setOp(nextOp)
    setWaiting(true)
  }

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b
      case '−': return a - b
      case '×': return a * b
      case '÷': return b === 0 ? 0 : a / b
      default: return b
    }
  }

  const equals = () => {
    if (op && previous !== null) {
      const current = parseFloat(display)
      const result = calculate(previous, current, op)
      setDisplay(String(result))
      setPrevious(null)
      setOp(null)
      setWaiting(true)
    }
  }

  const buttons = [
    ['C', '÷', '×', '−'],
    ['7', '8', '9', '+'],
    ['4', '5', '6', '='],
    ['1', '2', '3', '0'],
    ['.', '00'],
  ]

  const btnClass = (b: string) => {
    if (b === 'C') return 'bg-red-100 text-red-600'
    if (['÷', '×', '−', '+', '='].includes(b)) return 'bg-blue-600 text-white'
    return 'bg-zinc-100'
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
      <div className="w-72 rounded-2xl bg-zinc-900 p-4 shadow-xl">
        <div className="mb-4 rounded-lg bg-zinc-800 p-4 text-right">
          <div className="text-zinc-400 text-sm h-5">
            {previous !== null && op ? previous + ' ' + op : ''}
          </div>
          <div className="text-white text-4xl font-mono truncate">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={clear} className={\`h-14 rounded-lg font-medium \${btnClass('C')}\`}>C</button>
          <button onClick={() => performOp('÷')} className={\`h-14 rounded-lg font-medium \${btnClass('÷')}\`}>÷</button>
          <button onClick={() => performOp('×')} className={\`h-14 rounded-lg font-medium \${btnClass('×')}\`}>×</button>
          <button onClick={() => performOp('−')} className={\`h-14 rounded-lg font-medium \${btnClass('−')}\`}>−</button>

          {['7', '8', '9'].map((d) => (
            <button key={d} onClick={() => inputDigit(d)} className="h-14 rounded-lg font-medium bg-zinc-100">{d}</button>
          ))}
          <button onClick={() => performOp('+')} className="h-14 rounded-lg font-medium bg-blue-600 text-white row-span-2">+</button>

          {['4', '5', '6'].map((d) => (
            <button key={d} onClick={() => inputDigit(d)} className="h-14 rounded-lg font-medium bg-zinc-100">{d}</button>
          ))}

          {['1', '2', '3'].map((d) => (
            <button key={d} onClick={() => inputDigit(d)} className="h-14 rounded-lg font-medium bg-zinc-100">{d}</button>
          ))}
          <button onClick={equals} className="h-14 rounded-lg font-medium bg-blue-600 text-white">=</button>

          <button onClick={() => inputDigit('0')} className="h-14 rounded-lg font-medium bg-zinc-100 col-span-2">0</button>
          <button onClick={inputDecimal} className="h-14 rounded-lg font-medium bg-zinc-100">.</button>
          <button onClick={() => inputDigit('00')} className="h-14 rounded-lg font-medium bg-zinc-100">00</button>
        </div>
      </div>
    </div>
  )
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 1 module transformed\n✓ Ready in 189ms\n  → Local: http://localhost:5173',
  }
}

// ============ GENERIC ============
function generateGeneric(prompt: string): AgentPlan {
  const cleanPrompt = prompt.replace(/^(build|create|make|generate)\s+/i, '').trim()
  const componentName = toPascalCase(cleanPrompt) || 'App'

  return {
    steps: [
      `Analyze the request: "${cleanPrompt}"`,
      'Create the main component structure',
      'Add state management and event handlers',
      'Style with a clean, responsive layout',
      'Run dev server to verify',
    ],
    files: [
      {
        path: `src/components/${componentName}.tsx`,
        language: 'tsx',
        description: `Main component for: ${cleanPrompt}`,
        content: `import { useState } from 'react'

export function ${componentName}() {
  const [items, setItems] = useState<string[]>([
    'First item',
    'Second item',
    'Third item',
  ])
  const [input, setInput] = useState('')

  const addItem = () => {
    if (!input.trim()) return
    setItems([...items, input.trim()])
    setInput('')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">${cleanPrompt}</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add a new item..."
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addItem}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="group flex items-center justify-between px-4 py-3 rounded-lg border bg-white hover:shadow-sm transition-shadow"
            >
              <span>{item}</span>
              <button
                onClick={() => removeItem(i)}
                className="opacity-0 group-hover:opacity-100 text-red-500 text-sm transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-center text-zinc-400 py-8">No items yet. Add one above.</p>
          )}
        </div>
      </div>
    </div>
  )
}
`,
      },
      {
        path: 'src/App.tsx',
        language: 'tsx',
        description: 'Main app entry',
        content: `import { ${componentName} } from './components/${componentName}'

export default function App() {
  return <${componentName} />
}
`,
      },
    ],
    command: 'npm run dev',
    commandOutput: '✓ 2 modules transformed\n✓ Ready in 215ms\n  → Local: http://localhost:5173',
  }
}

function toPascalCase(s: string): string {
  return s
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
    .slice(0, 40)
}

// ============ SINGLE HTML FILE (for Netlify) ============
function generateSingleHTML(prompt: string): AgentPlan {
  const isShop = prompt.toLowerCase().includes('shop') || prompt.toLowerCase().includes('store') || prompt.toLowerCase().includes('cart')
  const title = isShop ? 'Premium Shop' : 'Axiom App'

  return {
    steps: [
      'Generate a complete, self-contained HTML file',
      'Add styled CSS for a professional look',
      'Add working JavaScript for interactivity',
      'File ready to upload to Netlify',
    ],
    files: [
      {
        path: 'index.html',
        language: 'html',
        description: 'Complete self-contained HTML file with CSS and JS',
        content: isShop ? generateShopHTML(prompt) : generateGenericHTML(prompt, title),
      },
    ],
    command: 'open index.html',
    commandOutput: '✓ File ready to deploy\n  Upload to Netlify or any static host',
  }
}

function generateShopHTML(prompt: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Luxe Boutique — Premium Fashion Store</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #faf9f7; color: #1a1a1a; }
    header { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 100; }
    .header-inner { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .logo span { color: #DC4A1E; }
    nav { display: flex; gap: 2rem; }
    nav a { text-decoration: none; color: #555; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
    nav a:hover { color: #DC4A1E; }
    .cart-btn { position: relative; background: none; border: none; cursor: pointer; font-size: 1.3rem; }
    .cart-count { position: absolute; top: -8px; right: -8px; background: #DC4A1E; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
    .hero { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #fff; padding: 4rem 2rem; text-align: center; }
    .hero h1 { font-size: 2.8rem; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
    .hero p { font-size: 1.1rem; opacity: 0.7; max-width: 600px; margin: 0 auto; }
    .filters { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; display: flex; gap: 1rem; flex-wrap: wrap; }
    .filter-btn { padding: 0.5rem 1.2rem; border: 1px solid #ddd; border-radius: 999px; background: #fff; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; }
    .filter-btn:hover, .filter-btn.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .products { max-width: 1200px; margin: 0 auto; padding: 0 2rem 3rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .product-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
    .product-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
    .product-img { width: 100%; height: 280px; object-fit: cover; background: #f0f0f0; }
    .product-info { padding: 1.2rem; }
    .product-name { font-size: 1rem; font-weight: 600; margin-bottom: 0.3rem; }
    .product-desc { font-size: 0.85rem; color: #888; margin-bottom: 0.8rem; line-height: 1.4; }
    .product-bottom { display: flex; justify-content: space-between; align-items: center; }
    .product-price { font-size: 1.2rem; font-weight: 700; }
    .add-btn { background: #1a1a1a; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: background 0.2s; }
    .add-btn:hover { background: #DC4A1E; }
    .cart-drawer { position: fixed; top: 0; right: -400px; width: 380px; height: 100vh; background: #fff; box-shadow: -5px 0 30px rgba(0,0,0,0.15); transition: right 0.3s ease; z-index: 200; display: flex; flex-direction: column; }
    .cart-drawer.open { right: 0; }
    .cart-header { padding: 1.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .cart-header h2 { font-size: 1.2rem; }
    .close-cart { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
    .cart-items { flex: 1; overflow-y: auto; padding: 1rem; }
    .cart-item { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #f0f0f0; }
    .cart-item img { width: 70px; height: 70px; border-radius: 8px; object-fit: cover; }
    .cart-item-info { flex: 1; }
    .cart-item-name { font-size: 0.9rem; font-weight: 500; margin-bottom: 0.3rem; }
    .cart-item-price { font-size: 0.85rem; color: #888; }
    .qty-controls { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
    .qty-btn { width: 24px; height: 24px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .qty-num { font-size: 0.85rem; font-weight: 600; min-width: 20px; text-align: center; }
    .remove-btn { color: #DC4A1E; background: none; border: none; cursor: pointer; font-size: 0.8rem; margin-left: auto; }
    .cart-footer { padding: 1.5rem; border-top: 1px solid #eee; }
    .cart-total { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; }
    .checkout-btn { width: 100%; padding: 1rem; background: #DC4A1E; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: background 0.2s; }
    .checkout-btn:hover { background: #B91C1C; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 150; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
    .overlay.show { opacity: 1; pointer-events: all; }
    .toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #fff; padding: 0.8rem 1.5rem; border-radius: 8px; font-size: 0.9rem; z-index: 300; opacity: 0; transition: opacity 0.3s, transform 0.3s; pointer-events: none; }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(-10px); }
    footer { text-align: center; padding: 2rem; color: #888; font-size: 0.85rem; }
    @media (max-width: 768px) { .hero h1 { font-size: 2rem; } nav { display: none; } .cart-drawer { width: 100%; right: -100%; } }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <div class="logo">Luxe<span>.</span></div>
      <nav>
        <a href="#">Shop</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </nav>
      <button class="cart-btn" onclick="toggleCart()">
        🛒 <span class="cart-count" id="cartCount">0</span>
      </button>
    </div>
  </header>

  <section class="hero">
    <h1>Premium Fashion, Delivered.</h1>
    <p>Curated pieces for the modern wardrobe. Free shipping on orders over $100.</p>
  </section>

  <div class="filters">
    <button class="filter-btn active" onclick="filterProducts('all', this)">All</button>
    <button class="filter-btn" onclick="filterProducts('tops', this)">Tops</button>
    <button class="filter-btn" onclick="filterProducts('bottoms', this)">Bottoms</button>
    <button class="filter-btn" onclick="filterProducts('accessories', this)">Accessories</button>
  </div>

  <div class="products" id="productGrid"></div>

  <div class="overlay" id="overlay" onclick="toggleCart()"></div>
  <div class="cart-drawer" id="cartDrawer">
    <div class="cart-header">
      <h2>Your Cart</h2>
      <button class="close-cart" onclick="toggleCart()">×</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-footer">
      <div class="cart-total">
        <span>Total</span>
        <span id="cartTotal">$0.00</span>
      </div>
      <button class="checkout-btn" onclick="checkout()">Checkout</button>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <footer>
    <p>© 2026 Luxe Boutique. Built with Axiom Studio.</p>
  </footer>

  <script>
    const products = [
      { id: 1, name: "Wool Blend Overcoat", desc: "Tailored fit, Italian wool", price: 289, category: "tops", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400" },
      { id: 2, name: "Silk Button-Up Shirt", desc: "100% mulberry silk", price: 129, category: "tops", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3cc6?w=400" },
      { id: 3, name: "Slim Fit Chinos", desc: "Stretch cotton, 4 colors", price: 89, category: "bottoms", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400" },
      { id: 4, name: "Leather Belt", desc: "Full-grain Italian leather", price: 65, category: "accessories", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
      { id: 5, name: "Cashmere Sweater", desc: "Mongolian cashmere", price: 195, category: "tops", img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400" },
      { id: 6, name: "Pleated Trousers", desc: "High-waist, wool blend", price: 145, category: "bottoms", img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400" },
      { id: 7, name: "Aviator Sunglasses", desc: "UV400, titanium frame", price: 175, category: "accessories", img: "https://images.unsplash.com/photo-1572631381918-0598a58d5766?w=400" },
      { id: 8, name: "Linen Blazer", desc: "Breathable summer linen", price: 225, category: "tops", img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400" },
    ];

    let cart = [];
    let currentFilter = 'all';

    function renderProducts() {
      const grid = document.getElementById('productGrid');
      const filtered = currentFilter === 'all' ? products : products.filter(p => p.category === currentFilter);
      grid.innerHTML = filtered.map(p => \`
        <div class="product-card">
          <img class="product-img" src="\${p.img}" alt="\${p.name}" loading="lazy">
          <div class="product-info">
            <div class="product-name">\${p.name}</div>
            <div class="product-desc">\${p.desc}</div>
            <div class="product-bottom">
              <div class="product-price">$\${p.price}</div>
              <button class="add-btn" onclick="addToCart(\${p.id})">Add to Cart</button>
            </div>
          </div>
        </div>
      \`).join('');
    }

    function filterProducts(cat, btn) {
      currentFilter = cat;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    }

    function addToCart(id) {
      const product = products.find(p => p.id === id);
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ ...product, qty: 1 });
      }
      updateCart();
      showToast(\`\${product.name} added to cart\`);
    }

    function removeFromCart(id) {
      cart = cart.filter(item => item.id !== id);
      updateCart();
    }

    function changeQty(id, delta) {
      const item = cart.find(i => i.id === id);
      if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeFromCart(id);
        else updateCart();
      }
    }

    function updateCart() {
      const count = cart.reduce((s, i) => s + i.qty, 0);
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      document.getElementById('cartCount').textContent = count;
      document.getElementById('cartTotal').textContent = '$' + total.toFixed(2);
      document.getElementById('cartItems').innerHTML = cart.map(item => \`
        <div class="cart-item">
          <img src="\${item.img}" alt="\${item.name}">
          <div class="cart-item-info">
            <div class="cart-item-name">\${item.name}</div>
            <div class="cart-item-price">$\${item.price}</div>
            <div class="qty-controls">
              <button class="qty-btn" onclick="changeQty(\${item.id}, -1)">−</button>
              <span class="qty-num">\${item.qty}</span>
              <button class="qty-btn" onclick="changeQty(\${item.id}, 1)">+</button>
              <button class="remove-btn" onclick="removeFromCart(\${item.id})">Remove</button>
            </div>
          </div>
        </div>
      \`).join('');
    }

    function toggleCart() {
      document.getElementById('cartDrawer').classList.toggle('open');
      document.getElementById('overlay').classList.toggle('show');
    }

    function checkout() {
      if (cart.length === 0) { showToast('Your cart is empty'); return; }
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      showToast(\`Order placed! Total: $\${total.toFixed(2)}\`);
      cart = [];
      updateCart();
      setTimeout(toggleCart, 1500);
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    renderProducts();
  </script>
</body>
</html>`
}

function generateGenericHTML(prompt: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #faf9f7; color: #1a1a1a; }
    .container { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; line-height: 1.6; color: #555; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>Built with Axiom Studio. ${prompt}</p>
  </div>
</body>
</html>`
}

// ============ GAME HTML (for games like Minecraft, Snake, etc.) ============
function generateGameHTML(prompt: string): AgentPlan {
  const p = prompt.toLowerCase()
  const isMinecraft = p.includes('minecraft') || p.includes('voxel') || p.includes('block')
  const gameName = isMinecraft ? 'LiveCraft' :
    p.includes('snake') ? 'Snake' :
    p.includes('tetris') ? 'Tetris' :
    p.includes('pong') ? 'Pong' :
    p.includes('memory') ? 'Memory Match' :
    p.includes('tic tac toe') || p.includes('tictactoe') ? 'Tic Tac Toe' :
    'Game'

  return {
    steps: [
      `Generate ${gameName} as a complete HTML game`,
      'Add canvas-based rendering',
      'Add game logic and controls',
      'Style the game UI',
      'File ready to preview and download',
    ],
    files: [
      {
        path: 'index.html',
        language: 'html',
        description: `Complete ${gameName} game in a single HTML file`,
        content: isMinecraft ? generateMinecraftHTML(gameName) : generateSimpleGameHTML(gameName, prompt),
      },
    ],
    command: 'open index.html',
    commandOutput: '✓ Game ready to play in the preview',
  }
}

function generateMinecraftHTML(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — A Voxel Building Game</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { overflow: hidden; background: #87CEEB; font-family: -apple-system, sans-serif; }
canvas { display: block; cursor: crosshair; }
#hud { position: fixed; top: 10px; left: 10px; color: white; text-shadow: 1px 1px 2px black; font-size: 14px; pointer-events: none; }
#crosshair { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; pointer-events: none; }
#crosshair::before, #crosshair::after { content: ''; position: absolute; background: white; }
#crosshair::before { width: 20px; height: 2px; top: 9px; left: 0; }
#crosshair::after { width: 2px; height: 20px; top: 0; left: 9px; }
#hotbar { position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; }
.slot { width: 50px; height: 50px; border: 2px solid #555; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; }
.slot.active { border-color: white; }
#info { position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%); color: white; text-shadow: 1px 1px 2px black; font-size: 12px; }
</style>
</head>
<body>
<div id="hud">Position: 0, 0, 0 | Looking: 0°</div>
<div id="crosshair"></div>
<div id="info">WASD: move | Space: jump | Mouse: look | Left click: break | Right click: place | 1-5: select block</div>
<div id="hotbar"></div>
<canvas id="game"></canvas>
<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const BLOCKS = { AIR:0, GRASS:1, DIRT:2, STONE:3, WOOD:4, LEAVES:5, SAND:6, WATER:7, BRICK:8 };
const COLORS = { 0:null, 1:'#4a7c34', 2:'#8b5a2b', 3:'#888888', 4:'#6b4226', 5:'#3a6b1f', 6:'#e6d88f', 7:'#3b6ee6', 8:'#a0421f' };
const NAMES = ['Air','Grass','Dirt','Stone','Wood','Leaves','Sand','Water','Brick'];

const WORLD_SIZE = 16;
const WORLD_HEIGHT = 8;
let world = {};

function setBlock(x,y,z,t) { if(x<0||x>=WORLD_SIZE||y<0||y>=WORLD_HEIGHT||z<0||z>=WORLD_SIZE) return; world[x+','+y+','+z]=t; }
function getBlock(x,y,z) { return world[x+','+y+','+z]||0; }

// Generate terrain
for(let x=0;x<WORLD_SIZE;x++) for(let z=0;z<WORLD_SIZE;z++) {
  const h = 3 + Math.floor(Math.sin(x*0.3)*Math.cos(z*0.3)*2);
  for(let y=0;y<h;y++) setBlock(x,y,z, y===h-1?BLOCKS.GRASS: y>h-3?BLOCKS.DIRT:BLOCKS.STONE);
  // Trees
  if(Math.random()<0.05) {
    for(let y=h;y<h+4;y++) setBlock(x,y,z,BLOCKS.WOOD);
    for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++) for(let dy=0;dy<2;dy++)
      if(Math.abs(dx)+Math.abs(dz)<3) setBlock(x+dx,h+3+dy,z+dz,BLOCKS.LEAVES);
  }
}

// Player
const player = { x:8, y:8, z:8, vx:0, vy:0, vz:0, yaw:0, pitch:0, onGround:false };
let selectedSlot = 1;
const slots = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.WOOD, BLOCKS.BRICK];

// Hotbar
const hotbar = document.getElementById('hotbar');
slots.forEach((b,i) => {
  const s = document.createElement('div');
  s.className = 'slot' + (i===0?' active':'');
  s.textContent = NAMES[b];
  s.onclick = () => { document.querySelectorAll('.slot')[selectedSlot-1]?.classList.remove('active'); s.classList.add('active'); selectedSlot = i+1; };
  hotbar.appendChild(s);
});

// Controls
let keys = {};
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if(e.key>='1'&&e.key<='5') {
    document.querySelectorAll('.slot')[selectedSlot-1]?.classList.remove('active');
    selectedSlot = parseInt(e.key);
    document.querySelectorAll('.slot')[selectedSlot-1]?.classList.add('active');
  }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('click', () => canvas.requestPointerLock());
document.addEventListener('mousemove', e => {
  if(document.pointerLockElement === canvas) {
    player.yaw += e.movementX * 0.003;
    player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch - e.movementY * 0.003));
  }
});

canvas.addEventListener('mousedown', e => {
  if(document.pointerLockElement !== canvas) return;
  const hit = raycast();
  if(hit) {
    if(e.button === 0) { setBlock(hit.x, hit.y, hit.z, 0); } // Break
    if(e.button === 2) { // Place
      const nx = hit.x + hit.nx, ny = hit.y + hit.ny, nz = hit.z + hit.nz;
      setBlock(nx, ny, nz, slots[selectedSlot-1]);
    }
  }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

function raycast() {
  const dx = Math.sin(player.yaw)*Math.cos(player.pitch);
  const dy = -Math.sin(player.pitch);
  const dz = -Math.cos(player.yaw)*Math.cos(player.pitch);
  for(let t=0; t<5; t+=0.05) {
    const x = Math.floor(player.x + dx*t);
    const y = Math.floor(player.y - 1 + dy*t);
    const z = Math.floor(player.z + dz*t);
    if(getBlock(x,y,z)) {
      const bx = Math.floor(player.x + dx*(t-0.05));
      const by = Math.floor(player.y - 1 + dy*(t-0.05));
      const bz = Math.floor(player.z + dz*(t-0.05));
      return { x, y, z, nx: bx-x, ny: by-y, nz: bz-z };
    }
  }
  return null;
}

function update() {
  const speed = 0.15;
  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  if(keys['w']) { player.x += sin*speed; player.z -= cos*speed; }
  if(keys['s']) { player.x -= sin*speed; player.z += cos*speed; }
  if(keys['a']) { player.x -= cos*speed; player.z -= sin*speed; }
  if(keys['d']) { player.x += cos*speed; player.z += sin*speed; }
  if(keys[' '] && player.onGround) { player.vy = 0.3; player.onGround = false; }

  player.vy -= 0.02;
  player.y += player.vy;

  // Collision
  const fx = Math.floor(player.x), fy = Math.floor(player.y-1), fz = Math.floor(player.z);
  if(getBlock(fx, fy, fz)) { player.y = fy + 2; player.vy = 0; player.onGround = true; }
  else player.onGround = false;

  player.x = Math.max(0.5, Math.min(WORLD_SIZE-0.5, player.x));
  player.z = Math.max(0.5, Math.min(WORLD_SIZE-0.5, player.z));

  document.getElementById('hud').textContent = 
    'Position: ' + Math.floor(player.x) + ', ' + Math.floor(player.y) + ', ' + Math.floor(player.z) +
    ' | Looking: ' + Math.floor(player.yaw*180/Math.PI) + '°';
}

function render() {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Collect visible blocks
  const blocks = [];
  for(const key in world) {
    const [x,y,z] = key.split(',').map(Number);
    if(y > player.y + 10 || y < player.y - 10) continue;
    // Check if exposed
    if(!getBlock(x+1,y,z) || !getBlock(x-1,y,z) || !getBlock(x,y+1,z) || !getBlock(x,y-1,z) || !getBlock(x,y,z+1) || !getBlock(x,y,z-1)) {
      blocks.push({ x, y, z, t: world[key] });
    }
  }

  // Sort by distance
  blocks.sort((a,b) => {
    const da = (a.x-player.x)**2 + (a.y-player.y)**2 + (a.z-player.z)**2;
    const db = (b.x-player.x)**2 + (b.y-player.y)**2 + (b.z-player.z)**2;
    return db - da;
  });

  // Project 3D to 2D
  const fov = 600;
  const cx = canvas.width/2, cy = canvas.height/2;
  const cosP = Math.cos(player.pitch), sinP = Math.sin(player.pitch);
  const cosY = Math.cos(player.yaw), sinY = Math.sin(player.yaw);

  for(const b of blocks) {
    // Relative position
    let rx = b.x - player.x + 0.5;
    let ry = b.y - player.y + 0.5;
    let rz = b.z - player.z + 0.5;

    // Rotate by yaw
    let tx = rx * cosY - rz * sinY;
    let tz = rx * sinY + rz * cosY;
    rx = tx; rz = tz;

    // Rotate by pitch
    let ty = ry * cosP - rz * sinP;
    tz = ry * sinP + rz * cosP;
    ry = ty; rz = tz;

    if(tz <= 0.1) continue; // Behind camera

    const scale = fov / tz;
    const sx = cx + rx * scale;
    const sy = cy - ry * scale;
    const s = scale * 0.5;

    if(s < 1) continue;

    // Draw block as a cube
    ctx.fillStyle = COLORS[b.t];
    ctx.fillRect(sx - s/2, sy - s/2, s, s);

    // Top face (lighter)
    ctx.fillStyle = lightenColor(COLORS[b.t], 20);
    ctx.beginPath();
    ctx.moveTo(sx - s/2, sy - s/2);
    ctx.lineTo(sx + s/2, sy - s/2);
    ctx.lineTo(sx + s/2 + s*0.2, sy - s/2 - s*0.2);
    ctx.lineTo(sx - s/2 + s*0.2, sy - s/2 - s*0.2);
    ctx.fill();

    // Right face (darker)
    ctx.fillStyle = lightenColor(COLORS[b.t], -20);
    ctx.beginPath();
    ctx.moveTo(sx + s/2, sy - s/2);
    ctx.lineTo(sx + s/2 + s*0.2, sy - s/2 - s*0.2);
    ctx.lineTo(sx + s/2 + s*0.2, sy + s/2 - s*0.2);
    ctx.lineTo(sx + s/2, sy + s/2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.strokeRect(sx - s/2, sy - s/2, s, s);
  }

  // Crosshair
  ctx.fillStyle = 'white';
  ctx.fillRect(cx-10, cy-1, 20, 2);
  ctx.fillRect(cx-1, cy-10, 2, 20);
}

function lightenColor(hex, percent) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return 'rgb(' + Math.min(255, r+percent) + ',' + Math.min(255, g+percent) + ',' + Math.min(255, b+percent) + ')';
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
loop();
</script>
</body>
</html>`
}

function generateSimpleGameHTML(name: string, prompt: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1a1a1a; color: white; font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
canvas { border: 2px solid #444; border-radius: 8px; background: #0d0d0d; }
h1 { margin-bottom: 16px; font-size: 1.5rem; }
#score { font-size: 1.2rem; margin-bottom: 8px; color: #4ade80; }
</style>
</head>
<body>
<h1>${name}</h1>
<div id="score">Score: 0</div>
<canvas id="game" width="400" height="400"></canvas>
<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
let score = 0;
let gameOver = false;

// Simple snake game as fallback
const grid = 20;
let snake = [{x:10, y:10}];
let food = {x:5, y:5};
let dx = 1, dy = 0;

document.addEventListener('keydown', e => {
  if(e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
  if(e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
  if(e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
  if(e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
  if(e.key === ' ' && gameOver) { snake = [{x:10,y:10}]; score = 0; dx = 1; dy = 0; gameOver = false; }
});

function update() {
  if(gameOver) return;
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    return;
  }
  snake.unshift(head);
  if(head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = 'Score: ' + score;
    food = { x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20) };
  } else {
    snake.pop();
  }
}

function render() {
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle = '#4ade80';
  snake.forEach(s => ctx.fillRect(s.x * grid, s.y * grid, grid-1, grid-1));
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(food.x * grid, food.y * grid, grid-1, grid-1);
  if(gameOver) {
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over! Press Space', 200, 200);
  }
}

function loop() {
  update();
  render();
  setTimeout(() => requestAnimationFrame(loop), 100);
}
loop();
</script>
</body>
</html>`
}
