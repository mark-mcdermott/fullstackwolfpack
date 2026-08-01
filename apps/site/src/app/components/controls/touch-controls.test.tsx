import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RomSystem } from '@/core/roms'
import { TouchControls } from './touch-controls'

function setup(system: RomSystem = 'snes') {
  const onDown = vi.fn()
  const onUp = vi.fn()
  render(<TouchControls system={system} onDown={onDown} onUp={onUp} />)
  return { onDown, onUp }
}

describe('TouchControls', () => {
  it('renders the full SNES button set (D-pad + diamond + shoulders + system)', () => {
    setup('snes')
    for (const label of ['D-pad', 'A', 'B', 'X', 'Y', 'L', 'R', 'Start', 'Select']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  it('hides X/Y and shoulders on a two-button system (NES)', () => {
    setup('nes')
    expect(screen.getByLabelText('A')).toBeInTheDocument()
    expect(screen.getByLabelText('B')).toBeInTheDocument()
    for (const label of ['X', 'Y', 'L', 'R']) {
      expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
    }
  })

  it('drives the emulator seam on press and release of a face button', () => {
    const { onDown, onUp } = setup('snes')
    const a = screen.getByLabelText('A')

    fireEvent.pointerDown(a)
    expect(onDown).toHaveBeenCalledWith('a')
    expect(onUp).not.toHaveBeenCalled()

    fireEvent.pointerUp(a)
    expect(onUp).toHaveBeenCalledWith('a')
  })

  it('holds a button once — a repeat pointerdown does not re-fire onDown', () => {
    const { onDown } = setup('nes')
    const b = screen.getByLabelText('B')

    fireEvent.pointerDown(b)
    fireEvent.pointerDown(b)
    expect(onDown).toHaveBeenCalledTimes(1)
  })

  it('releases a held button if it unmounts mid-press (no stuck input)', () => {
    const onDown = vi.fn()
    const onUp = vi.fn()
    const { unmount } = render(
      <TouchControls system="nes" onDown={onDown} onUp={onUp} />,
    )

    fireEvent.pointerDown(screen.getByLabelText('Start'))
    expect(onUp).not.toHaveBeenCalled()

    // A lesson interrupt can unmount the pad while a button is held — cleanup
    // must release it so the emulator doesn't get a stuck press.
    unmount()
    expect(onUp).toHaveBeenCalledWith('start')
  })
})
