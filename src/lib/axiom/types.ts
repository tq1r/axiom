// ============ AXIOM TYPES ============

export type ViewName =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'chat'
  | 'studio'
  | 'models'
  | 'pricing'
  | 'settings'

export interface ModelConfig {
  id: string
  name: string
  tagline: string
  description: string
  contextWindow: string
  capabilities: string[]
  tier: 'free' | 'pro' | 'teams'
  category: 'reasoning' | 'fast' | 'code' | 'vision'
  benchmark?: { label: string; value: string }[]
  badgeColor: string
  icon: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  model?: string
  attachments?: Attachment[]
  isStreaming?: boolean
  isThinking?: boolean
  thinking?: string
  isThinkingDone?: boolean
  toolBadge?: string
  feedback?: 'up' | 'down' | null
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl?: string
}

export interface ChatThread {
  id: string
  title: string
  messages: ChatMessage[]
  modelId: string
  createdAt: number
  updatedAt: number
  pinned?: boolean
  archived?: boolean
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirectory?: boolean
  children?: ProjectFile[]
}

export interface StudioProject {
  id: string
  name: string
  template: string
  description: string
  files: ProjectFile[]
  createdAt: number
  updatedAt: number
  language: string
  framework: string
}

export interface AgentStep {
  id: string
  type: 'plan' | 'file' | 'command' | 'thought' | 'complete'
  title: string
  detail?: string
  status: 'pending' | 'running' | 'done' | 'error'
  timestamp: number
  fileName?: string
  diff?: string
  command?: string
  output?: string
  todos?: { text: string; done: boolean }[]
}

export interface Checkpoint {
  id: string
  label: string
  timestamp: number
  stepIndex: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: 'free' | 'pro' | 'teams'
  credits: number
  creditsTotal: number
}

export interface PricingTier {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  highlight?: boolean
  cta: string
}
