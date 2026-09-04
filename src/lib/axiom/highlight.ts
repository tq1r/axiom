/**
 * Single-pass syntax highlighter.
 * Tokenizes the code first, then wraps each token in a span.
 * This avoids the corruption caused by sequential regex replacements.
 */

type TokenType = 'comment' | 'string' | 'keyword' | 'number' | 'function' | 'tag' | 'plain'

interface Token {
  type: TokenType
  value: string
}

const KEYWORDS = new Set([
  'import', 'export', 'from', 'default', 'const', 'let', 'var', 'function',
  'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'implements',
  'interface', 'type', 'enum', 'async', 'await', 'new', 'try', 'catch',
  'finally', 'throw', 'switch', 'case', 'break', 'continue', 'this', 'super',
  'static', 'public', 'private', 'protected', 'readonly', 'get', 'set',
  'void', 'null', 'undefined', 'true', 'false', 'def', 'print', 'func', 'fn',
  'mut', 'pub', 'struct', 'impl', 'trait', 'use', 'match', 'self', 'in', 'of',
  'as', 'is', 'not', 'and', 'or', 'local', 'then', 'end', 'do', 'nil',
  'require', 'module', 'exports', 'typeof', 'instanceof', 'yield', 'delete',
  'namespace', 'abstract', 'virtual', 'override', 'namespace',
])

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function tokenize(code: string, lang: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = code.length
  const isLua = ['lua'].includes(lang)
  const isPy = ['py', 'python'].includes(lang)
  const isShell = ['sh', 'bash', 'shell', 'zsh'].includes(lang)
  const isYaml = ['yml', 'yaml', 'toml'].includes(lang)
  const isJsx = ['tsx', 'jsx'].includes(lang)

  while (i < len) {
    const ch = code[i]
    const next = code[i + 1]

    // Line comment: // or # or --
    if ((ch === '/' && next === '/') || (ch === '-' && next === '-') || (isPy && ch === '#') || (isShell && ch === '#') || (isYaml && ch === '#') || (isLua && ch === '-')) {
      let end = code.indexOf('\n', i)
      if (end === -1) end = len
      tokens.push({ type: 'comment', value: code.slice(i, end) })
      i = end
      continue
    }

    // Block comment: /* */
    if (ch === '/' && next === '*') {
      let end = code.indexOf('*/', i + 2)
      if (end === -1) end = len
      else end += 2
      tokens.push({ type: 'comment', value: code.slice(i, end) })
      i = end
      continue
    }

    // String: '...' "..." `...`
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch
      let j = i + 1
      while (j < len) {
        if (code[j] === '\\') { j += 2; continue }
        if (code[j] === quote) { j++; break }
        if (code[j] === '\n' && quote !== '`') break
        j++
      }
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    // Number: 123, 1.5, 0x1a, etc
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next))) {
      let j = i
      while (j < len && /[0-9._a-fA-FxX]/.test(code[j])) j++
      tokens.push({ type: 'number', value: code.slice(i, j) })
      i = j
      continue
    }

    // Identifier / keyword / function
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i
      while (j < len && /[a-zA-Z0-9_$]/.test(code[j])) j++
      const word = code.slice(i, j)
      // Check if it's a function call (followed by optional space then paren)
      let k = j
      while (k < len && code[k] === ' ') k++
      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word })
      } else if (code[k] === '(') {
        tokens.push({ type: 'function', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
      i = j
      continue
    }

    // JSX tag: <Component or </Component
    if (isJsx && ch === '<' && /[a-zA-Z/]/.test(next)) {
      // Emit the < and then the tag name as a 'tag' token
      let j = i + 1
      if (code[j] === '/') j++
      while (j < len && /[a-zA-Z0-9.]/.test(code[j])) j++
      tokens.push({ type: 'tag', value: code.slice(i, j) })
      i = j
      continue
    }

    // Default: single char
    tokens.push({ type: 'plain', value: ch })
    i++
  }

  return tokens
}

const STYLES: Record<TokenType, string> = {
  comment: 'color: var(--muted-foreground); font-style: italic;',
  string: 'color: var(--forest);',
  keyword: 'color: var(--tangerine); font-weight: 500;',
  number: 'color: var(--ochre);',
  function: 'color: #4A6FA5;',
  tag: 'color: var(--tangerine);',
  plain: '',
}

export function highlightCode(code: string, lang: string): string {
  const tokens = tokenize(code, lang)
  return tokens
    .map((t) => {
      const escaped = escapeHtml(t.value)
      if (t.type === 'plain' || !STYLES[t.type]) return escaped
      return `<span style="${STYLES[t.type]}">${escaped}</span>`
    })
    .join('')
}
