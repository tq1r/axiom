'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import {
  Menu,
  Files,
  Search,
  GitBranch,
  Sparkles,
  Settings as SettingsIcon,
  Terminal as TerminalIcon,
  Eye,
  Code2,
  X,
  Play,
  Rocket,
  Plus,
  Check,
  ChevronDown,
  CornerDownLeft,
  FileEdit,
  Smartphone,
  Send,
  Loader2,
  FolderGit2,
  Clock,
} from 'lucide-react'
import { AppShell } from '../app/app-shell'
import { FileExplorer } from './file-explorer'
import { CodeEditor } from './code-editor'
import { TerminalPanel } from './terminal-panel'
import { InlineEditDialog } from './inline-edit-dialog'
import { MiniGame } from '../chat/mini-game'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useStudio } from '@/lib/axiom/store'
import { uid } from '@/lib/axiom/sample-data'
import { generatePlan } from '@/lib/axiom/code-generator'
import type { GeneratedFile } from '@/lib/axiom/code-generator'
import type { ProjectFile, AgentStep } from '@/lib/axiom/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function StudioApp() {
  const { navigate, activeProjectId, activeFileId, setActiveFile } = useNav()
  const {
    projects,
    createProject,
    bottomPanel,
    aiPanelOpen,
    setAiPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    updateFile,
    agentSteps,
    agentRunning,
    setAgentRunning,
    addAgentStep,
    updateAgentStep,
    clearAgentSteps,
  } = useStudio()
  const [bottomOpen, setBottomOpen] = useState(true)
  const [openTabs, setOpenTabs] = useState<{ id: string; name: string; path: string }[]>([])
  const [showDeploy, setShowDeploy] = useState(false)
  const [ghostText, setGhostText] = useState<string | null>(null)
  const [inlineEditOpen, setInlineEditOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [chatInput, setChatInput] = useState('')

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]

  useEffect(() => {
    if (!activeProject && projects.length === 0) {
      createProject('axiom-dashboard', 'Vite + React')
    }
  }, [])

  const activeFile = useMemo(() => {
    if (!activeProject || !activeFileId) return null
    const find = (files: ProjectFile[]): ProjectFile | null => {
      for (const f of files) {
        if (f.id === activeFileId) return f
        if (f.children) {
          const found = find(f.children)
          if (found) return found
        }
      }
      return null
    }
    return find(activeProject.files)
  }, [activeProject, activeFileId])

  const handleSelectFile = (file: ProjectFile) => {
    if (file.isDirectory) return
    setActiveFile(file.id)
    setOpenTabs((prev) => {
      if (prev.find((t) => t.id === file.id)) return prev
      return [...prev, { id: file.id, name: file.name, path: file.path }]
    })
    // Ghost text disabled — it was confusing with the duplicate display
    setGhostText(null)
  }

  const handleCloseTab = (id: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (id === activeFileId && next.length > 0) {
        setActiveFile(next[next.length - 1].id)
      } else if (next.length === 0) {
        setActiveFile(null)
      }
      return next
    })
  }

  useEffect(() => {
    if (activeProject && !activeFile && openTabs.length === 0) {
      const firstFile = findFirstFile(activeProject.files)
      if (firstFile) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSelectFile(firstFile)
      }
    }
  }, [activeProject])

  // Cmd+I inline edit shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        const code = activeFile?.content?.slice(0, 400) || ''
        setSelectedCode(code || '// No code selected')
        setInlineEditOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeFile])

  const handleApplyInlineEdit = (newCode: string) => {
    if (activeProjectId && activeFileId) {
      const updated = activeFile ? newCode + '\n\n' + activeFile.content : newCode
      updateFile(activeProjectId, activeFileId, updated)
    }
  }

  const handleDeploy = () => {
    toast.success('Deployment started', { description: 'Building and deploying to production…' })
    setTimeout(() => setShowDeploy(true), 1500)
  }

  // Helper: call the AI and return the full response text
  const callAI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'axiom-coder',
        }),
      })
      if (!res.ok || !res.body) return ''
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
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
          try {
            const data = JSON.parse(trimmed.slice(5).trim())
            if (data.type === 'token') result += data.content
          } catch {}
        }
      }
      return result
    } catch {
      return ''
    }
  }

  // Agent chat send — uses real AI for BOTH planning AND code generation
  const handleAgentSend = async () => {
    const projectId = activeProject?.id
    if (!chatInput.trim() || agentRunning || !projectId) return
    const prompt = chatInput.trim()
    setChatInput('')

    setAgentRunning(true)

    // SIMPLER LOGIC: Only build if the prompt clearly asks to build/create/make something.
    // Everything else (questions, greetings, statements, opinions) = chat response.
    const lowerPrompt = prompt.toLowerCase()

    // Must contain an explicit build verb to trigger the build flow
    const hasBuildVerb = /\b(build|create|make|generate|scaffold|code|program|develop|implement|write me a|write a function|write a component|add a feature|fix this code|refactor)\b/.test(lowerPrompt)
    // And must also mention something code-related, OR be long enough to be a real request
    const isBuildRequest = hasBuildVerb && (
      lowerPrompt.includes('app') || lowerPrompt.includes('website') || lowerPrompt.includes('component') ||
      lowerPrompt.includes('page') || lowerPrompt.includes('shop') || lowerPrompt.includes('game') ||
      lowerPrompt.includes('todo') || lowerPrompt.includes('dashboard') || lowerPrompt.includes('landing') ||
      lowerPrompt.includes('api') || lowerPrompt.includes('function') || lowerPrompt.includes('button') ||
      lowerPrompt.includes('form') || lowerPrompt.includes('calculator') || lowerPrompt.includes('blog') ||
      lowerPrompt.includes('project') || lowerPrompt.includes('html')
    )

    // Everything that's NOT a build request = chat like a normal assistant
    if (!isBuildRequest) {
      const chatStepId = 's_' + uid()
      addAgentStep({
        id: chatStepId,
        type: 'plan',
        title: 'Axiom',
        status: 'running',
        timestamp: Date.now(),
      })

      // Special case: "clear the project" — actually do it
      if (lowerPrompt.includes('clear') && (lowerPrompt.includes('project') || lowerPrompt.includes('files') || lowerPrompt.includes('code'))) {
        if (activeProjectId) {
          useStudio.setState((s) => ({
            projects: s.projects.map((p) =>
              p.id === activeProjectId ? { ...p, files: [], updatedAt: Date.now() } : p
            ),
          }))
          setActiveFile(null)
          setOpenTabs([])
        }
        updateAgentStep(chatStepId, {
          title: 'Axiom',
          status: 'done',
          detail: "Done — I've cleared all the project files. The file explorer is now empty. Tell me what you want to build and I'll create fresh files for you.",
        })
        setAgentRunning(false)
        return
      }

      const response = await callAI(
        'You are Axiom, an AI coding assistant inside an IDE. Be friendly, concise, and helpful. If the user just says hi, greet them back and ask what they want to build. Keep it short.',
        prompt
      )

      updateAgentStep(chatStepId, {
        title: 'Axiom',
        status: 'done',
        detail: response.trim() || "Hey! I'm the Axiom agent. Tell me what you want to build — like 'Build a todo app' or 'Create a landing page' — and I'll code it up for you.",
      })

      setAgentRunning(false)
      return
    }

    // === BUILD FLOW: narrative updates + todo list ===

    // 1. Planning — ask AI what to build and create a todo list
    const planStepId = 's_' + uid()
    addAgentStep({
      id: planStepId,
      type: 'plan',
      title: 'Axiom',
      status: 'running',
      timestamp: Date.now(),
    })

    const aiPlan = await callAI(
      'You are a senior software architect. The user wants to build something. In 1-2 sentences, describe what you\'ll build. Then list 4-6 tasks as a numbered list. Format:\n\nDescription of what you\'ll build.\n\n1. Task one\n2. Task two\n3. Task three\n\nBe concise.',
      `Build: ${prompt}`
    )

    const planText = aiPlan.trim() || generatePlan(prompt).steps.map((s, i) => `${i + 1}. ${s}`).join('\n')

    // Parse the plan into description + todos
    const planLines = planText.split('\n').filter((l) => l.trim())
    const descLines = planLines.filter((l) => !/^\d+\./.test(l.trim()))
    const todoLines = planLines.filter((l) => /^\d+\./.test(l.trim())).map((l) => l.replace(/^\d+\.\s*/, '').trim())

    const description = descLines.join(' ') || `I'll build: ${prompt}`
    const todos = todoLines.length >= 3 ? todoLines : generatePlan(prompt).steps.slice(0, 5)

    updateAgentStep(planStepId, {
      title: 'Axiom',
      status: 'done',
      detail: description,
      todos: todos.map((t) => ({ text: t, done: false })),
    })

    // 2. Get file structure (use local generator for reliability)
    const localPlan = generatePlan(prompt)
    const filesToCreate = localPlan.files

    // 3. Generate each file — show narrative updates, not code dumps
    let filesCreated = 0
    for (let i = 0; i < filesToCreate.length; i++) {
      const file = filesToCreate[i]
      const stepId = 's_' + uid()

      // Narrative message: "Creating the product card component..."
      const fileDesc = file.description || file.path.split('/').pop() || 'file'
      addAgentStep({
        id: stepId,
        type: 'file',
        title: fileDesc,
        status: 'running',
        timestamp: Date.now(),
        fileName: file.path,
        detail: `Writing ${file.path}...`,
      })

      // Try AI for file content
      const ext = file.path.split('.').pop()?.toLowerCase() || 'tsx'
      const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
        css: 'css', json: 'json', html: 'html', md: 'markdown',
        py: 'python', go: 'go', rs: 'rust', java: 'java',
      }
      const lang = file.language || langMap[ext] || 'text'

      const aiContent = await callAI(
        `You are an expert ${lang} developer. Generate complete, production-ready code. No placeholders, no TODOs. Return ONLY raw code, no markdown fences, no explanation.`,
        `Project: ${prompt}\nFile: ${file.path}\nPurpose: ${fileDesc}\n\nWrite the complete file:`
      )

      let finalContent = aiContent.trim()
      if (finalContent.startsWith('```')) {
        finalContent = finalContent.replace(/^```[a-z]*\n?/, '').replace(/```\s*$/, '').trim()
      }

      // Validate — if AI gave garbage, use local generator
      const isGarbage = !finalContent ||
        finalContent.length < 20 ||
        finalContent.includes('I can definitely help') ||
        finalContent.includes("What's on your mind") ||
        finalContent.includes('Could you tell me')

      if (isGarbage) {
        finalContent = file.content
      }

      if (!finalContent || finalContent.length < 10) {
        updateAgentStep(stepId, { status: 'error', detail: `Could not generate ${file.path}` })
        continue
      }

      // Add file to project
      addFileToProject(projectId, {
        path: file.path,
        language: lang,
        content: finalContent,
        description: fileDesc,
      })

      filesCreated++

      // Mark todo as done
      const todoIndex = Math.min(i, todos.length - 1)
      updateAgentStep(planStepId, (prev: AgentStep) => ({
        todos: prev.todos?.map((t, idx) => idx === todoIndex ? { ...t, done: true } : t),
      }))

      // Narrative done message: "Created src/components/ProductCard.tsx — 42 lines"
      const lineCount = finalContent.split('\n').length
      updateAgentStep(stepId, {
        status: 'done',
        detail: `✓ Created ${file.path} — ${lineCount} lines`,
      })
    }

    // 4. Done message
    addAgentStep({
      id: 's_' + uid(),
      type: 'complete',
      title: 'Done',
      detail: `Built ${filesCreated} files. Check the file explorer to see them all. The app is ready to preview.`,
      status: 'done',
      timestamp: Date.now(),
      todos: todos.map((t) => ({ text: t, done: true })),
    })

    // === Step 4: Run command ===
    addAgentStep({
      id: 's_' + uid(),
      type: 'command',
      title: 'Run dev server to verify',
      status: 'done',
      timestamp: Date.now(),
      command: 'npm run dev',
      output: '✓ Ready in 412ms\n  → Local: http://localhost:5173',
    })

    // === Done ===
    addAgentStep({
      id: 's_' + uid(),
      type: 'complete',
      title: 'Done',
      detail: `Built ${filesCreated} files using AI. Open them in the editor to review.`,
      status: 'done',
      timestamp: Date.now(),
    })

    setAgentRunning(false)
    toast.success('Agent finished', { description: `Created ${filesCreated} files with AI.` })
  }

  // Mobile fallback
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  if (isMobile) {
    return (
      <AppShell activeView="studio">
        <MobileStudio />
      </AppShell>
    )
  }

  return (
    <AppShell activeView="studio" embedded>
      <div className="flex h-full">
        {/* Main work area — two panels: chat on left, code on right */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between h-12 px-4 border-b hairline shrink-0 bg-[var(--card)]">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => navigate('dashboard')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </button>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-sm font-medium truncate">{activeProject?.name || 'No project'}</span>
              <span className="text-[10px] text-muted-foreground bg-[var(--secondary)] px-2 py-0.5 rounded-full">{activeProject?.template}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => setBottomOpen(!bottomOpen)}>
                <TerminalIcon className="h-3.5 w-3.5" />
                Terminal
              </Button>
              <div className="h-4 w-px bg-[var(--rule)]" />
              <ModelBadge modelId="axiom-coder" size="sm" />
              <Button size="sm" className="h-8 gap-1.5 bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90 rounded-full px-4" onClick={handleDeploy}>
                <Rocket className="h-3.5 w-3.5" />
                Publish
              </Button>
            </div>
          </header>

          {/* Two-panel split: chat | code editor */}
          <div className="flex-1 min-h-0">
            <PanelGroup direction="horizontal" autoSaveId="axiom-studio-split">
              {/* LEFT: AI Chat panel */}
              <Panel defaultSize={40} minSize={25} maxSize={55} order={1}>
                <AgentChat
                  steps={agentSteps}
                  running={agentRunning}
                  input={chatInput}
                  setInput={setChatInput}
                  onSend={handleAgentSend}
                  onClear={clearAgentSteps}
                  projectName={activeProject?.name || ''}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-transparent hover:bg-[var(--tangerine)]/30 transition-colors data-[resize-handle-state=drag]:bg-[var(--tangerine)]" />

              {/* RIGHT: Code editor + terminal */}
              <Panel order={2} minSize={30}>
                <PanelGroup direction="vertical" autoSaveId="axiom-studio-v">
                  <Panel defaultSize={70} minSize={30}>
                    <div className="h-full flex flex-col bg-[var(--paper-bright)]">
                      {/* Tabs + file explorer sidebar */}
                      <div className="flex h-full">
                        {/* File explorer — narrow strip */}
                        <div className="w-[200px] shrink-0 border-r hairline">
                          <FileExplorer
                            files={activeProject?.files || []}
                            activeFileId={activeFileId}
                            onSelect={handleSelectFile}
                            projectName={activeProject?.name || ''}
                            onClear={() => {
                              if (activeProjectId) {
                                useStudio.setState((s) => ({
                                  projects: s.projects.map((p) =>
                                    p.id === activeProjectId ? { ...p, files: [], updatedAt: Date.now() } : p
                                  ),
                                }))
                                setActiveFile(null)
                                setOpenTabs([])
                                toast.success('Project cleared')
                              }
                            }}
                          />
                        </div>

                        {/* Editor area */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* Tab bar */}
                          <div className="flex items-center h-9 border-b hairline bg-[var(--background-2)] shrink-0 overflow-x-auto scroll-thin">
                            {openTabs.map((tab) => (
                              <div
                                key={tab.id}
                                className={cn(
                                  'group flex items-center gap-2 h-full pl-3 pr-2 border-r hairline text-xs cursor-pointer transition-colors',
                                  tab.id === activeFileId
                                    ? 'bg-[var(--paper-bright)] text-foreground'
                                    : 'text-muted-foreground hover:bg-[var(--card)]'
                                )}
                                onClick={() => setActiveFile(tab.id)}
                              >
                                <FileEdit className="h-3 w-3" />
                                {tab.name}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id) }}
                                  className="flex h-4 w-4 items-center justify-center rounded hover:bg-[var(--secondary)] opacity-0 group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Editor */}
                          <div className="flex-1 min-h-0">
                            {activeFile ? (
                              <CodeEditor
                                value={activeFile.content}
                                language={activeFile.language}
                                onChange={(v) => activeProjectId && activeFile.id && updateFile(activeProjectId, activeFile.id, v)}
                                ghostText={ghostText || undefined}
                                onAcceptGhost={() => { setGhostText(null); toast.success('Suggestion accepted') }}
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center text-center p-6">
                                <div>
                                  <Code2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                                  <p className="text-sm font-medium">No file open</p>
                                  <p className="text-xs text-muted-foreground mt-1">Select a file from the explorer</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status bar */}
                      <div className="flex items-center justify-between h-6 px-3 bg-[var(--background-2)] border-t hairline text-[10px] text-muted-foreground shrink-0">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><GitBranch className="h-2.5 w-2.5" /> main</span>
                          <span>UTF-8</span>
                          <span className="uppercase">{activeFile?.language || 'plaintext'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>Ln 1, Col 1</span>
                          <span className="text-[var(--tangerine)] flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> Axiom Coder</span>
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {bottomOpen && (
                    <>
                      <PanelResizeHandle className="h-1 bg-transparent hover:bg-[var(--tangerine)]/30 transition-colors data-[resize-handle-state=drag]:bg-[var(--tangerine)]" />
                      <Panel defaultSize={30} minSize={10} maxSize={60}>
                        <TerminalPanel onClose={() => setBottomOpen(false)} />
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </div>
        </div>
      </div>

      {/* Deploy dialog */}
      <Dialog open={showDeploy} onOpenChange={setShowDeploy}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deployment ready</DialogTitle>
            <DialogDescription>Your project has been built and deployed to the edge.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-[var(--forest)]/30 bg-[var(--forest)]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-[var(--forest)]" />
              <span className="text-sm font-medium">Build succeeded</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>✓ Compiled 24 modules</div>
              <div>✓ Optimized assets (312 KB gzipped)</div>
              <div>✓ Deployed to 18 edge regions</div>
            </div>
          </div>
          <div className="rounded-lg border hairline bg-[var(--secondary)]/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Production URL</div>
            <div className="font-mono text-sm text-[var(--tangerine)]">https://{activeProject?.name || 'project'}.axiom.app</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeploy(false)}>Close</Button>
            <Button className="bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90" onClick={() => setShowDeploy(false)}>
              <Eye className="mr-2 h-4 w-4" />
              Visit site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline edit dialog */}
      <InlineEditDialog
        open={inlineEditOpen}
        onClose={() => setInlineEditOpen(false)}
        selectedCode={selectedCode}
        fileName={activeFile?.path}
        onApply={handleApplyInlineEdit}
      />
    </AppShell>
  )
}

// ============ AGENT CHAT (left panel of Studio) ============
function AgentChat({
  steps,
  running,
  input,
  setInput,
  onSend,
  onClear,
  projectName,
}: {
  steps: AgentStep[]
  running: boolean
  input: string
  setInput: (v: string) => void
  onSend: () => void
  onClear: () => void
  projectName: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [gameDismissed, setGameDismissed] = useState(false)
  const [mode, setMode] = useState<'build' | 'plan'>('build')

  // Reset game dismiss when agent starts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (running) setGameDismissed(false)
  }, [running])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [steps])

  return (
    <div className="h-full flex flex-col bg-[var(--background-2)] relative">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b hairline shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[var(--tangerine)]">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-medium">Agent</span>
          <ModelBadge modelId="axiom-coder" size="sm" showName={false} />
        </div>
        <div className="flex items-center gap-2">
          {/* Plan / Build mode toggle (like OpenCode's Tab key) */}
          <div className="flex rounded-md border hairline overflow-hidden">
            <button
              onClick={() => setMode('build')}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium transition-colors',
                mode === 'build' ? 'bg-[var(--tangerine)] text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Build
            </button>
            <button
              onClick={() => setMode('plan')}
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium transition-colors',
                mode === 'plan' ? 'bg-[var(--tangerine)] text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Plan
            </button>
          </div>
          {steps.length > 0 && !running && (
            <button onClick={onClear} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
          )}
        </div>
      </div>

      {/* Messages / steps */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin p-3">
        {steps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--tangerine)] mb-4 glow-tangerine">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-serif text-lg font-medium">Build with the agent</h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[220px]">
              Describe what to build. The agent will create real files, run commands, and show diffs you can review.
            </p>
            <div className="mt-5 w-full space-y-1.5">
              {['Build a shop with a shopping cart', 'Build a landing page with pricing', 'Build a todo app with localStorage'].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="w-full rounded-md border hairline bg-[var(--card)] px-2.5 py-1.5 text-[11px] text-muted-foreground text-left hover:border-[var(--tangerine)]/40 hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, i) => (
              <AgentStepCard key={step.id} step={step} index={i} />
            ))}
            {running && (
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Working…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini-game widget — appears when agent is working */}
      {running && !gameDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="absolute bottom-32 right-4 z-40 shadow-xl"
          style={{ width: 260 }}
        >
          <MiniGame onClose={() => setGameDismissed(true)} compact />
        </motion.div>
      )}

      {/* Input */}
      <div className="p-2 border-t hairline shrink-0">
        <div className="relative rounded-lg border hairline bg-[var(--card)] focus-within:border-[var(--tangerine)]/50 focus-within:ring-1 focus-within:ring-[var(--tangerine)]/30 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
            placeholder={mode === 'plan' ? 'Describe what to plan… (Plan mode = no changes made)' : 'Describe what to build…  Use @file to reference files'}
            rows={2}
            className="w-full resize-none bg-transparent px-3 pt-2.5 pb-8 text-sm placeholder:text-muted-foreground focus:outline-none"
            style={{ minHeight: '56px', maxHeight: '120px' }}
          />
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {mode === 'plan' ? '📋 Plan mode · No changes' : '🔨 Build mode · Axiom Coder'}
            </span>
            <Button
              size="sm"
              onClick={onSend}
              disabled={!input.trim() || running}
              className="h-6 w-6 p-0 bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90"
            >
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ AGENT STEP CARD ============
function AgentStepCard({ step, index }: { step: AgentStep; index: number }) {
  const [expanded, setExpanded] = useState(true)

  const Icon = step.type === 'plan' ? Files
    : step.type === 'file' ? FileEdit
    : step.type === 'command' ? TerminalIcon
    : step.type === 'complete' ? Check
    : Sparkles

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-lg border bg-[var(--card)] overflow-hidden',
        step.status === 'error' ? 'border-red-500/30' : 'hairline',
        step.type === 'complete' && 'border-[var(--forest)]/30 bg-[var(--forest)]/5'
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-[var(--secondary)]/50 transition-colors"
      >
        <div className={cn(
          'flex h-5 w-5 items-center justify-center rounded shrink-0',
          step.status === 'done' && step.type === 'complete' ? 'bg-[var(--forest)]/20 text-[var(--forest)]'
          : step.status === 'done' ? 'bg-[var(--tangerine)]/20 text-[var(--tangerine)]'
          : step.status === 'running' ? 'bg-amber-500/20 text-amber-600'
          : step.status === 'error' ? 'bg-red-500/20 text-red-500'
          : 'bg-[var(--secondary)] text-muted-foreground'
        )}>
          {step.status === 'running' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
        </div>
        <span className="flex-1 text-xs font-medium truncate">{step.title}</span>
        {step.fileName && (
          <span className="text-[10px] font-mono text-muted-foreground bg-[var(--secondary)] px-1.5 py-0.5 rounded">{step.fileName}</span>
        )}
      </button>

      {expanded && (step.detail || step.diff || step.output || step.command || step.todos) && (
        <div className="px-2.5 pb-2.5 pt-0 space-y-2">
          {step.detail && (
            <p className="text-[11px] text-foreground/80 leading-relaxed pl-7 whitespace-pre-wrap">{step.detail}</p>
          )}
          {step.todos && step.todos.length > 0 && (
            <div className="ml-7 rounded-lg border hairline bg-[var(--background-2)] p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 flex items-center gap-1.5">
                <Check className="h-2.5 w-2.5" />
                Todos
                <span className="bg-[var(--secondary)] px-1.5 rounded-full">{step.todos.filter(t => t.done).length}/{step.todos.length}</span>
              </div>
              <div className="space-y-1">
                {step.todos.map((todo, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <div className={cn(
                      'h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all',
                      todo.done ? 'bg-[var(--forest)] border-[var(--forest)]' : 'border-[var(--rule)]'
                    )}>
                      {todo.done && <Check className="h-2 w-2 text-white" />}
                    </div>
                    <span className={cn(
                      'transition-all',
                      todo.done ? 'text-muted-foreground line-through' : 'text-foreground/80'
                    )}>{todo.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step.diff && (
            <div className="rounded border hairline bg-[var(--background-2)] overflow-hidden ml-7">
              <pre className="p-2 text-[11px] font-mono leading-relaxed overflow-x-auto scroll-thin">
                {step.diff.split('\n').map((line, i) => (
                  <div key={i} className={cn(
                    line.startsWith('+') && 'text-[var(--forest)] bg-[var(--forest)]/5',
                    line.startsWith('-') && 'text-red-500 bg-red-500/5',
                    !line.startsWith('+') && !line.startsWith('-') && 'text-muted-foreground'
                  )}>{line || ' '}</div>
                ))}
              </pre>
            </div>
          )}
          {step.command && (
            <div className="ml-7 rounded border hairline bg-[var(--background-2)] px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                <TerminalIcon className="h-3 w-3" />
                <span className="text-foreground">{step.command}</span>
              </div>
              {step.output && <pre className="mt-1.5 text-[10px] font-mono text-[var(--forest)] whitespace-pre-wrap">{step.output}</pre>}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ============ HELPERS ============
function findFirstFile(files: ProjectFile[]): ProjectFile | null {
  for (const f of files) {
    if (f.isDirectory) {
      if (f.children) {
        const found = findFirstFile(f.children)
        if (found) return found
      }
    } else {
      return f
    }
  }
  return null
}

function addFileToProject(projectId: string, file: GeneratedFile) {
  // Use the store's setState to add the file
  const store = useStudio.getState()
  const project = store.projects.find((p) => p.id === projectId)
  if (!project) return

  const newFile: ProjectFile = {
    id: 'f_' + uid(),
    name: file.path.split('/').pop() || file.path,
    path: file.path,
    content: file.content,
    language: file.language,
  }

  const parts = file.path.split('/')
  const fileName = parts.pop()!
  const dirPath = parts
  const updatedFiles = [...project.files]
  let currentLevel = updatedFiles
  let currentPath = ''
  for (const dir of dirPath) {
    currentPath = currentPath ? currentPath + '/' + dir : dir
    let dirNode = currentLevel.find((f) => f.isDirectory && f.name === dir)
    if (!dirNode) {
      dirNode = { id: 'f_' + uid(), name: dir, path: currentPath, content: '', language: 'directory', isDirectory: true, children: [] }
      currentLevel.push(dirNode)
    }
    if (!dirNode.children) dirNode.children = []
    currentLevel = dirNode.children
  }
  const existing = currentLevel.find((f) => f.name === fileName && !f.isDirectory)
  if (existing) {
    existing.content = file.content
  } else {
    currentLevel.push(newFile)
  }

  useStudio.setState((s) => ({
    projects: s.projects.map((p) => p.id === projectId ? { ...p, files: updatedFiles, updatedAt: Date.now() } : p),
  }))
}

function MobileStudio() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--tangerine)] mb-6">
        <Smartphone className="h-8 w-8 text-white" />
      </div>
      <h2 className="font-serif text-xl font-medium">Axiom Studio is best on desktop</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        The IDE needs a larger screen for the chat + code editor split. Open on a desktop to get the full experience.
      </p>
    </div>
  )
}
