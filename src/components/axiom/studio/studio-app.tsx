'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import {
  Menu,
  Files,
  GitBranch,
  Sparkles,
  Terminal as TerminalIcon,
  Eye,
  Code2,
  X,
  Rocket,
  Plus,
  Check,
  ChevronDown,
  FileEdit,
  Smartphone,
  Send,
  Loader2,
  Copy,
  RefreshCw,
  Download,
  PanelLeft,
} from 'lucide-react'
import { AppShell } from '../app/app-shell'
import { FileExplorer } from './file-explorer'
import { CodeEditor } from './code-editor'
import { TerminalPanel } from './terminal-panel'
import { InlineEditDialog } from './inline-edit-dialog'
import { MiniGame } from '../chat/mini-game'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useStudio, useUser } from '@/lib/axiom/store'
import { uid } from '@/lib/axiom/sample-data'
import { generatePlan } from '@/lib/axiom/code-generator'
import type { GeneratedFile } from '@/lib/axiom/code-generator'
import type { ProjectFile, AgentStep } from '@/lib/axiom/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  const { user } = useUser()
  const [openTabs, setOpenTabs] = useState<{ id: string; name: string; path: string }[]>([])
  const [showDeploy, setShowDeploy] = useState(false)
  const [inlineEditOpen, setInlineEditOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [rightView, setRightView] = useState<'preview' | 'code' | 'files'>('preview')
  const [previewHtml, setPreviewHtml] = useState<string>('')

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]

  useEffect(() => {
    if (!activeProject && projects.length === 0) {
      createProject('untitled-project', 'Vite + React')
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
    // If it's HTML, update preview
    if (file.language === 'html' || file.name.endsWith('.html')) {
      setPreviewHtml(file.content)
      setRightView('preview')
    }
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

  // Find HTML file for preview
  useEffect(() => {
    if (activeProject) {
      const findHtml = (files: ProjectFile[]): ProjectFile | null => {
        for (const f of files) {
          if (!f.isDirectory && (f.language === 'html' || f.name.endsWith('.html'))) return f
          if (f.children) {
            const found = findHtml(f.children)
            if (found) return found
          }
        }
        return null
      }
      const htmlFile = findHtml(activeProject.files)
      if (htmlFile) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreviewHtml(htmlFile.content)
      }
    }
  }, [activeProject?.files])

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

  // Helper: call the AI
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

  // Agent chat send
  const handleAgentSend = async () => {
    const projectId = activeProject?.id
    if (!chatInput.trim() || agentRunning || !projectId) return
    const prompt = chatInput.trim()
    setChatInput('')

    // Add user message to chat
    setChatMessages((prev) => [...prev, { role: 'user', content: prompt }])

    setAgentRunning(true)

    // Check if it's a build request
    const lowerPrompt = prompt.toLowerCase()
    const hasBuildVerb = /\b(build|create|make|generate|scaffold|code|program|develop|implement|write me a|write a function|write a component|add a feature|fix this code|refactor)\b/.test(lowerPrompt)
    const isBuildRequest = hasBuildVerb && (
      lowerPrompt.includes('app') || lowerPrompt.includes('website') || lowerPrompt.includes('component') ||
      lowerPrompt.includes('page') || lowerPrompt.includes('shop') || lowerPrompt.includes('game') ||
      lowerPrompt.includes('todo') || lowerPrompt.includes('dashboard') || lowerPrompt.includes('landing') ||
      lowerPrompt.includes('api') || lowerPrompt.includes('function') || lowerPrompt.includes('button') ||
      lowerPrompt.includes('form') || lowerPrompt.includes('calculator') || lowerPrompt.includes('blog') ||
      lowerPrompt.includes('project') || lowerPrompt.includes('html')
    )

    if (!isBuildRequest) {
      // Chat response
      const response = await callAI(
        'You are Axiom, an AI coding assistant inside an IDE. Be friendly, concise, and helpful. Answer questions directly.',
        prompt
      )
      const aiResponse = response.trim() || "Hey! I'm the Axiom agent. Tell me what you want to build and I'll create it for you."
      setChatMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }])
      setAgentRunning(false)
      return
    }

    // Build flow
    const localPlan = generatePlan(prompt)
    const filesToCreate = localPlan.files
    let buildLog = `I'll build: ${prompt}\n\nCreating ${filesToCreate.length} files...\n`

    for (let i = 0; i < filesToCreate.length; i++) {
      const file = filesToCreate[i]
      const fileDesc = file.description || file.path.split('/').pop() || 'file'

      // Try AI for file content
      const ext = file.path.split('.').pop()?.toLowerCase() || 'tsx'
      const langMap: Record<string, string> = {
        ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
        css: 'css', json: 'json', html: 'html', md: 'markdown',
        py: 'python', go: 'go', rs: 'rust', java: 'java',
      }
      const lang = file.language || langMap[ext] || 'text'

      const aiContent = await callAI(
        `You are an expert ${lang} developer. Generate complete, production-ready code. No placeholders. Return ONLY raw code.`,
        `Project: ${prompt}\nFile: ${file.path}\nPurpose: ${fileDesc}\n\nWrite the complete file:`
      )

      let finalContent = aiContent.trim()
      if (finalContent.startsWith('```')) {
        finalContent = finalContent.replace(/^```[a-z]*\n?/, '').replace(/```\s*$/, '').trim()
      }

      const isGarbage = !finalContent || finalContent.length < 20 ||
        finalContent.includes('I can definitely help') ||
        finalContent.includes("What's on your mind") ||
        finalContent.includes('Could you tell me')

      if (isGarbage) {
        finalContent = file.content
      }

      if (finalContent && finalContent.length >= 10) {
        addFileToProject(projectId, {
          path: file.path,
          language: lang,
          content: finalContent,
          description: fileDesc,
        })
        buildLog += `✓ Created ${file.path} — ${finalContent.split('\n').length} lines\n`

        // If HTML, update preview
        if (lang === 'html') {
          setPreviewHtml(finalContent)
          setRightView('preview')
        }
      }
    }

    buildLog += `\nDone! Built ${filesToCreate.length} files. Check the preview on the right →`

    setChatMessages((prev) => [...prev, { role: 'assistant', content: buildLog }])
    setAgentRunning(false)
    toast.success('Build complete', { description: `${filesToCreate.length} files created` })
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
        {/* Main work area — two panels: chat | code+preview */}
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
              <ModelBadge modelId="axiom-coder" size="sm" />
              <Button size="sm" className="h-8 gap-1.5 bg-[var(--tangerine)] text-white hover:bg-[var(--tangerine)]/90 rounded-full px-4" onClick={handleDeploy}>
                <Rocket className="h-3.5 w-3.5" />
                Publish
              </Button>
            </div>
          </header>

          {/* Two-panel split: chat | code+preview */}
          <div className="flex-1 min-h-0">
            <PanelGroup direction="horizontal" autoSaveId="axiom-studio-split-v2">
              {/* LEFT: AI Chat panel — user can SEE their messages here */}
              <Panel defaultSize={40} minSize={25} maxSize={55} order={1}>
                <StudioChat
                  messages={chatMessages}
                  running={agentRunning}
                  input={chatInput}
                  setInput={setChatInput}
                  onSend={handleAgentSend}
                  projectName={activeProject?.name || ''}
                  user={user}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-transparent hover:bg-[var(--tangerine)]/30 transition-colors data-[resize-handle-state=drag]:bg-[var(--tangerine)]" />

              {/* RIGHT: File explorer + Code editor + Preview + Terminal */}
              <Panel order={2} minSize={30}>
                <div className="h-full flex flex-col bg-[var(--paper-bright)]">
                  {/* Right panel toolbar */}
                  <div className="flex items-center justify-between h-9 px-3 border-b hairline bg-[var(--background-2)] shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRightView('preview')}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', rightView === 'preview' ? 'bg-[var(--secondary)] text-foreground' : 'text-muted-foreground hover:bg-[var(--secondary)]')}
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setRightView('code')}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', rightView === 'code' ? 'bg-[var(--secondary)] text-foreground' : 'text-muted-foreground hover:bg-[var(--secondary)]')}
                        title="Code"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setRightView('files')}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors', rightView === 'files' ? 'bg-[var(--secondary)] text-foreground' : 'text-muted-foreground hover:bg-[var(--secondary)]')}
                        title="Files"
                      >
                        <Files className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {previewHtml && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => {
                          const blob = new Blob([previewHtml], { type: 'text/html' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'index.html'
                          a.click()
                          toast.success('Downloaded index.html')
                        }}>
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Content area — switches between preview, code, and files */}
                  <div className="flex-1 min-h-0 flex">
                    {/* File explorer strip (always visible on the left of the right panel) */}
                    <div className="w-[180px] shrink-0 border-r hairline hidden sm:block">
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
                            setPreviewHtml('')
                            toast.success('Project cleared')
                          }
                        }}
                      />
                    </div>

                    {/* Main content — preview or code editor */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {rightView === 'preview' && (
                        <div className="flex-1 min-h-0">
                          {previewHtml ? (
                            <iframe
                              srcDoc={previewHtml}
                              className="w-full h-full border-0 bg-white"
                              title="Preview"
                              sandbox="allow-scripts allow-same-origin"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-center p-6">
                              <div>
                                <Eye className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-sm font-medium">No preview yet</p>
                                <p className="text-xs text-muted-foreground mt-1">Ask the agent to build something with HTML</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {rightView === 'code' && (
                        <div className="flex-1 min-h-0 flex flex-col">
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
                          <div className="flex-1 min-h-0">
                            {activeFile ? (
                              <CodeEditor
                                value={activeFile.content}
                                language={activeFile.language}
                                onChange={(v) => activeProjectId && activeFile.id && updateFile(activeProjectId, activeFile.id, v)}
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
                      )}

                      {rightView === 'files' && (
                        <div className="flex-1 min-h-0">
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
                                setPreviewHtml('')
                                toast.success('Project cleared')
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terminal at bottom */}
                  <div className="h-[180px] shrink-0 border-t hairline">
                    <TerminalPanel onClose={() => {}} />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </div>
      </div>

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

// ============ STUDIO CHAT (left panel — user CAN see their messages) ============
function StudioChat({
  messages,
  running,
  input,
  setInput,
  onSend,
  projectName,
  user,
}: {
  messages: { role: 'user' | 'assistant'; content: string }[]
  running: boolean
  input: string
  setInput: (v: string) => void
  onSend: () => void
  projectName: string
  user: any
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [gameDismissed, setGameDismissed] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (running) setGameDismissed(false)
  }, [running])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, running])

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
      </div>

      {/* Chat messages — user can SEE both their messages and AI responses */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--tangerine)] mb-4 glow-tangerine">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-serif text-lg font-medium">Build with the agent</h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[240px]">
              Tell the agent what to build. It will create real files you can preview on the right.
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
          <div className="px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                {/* Avatar */}
                <div className="shrink-0 pt-0.5">
                  {msg.role === 'user' ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--secondary)] text-[10px] font-medium">
                      {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'YO'}
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tangerine)]">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                {/* Message content */}
                <div className={cn('min-w-0 flex-1', msg.role === 'user' && 'flex flex-col items-end')}>
                  <div className="text-[11px] text-muted-foreground mb-0.5">
                    {msg.role === 'user' ? 'You' : 'Axiom'}
                  </div>
                  <div className={cn(
                    'rounded-xl px-3.5 py-2.5 text-[13px] leading-[1.6] whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-[var(--secondary)] text-foreground max-w-[85%]'
                      : 'text-foreground/90'
                  )}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {running && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--tangerine)]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[var(--tangerine)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[var(--tangerine)] animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[var(--tangerine)] animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Working…</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini-game while working */}
      {running && !gameDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="absolute bottom-32 right-4 z-40 shadow-xl"
          style={{ width: 260 }}
        >
          <MiniGame onClose={() => setGameDismissed(true)} compact />
        </motion.div>
      )}

      {/* Input — floating at bottom */}
      <div className="p-3 border-t hairline shrink-0">
        <div className="relative rounded-xl border hairline bg-[var(--card)] focus-within:border-[var(--tangerine)]/50 focus-within:ring-1 focus-within:ring-[var(--tangerine)]/30 transition-all shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
            placeholder="Describe what to build…  Use @file to reference files"
            rows={2}
            className="w-full resize-none bg-transparent px-3.5 pt-3 pb-10 text-sm placeholder:text-muted-foreground focus:outline-none"
            style={{ minHeight: '60px', maxHeight: '120px' }}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-[var(--secondary)] hover:text-foreground transition-colors">
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onSend}
              disabled={!input.trim() || running}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--tangerine)] text-white disabled:opacity-40 hover:bg-[var(--tangerine)]/90 transition-colors"
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
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
        The IDE needs a larger screen for the chat + code + preview split. Open on a desktop to get the full experience.
      </p>
    </div>
  )
}
