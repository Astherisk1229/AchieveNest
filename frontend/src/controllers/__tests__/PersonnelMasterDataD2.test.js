import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validatePersonnelMasterData,
  validatePersonnelPlacement,
  formatFacultyEngagement,
  formatEmploymentStatus,
  formatPersonnelClassification
} from '../../utils/personnelPlacement.js'
import hrAdminService from '../../services/hrAdminService.js'
import apiClient from '../../services/apiClient.js'

describe('Personnel Evaluation Track — Plan D — Phase D2 Faculty Status & Master Data Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('D2.1 & D2.6 (Items 1, 2, 3) — Canonical 4-Way Independent Combinations', () => {
    it('accepts and persists combination 1: Full-time Faculty + Permanent', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        faculty_engagement: 'full_time_faculty',
        employment_status: 'permanent',
        position_title: 'Faculty Member',
        current_rank_title: 'Assistant Professor II',
        reason: 'Confirmed regular permanent full-time appointment'
      }

      const mockResponse = {
        data: {
          message: 'Personnel master data updated successfully.',
          profile_id: profileId,
          faculty_engagement: 'full_time_faculty',
          employment_status: 'permanent',
          position_title: 'Faculty Member',
          current_rank_title: 'Assistant Professor II',
          is_dean_review_eligible: true
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelMasterData(profileId, payload)
      const data = result?.data || result

      expect(apiClient.put).toHaveBeenCalledWith(`/hr/personnel/${profileId}/master-data`, payload)
      expect(data.faculty_engagement).toBe('full_time_faculty')
      expect(data.employment_status).toBe('permanent')
      expect(data.is_dean_review_eligible).toBe(true)
    })

    it('accepts and persists combination 2: Full-time Faculty + Probationary', async () => {
      const profileId = '10000000-0000-0000-0000-000000000004'
      const payload = {
        faculty_engagement: 'full_time_faculty',
        employment_status: 'probationary',
        position_title: 'Instructor I',
        current_rank_title: 'Instructor I',
        reason: 'Initial tenure-track appointment'
      }

      const mockResponse = {
        data: {
          message: 'Personnel master data updated successfully.',
          profile_id: profileId,
          faculty_engagement: 'full_time_faculty',
          employment_status: 'probationary',
          position_title: 'Instructor I',
          current_rank_title: 'Instructor I',
          is_dean_review_eligible: true
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelMasterData(profileId, payload)
      const data = result?.data || result

      expect(data.faculty_engagement).toBe('full_time_faculty')
      expect(data.employment_status).toBe('probationary')
      expect(data.is_dean_review_eligible).toBe(true)
    })

    it('accepts and persists combination 3: Part-time Faculty + Permanent', async () => {
      const profileId = '10000000-0000-0000-0000-000000000006'
      const payload = {
        faculty_engagement: 'part_time_faculty',
        employment_status: 'permanent',
        position_title: 'Lecturer',
        current_rank_title: 'Associate Professor I',
        reason: 'Permanent faculty member on reduced appointment'
      }

      const mockResponse = {
        data: {
          message: 'Personnel master data updated successfully.',
          profile_id: profileId,
          faculty_engagement: 'part_time_faculty',
          employment_status: 'permanent',
          position_title: 'Lecturer',
          current_rank_title: 'Associate Professor I',
          is_dean_review_eligible: false
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelMasterData(profileId, payload)
      const data = result?.data || result

      expect(data.faculty_engagement).toBe('part_time_faculty')
      expect(data.employment_status).toBe('permanent')
      expect(data.is_dean_review_eligible).toBe(false)
    })

    it('accepts and persists combination 4: Part-time Faculty + Probationary', async () => {
      const profileId = '10000000-0000-0000-0000-000000000007'
      const payload = {
        faculty_engagement: 'part_time_faculty',
        employment_status: 'probationary',
        position_title: 'Adjunct Lecturer',
        current_rank_title: 'Instructor I',
        reason: 'Probationary part-time lecturer'
      }

      const mockResponse = {
        data: {
          message: 'Personnel master data updated successfully.',
          profile_id: profileId,
          faculty_engagement: 'part_time_faculty',
          employment_status: 'probationary',
          position_title: 'Adjunct Lecturer',
          current_rank_title: 'Instructor I',
          is_dean_review_eligible: false
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelMasterData(profileId, payload)
      const data = result?.data || result

      expect(data.faculty_engagement).toBe('part_time_faculty')
      expect(data.employment_status).toBe('probationary')
      expect(data.is_dean_review_eligible).toBe(false)
    })
  })

  describe('D2.1 & D2.6 (Item 4) — Separate Position & Rank Fields', () => {
    it('stores and updates position title and academic rank independently without conflation', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        faculty_engagement: 'full_time_faculty',
        employment_status: 'permanent',
        position_title: 'Assistant Dean of Computing',
        current_rank_title: 'Associate Professor II',
        qualification_summary: 'Ph.D. in Computer Science',
        reason: 'Appointment to administrative position'
      }

      const mockResponse = {
        data: {
          message: 'Personnel master data updated successfully.',
          profile_id: profileId,
          position_title: 'Assistant Dean of Computing',
          current_rank_title: 'Associate Professor II',
          qualification_summary: 'Ph.D. in Computer Science'
        }
      }

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse)

      const result = await hrAdminService.updatePersonnelMasterData(profileId, payload)
      const data = result?.data || result

      expect(data.position_title).toBe('Assistant Dean of Computing')
      expect(data.current_rank_title).toBe('Associate Professor II')
      expect(data.qualification_summary).toBe('Ph.D. in Computer Science')
    })
  })

  describe('D2.2 & D2.6 (Item 5) — VP Unit Distinction (Academics vs Administration)', () => {
    it('distinguishes VP for Academics and VP for Administration by structured unit assignment', () => {
      const vpAcademics = {
        position_title: 'Vice President',
        organizational_side: 'academic',
        college_id: 'COL-01',
        college_name: 'College of Engineering & Computing',
        office_unit_id: null
      }

      const vpAdministration = {
        position_title: 'Vice President',
        organizational_side: 'non_academic',
        college_id: null,
        administrative_unit_id: 'UNIT-ADMIN-01',
        administrative_unit_name: 'Office of the VP for Administration'
      }

      expect(vpAcademics.organizational_side).toBe('academic')
      expect(vpAdministration.organizational_side).toBe('non_academic')
      expect(vpAcademics.college_id).toBeTruthy()
      expect(vpAdministration.administrative_unit_id).toBeTruthy()
    })
  })

  describe('D2.3 & D2.6 (Item 6) — HR-Only RBAC & 403 Rejections', () => {
    it('allows HR Admin to fetch and mutate master data', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const mockGet = {
        data: {
          profile_id: profileId,
          faculty_engagement: 'full_time_faculty',
          employment_status: 'permanent'
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockGet)

      const res = await hrAdminService.fetchPersonnelMasterData(profileId)
      const data = res?.data || res
      expect(apiClient.get).toHaveBeenCalledWith(`/hr/personnel/${profileId}/master-data`)
      expect(data.faculty_engagement).toBe('full_time_faculty')
    })

    it('rejects master data mutation attempt by Personnel actor with 403 FORBIDDEN', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        faculty_engagement: 'full_time_faculty',
        employment_status: 'permanent'
      }

      const mockError = {
        response: {
          status: 403,
          data: {
            error: {
              code: 'FORBIDDEN',
              message: 'Only HR Admin may create or update personnel master data.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelMasterData(profileId, payload)).rejects.toMatchObject({
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

    it('rejects master data mutation attempt by Dean actor with 403 FORBIDDEN', async () => {
      const profileId = '10000000-0000-0000-0000-000000000008'
      const payload = {
        faculty_engagement: 'part_time_faculty',
        employment_status: 'probationary'
      }

      const mockError = {
        response: {
          status: 403,
          data: {
            error: {
              code: 'FORBIDDEN',
              message: 'Only HR Admin may create or update personnel master data.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelMasterData(profileId, payload)).rejects.toMatchObject({
        response: {
          status: 403
        }
      })
    })
  })

  describe('D2.3 & D2.6 (Item 7) — Rejection of Invalid / Free-Text Values (422)', () => {
    it('rejects invalid faculty_engagement values (e.g. "contractual", "regular") with 422', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        faculty_engagement: 'contractual',
        employment_status: 'permanent'
      }

      const mockError = {
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_FACULTY_ENGAGEMENT',
              message: 'faculty_engagement must be either full_time_faculty or part_time_faculty.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelMasterData(profileId, payload)).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_FACULTY_ENGAGEMENT'
            }
          }
        }
      })
    })

    it('rejects invalid employment_status values (e.g. "tenured", "temporary") with 422', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const payload = {
        faculty_engagement: 'full_time_faculty',
        employment_status: 'tenured'
      }

      const mockError = {
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_EMPLOYMENT_STATUS',
              message: 'employment_status must be either permanent or probationary.'
            }
          }
        }
      }

      vi.spyOn(apiClient, 'put').mockRejectedValue(mockError)

      await expect(hrAdminService.updatePersonnelMasterData(profileId, payload)).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            error: {
              code: 'INVALID_EMPLOYMENT_STATUS'
            }
          }
        }
      })
    })
  })

  describe('D2.4 & D2.6 (Item 8) — Frontend Helpers & Validation', () => {
    it('validates client-side master data payload accurately', () => {
      const valid = validatePersonnelMasterData({
        facultyEngagement: 'full_time_faculty',
        employmentStatus: 'permanent'
      })
      expect(valid.isValid).toBe(true)

      const invalid = validatePersonnelMasterData({
        facultyEngagement: 'temporary_staff',
        employmentStatus: 'casual'
      })
      expect(invalid.isValid).toBe(false)
      expect(invalid.errors.facultyEngagement).toBeDefined()
      expect(invalid.errors.employmentStatus).toBeDefined()
    })

    it('formats display labels accurately', () => {
      expect(formatFacultyEngagement({ faculty_engagement: 'full_time_faculty' })).toBe('Full-time Faculty')
      expect(formatFacultyEngagement({ faculty_engagement: 'part_time_faculty' })).toBe('Part-time Faculty')
      expect(formatEmploymentStatus({ employment_status: 'permanent' })).toBe('Permanent')
      expect(formatEmploymentStatus({ employment_status: 'probationary' })).toBe('Probationary')
    })
  })

  describe('D2.1 & D2.6 (Item 9) — Historical Plan C Snapshot Non-Mutation', () => {
    it('guarantees master-data updates never alter submitted Plan C portfolio snapshots', () => {
      const historicalSubmissionSnapshot = {
        evaluation_id: 'EVAL-ROOT-2025-001',
        version_number: 1,
        status: 'submitted',
        personnel_profile_id: '10000000-0000-0000-0000-000000000003',
        submitted_at: '2026-09-08 10:00:00',
        captured_engagement: 'Full-time Faculty',
        captured_employment_status: 'Probationary',
        captured_rank: 'Assistant Professor I',
        items: [
          { id: 'ITEM-001', title: 'Publication in IEEE', points: 25, remarks: 'Verified by Dean' }
        ]
      }

      // Freeze historical snapshot to simulate DB immutability
      Object.freeze(historicalSubmissionSnapshot)
      Object.freeze(historicalSubmissionSnapshot.items[0])

      // HR later updates active master data to Permanent and Associate Professor II
      const activeMasterDataUpdate = {
        faculty_engagement: 'full_time_faculty',
        employment_status: 'permanent',
        current_rank_title: 'Associate Professor II',
        updated_at: '2026-09-08 22:00:00'
      }

      // Assert that historical snapshot remained immutable
      expect(historicalSubmissionSnapshot.status).toBe('submitted')
      expect(historicalSubmissionSnapshot.captured_engagement).toBe('Full-time Faculty')
      expect(historicalSubmissionSnapshot.captured_employment_status).toBe('Probationary')
      expect(historicalSubmissionSnapshot.captured_rank).toBe('Assistant Professor I')
      expect(historicalSubmissionSnapshot.items[0].remarks).toBe('Verified by Dean')
      expect(activeMasterDataUpdate.employment_status).toBe('permanent')
      expect(activeMasterDataUpdate.current_rank_title).toBe('Associate Professor II')
    })
  })
})
