'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Archive,
  MoreHorizontal,
  X,
  Check,
} from 'lucide-react'
import { useNav, useChat } from '@/lib/axiom/store'
import { AxiomLogo } from '../shared/logo'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/axiom/sample-data'
import { ModelBadge } from '../shared/model-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface ChatSidebarProps {
  open: boolean
  onClose: () => void
}

export function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  const { navigate } = useNav()
  const {
    threads,
    createThread,
    setActiveThread,
    activeThreadId,
    deleteThread,
    togglePin,
    renameThread,
    archiveThread,
  } = useChat()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  // Group threads by date — like the z.ai chat sidebar
  const now = Date.now()
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
  const thirtyDaysAgo = now - 30 * 86400000

  const pinned = filtered.filter((t) => t.pinned && !t.archived)
  const today = filtered.filter((t) => !t.pinned && !t.archived && t.updatedAt >= startOfToday.getTime())
  const yesterday = filtered.filter((t) => !t.pinned && !t.archived && t.updatedAt >= startOfYesterday.getTime() && t.updatedAt < startOfToday.getTime())
  const previous = filtered.filter((t) => !t.pinned && !t.archived && t.updatedAt >= thirtyDaysAgo && t.updatedAt < startOfYesterday.getTime())
  const older = filtered.filter((t) => !t.pinned && !t.archived && t.updatedAt < thirtyDaysAgo)

  const handleNew = () => {
    const id = createThread()
    setActiveThread(id)
    onClose()
  }

  const startEdit = (id: string, title: string) => {
    setEditingId(id)
    setEditValue(title)
  }

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      renameThread(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed lg:relative z-40 lg:z-auto inset-y-0 left-0 w-[280px] flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-sidebar-border shrink-0">
          <button onClick={() => navigate('dashboard')} className="px-1">
            <AxiomLogo size={24} />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNew}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-sidebar-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full h-9 pl-8 pr-3 rounded-md border border-sidebar-border bg-sidebar-accent/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Thread list — grouped by date */}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin p-2">
          {pinned.length > 0 && (
            <DateGroup label="Pinned" icon={<Pin className="h-3 w-3" />}>
              {pinned.map((t) => (
                <ThreadItem key={t.id} thread={t} active={t.id === activeThreadId} editing={editingId === t.id} editValue={editValue} onEditChange={setEditValue} onCommitEdit={commitEdit} onSelect={() => { setActiveThread(t.id); onClose() }} onPin={() => togglePin(t.id)} onDelete={() => deleteThread(t.id)} onArchive={() => archiveThread(t.id)} onRename={() => startEdit(t.id, t.title)} />
              ))}
            </DateGroup>
          )}

          {today.length > 0 && (
            <DateGroup label="Today">
              {today.map((t) => (
                <ThreadItem key={t.id} thread={t} active={t.id === activeThreadId} editing={editingId === t.id} editValue={editValue} onEditChange={setEditValue} onCommitEdit={commitEdit} onSelect={() => { setActiveThread(t.id); onClose() }} onPin={() => togglePin(t.id)} onDelete={() => deleteThread(t.id)} onArchive={() => archiveThread(t.id)} onRename={() => startEdit(t.id, t.title)} />
              ))}
            </DateGroup>
          )}

          {yesterday.length > 0 && (
            <DateGroup label="Yesterday">
              {yesterday.map((t) => (
                <ThreadItem key={t.id} thread={t} active={t.id === activeThreadId} editing={editingId === t.id} editValue={editValue} onEditChange={setEditValue} onCommitEdit={commitEdit} onSelect={() => { setActiveThread(t.id); onClose() }} onPin={() => togglePin(t.id)} onDelete={() => deleteThread(t.id)} onArchive={() => archiveThread(t.id)} onRename={() => startEdit(t.id, t.title)} />
              ))}
            </DateGroup>
          )}

          {previous.length > 0 && (
            <DateGroup label="Previous 30 days">
              {previous.map((t) => (
                <ThreadItem key={t.id} thread={t} active={t.id === activeThreadId} editing={editingId === t.id} editValue={editValue} onEditChange={setEditValue} onCommitEdit={commitEdit} onSelect={() => { setActiveThread(t.id); onClose() }} onPin={() => togglePin(t.id)} onDelete={() => deleteThread(t.id)} onArchive={() => archiveThread(t.id)} onRename={() => startEdit(t.id, t.title)} />
              ))}
            </DateGroup>
          )}

          {older.length > 0 && (
            <DateGroup label="Older">
              {older.map((t) => (
                <ThreadItem key={t.id} thread={t} active={t.id === activeThreadId} editing={editingId === t.id} editValue={editValue} onEditChange={setEditValue} onCommitEdit={commitEdit} onSelect={() => { setActiveThread(t.id); onClose() }} onPin={() => togglePin(t.id)} onDelete={() => deleteThread(t.id)} onArchive={() => archiveThread(t.id)} onRename={() => startEdit(t.id, t.title)} />
              ))}
            </DateGroup>
          )}

          {filtered.length === 0 && (
            <div className="px-2 py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {search ? 'No matches found.' : 'No conversations yet.'}
              </p>
              {!search && (
                <Button size="sm" variant="ghost" onClick={handleNew} className="mt-3 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Start one
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border shrink-0">
          <button
            onClick={() => navigate('dashboard')}
            className="w-full flex items-center gap-2 h-9 px-3 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Back to dashboard
          </button>
        </div>
      </aside>
    </>
  )
}

function DateGroup({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 flex items-center gap-1">
        {icon}
        {label}
      </div>
      {children}
    </div>
  )
}

interface ThreadItemProps {
  thread: {
    id: string
    title: string
    modelId: string
    updatedAt: number
    pinned?: boolean
    messages: { id: string }[]
  }
  active: boolean
  editing: boolean
  editValue: string
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onSelect: () => void
  onPin: () => void
  onDelete: () => void
  onArchive: () => void
  onRename: () => void
}

function ThreadItem({
  thread,
  active,
  editing,
  editValue,
  onEditChange,
  onCommitEdit,
  onSelect,
  onPin,
  onDelete,
  onArchive,
  onRename,
}: ThreadItemProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-md px-2 h-9 transition-colors cursor-pointer',
        active ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitEdit()
            if (e.key === 'Escape') onCommitEdit()
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-none outline-none text-sm"
        />
      ) : (
        <span className="flex-1 text-sm truncate">{thread.title}</span>
      )}
      {!editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onRename}>
                <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPin}>
                {thread.pinned ? <PinOff className="h-3.5 w-3.5 mr-2" /> : <Pin className="h-3.5 w-3.5 mr-2" />}
                {thread.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="h-3.5 w-3.5 mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
