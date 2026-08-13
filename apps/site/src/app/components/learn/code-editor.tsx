import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { EditorView, basicSetup } from 'codemirror'
import { useEffect, useRef } from 'react'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { cn } from '@/lib/utils'

// A small CodeMirror 6 editor for in-browser exercises (Phase 4). CM6 is modular
// and has first-class touch/mobile support, so it works in the Capacitor/Tauri
// webviews (docs/education-system.md §4.3). The parent owns the value; external
// changes (Reset / Show solution) are pushed into the doc without a re-create.
// The editor's colours, matched to the lesson code blocks.
//
// CodeMirror ships its own default highlight style — blues and purples that
// appear nowhere else in the product — so an exercise looked like a different
// application from the block explaining it two segments earlier.
//
// It highlights by Lezer tag rather than TextMate scope, so it cannot share
// Shiki's theme object. It reads the same palette through the `--code-*`
// variables instead, which also means it re-colours on a theme switch with no
// JS and no re-render: the variables change, the editor follows.
const FW_HIGHLIGHT = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--code-comment)' },
  {
    tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.definitionKeyword, t.operatorKeyword],
    color: 'var(--code-keyword)',
  },
  { tag: [t.string, t.special(t.string)], color: 'var(--code-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--code-number)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--code-function)' },
  { tag: [t.typeName, t.className, t.namespace], color: 'var(--code-type)' },
  { tag: [t.variableName, t.propertyName], color: 'var(--code-variable)' },
  { tag: [t.definition(t.variableName)], color: 'var(--code-variable)' },
  { tag: [t.operator, t.punctuation, t.bracket, t.separator], color: 'var(--code-punctuation)' },
  { tag: [t.tagName], color: 'var(--code-tag)' },
  { tag: [t.invalid], color: 'var(--code-invalid)' },
])

export function CodeEditor({
  value,
  onChange,
  language = 'js',
  className,
}: {
  value: string
  onChange: (value: string) => void
  language?: 'js' | 'ts' | 'python'
  className?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!host.current) return
    const v = new EditorView({
      doc: value,
      parent: host.current,
      extensions: [
        basicSetup,
        language === 'python' ? python() : javascript({ typescript: true }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
        }),
        EditorView.theme({
          // The same surface as a read-only code block, so an exercise reads
          // as a block you can type in rather than as a separate widget. It
          // was transparent, which put the editor on `--card` — legible
          // (4.62:1 at worst) but a different backdrop from the blocks whose
          // colours these are.
          '&': { fontSize: '13px', backgroundColor: 'var(--code-surface)' },
          '.cm-scroller': { fontFamily: 'var(--font-mono, ui-monospace, monospace)' },
          '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
        }),
        syntaxHighlighting(FW_HIGHLIGHT),
      ],
    })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
    // Create once — external value syncs happen in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push external value changes (Reset / Show solution) into the editor.
  useEffect(() => {
    const v = view.current
    if (v && value !== v.state.doc.toString()) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={host} className={cn('overflow-hidden border border-border text-left', className)} />
}
