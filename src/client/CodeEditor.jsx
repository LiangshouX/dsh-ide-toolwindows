/**
 * The editable code surface (CodeMirror 6).
 *
 * Mounted only while a tab is in edit mode; the document is seeded from the
 * tab's draft and every change flows back through `onChange` (the store keeps
 * the dirty flag). Mod-s calls `onSave`. The theme reads the workbench CSS
 * variables, so light/dark skins need no remount.
 */
import React, { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightSpecialChars,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { sql } from '@codemirror/lang-sql'
import { yaml } from '@codemirror/lang-yaml'
import { xml } from '@codemirror/lang-xml'
import { cpp } from '@codemirror/lang-cpp'
import { go } from '@codemirror/lang-go'
import { rust } from '@codemirror/lang-rust'

/** Language extension for one file path (empty = plain text). */
export function languageForPath(path) {
  const lower = String(path ?? '').toLowerCase()
  const dot = lower.lastIndexOf('.')
  const ext = dot < 0 ? '' : lower.slice(dot)
  switch (ext) {
    case '.js': case '.mjs': case '.cjs': return javascript()
    case '.jsx': return javascript({ jsx: true })
    case '.ts': case '.mts': case '.cts': return javascript({ typescript: true })
    case '.tsx': return javascript({ typescript: true, jsx: true })
    case '.json': case '.jsonc': case '.json5': return json()
    case '.md': case '.markdown': case '.mdx': return markdown()
    case '.py': case '.pyw': case '.pyi': return python()
    case '.java': return java()
    case '.css': case '.scss': case '.less': return css()
    case '.html': case '.htm': case '.vue': case '.svelte': return html()
    case '.sql': return sql()
    case '.yml': case '.yaml': return yaml()
    case '.xml': case '.svg': case '.xsl': case '.xsd': return xml()
    case '.c': case '.h': case '.cpp': case '.cc': case '.cxx': case '.hpp': case '.hh': return cpp()
    case '.go': return go()
    case '.rs': return rust()
    default: return []
  }
}

const HIGHLIGHT = HighlightStyle.define([
  { tag: tags.comment, color: '#7a8596', fontStyle: 'italic' },
  { tag: [tags.string, tags.special(tags.string)], color: '#5f8f3f' },
  { tag: [tags.keyword, tags.modifier], color: '#a15fb0' },
  { tag: [tags.number, tags.bool, tags.null], color: '#b57a2a' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#2f8f83' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#8a6a1f' },
  { tag: [tags.propertyName, tags.attributeName], color: '#3f6f9f' },
  { tag: [tags.tagName, tags.angleBracket], color: '#c05a63' },
  { tag: tags.heading, color: '#3b7dd8', fontWeight: 'bold' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.link, color: '#3b7dd8', textDecoration: 'underline' },
  { tag: tags.invalid, color: '#e2686f' },
])

const THEME = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'var(--itw-bg)', color: 'var(--itw-fg)' },
  '.cm-scroller': { fontFamily: 'var(--itw-mono)', fontSize: '13px', lineHeight: '1.6', overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--itw-accent)', padding: '10px 0' },
  '.cm-line': { padding: '0 14px 0 6px' },
  '.cm-gutters': {
    backgroundColor: 'var(--itw-bg)',
    color: 'var(--itw-muted)',
    border: 'none',
    borderRight: '1px solid var(--itw-border)',
    paddingLeft: '6px',
  },
  '.cm-lineNumbers .cm-gutterElement': { minWidth: '34px', padding: '0 8px 0 4px' },
  '.cm-activeLine': { backgroundColor: 'rgba(127,127,127,.075)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--itw-fg)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(76,154,255,.24) !important' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(76,154,255,.25)', outline: '1px solid rgba(76,154,255,.5)' },
  '.cm-searchMatch': { backgroundColor: 'rgba(215,162,74,.28)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--itw-accent)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-panels': { backgroundColor: 'var(--itw-panel)', color: 'var(--itw-fg)' },
  '.cm-tooltip': { backgroundColor: 'var(--itw-overlay)', border: '1px solid var(--itw-border-strong)' },
}, { dark: true })

/**
 * One editable buffer.
 * @param {{ value: string, path: string, fontSize?: number, resetToken?: number,
 *   onChange: (text: string) => void, onSave: () => void,
 *   onCursor?: (position: { line: number, col: number }) => void }} props
 */
export function CodeEditor({ value, path, fontSize = 13, resetToken = 0, onChange, onSave, onCursor }) {
  const hostRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)
  const onCursorRef = useRef(onCursor)
  onChangeRef.current = onChange
  onSaveRef.current = onSave
  onCursorRef.current = onCursor

  useEffect(() => {
    const host = hostRef.current
    if (host === null) return undefined
    const language = languageForPath(path)
    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      syntaxHighlighting(HIGHLIGHT),
      THEME,
      EditorView.theme({ '.cm-scroller': { fontSize: `${fontSize}px` } }),
      keymap.of([
        { key: 'Mod-s', run: () => { onSaveRef.current(); return true } },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      ...(Array.isArray(language) ? language : [language]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        if (update.selectionSet || update.docChanged) {
          const head = update.state.selection.main.head
          const line = update.state.doc.lineAt(head)
          onCursorRef.current?.({ line: line.number, col: head - line.from + 1 })
        }
      }),
    ]
    const view = new EditorView({
      state: EditorState.create({ doc: value ?? '', extensions }),
      parent: host,
    })
    view.focus()
    return () => { view.destroy() }
    // The component is keyed by tab, so a path/reset change is the only reason
    // to rebuild the document; keystrokes flow through onChange instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, resetToken])

  return React.createElement('div', { className: 'itw-codemirror', ref: hostRef })
}
