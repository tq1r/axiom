import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ViewName,
  ChatThread,
  ChatMessage,
  StudioProject,
  ProjectFile,
  User,
  AgentStep,
} from './types'
import { DEFAULT_CHAT_MODEL, DEFAULT_STUDIO_MODEL } from './models'
import { uid } from './sample-data'

// ============ NAVIGATION STORE ============
interface NavState {
  view: ViewName
  authMode: 'signin' | 'signup'
  isAuthenticated: boolean
  activeThreadId: string | null
  activeProjectId: string | null
  activeFileId: string | null
  activeSettingsTab: string
  commandOpen: boolean
  setView: (v: ViewName) => void
  setAuthMode: (m: 'signin' | 'signup') => void
  setAuth: (a: boolean) => void
  setActiveThread: (id: string | null) => void
  setActiveProject: (id: string | null) => void
  setActiveFile: (id: string | null) => void
  setActiveSettingsTab: (t: string) => void
  setCommandOpen: (o: boolean) => void
  navigate: (v: ViewName) => void
}

export const useNav = create<NavState>()(
  persist(
    (set) => ({
      view: 'landing',
      authMode: 'signin',
      isAuthenticated: false,
      activeThreadId: null,
      activeProjectId: null,
      activeFileId: null,
      activeSettingsTab: 'profile',
      commandOpen: false,
      setView: (view) => set({ view }),
      setAuthMode: (authMode) => set({ authMode }),
      setAuth: (isAuthenticated) => set({ isAuthenticated }),
      setActiveThread: (activeThreadId) => set({ activeThreadId }),
      setActiveProject: (activeProjectId) => set({ activeProjectId }),
      setActiveFile: (activeFileId) => set({ activeFileId }),
      setActiveSettingsTab: (activeSettingsTab) => set({ activeSettingsTab }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      navigate: (view) =>
        set({ view, commandOpen: false }),
    }),
    {
      name: 'axiom-nav-v3',
      partialize: (s) => ({ view: s.view, activeThreadId: s.activeThreadId, activeProjectId: s.activeProjectId }),
    }
  )
)

// ============ USER STORE ============
// Real email auth backed by localStorage. No server needed.
// Accounts are stored in a separate key so they survive sign-out.

interface StoredAccount {
  id: string
  name: string
  email: string
  password: string // plaintext — fine for a demo, never do this in production
  createdAt: number
}

interface UserState {
  user: User | null
  authError: string | null
  setUser: (u: Partial<User>) => void
  consumeCredit: (amount?: number) => void
  signUp: (name: string, email: string, password: string) => boolean
  signIn: (email: string, password: string) => boolean
  signInWithOAuth: (provider: 'google' | 'github') => void
  signOut: () => void
}

function loadAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('axiom-accounts')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAccounts(accts: StoredAccount[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('axiom-accounts', JSON.stringify(accts))
}

function makeUser(acct: StoredAccount): User {
  return {
    id: acct.id,
    name: acct.name,
    email: acct.email,
    plan: 'pro',
    credits: 4320,
    creditsTotal: 5000,
  }
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      authError: null,
      setUser: (u) =>
        set((s) => (s.user ? { user: { ...s.user, ...u } } : {})),
      consumeCredit: (amount = 1) =>
        set((s) =>
          s.user
            ? { user: { ...s.user, credits: Math.max(0, s.user.credits - amount) } }
            : {}
        ),
      signUp: (name, email, password) => {
        const accounts = loadAccounts()
        const exists = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase())
        if (exists) {
          set({ authError: 'An account with this email already exists.' })
          return false
        }
        if (password.length < 6) {
          set({ authError: 'Password must be at least 6 characters.' })
          return false
        }
        const acct: StoredAccount = {
          id: 'u_' + uid(),
          name: name || email.split('@')[0],
          email,
          password,
          createdAt: Date.now(),
        }
        accounts.push(acct)
        saveAccounts(accounts)
        set({ user: makeUser(acct), authError: null })
        return true
      },
      signIn: (email, password) => {
        const accounts = loadAccounts()
        const acct = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase())
        if (!acct) {
          set({ authError: 'No account found with this email.' })
          return false
        }
        if (acct.password !== password) {
          set({ authError: 'Incorrect password.' })
          return false
        }
        set({ user: makeUser(acct), authError: null })
        return true
      },
      signInWithOAuth: (provider) => {
        const email = `${provider.toLowerCase()}@axiom.dev`
        const accounts = loadAccounts()
        let acct = accounts.find((a) => a.email === email)
        if (!acct) {
          acct = {
            id: 'u_' + uid(),
            name: provider === 'google' ? 'Google User' : 'GitHub User',
            email,
            password: Math.random().toString(36).slice(2),
            createdAt: Date.now(),
          }
          accounts.push(acct)
          saveAccounts(accounts)
        }
        set({ user: makeUser(acct), authError: null })
      },
      signOut: () => set({ user: null, authError: null }),
    }),
    {
      name: 'axiom-user-v2',
      partialize: (s) => ({ user: s.user }),
    }
  )
)

// ============ CHAT STORE ============
interface ChatState {
  threads: ChatThread[]
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  createThread: (modelId?: string) => string
  deleteThread: (id: string) => void
  togglePin: (id: string) => void
  renameThread: (id: string, title: string) => void
  archiveThread: (id: string) => void
  setThreadModel: (id: string, modelId: string) => void
  addMessage: (threadId: string, msg: ChatMessage) => void
  updateMessage: (threadId: string, msgId: string, updates: Partial<ChatMessage>) => void
  removeMessage: (threadId: string, msgId: string) => void
  truncateAfter: (threadId: string, msgId: string) => void
  setMessageFeedback: (threadId: string, msgId: string, fb: 'up' | 'down' | null) => void
  getThread: (id: string | null) => ChatThread | undefined
}

export const useChat = create<ChatState>()(
  persist(
    (set) => ({
      threads: [],
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      createThread: (modelId) => {
        const id = 't_' + uid()
        const thread: ChatThread = {
          id,
          title: 'New conversation',
          messages: [],
          modelId: modelId || DEFAULT_CHAT_MODEL,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ threads: [thread, ...s.threads] }))
        return id
      },
      deleteThread: (id) =>
        set((s) => ({ threads: s.threads.filter((t) => t.id !== id) })),
      togglePin: (id) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, pinned: !t.pinned } : t
          ),
        })),
      renameThread: (id, title) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, title, updatedAt: Date.now() } : t
          ),
        })),
      archiveThread: (id) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, archived: !t.archived } : t
          ),
        })),
      setThreadModel: (id, modelId) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, modelId } : t
          ),
        })),
      addMessage: (threadId, msg) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [...t.messages, msg],
                  updatedAt: Date.now(),
                  title:
                    t.title === 'New conversation' && msg.role === 'user'
                      ? msg.content.slice(0, 48) + (msg.content.length > 48 ? '…' : '')
                      : t.title,
                }
              : t
          ),
        })),
      updateMessage: (threadId, msgId, updates) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === msgId ? { ...m, ...updates } : m
                  ),
                }
              : t
          ),
        })),
      removeMessage: (threadId, msgId) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, messages: t.messages.filter((m) => m.id !== msgId) }
              : t
          ),
        })),
      truncateAfter: (threadId, msgId) =>
        set((s) => ({
          threads: s.threads.map((t) => {
            if (t.id !== threadId) return t
            const idx = t.messages.findIndex((m) => m.id === msgId)
            if (idx === -1) return t
            return { ...t, messages: t.messages.slice(0, idx + 1) }
          }),
        })),
      setMessageFeedback: (threadId, msgId, fb) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === msgId ? { ...m, feedback: fb } : m
                  ),
                }
              : t
          ),
        })),
      getThread: (id) => (id ? undefined : undefined),
    }),
    {
      name: 'axiom-chat-v3',
      partialize: (s) => ({ threads: s.threads.slice(0, 30) }),
    }
  )
)

// ============ STUDIO STORE ============
interface StudioState {
  projects: StudioProject[]
  bottomPanel: 'terminal' | 'problems' | 'output' | 'preview'
  aiPanelOpen: boolean
  agentSteps: AgentStep[]
  agentRunning: boolean
  rightPanelOpen: boolean
  setBottomPanel: (p: StudioState['bottomPanel']) => void
  setAiPanelOpen: (v: boolean) => void
  setRightPanelOpen: (v: boolean) => void
  createProject: (name: string, template: string) => string
  deleteProject: (id: string) => void
  getProject: (id: string | null) => StudioProject | undefined
  updateFile: (projectId: string, fileId: string, content: string) => void
  setActiveFileByPath: (projectId: string, path: string) => string | null
  setAgentRunning: (v: boolean) => void
  addAgentStep: (step: AgentStep) => void
  updateAgentStep: (id: string, updates: Partial<AgentStep> | ((prev: AgentStep) => Partial<AgentStep>)) => void
  clearAgentSteps: () => void
}

export const useStudio = create<StudioState>()(
  persist(
    (set) => ({
      projects: [],
      bottomPanel: 'terminal',
      aiPanelOpen: true,
      agentSteps: [],
      agentRunning: false,
      rightPanelOpen: true,
      setBottomPanel: (bottomPanel) => set({ bottomPanel }),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
      setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
      createProject: (name, template) => {
        const id = 'p_' + uid()
        const project = buildProjectFromTemplate(id, name, template)
        set((s) => ({ projects: [project, ...s.projects] }))
        return id
      },
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      getProject: (id) => (id ? undefined : undefined),
      updateFile: (projectId, fileId, content) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  files: updateFileInTree(p.files, fileId, content),
                  updatedAt: Date.now(),
                }
              : p
          ),
        })),
      setActiveFileByPath: (projectId, path) => {
        const state = useStudio.getState()
        const project = state.projects.find((p) => p.id === projectId)
        if (!project) return null
        const file = findFileByPath(project.files, path)
        return file?.id || null
      },
      setAgentRunning: (agentRunning) => set({ agentRunning }),
      addAgentStep: (step) =>
        set((s) => ({ agentSteps: [...s.agentSteps, step] })),
      updateAgentStep: (id, updates) =>
        set((s) => ({
          agentSteps: s.agentSteps.map((st) => {
            if (st.id !== id) return st
            const resolved = typeof updates === 'function' ? (updates as (prev: AgentStep) => Partial<AgentStep>)(st) : updates
            return { ...st, ...resolved }
          }),
        })),
      clearAgentSteps: () => set({ agentSteps: [] }),
    }),
    {
      name: 'axiom-studio-v2',
      partialize: (s) => ({ projects: s.projects }),
    }
  )
)

// ============ UI STORE ============
interface UIState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (t: 'dark' | 'light') => void
  sidebarCollapsed: boolean
  toggleAppSidebar: () => void
  setAppSidebar: (v: boolean) => void
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
      sidebarCollapsed: false,
      toggleAppSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setAppSidebar: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    { name: 'axiom-ui' }
  )
)

// ============ HELPERS ============
function updateFileInTree(files: ProjectFile[], fileId: string, content: string): ProjectFile[] {
  return files.map((f) => {
    if (f.id === fileId) return { ...f, content }
    if (f.children) return { ...f, children: updateFileInTree(f.children, fileId, content) }
    return f
  })
}

function findFileByPath(files: ProjectFile[], path: string): ProjectFile | null {
  for (const f of files) {
    if (f.path === path) return f
    if (f.children) {
      const found = findFileByPath(f.children, path)
      if (found) return found
    }
  }
  return null
}

function buildProjectFromTemplate(id: string, name: string, template: string): StudioProject {
  const now = Date.now()
  return {
    id,
    name,
    template,
    description: `A ${template} project`,
    files: [],
    createdAt: now,
    updatedAt: now,
    language: 'typescript',
    framework: template,
  }
}
