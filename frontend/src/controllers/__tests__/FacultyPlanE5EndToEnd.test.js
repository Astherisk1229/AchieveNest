import { describe, it, expect, vi, beforeEach } from 'vitest'
import facultyRankCatalogService from '../../services/facultyRankCatalogService'
import partTimeFacultyTitleService from '../../services/partTimeFacultyTitleService'
import facultyInitialRankService from '../../services/facultyInitialRankService'
import apiClient from '../../services/apiClient'

vi.mock('../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Plan E — Phase E5: End-to-End Validation, Cross-Phase Reconciliation & Formal Plan E Closure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('E5.1 — Authoritative Source Freeze & Catalog Counts', () => {
    it('verifies exactly 26 Full-Time academic ranks in canonical catalog', () => {
      expect(facultyRankCatalogService.getRankCount()).toBe(26)
      expect(facultyRankCatalogService.SOURCE_DOCUMENT_ID).toBe('NDMU-DOC-ACAD-RANKS-2026-V1')
      expect(facultyRankCatalogService.SEED_VERSION).toBe('2026.1')
    })

    it('verifies exactly 4 Part-Time faculty titles in canonical catalog', () => {
      expect(partTimeFacultyTitleService.getTitleCount()).toBe(4)
      expect(partTimeFacultyTitleService.SOURCE_DOCUMENT_ID).toBe('NDMU-DOC-ACAD-RANKS-2026-V1')
      expect(partTimeFacultyTitleService.SEED_VERSION).toBe('2026.1')
    })
  })

  describe('E5.2 — Full-Time Initial Rank Seeding Matrix', () => {
    it('maps verified Doctoral qualifications to Professor I base rank', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'Ph.D. in Physics',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_initial_rank_code).toBe('PROFESSOR_I')
      expect(res.resolved_initial_rank_name).toBe('Professor I')
      expect(res.reason_code).toBe('doctoral_initial_rank')
    })

    it('maps verified Master’s / Professional Graduate qualifications to Assistant Professor base rank', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'MA Educational Management',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_initial_rank_code).toBe('ASSISTANT_PROFESSOR')
      expect(res.resolved_initial_rank_name).toBe('Assistant Professor')
      expect(res.reason_code).toBe('masters_initial_rank')
    })

    it('maps verified Professional Licensure qualifications to Senior Instructor base rank', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'BS Nursing',
        qualification_verified: true,
        licensure_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_initial_rank_code).toBe('SENIOR_INSTRUCTOR')
      expect(res.resolved_initial_rank_name).toBe('Senior Instructor')
      expect(res.reason_code).toBe('licensed_professional_initial_rank')
    })

    it('maps verified Baccalaureate qualifications to Assistant Instructor base rank', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'AB English Language',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_initial_rank_code).toBe('ASSISTANT_INSTRUCTOR')
      expect(res.resolved_initial_rank_name).toBe('Assistant Instructor')
      expect(res.reason_code).toBe('baccalaureate_initial_rank')
    })
  })

  describe('E5.3 — Part-Time Title Mapping Matrix', () => {
    it('maps verified Doctoral degrees to Professorial Lecturer', () => {
      const res = partTimeFacultyTitleService.resolveTitleSync({
        qualification_code: 'Ph.D. in Educational Leadership',
        qualification_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_title_code).toBe('PT_PROFESSORIAL_LECTURER')
      expect(res.resolved_title_name).toBe('Professorial Lecturer')
      expect(res.reason_code).toBe('resolved_doctoral')
    })

    it('maps verified Master’s / Professional degrees to Assistant Professorial Lecturer', () => {
      const res = partTimeFacultyTitleService.resolveTitleSync({
        qualification_code: 'MS Chemistry',
        qualification_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_title_code).toBe('PT_ASSISTANT_PROFESSORIAL_LECTURER')
      expect(res.resolved_title_name).toBe('Assistant Professorial Lecturer')
      expect(res.reason_code).toBe('resolved_masters_professional')
    })

    it('maps verified Professional Licensure degrees to Senior Lecturer', () => {
      const res = partTimeFacultyTitleService.resolveTitleSync({
        qualification_code: 'CPA / Accountancy',
        qualification_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_title_code).toBe('PT_SENIOR_LECTURER')
      expect(res.resolved_title_name).toBe('Senior Lecturer')
      expect(res.reason_code).toBe('resolved_licensed_professional')
    })

    it('maps verified Baccalaureate degrees to Lecturer', () => {
      const res = partTimeFacultyTitleService.resolveTitleSync({
        qualification_code: 'BS Information Technology',
        qualification_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.resolved_title_code).toBe('PT_LECTURER')
      expect(res.resolved_title_name).toBe('Lecturer')
      expect(res.reason_code).toBe('resolved_baccalaureate')
    })
  })

  describe('E5.4 — Strict Full-Time / Part-Time Scope Isolation', () => {
    it('blocks Part-Time Faculty from entering Full-Time initial rank seeding', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'Ph.D. in Computer Science',
        qualification_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('INELIGIBLE')
      expect(res.reason_code).toBe('part_time_not_applicable')
      expect(res.resolved_initial_rank_code).toBeNull()
    })

    it('blocks Full-Time Faculty from entering Part-Time title resolution', () => {
      const res = partTimeFacultyTitleService.resolveTitleSync({
        qualification_code: 'Ph.D. in History',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('INELIGIBLE')
      expect(res.reason_code).toBe('not_part_time_faculty')
      expect(res.resolved_title_code).toBeNull()
    })

    it('confirms Part-Time titles never appear in Full-Time catalog', () => {
      const ptTitles = partTimeFacultyTitleService.PART_TIME_TITLES
      ptTitles.forEach((pt) => {
        expect(facultyRankCatalogService.getRankByCodeSync(pt.code)).toBeUndefined()
      })
    })
  })

  describe('E5.5 — Full-Time Progression Graph & PhD Exception API Contracts', () => {
    it('validates single sequential step progression API call', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            allowed: true,
            from_rank: { rank_code: 'ASSISTANT_INSTRUCTOR', display_label: 'Assistant Instructor' },
            to_rank: { rank_code: 'INSTRUCTOR_I', display_label: 'Instructor I' },
            transition_type: 'normal_sequential',
          },
        },
      })

      const res = await facultyRankCatalogService.validateTransition('ASSISTANT_INSTRUCTOR', 'INSTRUCTOR_I')
      expect(res.allowed).toBe(true)
      expect(res.transition_type).toBe('normal_sequential')
    })

    it('blocks invalid multi-step progression jump via API validation', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            allowed: false,
            reason_code: 'invalid_transition',
            message: 'Direct progression is not allowed.',
          },
        },
      })

      const res = await facultyRankCatalogService.validateTransition('ASSISTANT_INSTRUCTOR', 'SENIOR_INSTRUCTOR_I')
      expect(res.allowed).toBe(false)
      expect(res.reason_code).toBe('invalid_transition')
    })

    it('validates PhD exception transition API call with verified PhD context', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            allowed: true,
            from_rank: { rank_code: 'ASSISTANT_PROFESSOR_I', display_label: 'Assistant Professor I' },
            to_rank: { rank_code: 'PROFESSOR_I', display_label: 'Professor I' },
            transition_type: 'phd_exception',
            rule_reference: 'NDMU-DOC-ACAD-RANKS-2026-V1/PHD-EXCEPTION-AP1-P1',
          },
        },
      })

      const res = await facultyRankCatalogService.validateTransition('ASSISTANT_PROFESSOR_I', 'PROFESSOR_I', {
        has_verified_phd: true,
      })
      expect(res.allowed).toBe(true)
      expect(res.transition_type).toBe('phd_exception')
    })
  })

  describe('E5.6 — Plan Boundaries (D, F, G, H Separation)', () => {
    it('preserves Plan D master data integrity and rejects non-teaching personnel', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'MS Accountancy',
        qualification_verified: true,
        personnel_group: 'non_teaching_staff',
      })
      expect(res.status).toBe('INELIGIBLE')
      expect(res.reason_code).toBe('non_teaching_not_applicable')
    })

    it('ensures initial rank seeding produces explainable reason codes rather than scores or promotion approvals', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'Ph.D. in Education',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.seed_action).toBe('seed_initial_rank')
      expect(res).not.toHaveProperty('score')
      expect(res).not.toHaveProperty('promotion_approved')
      expect(res).not.toHaveProperty('points_accepted')
    })
  })
})
