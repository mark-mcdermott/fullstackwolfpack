import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GitExerciseView } from '@/core/lesson-view'
import { TerminalExercise } from './terminal-exercise'

// This file exists for one reason: the component referenced `secondaryCtaClass`
// on its three buttons without importing it, which is a ReferenceError the
// moment it renders. Nothing caught it because nothing renders it — the git
// lane is built but the live catalogue is JavaScript-only, so every exercise in
// it is `kind: 'js'` and this branch is never taken. It would have fired on the
// first git topic to be seeded or generated.
//
// So the assertions are deliberately shallow. The point is that it mounts.
const exercise: GitExerciseView = {
  kind: 'git',
  id: 'ex1',
  prompt: 'Commit the file.',
  setup: [],
  goals: [{ type: 'commitCountAtLeast', count: 1 }],
  solution: ['git init', 'git add a.txt', 'git commit -m "add a"'],
  hint: 'Stage it first.',
}

describe('TerminalExercise', () => {
  it('renders its controls', () => {
    render(<TerminalExercise exercise={exercise} />)
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show solution/i })).toBeInTheDocument()
  })

  // The hint button is the one that is conditional, so it gets its own case.
  it('omits the hint button when the exercise has none', () => {
    render(<TerminalExercise exercise={{ ...exercise, hint: null }} />)
    expect(screen.queryByRole('button', { name: /hint/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })
})
