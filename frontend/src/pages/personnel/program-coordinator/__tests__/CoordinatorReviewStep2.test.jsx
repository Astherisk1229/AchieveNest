import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../services/portfolioService', () => ({
  default: {
    fetchCoordinatorQueue: vi.fn(async () => []), fetchRecord: vi.fn(), downloadEvidence: vi.fn(),
    verifyRecord: vi.fn(), requestRevision: vi.fn(), rejectRecord: vi.fn()
  }
}))

import CoordinatorDashboardPage from '../CoordinatorDashboardPage'
import { CoordinatorDecisionActions, CoordinatorEvidenceList, formatBytes, validateDecision } from '../CoordinatorReviewParts'
import { STATUS_FILTERS, formatApiError, normalizeQueueRecord } from '../../../../hooks/useVerification'

describe('Step 2 coordinator review', () => {
  it('maps every backend status to exactly one filter label', () => {
    const labels = ['submitted', 'revision_requested', 'verified', 'rejected'].map(status => normalizeQueueRecord({ status }).status)
    expect(labels).toEqual(['Pending', 'Returned', 'Verified', 'Rejected'])
    expect(STATUS_FILTERS).toEqual(['All', 'Pending', 'Returned', 'Verified', 'Rejected'])
  })

  it('requires remarks to return or reject, but not to approve', () => {
    expect(validateDecision('approve', '')).toBeNull()
    expect(validateDecision('return', '   ')).toMatch(/required/i)
    expect(validateDecision('reject', '')).toMatch(/required/i)
    expect(validateDecision('reject', 'Not a recognized issuer.')).toBeNull()
  })

  it('shows backend errors verbatim with their code', () => {
    expect(formatApiError({ error: { code: 'REMARKS_REQUIRED', message: 'A specific explanation remark is mandatory.' } }))
      .toBe('A specific explanation remark is mandatory. (REMARKS_REQUIRED)')
    expect(formatApiError({ error: { code: 'FORBIDDEN', message: 'You are not the authorized active Program Coordinator for this student program.' } }))
      .toContain('(FORBIDDEN)')
  })

  it('renders real file name, MIME type and size for every evidence item', () => {
    const html = renderToStaticMarkup(<CoordinatorEvidenceList evidence={[
      { id: 'e1', original_filename: 'appointment.pdf', detected_mime_type: 'application/pdf', byte_size: 353280 },
      { id: 'e2', original_filename: 'photo.png', detected_mime_type: 'image/png', byte_size: 1258291 }
    ]} />)
    expect(html).toContain('appointment.pdf')
    expect(html).toContain('application/pdf • 345 KB')
    expect(html).toContain('photo.png')
    expect(html).toContain('image/png • 1.2 MB')
    expect(html).not.toContain('Validated PDF')
    expect(formatBytes(512)).toBe('512 B')
  })

  it('offers Approve, Return and Reject only for records awaiting review', () => {
    const pending = renderToStaticMarkup(<CoordinatorDecisionActions item={{ id: 'r1', status: 'Pending' }} onApprove={vi.fn()} onReturn={vi.fn()} onReject={vi.fn()} />)
    expect(pending).toContain('Reject')
    expect(pending).toContain('Return for Revision')
    expect(pending).toContain('Approve &amp; Verify')
    const returned = renderToStaticMarkup(<CoordinatorDecisionActions item={{ id: 'r1', status: 'Returned' }} onApprove={vi.fn()} onReturn={vi.fn()} onReject={vi.fn()} />)
    expect(returned).not.toContain('Approve &amp; Verify')
  })

  it('renders the dashboard without fake activity, people, file sizes or points', () => {
    const html = renderToStaticMarkup(<MemoryRouter><CoordinatorDashboardPage currentUser={{ full_name: 'Coordinator', program_scope: 'BS Test Program' }} /></MemoryRouter>)
    for (const fake of ['Live Audit Stream', 'Maria Santos', 'John Doe', 'Juan Dela Cruz', 'Machine Learning Research Paper', '~345 KB', '~1.2 MB', 'Points: +', 'BS Computer Science verification CSV']) {
      expect(html).not.toContain(fake)
    }
    expect(html).toContain('BS Test Program')
  })
})
