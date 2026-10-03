import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { alertDialog, confirmDialog, promptDialog } from '../DialogProvider'
import { ConfirmDialog } from '../ConfirmDialog'

describe('DialogProvider helpers', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('falls back to the native confirm when no provider is mounted', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('window', { confirm })
    await expect(confirmDialog({ title: 'Remove?', message: 'Remove this item?' })).resolves.toBe(true)
    expect(confirm).toHaveBeenCalledWith('Remove this item?')
  })

  it('falls back to the native alert when no provider is mounted', async () => {
    const alert = vi.fn()
    vi.stubGlobal('window', { alert })
    await alertDialog('Saved.')
    expect(alert).toHaveBeenCalledWith('Saved.')
  })

  it('falls back to the native prompt and returns null when cancelled', async () => {
    vi.stubGlobal('window', { prompt: vi.fn(() => null) })
    await expect(promptDialog({ title: 'Reason', required: true })).resolves.toBeNull()
    vi.stubGlobal('window', { prompt: vi.fn(() => 'Corrected') })
    await expect(promptDialog({ title: 'Reason' })).resolves.toBe('Corrected')
  })

  it('renders a text field for prompts', () => {
    const html = renderToStaticMarkup(<ConfirmDialog isOpen title="Change DS?" inputLabel="Reason for the change" inputRequired inputValue="" onInputChange={() => {}} onConfirm={() => {}} onCancel={() => {}} />)
    expect(html).toContain('Reason for the change')
    expect(html).toContain('<textarea')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Discard Changes/)
  })

  it('renders a single-button notice for alerts', () => {
    const html = renderToStaticMarkup(<ConfirmDialog isOpen hideCancel tone="success" title="Report generated" message="Done" confirmLabel="OK" onConfirm={() => {}} onCancel={() => {}} />)
    expect(html).toContain('Report generated')
    expect(html).toContain('OK')
    expect(html).not.toContain('Continue Editing')
  })
})
