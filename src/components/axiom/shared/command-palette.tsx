'use client'

import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  MessageSquare,
  Code2,
  LayoutDashboard,
  Cpu,
  CreditCard,
  Settings,
  Search,
  Plus,
  FolderPlus,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useNav, useChat, useStudio } from '@/lib/axiom/store'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const {
    commandOpen,
    setCommandOpen,
    navigate,
    setActiveThread,
    setActiveProject,
    setActiveFile,
  } = useNav()
  const { threads, createThread } = useChat()
  const { projects, createProject } = useStudio()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    setOpen(commandOpen)
  }, [commandOpen])

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    setCommandOpen(v)
  }

  const go = (view: Parameters<typeof navigate>[0]) => {
    navigate(view)
    onOpenChange(false)
  }

  const newChat = () => {
    const id = createThread()
    setActiveThread(id)
    go('chat')
  }

  const newProject = () => {
    const id = createProject('untitled-project', 'Vite + React')
    setActiveProject(id)
    setActiveFile(null)
    go('studio')
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search threads, projects, actions…" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={newChat} className="gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400">
              <Plus className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="flex-1">New chat</span>
            <kbd className="text-[10px] text-muted-foreground">Axiom Chat</kbd>
          </CommandItem>
          <CommandItem onSelect={newProject} className="gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500">
              <FolderPlus className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="flex-1">New project</span>
            <kbd className="text-[10px] text-muted-foreground">Axiom Studio</kbd>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('dashboard')} className="gap-3">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span>Go to Dashboard</span>
            <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </CommandItem>
          <CommandItem onSelect={() => go('chat')} className="gap-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>Go to Axiom Chat</span>
          </CommandItem>
          <CommandItem onSelect={() => go('studio')} className="gap-3">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span>Go to Axiom Studio</span>
          </CommandItem>
          <CommandItem onSelect={() => go('models')} className="gap-3">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span>Go to Models</span>
          </CommandItem>
          <CommandItem onSelect={() => go('pricing')} className="gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>Go to Pricing</span>
          </CommandItem>
          <CommandItem onSelect={() => go('settings')} className="gap-3">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Go to Settings</span>
          </CommandItem>
        </CommandGroup>

        {threads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Threads">
              {threads.slice(0, 6).map((t) => (
                <CommandItem
                  key={t.id}
                  onSelect={() => {
                    setActiveThread(t.id)
                    go('chat')
                  }}
                  className="gap-3"
                >
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-[10px] text-muted-foreground">{t.messages.length} msgs</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 5).map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => {
                    setActiveProject(p.id)
                    go('studio')
                  }}
                  className="gap-3"
                >
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.template}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => go('landing')} className="gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Back to home page</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
