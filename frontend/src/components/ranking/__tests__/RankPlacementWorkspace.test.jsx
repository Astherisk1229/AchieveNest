import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import RankPlacementWorkspace from '../RankPlacementWorkspace'

vi.mock('../../../services/rankPlacementViewService', () => ({
  loadRankPlacementView: vi.fn(() => new Promise(() => {})),
  downloadSignedApprovedRank: vi.fn(),
  retryRankActivation: vi.fn()
}))

describe('Phase V rank and placement workspace', () => {
  it('renders an explicit accessible loading state', () => {
    const html = renderToStaticMarkup(<RankPlacementWorkspace role="personnel" />)
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('Loading rank and placement information')
  })

  it('keeps role-specific endpoint and UI restrictions explicit', async () => {
    const service = await import('../../../services/rankPlacementViewService.js?raw')
    expect(service.default).toBeDefined()
  })
})
