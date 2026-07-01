import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { loadKeyboardBinds } from '@/lib/controls-store'
import { ControlsPanel } from './controls-panel'

afterEach(() => localStorage.clear())

describe('ControlsPanel', () => {
  it('shows RetroArch keyboard defaults', () => {
    render(<ControlsPanel />)
    expect(screen.getByRole('button', { name: 'Rebind B' })).toHaveTextContent(
      'Z',
    )
    expect(
      screen.getByRole('button', { name: 'Rebind Start' }),
    ).toHaveTextContent('Enter')
  })

  it('rebinds a key on the next press and persists it', async () => {
    const user = userEvent.setup()
    render(<ControlsPanel />)
    const aButton = screen.getByRole('button', { name: 'Rebind A' })
    expect(aButton).toHaveTextContent('X') // default a = x

    await user.click(aButton)
    expect(aButton).toHaveTextContent(/press a key/i)

    fireEvent.keyDown(document.body, { code: 'KeyL' })
    expect(aButton).toHaveTextContent('L')
    expect(loadKeyboardBinds().a).toBe('l')
  })

  it('cancels a rebind on Escape', async () => {
    const user = userEvent.setup()
    render(<ControlsPanel />)
    const aButton = screen.getByRole('button', { name: 'Rebind A' })

    await user.click(aButton)
    fireEvent.keyDown(document.body, { code: 'Escape' })
    expect(aButton).toHaveTextContent('X')
    expect(loadKeyboardBinds().a).toBe('x')
  })

  it('shows gamepad button indices on the gamepad tab', async () => {
    const user = userEvent.setup()
    render(<ControlsPanel />)

    await user.click(screen.getByRole('button', { name: /gamepad/i }))
    expect(screen.getByRole('button', { name: 'Rebind A' })).toHaveTextContent(
      '#1',
    )
  })

  it('restores defaults after a change', async () => {
    const user = userEvent.setup()
    render(<ControlsPanel />)
    const aButton = screen.getByRole('button', { name: 'Rebind A' })

    await user.click(aButton)
    fireEvent.keyDown(document.body, { code: 'KeyL' })
    expect(aButton).toHaveTextContent('L')

    await user.click(screen.getByRole('button', { name: /restore defaults/i }))
    expect(screen.getByRole('button', { name: 'Rebind A' })).toHaveTextContent(
      'X',
    )
    expect(loadKeyboardBinds().a).toBe('x')
  })
})
