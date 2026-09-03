'use client'

import { useState, useEffect, useMemo } from 'react'
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
} from 'lucide-react'
import { AppShell } from '../app/app-shell'
import { FileExplorer } from './file-explorer'
import { CodeEditor } from './code-editor'
import { AiPanel } from './ai-panel'
import { TerminalPanel } from './terminal-panel'
import { InlineEditDialog } from './inline-edit-dialog'
import { ModelBadge } from '../shared/model-badge'
import { useNav, useStudio } from '@/lib/axiom/store'
import { uid } from '@/lib/axiom/sample-data'
import type { ProjectFile } from '@/lib/axiom/types'
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
  } = useStudio()
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'git'>('explorer')
  const [bottomOpen, setBottomOpen] = useState(true)
  const [openTabs, setOpenTabs] = useState<{ id: string; name: string; path: string }[]>([])
  const [showDeploy, setShowDeploy] = useState(false)
  const [ghostText, setGhostText] = useState<string | null>(null)
  const [inlineEditOpen, setInlineEditOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState('')

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0]

  // Ensure there's a project
  useEffect(() => {
    if (!activeProject && projects.length === 0) {
      createProject('axiom-dashboard', 'Vite + React')
    }
  }, [])

  // Find active file object
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

  // Open a file in a tab
  const handleSelectFile = (file: ProjectFile) => {
    if (file.isDirectory) return
    setActiveFile(file.id)
    setOpenTabs((prev) => {
      if (prev.find((t) => t.id === file.id)) return prev
      return [...prev, { id: file.id, name: file.name, path: file.path }]
    })
    // Simulate ghost text after a delay
    setTimeout(() => {
      if (file.language === 'tsx' || file.language === 'typescript') {
        setGhostText('// Axiom Coder suggestion: useMemo for derived state')
      } else {
        setGhostText(null)
      }
    }, 1500)
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

  // Open the first file by default
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
        // Use the first ~200 chars of the active file as "selected code" for the demo
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
      // For the demo, prepend the new code as a comment block at the top
      const updated = activeFile
        ? newCode + '\n\n' + activeFile.content
        : newCode
      updateFile(activeProjectId, activeFileId, updated)
    }
  }

  const handleDeploy = () => {
    toast.success('Deployment started', {
      description: 'Building and deploying to production…',
    })
    setTimeout(() => {
      setShowDeploy(true)
    }, 1500)
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
        {/* Activity bar */}
        <div className="w-12 shrink-0 flex flex-col items-center py-2 gap-1 bg-sidebar border-r border-sidebar-border">
          <ActivityIcon icon={Files} active={sidebarView === 'explorer'} onClick={() => setSidebarView('explorer')} label="Explorer" />
          <ActivityIcon icon={Search} active={sidebarView === 'search'} onClick={() => setSidebarView('search')} label="Search" />
          <ActivityIcon icon={GitBranch} active={sidebarView === 'git'} onClick={() => setSidebarView('git')} label="Source control" />
          <div className="flex-1" />
          <ActivityIcon icon={Sparkles} active={false} onClick={() => setAiPanelOpen(!aiPanelOpen)} label="AI Panel" />
          <ActivityIcon icon={SettingsIcon} active={false} onClick={() => navigate('settings')} label="Settings" />
        </div>

        {/* Main work area with resizable panels */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0 bg-background/60">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate('dashboard')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium truncate">{activeProject?.name || 'No project'}</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{activeProject?.template}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setBottomOpen(!bottomOpen)}
              >
                <TerminalIcon className="h-3.5 w-3.5" />
                Terminal
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Panel
              </Button>
              <div className="h-4 w-px bg-border mx-1" />
              <ModelBadge modelId="axiom-coder" size="sm" />
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
                onClick={handleDeploy}
              >
                <Rocket className="h-3.5 w-3.5" />
                Deploy
              </Button>
            </div>
          </header>

          {/* Resizable panels */}
          <div className="flex-1 min-h-0">
            <PanelGroup direction="horizontal" autoSaveId="axiom-studio-h">
              {/* File explorer */}
              <Panel defaultSize={16} minSize={12} maxSize={25} order={1}>
                {activeProject && (
                  <FileExplorer
                    files={activeProject.files}
                    activeFileId={activeFileId}
                    onSelect={handleSelectFile}
                    projectName={activeProject.name}
                  />
                )}
              </Panel>
              <ResizeHandle />

              {/* Center: editor + bottom panel */}
              <Panel order={2} minSize={30}>
                <PanelGroup direction="vertical" autoSaveId="axiom-studio-v">
                  <Panel defaultSize={70} minSize={30}>
                    {/* Editor with tabs */}
                    <div className="h-full flex flex-col bg-[var(--paper-bright)]">
                      {/* Tabs */}
                      <div className="flex items-center h-9 border-b hairline bg-[var(--background-2)] shrink-0 overflow-x-auto scroll-thin">
                        {openTabs.map((tab) => (
                          <div
                            key={tab.id}
                            className={cn(
                              'group flex items-center gap-2 h-full pl-3 pr-2 border-r hairline text-xs cursor-pointer transition-colors',
                              tab.id === activeFileId
                                ? 'bg-[var(--paper-bright)] text-foreground'
                                : 'text-muted-foreground hover:bg-white/[0.02]'
                            )}
                            onClick={() => setActiveFile(tab.id)}
                          >
                            <FileEdit className="h-3 w-3" />
                            {tab.name}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCloseTab(tab.id)
                              }}
                              className="flex h-4 w-4 items-center justify-center rounded hover:bg-white/10 opacity-0 group-hover:opacity-100"
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
                            onAcceptGhost={() => {
                              setGhostText(null)
                              toast.success('Suggestion accepted')
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-center p-6">
                            <div>
                              <Code2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                              <p className="text-sm font-medium">No file open</p>
                              <p className="text-xs text-muted-foreground mt-1">Select a file from the explorer to start editing</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status bar */}
                      <div className="flex items-center justify-between h-6 px-3 bg-[var(--background-2)] border-t hairline text-[10px] text-muted-foreground shrink-0">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-2.5 w-2.5" /> main
                          </span>
                          <span>UTF-8</span>
                          <span>LF</span>
                          <span className="uppercase">{activeFile?.language || 'plaintext'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>Ln 1, Col 1</span>
                          <span>Spaces: 2</span>
                          <span className="text-accent flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Axiom Coder
                          </span>
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {bottomOpen && (
                    <>
                      <PanelResizeHandle className="h-1 bg-transparent hover:bg-accent/30 transition-colors data-[resize-handle-state=drag]:bg-accent" />
                      <Panel defaultSize={30} minSize={10} maxSize={60}>
                        <TerminalPanel onClose={() => setBottomOpen(false)} />
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              </Panel>

              {aiPanelOpen && (
                <>
                  <ResizeHandle />
                  <Panel defaultSize={24} minSize={18} maxSize={35} order={3}>
                    <AiPanel onClose={() => setAiPanelOpen(false)} />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </div>
        </div>
      </div>

      {/* Deploy dialog */}
      <Dialog open={showDeploy} onOpenChange={setShowDeploy}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deployment ready</DialogTitle>
            <DialogDescription>
              Your project has been built and deployed to the edge.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">Build succeeded</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>✓ Compiled 24 modules</div>
              <div>✓ Optimized assets (312 KB gzipped)</div>
              <div>✓ Deployed to 18 edge regions</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Production URL</div>
            <div className="font-mono text-sm text-accent">https://{activeProject?.name || 'project'}.axiom.app</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeploy(false)}>Close</Button>
            <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowDeploy(false)}>
              <Eye className="mr-2 h-4 w-4" />
              Visit site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline edit dialog (Cmd+I) */}
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

function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-1 bg-transparent hover:bg-accent/30 transition-colors data-[resize-handle-state=drag]:bg-accent" />
  )
}

function ActivityIcon({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-md transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
            )}
          >
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-accent" />}
            <Icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

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

function MobileStudio() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 mb-6">
        <Smartphone className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-xl font-semibold">Axiom Studio is best on desktop</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        The IDE experience needs a larger screen for the file explorer, editor, and AI panels.
        Open this on a desktop or laptop to get the full experience.
      </p>
      <Button
        variant="outline"
        className="mt-6"
        onClick={() => window.location.reload()}
      >
        <Play className="mr-2 h-4 w-4" />
        Try anyway
      </Button>
    </div>
  )
}
