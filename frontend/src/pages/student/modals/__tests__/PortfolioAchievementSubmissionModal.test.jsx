import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../services/portfolioService', () => ({
  default: {
    fetchRecord: vi.fn(), createRecord: vi.fn(), updateRecord: vi.fn(), addEvidence: vi.fn(),
    scanEvidence: vi.fn(), removeEvidence: vi.fn(), resubmitRecord: vi.fn(), downloadEvidence: vi.fn()
  }
}))

import portfolioService from '../../../../services/portfolioService'
import PortfolioAchievementSubmissionModal from '../PortfolioAchievementSubmissionModal'

const taxonomy = [{ id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', name: 'Leadership Position', subcategories: [{ id: '40000001-0001-0000-0000-000000000001', name: 'SSG / University Student Government' }] }]

describe('PortfolioAchievementSubmissionModal', () => {
  it('renders the evidence-first form without creating a record', () => {
    const html = renderToStaticMarkup(<PortfolioAchievementSubmissionModal isOpen onClose={vi.fn()} taxonomy={taxonomy} />)
    expect(html).toContain('Upload supporting evidence')
    expect(html).toContain('Leadership Position')
    expect(html).toContain('Select a category first')
    expect(html).toContain('Save draft')
    expect(html).toContain('Submit for review')
    expect(portfolioService.createRecord).not.toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    expect(renderToStaticMarkup(<PortfolioAchievementSubmissionModal isOpen={false} onClose={vi.fn()} />)).toBe('')
  })

  it('shows no point or score wording', () => {
    const html = renderToStaticMarkup(<PortfolioAchievementSubmissionModal isOpen onClose={vi.fn()} taxonomy={taxonomy} />)
    expect(html).not.toMatch(/\bpoints?\b|\bscore\b/i)
  })
})
