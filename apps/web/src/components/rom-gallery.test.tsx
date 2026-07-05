import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ROM_CATALOG } from '@/lib/rom-catalog'
import { SYSTEM_META } from '@/core/roms'
import { RomGallery } from './rom-gallery'

// Assertions derive from ROM_CATALOG (not hardcoded titles) so the suite stays
// meaningful as the curated Green-bucket set grows/shrinks.
const firstRom = ROM_CATALOG[0]

describe('RomGallery', () => {
  it('renders every catalog tile and the upload tile', () => {
    render(<RomGallery onSelect={vi.fn()} />)
    for (const rom of ROM_CATALOG) {
      expect(screen.getByText(rom.title)).toBeInTheDocument()
    }
    expect(screen.getByText('Add your ROM')).toBeInTheDocument()
  })

  it('filters by system tab', async () => {
    const user = userEvent.setup()
    render(<RomGallery onSelect={vi.fn()} />)

    // Selecting a system tab shows that system's titles and hides the rest.
    await user.click(
      screen.getByRole('button', { name: SYSTEM_META[firstRom.system].label }),
    )
    for (const rom of ROM_CATALOG) {
      const tile = screen.queryByText(rom.title)
      if (rom.system === firstRom.system) {
        expect(tile).toBeInTheDocument()
      } else {
        expect(tile).not.toBeInTheDocument()
      }
    }
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    render(<RomGallery onSelect={vi.fn()} />)

    await user.type(screen.getByLabelText('Search games'), firstRom.title)
    expect(screen.getByText(firstRom.title)).toBeInTheDocument()
    for (const rom of ROM_CATALOG) {
      if (rom.id !== firstRom.id) {
        expect(screen.queryByText(rom.title)).not.toBeInTheDocument()
      }
    }
  })

  it('selects a catalog game on Play', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RomGallery onSelect={onSelect} />)

    await user.click(
      screen.getByRole('button', { name: `Play ${firstRom.title}` }),
    )

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'catalog', id: firstRom.id }),
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
