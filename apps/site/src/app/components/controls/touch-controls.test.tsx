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


  // The question this answers: can you hold a direction and press a face button
  // at the same time? Each control captures its own pointer id, so they should
  // not interfere — but nothing proved it until now.
  it('holds a direction and a face button at once (multi-touch)', () => {
    const onDown = vi.fn()
    const onUp = vi.fn()
    render(<TouchControls system="nes" onDown={onDown} onUp={onUp} />)

    const pad = screen.getByLabelText('D-pad')
    // jsdom gives every element a zero rect, and the pad reads its own box to
    // work out which direction a touch is in — so it has to be faked.
    pad.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 120, height: 120, right: 120, bottom: 120, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect

    // Finger 1: top of the pad -> up.
    fireEvent.pointerDown(pad, { pointerId: 1, clientX: 60, clientY: 6 })
    expect(onDown).toHaveBeenCalledWith('up')

    // Finger 2: the A button, while up is still held.
    fireEvent.pointerDown(screen.getByLabelText('A'), { pointerId: 2 })
    expect(onDown).toHaveBeenCalledWith('a')
    expect(onUp).not.toHaveBeenCalled()

    // Releasing A leaves the direction held.
    fireEvent.pointerUp(screen.getByLabelText('A'), { pointerId: 2 })
    expect(onUp).toHaveBeenCalledWith('a')
    expect(onUp).not.toHaveBeenCalledWith('up')

    fireEvent.pointerUp(pad, { pointerId: 1, clientX: 60, clientY: 6 })
    expect(onUp).toHaveBeenCalledWith('up')
  })

  // A second finger landing on the pad must not steal it from the first, or a
  // stray palm touch would swap the direction mid-press.
  it('ignores a second pointer on the D-pad while one is already driving it', () => {
    const onDown = vi.fn()
    const onUp = vi.fn()
    render(<TouchControls system="nes" onDown={onDown} onUp={onUp} />)
    const pad = screen.getByLabelText('D-pad')
    pad.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 120, height: 120, right: 120, bottom: 120, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect

    fireEvent.pointerDown(pad, { pointerId: 1, clientX: 60, clientY: 6 })
    onDown.mockClear()
    fireEvent.pointerDown(pad, { pointerId: 2, clientX: 6, clientY: 60 })
    expect(onDown).not.toHaveBeenCalled()
    expect(onUp).not.toHaveBeenCalled()
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
