import { describe, expect, it } from 'vitest'
import {
  derivePersonnelPortfolioState,
  normalizeLatestPersonnelSubmission
} from '../personnelPortfolioState'

describe('personnel portfolio authoritative submission state', () => {
  it('normalizes the service-level latest-submission payload', () => {
    const result = normalizeLatestPersonnelSubmission({
      submission: { id: 'evaluation-v1', status: 'submitted', version_number: 1 },
      status: 'submitted',
      items_count: 1,
      items: [{ id: 'snapshot-1' }]
    })

    expect(result).toMatchObject({
      id: 'evaluation-v1',
      status: 'submitted',
      version_number: 1,
      items_count: 1
    })
    expect(result.items).toEqual([{ id: 'snapshot-1' }])
  })

  it('does not treat an empty DRAFT response as a submitted snapshot', () => {
    expect(normalizeLatestPersonnelSubmission({
      data: { submission: null, status: 'DRAFT', items: [] }
    })).toBeNull()
  })

  it('gives submitted V1 precedence over a rebuilt draft and locks editing', () => {
    expect(derivePersonnelPortfolioState(
      { status: 'draft' },
      { id: 'evaluation-v1', status: 'submitted', version_number: 1 }
    )).toEqual({
      status: 'submitted',
      isReturnedForRevision: false,
      isLocked: true,
      isEditable: false
    })
  })

  it('keeps a true working draft editable when no submission exists', () => {
    expect(derivePersonnelPortfolioState({ status: 'draft' }, null).isEditable).toBe(true)
  })

  it('keeps an in-evaluation submission locked', () => {
    expect(derivePersonnelPortfolioState(
      { status: 'draft' },
      { status: 'in_evaluation', version_number: 1 }
    )).toMatchObject({ status: 'in_evaluation', isLocked: true, isEditable: false })
  })

  it('restores editing only after the authoritative submission is returned', () => {
    expect(derivePersonnelPortfolioState(
      { status: 'draft' },
      { status: 'returned_for_revision', version_number: 1 }
    )).toEqual({
      status: 'returned_for_revision',
      isReturnedForRevision: true,
      isLocked: false,
      isEditable: true
    })
  })
})
