import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelAchievementController from '../PersonnelAchievementController.js'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService.js'
import AchievementModel from '../../models/AchievementModel.js'

describe('PersonnelAchievementController — Phase A4 Structured Record Persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 18.1: Canonical Create & Structured Persistence
  // =========================================================================
  it('creates an authoritative accomplishment record with linked evidence and advisory classification', async () => {
    const mockAccomplishmentId = 'acc_uuid_101'
    const mockEvidenceId = 'ev_uuid_202'

    vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockResolvedValue({
      data: { id: mockAccomplishmentId, status: 'draft' }
    })

    vi.spyOn(personnelAccomplishmentService, 'uploadEvidence').mockResolvedValue({
      data: {
        evidence: {
          id: mockEvidenceId,
          original_filename: 'phd_diploma.pdf',
          byte_size: 1048576,
          mime_type: 'application/pdf',
          checksum: 'sha256_mock_hash'
        }
      }
    })

    const dummyFile = new File(['%PDF-test'], 'phd_diploma.pdf', { type: 'application/pdf' })

    const newEntry = {
      title: 'Doctor of Philosophy in Computer Science',
      category: 'A.1 Degree/s',
      category_area: 'areaA',
      domain: 'professional_development',
      issuer: 'Notre Dame of Marbel University',
      location: 'Notre Dame of Marbel University',
      date_achieved: '2025-05-15',
      academic_year: 'AY 2024-2025',
      scope_level: 'Institutional / Graduate Level',
      description: 'Conferred Ph.D. degree.',
      claimed_points: 40,
      advisory_classification: {
        suggested_category: 'A.1 Degree/s',
        suggested_subcategory: 'Ph.D. Degree Holder',
        criterion_code: 'A.1',
        suggested_points: 40,
        is_advisory: true,
        rule_reference: 'NDMU-PERSONNEL-RATING-V2'
      },
      ocr_metadata: {
        confidence_score: 95,
        matched_keywords: ['Doctor of Philosophy', 'conferred']
      }
    }

    const createdModel = await PersonnelAchievementController.addAchievement(newEntry, dummyFile)

    expect(createdModel).toBeInstanceOf(AchievementModel)
    expect(createdModel.id).toBe(mockAccomplishmentId)
    expect(createdModel.title).toBe(newEntry.title)
    expect(createdModel.category).toBe(newEntry.category)
    expect(createdModel.evidence_id).toBe(mockEvidenceId)
    expect(createdModel.claimed_points).toBeUndefined()
    expect(createdModel.advisory_classification).toBeUndefined()
    expect(createdModel.ocr_metadata.confidence_score).toBe(95)
  })

  it('preserves the selected HR criterion identity and backend snapshot on the accomplishment model', async () => {
    const criterionSnapshot = { evaluation_scale_version_id: 'scale-v4', criterion: { id: 'leaf-1', name: 'Journal Article' } }
    const createSpy = vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockResolvedValue({
      data: { id: 'acc-versioned', criterion_id: 'leaf-1', evaluation_scale_version_id: 'scale-v4', criterion_snapshot: criterionSnapshot }
    })

    const created = await PersonnelAchievementController.addAchievement({
      title: 'Journal Article',
      category: 'B.2 Publication',
      criterion_id: 'leaf-1'
    })

    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ criterion_id: 'leaf-1' }))
    expect(created.criterion_id).toBe('leaf-1')
    expect(created.evaluation_scale_version_id).toBe('scale-v4')
    expect(created.criterion_snapshot).toEqual(criterionSnapshot)
  })

  // =========================================================================
  // 18.2: Refresh & Backend Hydration
  // =========================================================================
  it('hydrates multiple AchievementModel records from canonical backend response', async () => {
    const mockBackendRows = [
      {
        id: 'acc_01',
        title: 'International Keynote on AI Ethics',
        category: 'B.1 Guest Lecturer / Consultant / Judge',
        domain: 'productivity_creative_work',
        organizer_or_publisher: 'DOST-SEI',
        occurrence_date: '2025-08-20',
        claimed_points: 10,
        status: 'draft',
        evidence: [
          { id: 'ev_01', original_filename: 'invitation_keynote.pdf' }
        ]
      },
      {
        id: 'acc_02',
        title: 'IEEE Journal Paper on Machine Learning',
        category: 'B.2 Publication',
        domain: 'productivity_creative_work',
        organizer_or_publisher: 'IEEE Access',
        occurrence_date: '2025-09-10',
        claimed_points: 8,
        status: 'draft',
        evidence: [
          { id: 'ev_02', original_filename: 'ieee_paper.pdf' }
        ]
      }
    ]

    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(mockBackendRows)

    const list = await PersonnelAchievementController.loadAchievements()

    expect(list).toHaveLength(2)
    expect(list[0]).toBeInstanceOf(AchievementModel)
    expect(list[0].id).toBe('acc_01')
    expect(list[0].title).toBe('International Keynote on AI Ethics')
    expect(list[0].evidence_id).toBe('ev_01')
    expect(list[1].id).toBe('acc_02')
    expect(list[1].evidence_id).toBe('ev_02')
  })

  // =========================================================================
  // 18.3: Update Operation & State Synchronization
  // =========================================================================
  it('updates an existing accomplishment in backend and reflects in memory list', async () => {
    const updateSpy = vi.spyOn(personnelAccomplishmentService, 'updateAccomplishment').mockResolvedValue({
      data: { id: 'acc_01', message: 'Updated' }
    })

    const initialItem = new AchievementModel({
      id: 'acc_01',
      title: 'Original Title',
      category: 'A.3 Attendance to Seminars/Trainings',
      date: '2025-07-01',
      claimed_points: 6
    })

    const currentList = [initialItem]

    const updatedList = await PersonnelAchievementController.updateAchievement(currentList, 'acc_01', {
      title: 'Updated Regional Seminar Title',
      claimed_points: 8,
      scope_level: 'National'
    })

    expect(updateSpy).toHaveBeenCalledWith('acc_01', expect.objectContaining({
      title: 'Updated Regional Seminar Title',
      scope_level: 'National'
    }))
    expect(updateSpy.mock.calls[0][1]).not.toHaveProperty('claimed_points')

    expect(updatedList).toHaveLength(1)
    expect(updatedList[0].title).toBe('Updated Regional Seminar Title')
    expect(updatedList[0].claimed_points).toBeUndefined()
    expect(updatedList[0].id).toBe('acc_01')
  })

  // =========================================================================
  // 18.6 & 18.8: Suggested vs Accepted Separation & No localStorage Dependency
  // =========================================================================
  it('keeps all scoring fields out of the personnel-facing achievement model', async () => {
    const model = new AchievementModel({
      id: 'acc_test_pts',
      title: 'Workshop Attendance',
      claimed_points: 6,
      advisory_classification: {
        suggested_points: 6,
        criterion_code: 'A.3',
        is_advisory: true
      }
    })

    const json = model.toJSON()
    expect(json.claimed_points).toBeUndefined()
    expect(json.accepted_points).toBeUndefined()
    expect(json.final_score).toBeUndefined()
    expect(json.evaluation_outcome).toBeUndefined()
  })

  // =========================================================================
  // 18.7: Advisory Duplicate Detection
  // =========================================================================
  describe('checkDuplicateWarning (Advisory Rule)', () => {
    const existing = [
      new AchievementModel({
        id: 'acc_existing_1',
        title: 'National AI Conference 2025',
        date: '2025-04-12',
        issuer: 'CHED Region XII'
      })
    ]

    it('returns warning when exact title, date, and issuer collide', () => {
      const result = PersonnelAchievementController.checkDuplicateWarning({
        title: 'National AI Conference 2025',
        date_achieved: '2025-04-12',
        issuer: 'CHED Region XII'
      }, existing)

      expect(result.isDuplicate).toBe(true)
      expect(result.warningMessage).toContain('already recorded')
      expect(result.collidingAchievement.id).toBe('acc_existing_1')
    })

    it('returns no warning when date or title differs', () => {
      const result = PersonnelAchievementController.checkDuplicateWarning({
        title: 'National AI Conference 2025',
        date_achieved: '2025-04-13', // different date
        issuer: 'CHED Region XII'
      }, existing)

      expect(result.isDuplicate).toBe(false)
      expect(result.warningMessage).toBeNull()
    })

    it('does not produce warning on empty fields', () => {
      const result = PersonnelAchievementController.checkDuplicateWarning({}, existing)
      expect(result.isDuplicate).toBe(false)
    })
  })

  // =========================================================================
  // 18.9: Error & Rejection Handling
  // =========================================================================
  it('propagates backend errors cleanly without creating fake local records', async () => {
    vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockRejectedValue(
      new Error('Database foreign key violation: invalid owner profile.')
    )

    await expect(PersonnelAchievementController.addAchievement({
      title: 'Invalid Test Record'
    })).rejects.toThrow('Database foreign key violation')
  })
})
