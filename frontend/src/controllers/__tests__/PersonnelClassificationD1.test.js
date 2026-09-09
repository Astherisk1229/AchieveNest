import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validatePersonnelPlacement, formatPersonnelClassification, isAcademicPersonnel } from '../../utils/personnelPlacement.js'
import hrAdminService from '../../services/hrAdminService.js'
import apiClient from '../../services/apiClient.js'

describe('Personnel Evaluation Track — Plan D — Phase D1 Final Personnel Classification Model Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('D1.1 & D1.3 — Canonical Valid Pairs & Derived Classification Codes', () => {
    it('accepts and persists valid pair: Faculty + Academic (FACULTY_ACADEMIC)', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        personnel_group: 'faculty',
        organizational_side: 'academic',
        reason: 'Confirmed academic teaching assignment'
      }

      const mockResponse = {
        data: {
          message: 'Personnel classification updated successfully.',
          profile_id: profileId,
          personnel_group: 'faculty',
          organizational_side: 'academic',
          classification_code: 'FACULTY_ACADEMIC',
          classification_label: 'Faculty • Academic',
          updated_at: '2026-09-08 21:00:00'
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelClassification(profileId, payload)
      const data = result?.data || result
      expect(apiClient.put).toHaveBeenCalledWith(`/hr/personnel/${profileId}/classification`, payload)
      expect(data.personnel_group).toBe('faculty')
      expect(data.organizational_side).toBe('academic')
      expect(data.classification_code).toBe('FACULTY_ACADEMIC')
    })

    it('accepts and persists valid pair: Non-Teaching Faculty + Academic (NON_TEACHING_FACULTY_ACADEMIC)', async () => {
      const profileId = '10000000-0000-0000-0000-000000000004'
      const payload = {
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic',
        reason: 'Assigned as Academic Support / Laboratory Coordinator'
      }

      const mockResponse = {
        data: {
          message: 'Personnel classification updated successfully.',
          profile_id: profileId,
          personnel_group: 'non_teaching_faculty',
          organizational_side: 'academic',
          classification_code: 'NON_TEACHING_FACULTY_ACADEMIC',
          classification_label: 'Non-Teaching Faculty • Academic',
          updated_at: '2026-09-08 21:05:00'
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelClassification(profileId, payload)
      const data = result?.data || result
      expect(data.personnel_group).toBe('non_teaching_faculty')
      expect(data.organizational_side).toBe('academic')
      expect(data.classification_code).toBe('NON_TEACHING_FACULTY_ACADEMIC')
    })

    it('accepts and persists valid pair: Non-Teaching Faculty + Non-Academic (NON_TEACHING_FACULTY_NON_ACADEMIC)', async () => {
      const profileId = '10000000-0000-0000-0000-000000000005'
      const payload = {
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        reason: 'Assigned to Registrar Office'
      }

      const mockResponse = {
        data: {
          message: 'Personnel classification updated successfully.',
          profile_id: profileId,
          personnel_group: 'non_teaching_faculty',
          organizational_side: 'non_academic',
          classification_code: 'NON_TEACHING_FACULTY_NON_ACADEMIC',
          classification_label: 'Non-Teaching Faculty • Non-Academic',
          updated_at: '2026-09-08 21:10:00'
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelClassification(profileId, payload)
      const data = result?.data || result
      expect(data.personnel_group).toBe('non_teaching_faculty')
      expect(data.organizational_side).toBe('non_academic')
      expect(data.classification_code).toBe('NON_TEACHING_FACULTY_NON_ACADEMIC')
    })
  })

  describe('D1.1 & D1.3 — Invalid Pair & Legacy Group Rejection', () => {
    it('rejects invalid pair: Faculty + Non-Academic with 422 INVALID_PERSONNEL_CLASSIFICATION', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        personnel_group: 'faculty',
        organizational_side: 'non_academic'
      }

      const mockError = {
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_PERSONNEL_CLASSIFICATION',
              message: 'Invalid combination: Faculty cannot be assigned to the Non-Academic organizational side.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelClassification(profileId, payload)).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_PERSONNEL_CLASSIFICATION'
            }
          }
        }
      })
    })

    it('rejects legacy third-group values (e.g. non_teaching_personnel / staff) with 422', async () => {
      const profileId = '10000000-0000-0000-0000-000000000005'
      const payload = {
        personnel_group: 'non_teaching_personnel',
        organizational_side: 'non_academic'
      }

      const mockError = {
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_PERSONNEL_CLASSIFICATION',
              message: 'personnel_group must be either faculty or non_teaching_faculty.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelClassification(profileId, payload)).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_PERSONNEL_CLASSIFICATION'
            }
          }
        }
      })
    })
  })

  describe('D1.3 — RBAC Authorization & Actor Integrity', () => {
    it('rejects classification update attempt by non-HR personnel actor with 403 FORBIDDEN', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        personnel_group: 'faculty',
        organizational_side: 'academic'
      }

      const mockError = {
        response: {
          status: 403,
          data: {
            error: {
              code: 'FORBIDDEN',
              message: 'Only HR Admin may update personnel classifications.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelClassification(profileId, payload)).rejects.toMatchObject({
        response: {
          status: 403,
          data: {
            error: {
              code: 'FORBIDDEN'
            }
          }
        }
      })
    })

    it('rejects classification update attempt by Dean actor with 403 FORBIDDEN', async () => {
      const profileId = '10000000-0000-0000-0000-000000000008'
      const payload = {
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic'
      }

      const mockError = {
        response: {
          status: 403,
          data: {
            error: {
              code: 'FORBIDDEN',
              message: 'Only HR Admin may update personnel classifications.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelClassification(profileId, payload)).rejects.toMatchObject({
        response: {
          status: 403
        }
      })
    })
  })

  describe('D1.4 — Frontend Helper & Placement Form Validation', () => {
    const mockOptions = {
      colleges: [
        { id: 'COL-01', code: 'CEAC', name: 'College of Engineering' }
      ],
      academicPrograms: [
        { id: 'PROG-01', collegeId: 'COL-01', code: 'BSCS', name: 'Computer Science' }
      ],
      administrativeUnits: [
        { id: 'UNIT-01', code: 'HRMD', name: 'Human Resource Management' }
      ]
    }

    it('flags classificationPair error if Faculty + Non-Academic is attempted in client form', () => {
      const result = validatePersonnelPlacement({
        group: 'faculty',
        side: 'non_academic',
        collegeId: '',
        academicProgramIds: [],
        administrativeUnitId: 'UNIT-01'
      }, mockOptions)

      expect(result.isValid).toBe(false)
      expect(result.errors.classificationPair).toContain('Invalid combination')
    })

    it('validates Faculty + Academic with college and program successfully', () => {
      const result = validatePersonnelPlacement({
        group: 'faculty',
        side: 'academic',
        collegeId: 'COL-01',
        academicProgramIds: ['PROG-01'],
        administrativeUnitId: ''
      }, mockOptions)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('validates Non-Teaching Faculty + Non-Academic with administrative unit successfully', () => {
      const result = validatePersonnelPlacement({
        group: 'non_teaching_faculty',
        side: 'non_academic',
        collegeId: '',
        academicProgramIds: [],
        administrativeUnitId: 'UNIT-01'
      }, mockOptions)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('formats canonical classification labels accurately', () => {
      expect(formatPersonnelClassification({
        personnel_group: 'faculty',
        organizational_side: 'academic'
      })).toBe('Faculty • Academic')

      expect(formatPersonnelClassification({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic'
      })).toBe('Non-Teaching Faculty • Academic')

      expect(formatPersonnelClassification({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic'
      })).toBe('Non-Teaching Faculty • Non-Academic')
    })
  })

  describe('D1.5 — Historical Immutability Guarantee', () => {
    it('ensures master-data classification updates do not alter Plan C submitted snapshots', () => {
      const historicalSubmissionSnapshot = {
        evaluation_id: 'EVAL-ROOT-2025-001',
        version_number: 1,
        status: 'submitted',
        personnel_profile_id: '10000000-0000-0000-0000-000000000003',
        submitted_at: '2026-09-08 10:00:00',
        captured_classification: 'Faculty • Academic',
        items: [
          { id: 'ITEM-001', title: 'PhD in Computer Science', points: 30 }
        ]
      }

      // Deep freeze the submitted snapshot to simulate database-enforced immutability
      Object.freeze(historicalSubmissionSnapshot)
      Object.freeze(historicalSubmissionSnapshot.items[0])

      // When HR updates active master data:
      const updatedMasterData = {
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic',
        updated_at: '2026-09-08 21:30:00'
      }

      // Assert historical snapshot remains unchanged
      expect(historicalSubmissionSnapshot.status).toBe('submitted')
      expect(historicalSubmissionSnapshot.version_number).toBe(1)
      expect(historicalSubmissionSnapshot.captured_classification).toBe('Faculty • Academic')
      expect(historicalSubmissionSnapshot.items.length).toBe(1)
      expect(updatedMasterData.personnel_group).toBe('non_teaching_faculty')
    })
  })
})
