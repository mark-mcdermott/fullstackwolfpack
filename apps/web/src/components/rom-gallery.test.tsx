import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RomGallery } from './rom-gallery'

describe('RomGallery', () => {
  it('renders catalog tiles and the upload tile', () => {
    render(<RomGallery onSelect={vi.fn()} />)
    expect(screen.getByText('Alter Ego')).toBeInTheDocument()
    expect(screen.getByText('Tobu Tobu Girl')).toBeInTheDocument()
    expect(screen.getByText('Add your ROM')).toBeInTheDocument()
  })

  it('filters by system tab', async () => {
    const user = userEvent.setup()
    render(<RomGallery onSelect={vi.fn()} />)

    // Game Boy tab should hide the NES title.
    await user.click(screen.getByRole('button', { name: 'Game Boy' }))
    expect(screen.getByText('Tobu Tobu Girl')).toBeInTheDocument()
    expect(screen.queryByText('Alter Ego')).not.toBeInTheDocument()
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    render(<RomGallery onSelect={vi.fn()} />)

    await user.type(screen.getByLabelText('Search games'), 'anguna')
    expect(screen.getByText('Anguna')).toBeInTheDocument()
    expect(screen.queryByText('Alter Ego')).not.toBeInTheDocument()
  })

  it('selects a catalog game on Play', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RomGallery onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: 'Play Alter Ego' }))

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'catalog', id: 'alter-ego' }),
    )
  })

  it('accepts a valid uploaded ROM', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RomGallery onSelect={onSelect} />)

    const file = new File([new Uint8Array([1, 2, 3, 4])], 'my-game.gba')
    await user.upload(screen.getByLabelText('Choose file'), file)

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'upload',
        system: 'gba',
        title: 'My Game',
        file,
      }),
    )
  })

  it('rejects an unsupported upload and shows an error', () => {
    const onSelect = vi.fn()
    render(<RomGallery onSelect={onSelect} />)

    // fireEvent bypasses the input's `accept` filter, exercising the same
    // guard that protects users who override the file picker.
    const file = new File(['hello'], 'cheats.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Choose file'), {
      target: { files: [file] },
    })

    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/unsupported/i)
  })
})
