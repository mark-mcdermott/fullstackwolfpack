import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AnswerFeedback, QuestionView } from '@/core/lesson-view'
import { QuizSegment } from './quiz-segment'

// The instant-feedback contract. What makes these tests meaningful is the grade
// function: it returns a promise that never settles, so anything asserted after a
// click is something the player produced without the server.

const keyed: QuestionView = {
  id: 'q1',
  type: 'mcq',
  prompt: 'Which declaration is hoisted?',
  options: ['let', 'var'],
  correctIndex: 1,
  explanation: 'Only `var` is hoisted and initialised to undefined.',
}

const unkeyed: QuestionView = { ...keyed, correctIndex: null, explanation: null }

const neverSettles = () => new Promise<AnswerFeedback>(() => {})

describe('QuizSegment — keyed MCQ', () => {
  it('paints the verdict without waiting for the server', () => {
    render(<QuizSegment questions={[keyed]} onGrade={neverSettles} />)
    fireEvent.click(screen.getByRole('button', { name: /var/ }))

    expect(screen.getByText('Correct')).toBeInTheDocument()
    expect(screen.getByText(/is hoisted and initialised/)).toBeInTheDocument()
    expect(screen.queryByText('Checking…')).not.toBeInTheDocument()
  })

  it('marks a wrong pick and reveals the right one', () => {
    render(<QuizSegment questions={[keyed]} onGrade={neverSettles} />)
    fireEvent.click(screen.getByRole('button', { name: /let/ }))
    expect(screen.getByText('Not quite')).toBeInTheDocument()
  })

  // The whole integrity argument rests on this: the attempt is still recorded, so
  // the server keeps writing quiz_attempts / users.xp from its own grade.
  it('still posts the attempt', () => {
    const onGrade = vi.fn(neverSettles)
    render(<QuizSegment questions={[keyed]} onGrade={onGrade} />)
    fireEvent.click(screen.getByRole('button', { name: /var/ }))
    expect(onGrade).toHaveBeenCalledWith('q1', { selectedIndex: 1 })
  })

  // Fires once, not once per grade source — it is what accrues the lesson XP total,
  // so a second call when the server replies would double-count the question.
  it('reports the answer exactly once, before the server replies', async () => {
    const onAnswered = vi.fn()
    const fb: AnswerFeedback = {
      questionId: 'q1', correct: true, correctIndex: 1,
      explanation: null, feedback: null, score: null, xp: 10,
    }
    render(
      <QuizSegment
        questions={[keyed]}
        onGrade={() => Promise.resolve(fb)}
        onAnswered={onAnswered}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /var/ }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    await Promise.resolve()
    expect(onAnswered).toHaveBeenCalledTimes(1)
  })

  it('keeps the verdict when the background write fails', async () => {
    render(<QuizSegment questions={[keyed]} onGrade={() => Promise.reject(new Error('offline'))} />)
    fireEvent.click(screen.getByRole('button', { name: /var/ }))
    await Promise.resolve()
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })
})

describe('QuizSegment — unkeyed MCQ', () => {
  // The fallback still has to work: a question served without a key must wait for
  // the server rather than paint a guess.
  it('waits for the server and says so', () => {
    render(<QuizSegment questions={[unkeyed]} onGrade={neverSettles} />)
    fireEvent.click(screen.getByRole('button', { name: /var/ }))

    expect(screen.getByText('Checking…')).toBeInTheDocument()
    expect(screen.queryByText('Correct')).not.toBeInTheDocument()
  })
})
