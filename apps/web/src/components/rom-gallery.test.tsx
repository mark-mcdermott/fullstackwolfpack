import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EMBED_CATALOG } from '@/lib/embed-catalog'
import { type GamePlaytime, gameKey } from '@/core/playtime'
import { ROM_CATALOG, uploadedRomFromFile } from '@/lib/rom-catalog'
import { SYSTEM_META } from '@/core/roms'
import { RomGallery } from './rom-gallery'

// Assertions derive from ROM_CATALOG (not hardcoded titles) so the suite stays
// meaningful as the curated Green-bucket set grows/shrinks.
const firstRom = ROM_CATALOG[0]

function renderGallery(props: Partial<ComponentProps<typeof RomGallery>> = {}) {
  const handlers = {
    onSelect: props.onSelect ?? vi.fn(),
    onUpload: props.onUpload ?? vi.fn(),
    onDelete: props.onDelete ?? vi.fn(),
  }
  render(
    <RomGallery
      uploads={props.uploads ?? []}
      playtimeByGame={props.playtimeByGame ?? new Map()}
      {...handlers}
    />,
  )
  return handlers
}

describe('RomGallery', () => {
  it('renders every catalog tile and the upload tile', () => {
    renderGallery()
    for (const rom of ROM_CATALOG) {
      expect(screen.getByText(rom.title)).toBeInTheDocument()
    }
    expect(screen.getByText('Add your ROM')).toBeInTheDocument()
  })

  it('groups games into Netflix-style rows by lane', () => {
    renderGallery()
    // A "Web games" row, a row per ROM system, and a "Your library" row.
    expect(
      screen.getByRole('heading', { name: 'Web games' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: SYSTEM_META[firstRom.system].label,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /your library/i }),
    ).toBeInTheDocument()
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    renderGallery()

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
    const { onSelect } = renderGallery()

    await user.click(
      screen.getByRole('button', { name: `Play ${firstRom.title}` }),
    )

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'catalog', id: firstRom.id }),
    )
  })

  it('hands a valid upload to onUpload for persistence', async () => {
    const user = userEvent.setup()
    const { onUpload } = renderGallery()

    const file = new File([new Uint8Array([1, 2, 3, 4])], 'my-game.gba')
    await user.upload(screen.getByLabelText('Add your ROM'), file)

    expect(onUpload).toHaveBeenCalledWith(file, 'gba')
  })

  it('renders stored uploads and can play or remove them', async () => {
    const user = userEvent.setup()
    const rom = uploadedRomFromFile(
      new File([new Uint8Array([1, 2, 3, 4])], 'my-rom.gba'),
      'gba',
    )
    const { onSelect, onDelete } = renderGallery({ uploads: [rom] })

    expect(screen.getByText('My Rom')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Play My Rom' }))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'upload', id: rom.id }),
    )

    await user.click(screen.getByRole('button', { name: 'Remove My Rom' }))
    expect(onDelete).toHaveBeenCalledWith(rom.id)
  })

  it('renders embed (web) games and selects one on Play', async () => {
    const user = userEvent.setup()
    const { onSelect } = renderGallery()

    const firstEmbed = EMBED_CATALOG[0]
    expect(screen.getByText(firstEmbed.title)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: `Play ${firstEmbed.title}` }),
    )
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'embed', id: firstEmbed.id }),
    )
  })

  it('shows a played total and floats a recently-played title to the front of its lane', () => {
    const lastRom = ROM_CATALOG[ROM_CATALOG.length - 1]
    const playtimeByGame = new Map<string, GamePlaytime>([
      [
        gameKey(lastRom),
        {
          gameId: gameKey(lastRom),
          source: 'catalog',
          title: lastRom.title,
          seconds: 2520,
          lastPlayedAt: '2026-07-05T12:00:00.000Z',
        },
      ],
    ])
    renderGallery({ playtimeByGame })

    // The played poster surfaces its running total…
    expect(screen.getByText('42m')).toBeInTheDocument()

    // …and floats ahead of the first (unplayed) catalog ROM in DOM order.
    const played = screen.getByRole('heading', { name: lastRom.title })
    const first = screen.getByRole('heading', { name: firstRom.title })
    expect(
      played.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('rejects an unsupported upload and shows an error', () => {
    const { onUpload } = renderGallery()

    // fireEvent bypasses the input's `accept` filter, exercising the same
    // guard that protects users who override the file picker.
    const file = new File(['hello'], 'cheats.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Add your ROM'), {
      target: { files: [file] },
    })

    expect(onUpload).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/unsupported/i)
  })
})
