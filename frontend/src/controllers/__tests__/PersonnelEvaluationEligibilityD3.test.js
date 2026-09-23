import { describe, it, expect, vi, beforeEach } from 'vitest'
import deanAnnualReviewService from '../../services/deanAnnualReviewService.js'
import personnelEligibilityService from '../../services/personnelEligibilityService.js'
import apiClient from '../../services/apiClient.js'

describe('Personnel Evaluation Track — Plan D — Phase D3: Evaluation Eligibility Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('D3.1 Canonical Portfolio-Validation Eligibility Gate', () => {
    it('grants portfolio validation eligibility when Academic personnel has a Cleared Dean Annual Review', async () => {
      const mockEligibility = {
        data: {
          evaluation_cycle_id: '2025-2026',
          personnel_profile_id: '10000000-0000-0000-0000-000000000003',
          master_data: {
            personnel_group: 'faculty',
            organizational_side: 'academic',
            faculty_engagement: 'full_time_faculty',
            employment_status: 'permanent'
          },
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
      expect(data.portfolio_validation.decision).toBe('cleared')
      expect(data.portfolio_validation.reason_codes).toHaveLength(0)
    })

    it('denies portfolio validation eligibility when Dean Annual Review is Not Cleared', async () => {
      const mockEligibility = {
        data: {
          evaluation_cycle_id: '2025-2026',
          personnel_profile_id: '10000000-0000-0000-0000-000000000004',
          portfolio_validation: {
            eligible: false,
            decision: 'not_cleared',
            review_id: 'par-uuid-002',
            decision_reason: 'Unresolved instructional performance deficiencies.',
            reason_codes: ['ANNUAL_REVIEW_NOT_CLEARED']
          },
          ranking_readiness: {
            eligible: false,
            reason_codes: ['ANNUAL_REVIEW_NOT_CLEARED']
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility({ evaluation_cycle_id: '2025-2026' })
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(false)
      expect(data.portfolio_validation.decision).toBe('not_cleared')
      expect(data.portfolio_validation.decision_reason).toBe('Unresolved instructional performance deficiencies.')
      expect(data.portfolio_validation.reason_codes).toContain('ANNUAL_REVIEW_NOT_CLEARED')
    })

    it('returns ANNUAL_REVIEW_PENDING when no Annual Review record has been entered for the cycle', async () => {
      const mockEligibility = {
        data: {
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
      expect(data.portfolio_validation.decision).toBe('pending')
      expect(data.portfolio_validation.reason_codes).toContain('ANNUAL_REVIEW_PENDING')
    })
  })

  describe('D3.2 Ranking-Evaluation Readiness Gate & Separation of Concerns', () => {
    it('evaluates Permanent Full-Time Faculty with Cleared Annual Review as ranking-ready', async () => {
      const mockEligibility = {
        data: {
          evaluation_cycle_id: '2025-2026',
          master_data: {
            personnel_group: 'faculty',
            organizational_side: 'academic',
            faculty_engagement: 'full_time_faculty',
            employment_status: 'permanent'
          },
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: true,
            reason_codes: []
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility()
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(true)
    })

    it('evaluates Probationary Full-Time Faculty with Cleared Annual Review as ranking-ready (Permanent and Probationary both permitted)', async () => {
      const mockEligibility = {
        data: {
          evaluation_cycle_id: '2025-2026',
          master_data: {
            personnel_group: 'faculty',
            organizational_side: 'academic',
            faculty_engagement: 'full_time_faculty',
            employment_status: 'probationary'
          },
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: true,
            reason_codes: []
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility()
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(true)
    })

    it('blocks Part-Time Faculty from Ranking Readiness with PART_TIME_FACULTY reason code even if Cleared by Dean', async () => {
      const mockEligibility = {
        data: {
          evaluation_cycle_id: '2025-2026',
          master_data: {
            personnel_group: 'faculty',
            organizational_side: 'academic',
            faculty_engagement: 'part_time_faculty',
            employment_status: 'permanent'
          },
          portfolio_validation: {
            eligible: true,
            decision: 'cleared',
            reason_codes: []
          },
          ranking_readiness: {
            eligible: false,
            reason_codes: ['PART_TIME_FACULTY']
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility()
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(false)
      expect(data.ranking_readiness.reason_codes).toContain('PART_TIME_FACULTY')
    })

    it('allows Academic Non-Teaching Faculty for portfolio validation but blocks ranking readiness with UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING', async () => {
      const mockEligibility = {
        data: {
          evaluation_cycle_id: '2025-2026',
          master_data: {
            personnel_group: 'non_teaching_faculty',
            organizational_side: 'academic'
          },
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

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility()
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(false)
      expect(data.ranking_readiness.reason_codes).toContain('UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING')
    })

    it('blocks Non-Academic personnel from Dean Annual Review flow with NOT_ACADEMIC_PERSONNEL', async () => {
      const mockEligibility = {
        data: {
          evaluation_cycle_id: '2025-2026',
          master_data: {
            personnel_group: 'non_teaching_faculty',
            organizational_side: 'non_academic'
          },
          portfolio_validation: {
            eligible: false,
            decision: 'pending',
            reason_codes: ['NOT_ACADEMIC_PERSONNEL']
          },
          ranking_readiness: {
            eligible: false,
            reason_codes: ['NOT_ACADEMIC_PERSONNEL', 'UNSUPPORTED_PERSONNEL_GROUP_FOR_RANKING']
          }
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEligibility)

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility()
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(false)
      expect(data.portfolio_validation.reason_codes).toContain('NOT_ACADEMIC_PERSONNEL')
      expect(data.ranking_readiness.reason_codes).toContain('NOT_ACADEMIC_PERSONNEL')
    })

    it('blocks ranking readiness with EVALUATION_ALREADY_EXISTS_FOR_CYCLE when a Plan C evaluation root exists', async () => {
      const mockEligibility = {
        data: {
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

      const result = await personnelEligibilityService.fetchCurrentPersonnelEligibility()
      const data = result?.data || result

      expect(data.portfolio_validation.eligible).toBe(true)
      expect(data.ranking_readiness.eligible).toBe(false)
      expect(data.ranking_readiness.reason_codes).toContain('EVALUATION_ALREADY_EXISTS_FOR_CYCLE')
    })
  })

  describe('D3.3 Dean Annual Review Recording & Authorization Rules', () => {
    it('records Cleared decision for Academic personnel in Dean college', async () => {
      const payload = {
        personnel_profile_id: '10000000-0000-0000-0000-000000000003',
        evaluation_cycle_id: '2025-2026',
        review_period_label: 'A.Y. 2024-2025 Annual Faculty Performance Evaluation',
        decision: 'cleared',
        evidence_reference: 'CCS-AR-2025-0042'
      }

      const mockResponse = {
        data: {
          message: 'Annual review recorded successfully.',
          review_id: 'par-uuid-001',
          decision: 'cleared',
          recorded_at: '2026-09-08T12:00:00Z',
          recorded_by_dean_id: 'dean-user-001'
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse)

      const result = await deanAnnualReviewService.recordDeanAnnualReview(payload)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith('/dean/annual-reviews', payload)
      expect(data.review_id).toBe('par-uuid-001')
      expect(data.decision).toBe('cleared')
    })

    it('rejects not_cleared decision without reason (422 DECISION_REASON_REQUIRED)', async () => {
      const payload = {
        personnel_profile_id: '10000000-0000-0000-0000-000000000004',
        evaluation_cycle_id: '2025-2026',
        decision: 'not_cleared'
      }

      const mockError = {
        response: {
          status: 422,
          data: { code: 'DECISION_REASON_REQUIRED' }
        }
      }

      vi.spyOn(apiClient, 'post').mockRejectedValue(mockError)

      await expect(deanAnnualReviewService.recordDeanAnnualReview(payload)).rejects.toMatchObject({
        response: {
          status: 422,
          data: { code: 'DECISION_REASON_REQUIRED' }
        }
      })
    })

    it('rejects duplicate review creation when active record exists (409 ANNUAL_REVIEW_ALREADY_RECORDED)', async () => {
      const payload = {
        personnel_profile_id: '10000000-0000-0000-0000-000000000003',
        evaluation_cycle_id: '2025-2026',
        decision: 'cleared'
      }

      const mockError = {
        response: {
          status: 409,
          data: { code: 'ANNUAL_REVIEW_ALREADY_RECORDED' }
        }
      }

      vi.spyOn(apiClient, 'post').mockRejectedValue(mockError)

      await expect(deanAnnualReviewService.recordDeanAnnualReview(payload)).rejects.toMatchObject({
        response: {
          status: 409,
          data: { code: 'ANNUAL_REVIEW_ALREADY_RECORDED' }
        }
      })
    })

    it('supersedes previous review and activates new decision without deleting historical record', async () => {
      const reviewId = 'par-uuid-002'
      const payload = {
        decision: 'cleared',
        evidence_reference: 'CCS-AR-2025-0089-REV1',
        supersede_reason: 'Dean conference resolution completed and deficiencies resolved.'
      }

      const mockResponse = {
        data: {
          message: 'Annual review superseded successfully.',
          superseded_review_id: reviewId,
          new_review_id: 'par-uuid-003',
          decision: 'cleared',
          recorded_at: '2026-09-08T12:15:00Z'
        }
      }

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse)

      const result = await deanAnnualReviewService.supersedeDeanAnnualReview(reviewId, payload)
      const data = result?.data || result

      expect(apiClient.post).toHaveBeenCalledWith(`/dean/annual-reviews/${reviewId}/supersede`, payload)
      expect(data.superseded_review_id).toBe(reviewId)
      expect(data.new_review_id).toBe('par-uuid-003')
      expect(data.decision).toBe('cleared')
    })
  })

  describe('D3.4 HR Admin Diagnostic Access & Dean Queue Fetching', () => {
    it('allows HR Admin to query explainable eligibility DTO by personnel profile ID', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003'
      const mockHRView = {
        data: {
          personnel_profile_id: profileId,
          evaluation_cycle_id: '2025-2026',
          portfolio_validation: { eligible: true, decision: 'cleared' },
          ranking_readiness: { eligible: true, reason_codes: [] }
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

    it('fetches Dean assigned queue filtered by cycle and decision state', async () => {
      const queryParams = { evaluation_cycle_id: '2025-2026', decision: 'cleared' }
      const mockQueue = {
        data: {
          college: { code: 'CCS', name: 'College of Computer Studies' },
          personnel: [
            { id: '10000000-0000-0000-0000-000000000003', effective_review: { decision: 'cleared' } }
          ]
        }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockQueue)

      const result = await deanAnnualReviewService.fetchDeanAnnualReviews(queryParams)
      const data = result?.data || result

      expect(apiClient.get).toHaveBeenCalledWith('/dean/annual-reviews', { params: queryParams })
      expect(data.college.code).toBe('CCS')
      expect(data.personnel).toHaveLength(1)
    })
  })
})
