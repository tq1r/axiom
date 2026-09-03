'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * Minimal Mermaid-like flowchart renderer.
 * Parses a tiny subset: graph TD/LR, node declarations (A[label]), arrows (A --> B), styled nodes.
 * Renders as inline SVG. Not a full Mermaid replacement — just enough for chat demos.
 */

interface MermaidNode {
  id: string
  label: string
  x: number
  y: number
  shape?: 'rect' | 'round' | 'diamond'
}

interface MermaidEdge {
  from: string
  to: string
  label?: string
}

export function MermaidDiagram({ code }: { code: string }) {
  const { nodes, edges, direction, error } = useMemo(() => parseMermaid(code), [code])

  if (error) {
    return (
      <div className="axiom-mermaid">
        <span className="axiom-mermaid-label">Mermaid</span>
        <pre className="text-xs font-mono text-muted-foreground text-left overflow-x-auto">{code}</pre>
      </div>
    )
  }

  const isLR = direction === 'LR'
  const width = isLR ? Math.max(nodes.length * 180, 360) : 360
  const height = isLR ? 200 : Math.max(nodes.length * 80, 200)

  return (
    <div className="axiom-mermaid">
      <span className="axiom-mermaid-label">Diagram</span>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full h-auto"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted-foreground" />
          </marker>
        </defs>
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodes.find((n) => n.id === edge.from)
          const to = nodes.find((n) => n.id === edge.to)
          if (!from || !to) return null
          return (
            <g key={`e-${i}`}>
              <path
                d={isLR
                  ? `M ${from.x + 70} ${from.y} L ${to.x - 70} ${to.y}`
                  : `M ${from.x} ${from.y + 20} L ${to.x} ${to.y - 20}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground/60"
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text
                  x={isLR ? (from.x + to.x) / 2 : from.x + 10}
                  y={isLR ? from.y - 6 : (from.y + to.y) / 2}
                  className="fill-muted-foreground text-[10px]"
                >
                  {edge.label}
                </text>
              )}
            </g>
          )
        })}
        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {node.shape === 'diamond' ? (
              <polygon
                points={`${node.x},${node.y - 20} ${node.x + 60},${node.y} ${node.x},${node.y + 20} ${node.x - 60},${node.y}`}
                fill="hsl(var(--card))"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-accent"
              />
            ) : (
              <rect
                x={node.x - 70}
                y={node.y - 18}
                width={140}
                height={36}
                rx={node.shape === 'round' ? 18 : 6}
                fill="hsl(var(--card))"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-accent"
              />
            )}
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-medium"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function parseMermaid(code: string): {
  nodes: MermaidNode[]
  edges: MermaidEdge[]
  direction: string
  error?: string
} {
  const lines = code.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { nodes: [], edges: [], direction: 'TD', error: 'empty' }

  const firstLine = lines[0]
  const directionMatch = firstLine.match(/graph\s+(TD|LR|TB|RL|BT)/i)
  const direction = directionMatch ? directionMatch[1].toUpperCase().replace('TB', 'TD') : 'TD'

  const nodeMap = new Map<string, { label: string; shape?: 'rect' | 'round' | 'diamond' }>()
  const edges: MermaidEdge[] = []
  const order: string[] = []

  for (let i = directionMatch ? 1 : 0; i < lines.length; i++) {
    const line = lines[i]
    // Edge: A --> B  or  A -->|label| B
    const edgeMatch = line.match(/^(\w+)\s*-->\s*(?:\|([^|]+)\|\s*)?(\w+)$/)
    if (edgeMatch) {
      const [, from, label, to] = edgeMatch
      if (!nodeMap.has(from)) { nodeMap.set(from, { label: from }); order.push(from) }
      if (!nodeMap.has(to)) { nodeMap.set(to, { label: to }); order.push(to) }
      edges.push({ from, to, label })
      continue
    }
    // Node with label: A[label] or A(label) or A{label} or A((label))
    const nodeMatch = line.match(/^(\w+)\s*(?:\[([^\]]+)\]|\(([^)]+)\)|\{([^}]+)\})$/)
    if (nodeMatch) {
      const [, id, rectLabel, roundLabel, diamondLabel] = nodeMatch
      const label = rectLabel || roundLabel || diamondLabel || id
      const shape = diamondLabel ? 'diamond' : roundLabel ? 'round' : 'rect'
      if (!nodeMap.has(id)) order.push(id)
      nodeMap.set(id, { label, shape })
      continue
    }
    // Plain node
    const plainMatch = line.match(/^(\w+)$/)
    if (plainMatch) {
      const id = plainMatch[1]
      if (!nodeMap.has(id)) { nodeMap.set(id, { label: id }); order.push(id) }
    }
  }

  // Layout: place nodes in a grid
  const nodes: MermaidNode[] = order.map((id, i) => {
    const meta = nodeMap.get(id)!
    const isLR = direction === 'LR' || direction === 'RL'
    if (isLR) {
      const perCol = Math.min(Math.ceil(order.length / 2), 3)
      const col = Math.floor(i / perCol)
      const row = i % perCol
      return {
        id,
        label: meta.label,
        shape: meta.shape,
        x: 90 + col * 180,
        y: 50 + row * 60,
      }
    }
    return {
      id,
      label: meta.label,
      shape: meta.shape,
      x: 180,
      y: 50 + i * 70,
    }
  })

  return { nodes, edges, direction }
}
