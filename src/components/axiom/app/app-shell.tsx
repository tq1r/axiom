'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  Code2,
  Cpu,
  CreditCard,
  Settings,
  Search,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { AxiomLogo } from '../shared/logo'
import { ThemeToggle } from '../shared/theme-toggle'
import { useNav, useUser, useChat, useStudio } from '@/lib/axiom/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AppShellProps {
  children: React.ReactNode
  activeView: 'dashboard' | 'chat' | 'studio' | 'models' | 'pricing' | 'settings'
  /** For chat/studio which have their own sidebars, hide the app rail on mobile */
  embedded?: boolean
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'studio', label: 'Studio', icon: Code2 },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'pricing', label: 'Pricing', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export function AppShell({ children, activeView, embedded = false }: AppShellProps) {
  const { navigate, setCommandOpen } = useNav()
  const { user, signOut } = useUser()
  const { threads, createThread, setActiveThread } = useChat()
  const { projects, createProject, setActiveProject, setActiveFile } = useStudio()
  const [collapsed, setCollapsed] = useState(false)

  const handleNewChat = () => {
    const id = createThread()
    setActiveThread(id)
    navigate('chat')
  }

  const handleNewProject = () => {
    const id = createProject('untitled-project', 'Vite + React')
    setActiveProject(id)
    setActiveFile(null)
    navigate('studio')
  }

  const handleSignOut = () => {
    signOut()
    navigate('landing')
  }

  if (!user) return null

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Left rail */}
      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar shrink-0 transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-[248px]',
          embedded && 'hidden lg:flex'
        )}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-sidebar-border shrink-0">
          {collapsed ? (
            <button onClick={() => navigate('dashboard')} className="mx-auto">
              <AxiomLogo size={26} showWordmark={false} />
            </button>
          ) : (
            <button onClick={() => navigate('dashboard')} className="px-1">
              <AxiomLogo size={26} />
            </button>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search / command */}
        <div className="p-2 border-b border-sidebar-border shrink-0">
          {collapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setCommandOpen(true)}
                    className="mx-auto flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Search (⌘K)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center gap-2 h-9 px-3 rounded-md border border-sidebar-border bg-sidebar-accent/50 text-sm text-muted-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="text-[10px] font-mono opacity-60">⌘K</kbd>
            </button>
          )}
        </div>

        {/* Quick actions */}
        <div className="p-2 space-y-1 border-b border-sidebar-border shrink-0">
          {collapsed ? (
            <>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewChat}
                      className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white hover:opacity-90 transition-opacity"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">New chat</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewProject}
                      className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-teal-500 text-white hover:opacity-90 transition-opacity"
                    >
                      <Code2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">New project</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <>
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors group"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-violet-500">
                  <MessageSquare className="h-3 w-3 text-white" />
                </div>
                <span className="flex-1 text-left">New chat</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={handleNewProject}
                className="w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors group"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-cyan-400 to-teal-500">
                  <Code2 className="h-3 w-3 text-white" />
                </div>
                <span className="flex-1 text-left">New project</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </>
          )}
        </div>

        {/* Recent threads (only when expanded and not in studio) */}
        {!collapsed && activeView !== 'studio' && threads.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto axiom-scroll-thin p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Recent chats</div>
            {threads.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveThread(t.id)
                  navigate('chat')
                }}
                className={cn(
                  'w-full flex items-center gap-2 h-8 px-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors group',
                  activeView === 'chat' && 'bg-sidebar-accent text-foreground'
                )}
              >
                <MessageSquare className="h-3 w-3 shrink-0" />
                <span className="flex-1 text-left truncate">{t.title}</span>
              </button>
            ))}
            {projects.length > 0 && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 mt-3">Projects</div>
                {projects.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p.id)
                      navigate('studio')
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 h-8 px-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors group',
                      activeView === 'studio' && 'bg-sidebar-accent text-foreground'
                    )}
                  >
                    <Code2 className="h-3 w-3 shrink-0" />
                    <span className="flex-1 text-left truncate">{p.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {collapsed && <div className="flex-1" />}

        {/* Nav items */}
        <nav className="p-2 border-t border-sidebar-border shrink-0 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activeView === item.id
            if (collapsed) {
              return (
                <TooltipProvider key={item.id} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.id)}
                        className={cn(
                          'mx-auto flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                          active
                            ? 'bg-sidebar-accent text-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            }
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User + theme */}
        <div className="p-2 border-t border-sidebar-border shrink-0">
          <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'flex items-center gap-2 rounded-md hover:bg-sidebar-accent transition-colors min-w-0',
                  collapsed ? 'h-9 w-9 justify-center' : 'h-9 px-2 flex-1'
                )}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-cyan-400 text-white text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-medium truncate">{user.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{user.plan.toUpperCase()} plan</div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('settings')}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('pricing')}>
                  <CreditCard className="h-4 w-4 mr-2" /> Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!collapsed && <ThemeToggle />}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile top bar (when embedded) */}
        {embedded && (
          <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
            <button onClick={() => navigate('dashboard')}>
              <AxiomLogo size={24} />
            </button>
            <Button size="sm" variant="ghost" onClick={() => navigate('dashboard')}>
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
