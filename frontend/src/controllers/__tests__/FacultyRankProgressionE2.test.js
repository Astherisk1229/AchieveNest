import { describe, it, expect, vi, beforeEach } from 'vitest'
import { facultyRankCatalogService } from '../../services/facultyRankCatalogService'
import apiClient from '../../services/apiClient'

vi.mock('../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Personnel Evaluation Track — Plan E — Phase E2: Faculty Rank Progression Rules Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // 1. Normal Sequential One-Step Progression
  // =========================================================================
  describe('1. Normal Sequential Progression', () => {
    it('E2-SEQ-001: resolves normal sequential next rank for Baccalaureate entry (Assistant Instructor -> Instructor I)', async () => {
      const mockResult = {
        success: true,
        current_rank_code: 'ASSISTANT_INSTRUCTOR',
        is_terminal: false,
        next_rank: {
          rank_code: 'INSTRUCTOR_I',
          display_label: 'Instructor I',
          qualification_tier_code: 'baccalaureate',
        },
      }
      apiClient.get.mockResolvedValueOnce({ data: mockResult })

      const res = await facultyRankCatalogService.fetchNextRank('ASSISTANT_INSTRUCTOR')
      expect(apiClient.get).toHaveBeenCalledWith('/faculty-ranks/ASSISTANT_INSTRUCTOR/next')
      expect(res.next_rank.rank_code).toBe('INSTRUCTOR_I')
      expect(res.is_terminal).toBe(false)
    })

    it('E2-SEQ-002: resolves normal sequential step for Board Licensure (Senior Instructor I -> Senior Instructor II)', async () => {
      const mockResult = {
        success: true,
        current_rank_code: 'SENIOR_INSTRUCTOR_I',
        is_terminal: false,
        next_rank: {
          rank_code: 'SENIOR_INSTRUCTOR_II',
          display_label: 'Senior Instructor II',
        },
      }
      apiClient.get.mockResolvedValueOnce({ data: mockResult })

      const res = await facultyRankCatalogService.fetchNextRank('SENIOR_INSTRUCTOR_I')
      expect(res.next_rank.rank_code).toBe('SENIOR_INSTRUCTOR_II')
    })

    it('E2-SEQ-003: resolves normal sequential step for Master Tier (Assistant Professor I -> Assistant Professor II)', async () => {
      const mockResult = {
        success: true,
        current_rank_code: 'ASSISTANT_PROFESSOR_I',
        is_terminal: false,
        next_rank: {
          rank_code: 'ASSISTANT_PROFESSOR_II',
          display_label: 'Assistant Professor II',
        },
      }
      apiClient.get.mockResolvedValueOnce({ data: mockResult })

      const res = await facultyRankCatalogService.fetchNextRank('ASSISTANT_PROFESSOR_I')
      expect(res.next_rank.rank_code).toBe('ASSISTANT_PROFESSOR_II')
    })

    it('E2-SEQ-004: resolves normal sequential step for Doctoral Tier (Professor I -> Professor II)', async () => {
      const mockResult = {
        success: true,
        current_rank_code: 'PROFESSOR_I',
        is_terminal: false,
        next_rank: {
          rank_code: 'PROFESSOR_II',
          display_label: 'Professor II',
        },
      }
      apiClient.get.mockResolvedValueOnce({ data: mockResult })

      const res = await facultyRankCatalogService.fetchNextRank('PROFESSOR_I')
      expect(res.next_rank.rank_code).toBe('PROFESSOR_II')
    })
  })

  // =========================================================================
  // 2. Multi-Step & Invalid Jumps Rejection
  // =========================================================================
  describe('2. Multi-Step & Invalid Jumps Rejection', () => {
    it('E2-JUMP-001: rejects multi-step jump (Instructor I -> Assistant Professor I) as invalid transition', async () => {
      const mockValidation = {
        allowed: false,
        reason_code: 'invalid_transition',
        message: 'Direct progression is not allowed in the canonical progression graph.',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockValidation } })

      const res = await facultyRankCatalogService.validateTransition('INSTRUCTOR_I', 'ASSISTANT_PROFESSOR_I')
      expect(apiClient.post).toHaveBeenCalledWith('/faculty-ranks/validate-transition', {
        from_rank_code: 'INSTRUCTOR_I',
        to_rank_code: 'ASSISTANT_PROFESSOR_I',
        context: {},
      })
      expect(res.allowed).toBe(false)
      expect(res.reason_code).toBe('invalid_transition')
    })

    it('E2-JUMP-002: rejects reverse progression (Professor II -> Professor I)', async () => {
      const mockValidation = {
        allowed: false,
        reason_code: 'invalid_transition',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockValidation } })

      const res = await facultyRankCatalogService.validateTransition('PROFESSOR_II', 'PROFESSOR_I')
      expect(res.allowed).toBe(false)
      expect(res.reason_code).toBe('invalid_transition')
    })

    it('E2-JUMP-003: rejects same-rank transition (Professor I -> Professor I)', async () => {
      const mockValidation = {
        allowed: false,
        reason_code: 'same_rank_transition',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockValidation } })

      const res = await facultyRankCatalogService.validateTransition('PROFESSOR_I', 'PROFESSOR_I')
      expect(res.allowed).toBe(false)
      expect(res.reason_code).toBe('same_rank_transition')
    })
  })

  // =========================================================================
  // 3. Terminal Rank Handling
  // =========================================================================
  describe('3. Terminal Rank Handling', () => {
    it('E2-TERM-001: identifies University Professor as terminal rank with no next rank', async () => {
      const mockResult = {
        success: true,
        current_rank_code: 'UNIVERSITY_PROFESSOR',
        is_terminal: true,
        next_rank: null,
      }
      apiClient.get.mockResolvedValueOnce({ data: mockResult })

      const res = await facultyRankCatalogService.fetchNextRank('UNIVERSITY_PROFESSOR')
      expect(res.is_terminal).toBe(true)
      expect(res.next_rank).toBeNull()
    })

    it('E2-TERM-002: validateTransition rejects any advancement from terminal rank', async () => {
      const mockValidation = {
        allowed: false,
        reason_code: 'no_next_rank',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockValidation } })

      const res = await facultyRankCatalogService.validateTransition('UNIVERSITY_PROFESSOR', 'UNIVERSITY_PROFESSOR_IV')
      expect(res.allowed).toBe(false)
      expect(res.reason_code).toBe('no_next_rank')
    })
  })

  // =========================================================================
  // 4. Confirmed PhD Exception (Assistant Professor I -> Professor I)
  // =========================================================================
  describe('4. Confirmed PhD Exception', () => {
    it('E2-PHD-001: includes Professor I as allowed exception when has_verified_phd is true', async () => {
      const mockDTO = {
        current_rank_code: 'ASSISTANT_PROFESSOR_I',
        normal_next_rank_code: 'ASSISTANT_PROFESSOR_II',
        allowed_exception_transitions: [
          {
            rank: { rank_code: 'PROFESSOR_I', display_label: 'Professor I' },
            transition_type: 'phd_exception',
            requires_verified_phd: true,
          },
        ],
        all_valid_target_ranks: [
          { rank_code: 'ASSISTANT_PROFESSOR_II', transition_type: 'normal_sequential' },
          { rank_code: 'PROFESSOR_I', transition_type: 'phd_exception' },
        ],
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockDTO } })

      const res = await facultyRankCatalogService.fetchAllowedTransitions('ASSISTANT_PROFESSOR_I', {
        has_verified_phd: true,
      })

      expect(apiClient.get).toHaveBeenCalledWith('/faculty-ranks/ASSISTANT_PROFESSOR_I/transitions', {
        params: { has_verified_phd: true },
      })
      expect(res.allowed_exception_transitions).toHaveLength(1)
      expect(res.allowed_exception_transitions[0].rank.rank_code).toBe('PROFESSOR_I')
      expect(res.all_valid_target_ranks).toHaveLength(2)
    })

    it('E2-PHD-002: excludes Professor I exception when has_verified_phd is false', async () => {
      const mockDTO = {
        current_rank_code: 'ASSISTANT_PROFESSOR_I',
        normal_next_rank_code: 'ASSISTANT_PROFESSOR_II',
        allowed_exception_transitions: [],
        all_valid_target_ranks: [
          { rank_code: 'ASSISTANT_PROFESSOR_II', transition_type: 'normal_sequential' },
        ],
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockDTO } })

      const res = await facultyRankCatalogService.fetchAllowedTransitions('ASSISTANT_PROFESSOR_I', {
        has_verified_phd: false,
      })

      expect(res.allowed_exception_transitions).toHaveLength(0)
      expect(res.all_valid_target_ranks).toHaveLength(1)
    })

    it('E2-PHD-003: validateTransition allows AP I -> Professor I with verified PhD context', async () => {
      const mockValidation = {
        allowed: true,
        transition_type: 'phd_exception',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockValidation } })

      const res = await facultyRankCatalogService.validateTransition(
        'ASSISTANT_PROFESSOR_I',
        'PROFESSOR_I',
        { has_verified_phd: true }
      )
      expect(res.allowed).toBe(true)
      expect(res.transition_type).toBe('phd_exception')
    })

    it('E2-PHD-004: validateTransition rejects AP I -> Professor I when verified PhD context is missing', async () => {
      const mockValidation = {
        allowed: false,
        reason_code: 'qualification_exception_not_satisfied',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockValidation } })

      const res = await facultyRankCatalogService.validateTransition(
        'ASSISTANT_PROFESSOR_I',
        'PROFESSOR_I',
        { has_verified_phd: false }
      )
      expect(res.allowed).toBe(false)
      expect(res.reason_code).toBe('qualification_exception_not_satisfied')
    })
  })

  // =========================================================================
  // 5. Boundary Protection (Part-Time & Non-Teaching)
  // =========================================================================
  describe('5. Boundary Protection', () => {
    it('E2-BND-001: rejects progression request for Part-Time Faculty context', async () => {
      const mockDTO = {
        current_rank_code: 'ASSISTANT_PROFESSOR_I',
        status: 'INELIGIBLE',
        reason_code: 'part_time_not_eligible',
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockDTO } })

      const res = await facultyRankCatalogService.fetchAllowedTransitions('ASSISTANT_PROFESSOR_I', {
        faculty_engagement: 'part_time_faculty',
      })

      expect(res.status).toBe('INELIGIBLE')
      expect(res.reason_code).toBe('part_time_not_eligible')
    })

    it('E2-BND-002: rejects progression request for Non-Teaching personnel context', async () => {
      const mockDTO = {
        current_rank_code: 'ASSISTANT_INSTRUCTOR',
        status: 'INELIGIBLE',
        reason_code: 'unsupported_personnel_group',
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockDTO } })

      const res = await facultyRankCatalogService.fetchAllowedTransitions('ASSISTANT_INSTRUCTOR', {
        personnel_group: 'non_teaching_faculty',
      })

      expect(res.status).toBe('INELIGIBLE')
      expect(res.reason_code).toBe('unsupported_personnel_group')
    })

    it('E2-BND-003: returns rank_not_found for unrecognized rank codes', async () => {
      const mockDTO = {
        status: 'UNRESOLVED',
        reason_code: 'rank_not_found',
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockDTO } })

      const res = await facultyRankCatalogService.fetchAllowedTransitions('UNKNOWN_RANK_XYZ')
      expect(res.status).toBe('UNRESOLVED')
      expect(res.reason_code).toBe('rank_not_found')
    })
  })
})
