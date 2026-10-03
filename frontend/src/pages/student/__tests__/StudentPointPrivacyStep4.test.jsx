import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { full_name: 'Test Student', student_id: 'S-1' } }) }))
vi.mock('../../../services/authService', () => ({ getCurrentUser: () => null }))
vi.mock('../../../services/apiClient', () => ({ default: { get: vi.fn(async () => ({ data: {} })), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../../../services/portfolioService', () => ({
  default: {
    fetchRecords: vi.fn(async () => []), fetchCategories: vi.fn(async () => []), fetchRecord: vi.fn(),
    createRecord: vi.fn(), updateRecord: vi.fn(), addEvidence: vi.fn(), scanEvidence: vi.fn(), readEvidence: vi.fn(),
    removeEvidence: vi.fn(), resubmitRecord: vi.fn(), downloadEvidence: vi.fn()
  }
}))

import StudentPortfolioPage, { summarizePortfolio } from '../StudentPortfolioPage'
import StudentDashboardPage, { toTimelineItem } from '../StudentDashboardPage'
import StudentAchievementsPage from '../StudentAchievementsPage'
import ExportPortfolioPreviewModal, { toExportItem } from '../modals/ExportPortfolioPreviewModal'

const POINT_TEXT = /\bpoints?\b|\bscores?\b/i
const FAKE_PEOPLE = /Maria Santos|Juan Dela Cruz|2024-01234|Dean's Lister|Basketball Intramurals Champion/

const textOf = element => renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>).replace(/<[^>]+>/g, ' ')

const records = [
  { id: 'r1', title: 'SSG Secretary', status: 'verified', category_name: 'Leadership Position', start_date: '2025-08-01', organizer_or_body: 'SSG', evidence: [{ id: 'e1', original_filename: 'appointment.pdf' }], structured_metadata: '{"academic_year":"2025-2026"}' },
  { id: 'r2', title: 'Outreach', status: 'submitted', category_name: 'Community Service / Volunteerism', evidence_count: 1 },
  { id: 'r3', title: 'Returned item', status: 'revision_requested', category_name: 'Sports' },
  { id: 'r4', title: 'Unfinished', status: 'draft', category_name: 'Sports' }
]

describe('Step 4: student pages show no point or score values', () => {
  it.each([
    ['StudentPortfolioPage', <StudentPortfolioPage currentUser={{ full_name: 'Test Student' }} />],
    ['StudentDashboardPage', <StudentDashboardPage currentUser={{ full_name: 'Test Student' }} />],
    ['StudentAchievementsPage', <StudentAchievementsPage />],
    ['ExportPortfolioPreviewModal', <ExportPortfolioPreviewModal isOpen onClose={() => {}} student={{ full_name: 'Test Student' }} achievements={records} />]
  ])('%s renders no Points/Score text and no sample people', (_name, element) => {
    const text = textOf(element)
    expect(text).not.toMatch(POINT_TEXT)
    expect(text).not.toMatch(FAKE_PEOPLE)
  })

  it('computes portfolio counts only from real records (drafts excluded from totals)', () => {
    const summary = summarizePortfolio(records)
    expect(summary).toMatchObject({ total: 3, verified: 1, pending: 1, returned: 1 })
    expect(summary.categories).toEqual([{ name: 'Leadership Position', count: 1 }])
    expect(summarizePortfolio([])).toMatchObject({ total: 0, verified: 0, pending: 0, returned: 0, categories: [] })
  })

  it('exports only verified records and carries no scoring fields', () => {
    const html = textOf(<ExportPortfolioPreviewModal isOpen onClose={() => {}} student={{}} achievements={records} />)
    expect(html).toContain('SSG Secretary')
    expect(html).not.toContain('Outreach')
    const item = toExportItem(records[0])
    expect(item).not.toHaveProperty('points')
    expect(item.academic_year).toBe('2025-2026')
  })

  it('maps dashboard timeline items from real record statuses', () => {
    expect(toTimelineItem(records[1])).toMatchObject({ status: 'Pending Review', statusType: 'pending', hasProof: true })
    expect(toTimelineItem(records[2])).toMatchObject({ status: 'Returned', statusType: 'returned' })
  })
})
