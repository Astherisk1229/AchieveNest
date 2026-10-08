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
import { applyStructuredFieldDefaults } from '../../components/StructuredDetailsFields'

const taxonomy = [{ id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', name: 'Leadership Position', subcategories: [{ id: '40000001-0001-0000-0000-000000000001', name: 'SSG / University Student Government' }] }]

describe('PortfolioAchievementSubmissionModal', () => {
  it('renders the evidence-first form without creating a record', () => {
    const html = renderToStaticMarkup(<PortfolioAchievementSubmissionModal isOpen onClose={vi.fn()} taxonomy={taxonomy} />)
    expect(html).toContain('Upload supporting evidence')
    expect(html).toContain('Leadership Position')
    expect(html).toContain('Choose a subcategory to see the details it needs.')
    expect(html).not.toContain('Basic Information')
    expect(html).toContain('Save draft')
    expect(html).toContain('Submit for review')
    expect(portfolioService.createRecord).not.toHaveBeenCalled()
  })

  it('orders the form evidence, classification, then configured details without generic fields', () => {
    const html = renderToStaticMarkup(<PortfolioAchievementSubmissionModal isOpen onClose={vi.fn()} taxonomy={taxonomy} />)
    const order = ['Upload supporting evidence', 'Category and subcategory', 'Choose a subcategory to see the details it needs.'].map(text => html.indexOf(text))
    expect(order.every(index => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(html).not.toContain('Activity / Event Title')
    expect(html).not.toContain('Organizer / Issuing Body')
    expect(html).not.toContain('Start Date')
    expect(html).toMatch(/id="evidence-file-input"(?![^>]*disabled)/)
  })

  it('renders nothing when closed', () => {
    expect(renderToStaticMarkup(<PortfolioAchievementSubmissionModal isOpen={false} onClose={vi.fn()} />)).toBe('')
  })

  it('shows no point or score wording', () => {
    const html = renderToStaticMarkup(<PortfolioAchievementSubmissionModal isOpen onClose={vi.fn()} taxonomy={taxonomy} />)
    expect(html).not.toMatch(/\bpoints?\b|\bscore\b/i)
  })

  it('persists displayed schema defaults so required semester validation receives a value', () => {
    const metadata = applyStructuredFieldDefaults(
      { schema_version: '1.0' },
      [{ key: 'semester', defaultValue: '1st_semester' }, { key: 'academic_year', defaultValue: '2025-2026' }]
    )

    expect(metadata).toMatchObject({ semester: '1st_semester', academic_year: '2025-2026' })
  })
})
