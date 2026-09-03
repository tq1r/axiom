'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * Lightweight KaTeX-style math renderer.
 * Renders a subset of LaTeX math syntax using HTML/CSS without the full KaTeX library.
 * Supports: fractions, superscript, subscript, Greek letters, common operators, sqrt, sum, int.
 */

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'θ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'π',
  rho: 'ρ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'φ',
  varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
}

const OPS: Record<string, string> = {
  'times': '×', 'div': '÷', 'pm': '±', 'mp': '∓', 'cdot': '·',
  'leq': '≤', 'geq': '≥', 'neq': '≠', 'approx': '≈', 'equiv': '≡',
  'infty': '∞', 'partial': '∂', 'nabla': '∇', 'propto': '∝',
  'in': '∈', 'notin': '∉', 'subset': '⊂', 'supset': '⊃',
  'cup': '∪', 'cap': '∩', 'emptyset': '∅', 'forall': '∀', 'exists': '∃',
  'rightarrow': '→', 'leftarrow': '←', 'Rightarrow': '⇒', 'Leftarrow': '⇐',
  'leftrightarrow': '↔', 'Leftrightarrow': '⇔', 'mapsto': '↦',
  'sum': '∑', 'prod': '∏', 'int': '∫', 'oint': '∮',
  'langle': '⟨', 'rangle': '⟩', 'lfloor': '⌊', 'rfloor': '⌋',
  'lceil': '⌈', 'rceil': '⌉', 'ell': 'ℓ', 'Re': 'ℜ', 'Im': 'ℑ',
  'aleph': 'ℵ', 'hbar': 'ℏ', 'circ': '∘', 'bullet': '•',
  'to': '→', 'gets': '←',
}

function tokenizeLatex(src: string): string {
  let out = src
  // Replace \ Greek and operator commands
  for (const [cmd, sym] of Object.entries({ ...GREEK, ...OPS })) {
    out = out.replace(new RegExp('\\\\' + cmd + '\\b', 'g'), sym)
  }
  // \text{...}
  out = out.replace(/\\text\{([^}]*)\}/g, '$1')
  // \mathrm{...}
  out = out.replace(/\\mathrm\{([^}]*)\}/g, '$1')
  // \frac{a}{b}  →  a/b stacked
  out = out.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => {
    return `<span class="axiom-math-frac"><span class="axiom-math-num">${a}</span><span class="axiom-math-den">${b}</span></span>`
  })
  // \sqrt{x}
  out = out.replace(/\\sqrt\{([^{}]*)\}/g, '<span class="axiom-math-sqrt">$1</span>')
  // \overline{x}
  out = out.replace(/\\overline\{([^{}]*)\}/g, '<span style="text-decoration:overline">$1</span>')
  // \hat{x}
  out = out.replace(/\\hat\{([^}]*)\}/g, '<span style="position:relative">$1<span style="position:absolute;left:0;right:0;top:-0.5em;text-align:center;font-size:0.7em">^</span></span>')
  // Superscript ^{...} or ^x
  out = out.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>')
  out = out.replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>')
  // Subscript _{...} or _x
  out = out.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>')
  out = out.replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>')
  // \left( \right)  →  just parens (already there)
  out = out.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
  out = out.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']')
  out = out.replace(/\\left\{/g, '{').replace(/\\right\}/g, '}')
  // \, \; \: \! spacing — collapse
  out = out.replace(/\\[,:;!]/g, ' ')
  // Strip remaining backslash commands we don't handle
  out = out.replace(/\\[a-zA-Z]+/g, '')
  return out
}

export function Math({ expression, display = false }: { expression: string; display?: boolean }) {
  const html = useMemo(() => tokenizeLatex(expression), [expression])
  return (
    <span
      className={cn('axiom-math', display && 'axiom-math-display')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
