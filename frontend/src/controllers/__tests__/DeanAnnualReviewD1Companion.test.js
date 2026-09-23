import { describe, it, expect, vi, beforeEach } from 'vitest'
import deanAnnualReviewService from '../../services/deanAnnualReviewService.js'
import personnelEligibilityService from '../../services/personnelEligibilityService.js'
import apiClient from '../../services/apiClient.js'

describe('Personnel Evaluation Track — Plan D1 — Dean Annual Review & Portfolio-Validation Eligibility Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('D1.1 Dean Annual Review Recording — Cleared (Yes)', () => {
    it('records an authoritative Cleared decision for an Academic personnel in the Dean\'s college', async () => {
      const payload = {
        personnel_profile_id: '10000000-0000-0000-0000-000000000003',
        evaluation_cycle_id: '2025-2026',
        review_period_label: 'A.Y. 2024-2025 Annual Faculty Performance Evaluation',
        decision: 'cleared',
        evidence_reference: 'CCS-AR-2025-0042 (Official Annual Review Summary)',
        review_summary_payload: {
          instructional_skills: 'Outstanding (4.85/5.00)',
          attendance: '100%',
          efficiency: 'Exemplary'
        }
      }

      const mockResponse = {
        data: {
          message: 'Annual review recorded successfully.',
          review_id: 'par-uuid-001',
          decision: 'cleared',
          recorded_at: '2026-09-08T12:00:00Z',
          recorded_by_dean_id: 'dean-user-001',
          portfolio_validation_eligible: true
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse)

      const result = await deanAnnualReviewService.recordDeanAnnualReview(payload)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith('/dean/annual-reviews', payload)
      expect(data.review_id).toBe('par-uuid-001')
      expect(data.decision).toBe('cleared')
      expect(data.portfolio_validation_eligible).toBe(true)
    })
  })

  describe('D1.2 Dean Annual Review Recording — Not Cleared (No) & Validation Rules', () => {
    it('records a Not Cleared decision when a clear justification reason is supplied', async () => {
      const payload = {
        personnel_profile_id: '10000000-0000-0000-0000-000000000004',
        evaluation_cycle_id: '2025-2026',
        review_period_label: 'A.Y. 2024-2025 Annual Faculty Performance Evaluation',
        decision: 'not_cleared',
        decision_reason: 'Unresolved instructional performance deficiencies noted during Dean annual conference.',
        evidence_reference: 'CCS-AR-2025-0089'
      }

      const mockResponse = {
        data: {
          message: 'Annual review recorded successfully.',
          review_id: 'par-uuid-002',
          decision: 'not_cleared',
          decision_reason: payload.decision_reason,
          recorded_at: '2026-09-08T12:05:00Z',
          portfolio_validation_eligible: false
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse)

      const result = await deanAnnualReviewService.recordDeanAnnualReview(payload)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith('/dean/annual-reviews', payload)
      expect(data.decision).toBe('not_cleared')
      expect(data.portfolio_validation_eligible).toBe(false)
    })

    it('rejects not_cleared decision when decision_reason is missing (422 DECISION_REASON_REQUIRED)', async () => {
      const payload = {
        personnel_profile_id: '10000000-0000-0000-0000-000000000004',
        evaluation_cycle_id: '2025-2026',
        decision: 'not_cleared'
        // missing decision_reason
      }

      const mockError = {
        response: {
          status: 422,
          data: {
            code: 'DECISION_REASON_REQUIRED',
            message: 'A clear explanation reason is required when marking not cleared for portfolio validation.'
          }
        }
      }

      vi.spyOn(apiClient, 'post').mockRejectedValue(mockError)

      await expect(deanAnnualReviewService.recordDeanAnnualReview(payload)).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            code: 'DECISION_REASON_REQUIRED'
          }
        }
      })
    })

    it('rejects recording when an effective review already exists for the cycle (409 ANNUAL_REVIEW_ALREADY_RECORDED)', async () => {
      const payload = {
        personnel_profile_id: '10000000-0000-0000-0000-000000000003',
        evaluation_cycle_id: '2025-2026',
        decision: 'cleared'
      }

      const mockError = {
        response: {
          status: 409,
          data: {
            code: 'ANNUAL_REVIEW_ALREADY_RECORDED',
            message: 'An active annual review already exists for this personnel member and cycle. Use the supersede endpoint to correct a decision.'
          }
        }
      }

      vi.spyOn(apiClient, 'post').mockRejectedValue(mockError)

      await expect(deanAnnualReviewService.recordDeanAnnualReview(payload)).rejects.toMatchObject({
        response: {
          status: 409,
          data: {
            code: 'ANNUAL_REVIEW_ALREADY_RECORDED'
          }
        }
      })
    })
  })

  describe('D1.3 Auditable Supersession / Decision Correction Flow', () => {
    it('creates a successor record and marks historical review as superseded without overwriting original data', async () => {
      const reviewId = 'par-uuid-002'
      const supersedePayload = {
        decision: 'cleared',
        decision_reason: null,
        evidence_reference: 'CCS-AR-2025-0089-REV1 (Amended Dean Conference Minutes)',
        supersede_reason: 'Dean conference resolution completed and grade submission compliance verified.'
      }

      const mockResponse = {
        data: {
          message: 'Annual review superseded successfully.',
          superseded_review_id: reviewId,
          new_review_id: 'par-uuid-003',
          decision: 'cleared',
          recorded_at: '2026-09-08T12:15:00Z',
          recorded_by_dean_id: 'dean-user-001'
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse)

      const result = await deanAnnualReviewService.supersedeDeanAnnualReview(reviewId, supersedePayload)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith(`/dean/annual-reviews/${reviewId}/supersede`, supersedePayload)
      expect(data.superseded_review_id).toBe(reviewId)
      expect(data.new_review_id).toBe('par-uuid-003')
      expect(data.decision).toBe('cleared')
    })
  })

  describe('D1.4 Separation of Gates — Personnel Eligibility Service DTOs', () => {
    it('evaluates Permanent Full-Time Faculty with Cleared decision as both portfolio-validation eligible and ranking-ready', async () => {
      const mockEligibility = {
        data: {
          personnel_profile_id: '10000000-0000-0000-0000-000000000003',
          evaluation_cycle_id: '2025-2026',
          personnel_group: 'faculty',
          organizational_side: 'academic',
          faculty_engagement: 'full_time_faculty',
          employment_status: 'permanent',
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            review_id: 'par-uuid-001',
            recorded_at: '2026-09-08T12:00:00Z',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: true,
            reason_codes: []
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(apiClient.get).toHaveBeenCalledWith('/personnel/eligibility/current', {
        params: { evaluation_cycle_id: '2025-2026' }
      })
      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(true)
      expect(data.ranking_readiness.reason_codes).toHaveLength(0)
    })

    it('evaluates Probationary Full-Time Faculty with Cleared decision as ranking-ready (Permanent and Probationary both permitted)', async () => {
      const mockEligibility = {
        data: {
          personnel_profile_id: '10000000-0000-0000-0000-000000000004',
          evaluation_cycle_id: '2025-2026',
          personnel_group: 'faculty',
          organizational_side: 'academic',
          faculty_engagement: 'full_time_faculty',
          employment_status: 'probationary',
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            review_id: 'par-uuid-003',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: true,
            reason_codes: []
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(true)
    })

    it('blocks Part-Time Faculty from Ranking Readiness with PART_TIME_FACULTY reason code even if Cleared by Dean', async () => {
      const mockEligibility = {
        data: {
          personnel_profile_id: '10000000-0000-0000-0000-000000000005',
          evaluation_cycle_id: '2025-2026',
          personnel_group: 'faculty',
          organizational_side: 'academic',
          faculty_engagement: 'part_time_faculty',
          employment_status: 'permanent',
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            review_id: 'par-uuid-004',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: false,
            reason_codes: ['PART_TIME_FACULTY']
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(false)
      expect(data.ranking_readiness.reason_codes).toContain('PART_TIME_FACULTY')
    })

    it('allows Academic Non-Teaching Faculty for portfolio validation but flags UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING', async () => {
      const mockEligibility = {
        data: {
          personnel_profile_id: '10000000-0000-0000-0000-000000000006',
          evaluation_cycle_id: '2025-2026',
          personnel_group: 'non_teaching_faculty',
          organizational_side: 'academic',
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: false,
            reason_codes: ['UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING']
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(false)
      expect(data.ranking_readiness.reason_codes).toContain('UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING')
    })

    it('returns ANNUAL_REVIEW_PENDING when no annual review record exists for the cycle', async () => {
      const mockEligibility = {
        data: {
          personnel_profile_id: '10000000-0000-0000-0000-000000000007',
          evaluation_cycle_id: '2025-2026',
          portfolio_validation: {
            eligible: false,
            decision: 'pending',
            reason_codes: ['ANNUAL_REVIEW_PENDING']
          },
          ranking_readiness: {
            eligible: false,
            reason_codes: ['ANNUAL_REVIEW_PENDING']
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(false)
      expect(data.portfolio_validation.reason_codes).toContain('ANNUAL_REVIEW_PENDING')
      expect(data.ranking_readiness.reason_codes).toContain('ANNUAL_REVIEW_PENDING')
    })

    it('blocks Ranking Readiness with EVALUATION_ALREADY_EXISTS_FOR_CYCLE when Plan C evaluation root exists', async () => {
      const mockEligibility = {
        data: {
          personnel_profile_id: '10000000-0000-0000-0000-000000000003',
          evaluation_cycle_id: '2025-2026',
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: false,
            reason_codes: ['EVALUATION_ALREADY_EXISTS_FOR_CYCLE']
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(false)
      expect(data.ranking_readiness.reason_codes).toContain('EVALUATION_ALREADY_EXISTS_FOR_CYCLE')
    })
  })

  describe('D1.5 HR Admin Read-Only Diagnostic Access', () => {
    it('allows HR Admin to query explainable eligibility DTO by personnel profile ID', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const mockHRView = {
        data: {
          personnel_profile_id: profileId,
          evaluation_cycle_id: '2025-2026',
          personnel_group: 'faculty',
          organizational_side: 'academic',
          portfolio_validation: {
            eligible: true,
            decision: 'cleared'
          },
          ranking_readiness: {
            eligible: true,
            reason_codes: []
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockHRView)

      const result = await personnelEligibilityService.fetchHRPersonnelEligibility(profileId, { evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(apiClient.get).toHaveBeenCalledWith(`/hr/personnel/${profileId}/eligibility`, {
        params: { evaluation_cycle_id: '2025-2026' }
      })
      expect(data.personnel_profile_id).toBe(profileId)
      expect(data.portfolio_validation.eligible).toBe(true)
    })
  })

  describe('D1.6 Dean Queue Workspace Data Fetching', () => {
    it('fetches Dean assigned queue filtered by cycle, status, and decision', async () => {
      const queryParams = {
        evaluation_cycle_id: '2025-2026',
        decision: 'all',
        employment_status: 'all'
      }

      const mockQueue = {
        data: {
          college: {
            id: 'col-ccs-001',
            code: 'CCS',
            name: 'College of Computer Studies'
          },
          evaluation_cycle_id: '2025-2026',
          personnel: [
            {
              id: '10000000-0000-0000-0000-000000000003',
              name: 'Dr. John Doe',
              personnel_group: 'faculty',
              organizational_side: 'academic',
              faculty_engagement: 'full_time_faculty',
              employment_status: 'permanent',
              effective_review: {
                id: 'par-uuid-001',
                decision: 'cleared',
                review_period_label: 'A.Y. 2024-2025 Annual Faculty Performance Evaluation'
              }
            }
          ]
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockQueue)

      const result = await deanAnnualReviewService.fetchDeanAnnualReviews(queryParams)
      const data = result?.data || result

      expect(apiClient.get).toHaveBeenCalledWith('/dean/annual-reviews', { params: queryParams })
      expect(data.college.code).toBe('CCS')
      expect(data.personnel).toHaveLength(1)
      expect(data.personnel[0].effective_review.decision).toBe('cleared')
    })
  })
})
