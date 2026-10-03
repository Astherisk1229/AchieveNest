import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../services/portfolioService', () => ({ default: { fetchRecord: vi.fn(() => Promise.resolve({ events: [] })), downloadEvidence: vi.fn() } }))

import StudentAchievementController from '../../../../controllers/StudentAchievementController'
import StudentAchievementPreviewModal, { detailRows } from '../StudentAchievementPreviewModal'

const CLUB = '40000001-0001-0000-0000-000000000003'
const record = (overrides = {}) => StudentAchievementController.normalize({
  id: 'rec-1', status: 'submitted', title: 'Leadership Excellence Award', category_name: 'Leadership Position', subcategory_name: 'Club / Organization',
  subcategory_id: CLUB, organizer_or_body: 'Office of Student Development', start_date: '2026-05-28', created_at: '2026-09-30 14:42:30.000000',
  structured_metadata: JSON.stringify({ schema_version: '1.0', organization_name: 'Association of Computing Students', academic_year: '2025-2026' }),
  evidence: [{ id: 'ev-1', original_filename: 'P03_leadership_certificate.png', mime_type: 'image/png', security_status: 'clean', status: 'active' }],
  ...overrides
})

describe('StudentAchievementPreviewModal (document-first)', () => {
  it('shows real data only and none of the old invented labels', () => {
    const html = renderToStaticMarkup(<StudentAchievementPreviewModal isOpen achievement={record()} onClose={vi.fn()} />)
    expect(html).toContain('Leadership Excellence Award')
    expect(html).toContain('Leadership Position › Club / Organization')
    expect(html).toContain('May 28, 2026')
    expect(html).toContain('Association of Computing Students')
    expect(html).toContain('AY 2025-2026')
    expect(html).toContain('Security check passed')
    expect(html).toContain('Pending review')
    for (const invented of ['Institutional', 'Verified PDF Document Proof', 'Official Attachment', 'Date Conferred', '14:42:30']) {
      expect(html).not.toContain(invented)
    }
    expect(html).not.toContain('Continue editing') // submitted records are not editable
  })

  it('labels an untitled, undated draft honestly and offers editing', () => {
    const html = renderToStaticMarkup(<StudentAchievementPreviewModal isOpen achievement={record({ status: 'draft', title: '', start_date: null, subcategory_id: null, subcategory_name: null, structured_metadata: null })} onClose={vi.fn()} />)
    expect(html).toContain('Untitled draft')
    expect(html).toContain('No activity date yet')
    expect(html).toContain('Saved Sep 30, 2026, 2:42 PM')
    expect(html).toContain('Continue editing')
  })

  it('maps detail values to the form labels', () => {
    expect(detailRows(CLUB, { academic_year: '2025-2026' })).toEqual([expect.objectContaining({ value: 'AY 2025-2026' })])
  })
})

describe('StudentAchievementController dates and ordering', () => {
  it('never uses the creation time as the activity date and sorts by last change', () => {
    const draft = record({ status: 'draft', start_date: null, updated_at: '2026-09-30 21:40:00' })
    expect(draft.display_date).toBe('No activity date yet')
    const older = record({ id: 'a', updated_at: '2026-09-30 10:00:00' })
    const newer = record({ id: 'b', updated_at: '2026-09-30 21:45:00' })
    expect(StudentAchievementController.getFilteredAchievements([older, newer]).map(item => item.id)).toEqual(['b', 'a'])
  })
})
