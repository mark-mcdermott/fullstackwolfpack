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

  it('hyperlinks a glossary term to Wikipedia when terms are provided', () => {
    render(
      <LessonMarkdown terms={['closures']}>
        {'JavaScript closures are powerful.'}
      </LessonMarkdown>,
    )
    const link = screen.getByRole('link', { name: 'closures' })
    expect(link).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Special:Search?search=closures',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('does not linkify a term that appears inside inline code', () => {
    render(
      <LessonMarkdown terms={['await']}>
        {'Type `await` in code, then await the value in prose.'}
      </LessonMarkdown>,
    )
    // Only the prose occurrence is linked — the one inside <code> stays text.
    const links = screen.getAllByRole('link', { name: 'await' })
    expect(links).toHaveLength(1)
  })

  it('adds no links when no terms are given', () => {
    render(<LessonMarkdown>{'Plain closures text.'}</LessonMarkdown>)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
