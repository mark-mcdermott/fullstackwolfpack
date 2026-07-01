import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LessonMarkdown } from './lesson-markdown'

// Uses code-free markdown so the async Shiki path (CodeBlock) isn't exercised here —
// this test covers the prose rendering; CodeBlock has its own plain-text fallback.

describe('LessonMarkdown', () => {
  it('renders headings, emphasis, and inline code', () => {
    render(
      <LessonMarkdown>
        {'# Promises\n\nUse `await` to resolve a **promise**.'}
      </LessonMarkdown>,
    )
    expect(screen.getByRole('heading', { name: 'Promises' })).toBeInTheDocument()
    expect(screen.getByText('await')).toBeInTheDocument()
    expect(screen.getByText('promise')).toBeInTheDocument()
  })

  it('renders list items', () => {
    render(<LessonMarkdown>{'- one\n- two'}</LessonMarkdown>)
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })
})
