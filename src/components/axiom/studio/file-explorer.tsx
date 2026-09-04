'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Braces,
  Hash,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectFile } from '@/lib/axiom/types'

interface FileExplorerProps {
  files: ProjectFile[]
  activeFileId: string | null
  onSelect: (file: ProjectFile) => void
  projectName: string
  onClear?: () => void
}

function FileIconView({ name, className }: { name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'rb', 'php'].includes(ext || '')) return <FileCode className={className} />
  if (['json'].includes(ext || '')) return <FileJson className={className} />
  if (['md', 'txt'].includes(ext || '')) return <FileText className={className} />
  if (['css', 'scss', 'html'].includes(ext || '')) return <Hash className={className} />
  if (['yml', 'yaml', 'toml'].includes(ext || '')) return <Braces className={className} />
  return <FileIcon className={className} />
}

export function FileExplorer({ files, activeFileId, onSelect, projectName, onClear }: FileExplorerProps) {
  return (
    <div className="h-full flex flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)]">
      <div className="flex items-center justify-between h-9 px-3 border-b hairline shrink-0">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Explorer</span>
        {files.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Clear all files"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="px-2 py-1.5 border-b hairline shrink-0">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <FolderOpen className="h-3.5 w-3.5 text-[var(--tangerine)]" />
          {projectName}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin py-1">
        {files.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-muted-foreground">No files yet.<br />Ask the agent to build something.</p>
          </div>
        ) : (
          files.map((file) => (
            <FileNode
              key={file.id}
              file={file}
              depth={0}
              activeFileId={activeFileId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface FileNodeProps {
  file: ProjectFile
  depth: number
  activeFileId: string | null
  onSelect: (file: ProjectFile) => void
}

function FileNode({ file, depth, activeFileId, onSelect }: FileNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const isActive = file.id === activeFileId

  if (file.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1 h-7 px-2 text-sm hover:bg-sidebar-accent transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-accent shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="truncate">{file.name}</span>
        </button>
        {expanded && file.children && (
          <div>
            {file.children.map((child) => (
              <FileNode
                key={child.id}
                file={child}
                depth={depth + 1}
                activeFileId={activeFileId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => onSelect(file)}
      className={cn(
        'w-full flex items-center gap-1.5 h-7 px-2 text-sm transition-colors',
        isActive
          ? 'bg-accent/15 text-accent'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
      )}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      <FileIconView name={file.name} className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-accent' : 'text-muted-foreground')} />
      <span className="truncate">{file.name}</span>
    </button>
  )
}
