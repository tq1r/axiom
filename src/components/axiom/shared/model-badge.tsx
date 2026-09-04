'use client'

import { Sparkles, Zap, Code, Eye } from 'lucide-react'
import { MODELS } from '@/lib/axiom/models'
import { cn } from '@/lib/utils'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  zap: Zap,
  code: Code,
  eye: Eye,
}

interface ModelBadgeProps {
  modelId: string
  size?: 'sm' | 'md'
  showName?: boolean
  className?: string
}

export function ModelBadge({ modelId, size = 'sm', showName = true, className }: ModelBadgeProps) {
  const model = MODELS.find((m) => m.id === modelId)
  if (!model) return null
  const Icon = ICONS[model.icon] || Sparkles

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br', model.badgeColor)}>
        <Icon className="h-2 w-2 text-white" />
      </span>
      {showName && <span className="text-foreground/90">{model.name}</span>}
    </span>
  )
}
