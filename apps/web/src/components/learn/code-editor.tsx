import { javascript } from '@codemirror/lang-javascript'
import { EditorView, basicSetup } from 'codemirror'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// A small CodeMirror 6 editor for in-browser exercises (Phase 4). CM6 is modular
// and has first-class touch/mobile support, so it works in the Capacitor/Tauri
// webviews (docs/education-system.md §4.3). The parent owns the value; external
// changes (Reset / Show solution) are pushed into the doc without a re-create.
export function CodeEditor({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
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
        javascript({ typescript: true }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
        }),
        EditorView.theme({
          '&': { fontSize: '13px', backgroundColor: 'transparent' },
          '.cm-scroller': { fontFamily: 'var(--font-mono, ui-monospace, monospace)' },
          '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
        }),
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
