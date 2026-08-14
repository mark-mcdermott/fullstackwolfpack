import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { FwMobileMenu } from './fw-mobile-menu'

const items = [
  { to: '/', label: 'Mission', end: true },
  { to: '/javascript', label: 'JavaScript' },
  { to: '/play', label: 'Arcade' },
  { to: '/review', label: 'Review', badge: 3 },
]

function renderMenu({ open = true } = {}) {
  const onOpenChange = vi.fn()
  render(
    <MemoryRouter initialEntries={['/']}>
      <FwMobileMenu items={items} open={open} onOpenChange={onOpenChange} />
    </MemoryRouter>,
  )
  return { onOpenChange }
}

describe('FwMobileMenu', () => {
  it('holds the whole bar nav, including the items the bar itself drops', () => {
    renderMenu()
    for (const { label } of items) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument()
    }
    // Review only appears in the bar from `lg`; the panel is the one place it
    // is reachable at this width, count and all.
    expect(screen.getByLabelText('3 reviews due')).toBeInTheDocument()
  })

  it('closes when a route is picked', async () => {
    const { onOpenChange } = renderMenu()
    await userEvent.click(screen.getByRole('link', { name: /arcade/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('sets the theme and stays open, so the change can be seen landing', async () => {
    const { onOpenChange } = renderMenu()
    await userEvent.click(screen.getByRole('radio', { name: /dark/i }))
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('radio', { name: /dark/i })).toBeChecked()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('renders nothing but the trigger while closed', () => {
    renderMenu({ open: false })
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
