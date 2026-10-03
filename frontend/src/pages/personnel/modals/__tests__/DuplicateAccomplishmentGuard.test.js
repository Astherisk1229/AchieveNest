import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../../../../services/personnelAccomplishmentService', () => ({
  default: {
    createAccomplishment: vi.fn(),
    uploadEvidence: vi.fn(),
    deleteAccomplishment: vi.fn(),
  },
}))

import personnelAccomplishmentService from '../../../../services/personnelAccomplishmentService'
import PersonnelAchievementController from '../../../../controllers/PersonnelAchievementController'
import { findAccomplishmentWithDocument } from '../PersonnelSubmissionModal'

describe('duplicate document detection', () => {
  const list = [
    { id: 'a1', title: 'Seminar on Records', evidence: [{ id: 'e1', checksum: 'ABC123' }] },
    { id: 'a2', title: 'Volunteer Day', primary_evidence: { id: 'e2', sha256: 'def456' } },
  ]

  it('finds the accomplishment that already uses the same file', () => {
    expect(findAccomplishmentWithDocument(list, 'abc123')?.title).toBe('Seminar on Records')
    expect(findAccomplishmentWithDocument(list, 'def456')?.id).toBe('a2')
  })

  it('ignores the record being edited and unknown files', () => {
    expect(findAccomplishmentWithDocument(list, 'abc123', 'a1')).toBeNull()
    expect(findAccomplishmentWithDocument(list, 'zzz')).toBeNull()
    expect(findAccomplishmentWithDocument(list, '')).toBeNull()
  })
})

describe('PersonnelAchievementController duplicate evidence rollback', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes the just-created record when the server rejects the document as a duplicate', async () => {
    personnelAccomplishmentService.createAccomplishment.mockResolvedValue({ data: { id: 'new-1' } })
    personnelAccomplishmentService.uploadEvidence.mockRejectedValue({ error: { code: 'DUPLICATE_EVIDENCE', message: 'This document is already used for "X".' } })
    await expect(PersonnelAchievementController.addAchievement({ title: 'X', category: 'B.1' }, { name: 'x.pdf' }))
      .rejects.toMatchObject({ error: { code: 'DUPLICATE_EVIDENCE' } })
    expect(personnelAccomplishmentService.deleteAccomplishment).toHaveBeenCalledWith('new-1')
  })

  it('keeps the record for other upload errors', async () => {
    personnelAccomplishmentService.createAccomplishment.mockResolvedValue({ data: { id: 'new-2' } })
    personnelAccomplishmentService.uploadEvidence.mockRejectedValue({ error: { code: 'UPLOAD_FAILED' } })
    await expect(PersonnelAchievementController.addAchievement({ title: 'Y', category: 'B.1' }, { name: 'y.pdf' })).rejects.toBeTruthy()
    expect(personnelAccomplishmentService.deleteAccomplishment).not.toHaveBeenCalled()
  })
})
