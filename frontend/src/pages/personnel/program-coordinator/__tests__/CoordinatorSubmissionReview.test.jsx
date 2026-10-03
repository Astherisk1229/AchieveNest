import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../services/portfolioService', () => ({ default: { downloadEvidence: vi.fn(), fetchRecord: vi.fn() } }))

import CoordinatorSubmissionReview, { AWARD_FLAG_TEXT } from '../CoordinatorSubmissionReview'
import { normalizeQueueRecord } from '../../../../hooks/useVerification'

const CLUB = '40000001-0001-0000-0000-000000000003'
const item = normalizeQueueRecord({
  id: 'rec-1', status: 'submitted', title: 'Outstanding Leadership and', category_name: 'Leadership Position', subcategory_name: 'Club / Organization',
  subcategory_id: CLUB, organizer_or_body: 'Office of Student', start_date: '2026-05-28',
  structured_metadata: JSON.stringify({ organization_name: 'Association of Computing', position_title: 'Student Organization President', academic_year: '2025-2026', semester: '1st_semester' }),
  evidence: [{ id: 'ev-1', original_filename: 'P03_leadership_certificate.png', mime_type: 'image/png', security_status: 'clean', status: 'active' }]
})
const render = () => renderToStaticMarkup(<CoordinatorSubmissionReview item={item} loadRecordDetail={vi.fn(() => new Promise(() => {}))} />)

describe('CoordinatorSubmissionReview', () => {
  it('shows only real claims, with readable dates and subcategory details', () => {
    const html = render()
    for (const text of ['Outstanding Leadership and', 'Leadership Position', 'Club / Organization', 'Office of Student', 'May 28, 2026', 'Association of Computing', 'Student Organization President', 'AY 2025-2026', 'Security check passed']) {
      expect(html).toContain(text)
    }
    for (const invented of ['Participant', 'Scope Level', 'Date Conferred', '2026-05-28', 'Rank / Position']) {
      expect(html).not.toContain(invented)
    }
  })

  it('flags award-relevant fields and the empty officer tier, without any point values', () => {
    const html = render()
    expect(html).toContain(AWARD_FLAG_TEXT)
    expect(html).toContain('Required details left empty')
    expect(html).toContain('Leadership Officer Tier (affects award evaluation)')
    // Check the visible text only (icon class names such as "lucide-file-exclamation-point" are not text).
    const text = html.replace(/<[^>]*>/g, ' ')
    expect(text).not.toMatch(/\bpoints?\b(?! values are not shown)/i)
    expect(text).not.toMatch(/\bscore\b/i)
  })
})
