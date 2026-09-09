import { describe, it, expect, vi } from 'vitest'
import facultyInitialRankService from '../../services/facultyInitialRankService'
import facultyRankCatalogService from '../../services/facultyRankCatalogService'
import partTimeFacultyTitleService from '../../services/partTimeFacultyTitleService'
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

describe('Plan E — Phase E4: Full-Time Faculty Qualification-Based Initial Rank Seeding & Current-Rank Reconciliation', () => {
  describe('24.1 — Doctoral Missing-Rank Seed', () => {
    it('resolves verified PhD/EdD with missing current rank to Professor I base rank', () => {
      const context = {
        qualification_code: 'Ph.D. in Computer Science',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      }
      const res = facultyInitialRankService.resolveInitialRankSync(context)
      expect(res.status).toBe('OK')
      expect(res.seed_action).toBe('seed_initial_rank')
      expect(res.reason_code).toBe('doctoral_initial_rank')
      expect(res.resolved_initial_rank_code).toBe('PROFESSOR_I')
      expect(res.resolved_initial_rank_name).toBe('Professor I')
    })
  })

  describe('24.2 — Master’s Missing-Rank Seed', () => {
    it('resolves verified Master’s / Professional Graduate qualification to Assistant Professor base rank', () => {
      const context = {
        qualification_code: 'MS Information Technology',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      }
      const res = facultyInitialRankService.resolveInitialRankSync(context)
      expect(res.status).toBe('OK')
      expect(res.seed_action).toBe('seed_initial_rank')
      expect(res.reason_code).toBe('masters_initial_rank')
      expect(res.resolved_initial_rank_code).toBe('ASSISTANT_PROFESSOR')
      expect(res.resolved_initial_rank_name).toBe('Assistant Professor')
    })
  })

  describe('24.3 — Licensed Professional Missing-Rank Seed', () => {
    it('resolves verified licensure and professional qualification to Senior Instructor base rank', () => {
      const context = {
        qualification_code: 'BS Civil Engineering',
        qualification_verified: true,
        licensure_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      }
      const res = facultyInitialRankService.resolveInitialRankSync(context)
      expect(res.status).toBe('OK')
      expect(res.seed_action).toBe('seed_initial_rank')
      expect(res.reason_code).toBe('licensed_professional_initial_rank')
      expect(res.resolved_initial_rank_code).toBe('SENIOR_INSTRUCTOR')
      expect(res.resolved_initial_rank_name).toBe('Senior Instructor')
    })
  })

  describe('24.4 — Baccalaureate Missing-Rank Seed', () => {
    it('resolves verified baccalaureate degree to Assistant Instructor base rank', () => {
      const context = {
        qualification_code: 'BS Mathematics',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      }
      const res = facultyInitialRankService.resolveInitialRankSync(context)
      expect(res.status).toBe('OK')
      expect(res.seed_action).toBe('seed_initial_rank')
      expect(res.reason_code).toBe('baccalaureate_initial_rank')
      expect(res.resolved_initial_rank_code).toBe('ASSISTANT_INSTRUCTOR')
      expect(res.resolved_initial_rank_name).toBe('Assistant Instructor')
    })
  })

  describe('24.5 — Valid Existing Rank Preservation (Non-Demotion & Non-Mutation)', () => {
    it('preserves existing canonical rank without reseeding or alteration', async () => {
      const mockApiPayload = {
        personnel_profile_id: 101,
        current_rank_code: 'ASSISTANT_PROFESSOR_II',
        current_rank_name: 'Assistant Professor II',
        current_rank_status: 'valid',
        seed_action: 'preserve_current',
        reason_code: 'current_rank_valid',
        requires_hr_review: false,
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockApiPayload } })

      const res = await facultyInitialRankService.reconcileCurrentRank({
        personnel_profile_id: 101,
        current_rank: 'ASSISTANT_PROFESSOR_II',
        qualification_code: 'BS Mathematics',
        qualification_verified: true,
      })

      expect(res.current_rank_status).toBe('valid')
      expect(res.seed_action).toBe('preserve_current')
      expect(res.reason_code).toBe('current_rank_valid')
      expect(res.current_rank_code).toBe('ASSISTANT_PROFESSOR_II')
    })
  })

  describe('24.6 — Advanced Existing Rank Non-Demotion', () => {
    it('never resets an advanced rank (Associate Professor II) to lower seed base', async () => {
      const mockApiPayload = {
        personnel_profile_id: 102,
        current_rank_code: 'ASSOCIATE_PROFESSOR_II',
        current_rank_name: 'Associate Professor II',
        current_rank_status: 'valid',
        seed_action: 'preserve_current',
        reason_code: 'current_rank_valid',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockApiPayload } })

      const res = await facultyInitialRankService.reconcileCurrentRank({
        personnel_profile_id: 102,
        current_rank: 'ASSOCIATE_PROFESSOR_II',
        qualification_code: 'MS Computer Science',
        qualification_verified: true,
      })

      expect(res.seed_action).toBe('preserve_current')
      expect(res.current_rank_code).toBe('ASSOCIATE_PROFESSOR_II')
    })
  })

  describe('24.7 — Higher Qualification with Valid Lower Rank (Non-Promotion Safeguard)', () => {
    it('refuses to auto-promote existing valid Assistant Professor I to Professor, deferring to E2/H', async () => {
      const mockApiPayload = {
        personnel_profile_id: 103,
        current_rank_code: 'ASSISTANT_PROFESSOR_I',
        current_rank_name: 'Assistant Professor I',
        current_rank_status: 'valid',
        resolved_initial_rank_code: 'PROFESSOR_I',
        seed_action: 'preserve_current',
        reason_code: 'current_rank_valid',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockApiPayload } })

      const res = await facultyInitialRankService.reconcileCurrentRank({
        personnel_profile_id: 103,
        current_rank: 'ASSISTANT_PROFESSOR_I',
        qualification_code: 'Ph.D. in Education',
        qualification_verified: true,
      })

      expect(res.seed_action).toBe('preserve_current')
      expect(res.current_rank_code).toBe('ASSISTANT_PROFESSOR_I')
    })
  })

  describe('24.8 — Unknown / Ambiguous Current Rank', () => {
    it('flags unknown legacy rank values for HR reconciliation without auto-overwriting', async () => {
      const mockApiPayload = {
        personnel_profile_id: 104,
        current_rank_code: 'LEGACY_UNRECOGNIZED_RANK_XYZ',
        current_rank_status: 'unknown',
        seed_action: 'requires_reconciliation',
        reason_code: 'rank_reconciliation_required',
        requires_hr_review: true,
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockApiPayload } })

      const res = await facultyInitialRankService.reconcileCurrentRank({
        personnel_profile_id: 104,
        current_rank: 'LEGACY_UNRECOGNIZED_RANK_XYZ',
        qualification_code: 'MS Physics',
        qualification_verified: true,
      })

      expect(res.current_rank_status).toBe('unknown')
      expect(res.seed_action).toBe('requires_reconciliation')
      expect(res.reason_code).toBe('rank_reconciliation_required')
      expect(res.requires_hr_review).toBe(true)
    })
  })

  describe('24.9 — Unverified Qualification Handling', () => {
    it('returns qualification_not_verified when qualification flag is false', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'Ph.D. in Mathematics',
        qualification_verified: false,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('UNRESOLVED')
      expect(res.seed_action).toBe('no_action')
      expect(res.reason_code).toBe('qualification_not_verified')
      expect(res.resolved_initial_rank_code).toBeNull()
    })
  })

  describe('24.10 — Missing Licensure Handling', () => {
    it('falls back to baccalaureate base rank without guessing Senior Instructor when licensure is unverified', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'BS Nursing',
        qualification_verified: true,
        licensure_verified: false,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('OK')
      expect(res.seed_action).toBe('seed_initial_rank')
      expect(res.reason_code).toBe('licensure_not_verified')
      expect(res.resolved_initial_rank_code).toBe('ASSISTANT_INSTRUCTOR')
    })
  })

  describe('24.11 — Part-Time Faculty Scope Rejection', () => {
    it('strictly rejects Part-Time Faculty from Full-Time rank seeding', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'Ph.D. in Literature',
        qualification_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.status).toBe('INELIGIBLE')
      expect(res.seed_action).toBe('no_action')
      expect(res.reason_code).toBe('part_time_not_applicable')
      expect(res.resolved_initial_rank_code).toBeNull()
    })
  })

  describe('24.12 — Non-Teaching Personnel Boundary', () => {
    it('rejects Non-Teaching personnel context', () => {
      const res = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'MS Management',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'non_teaching_staff',
      })
      expect(res.status).toBe('INELIGIBLE')
      expect(res.seed_action).toBe('no_action')
      expect(res.reason_code).toBe('non_teaching_not_applicable')
      expect(res.resolved_initial_rank_code).toBeNull()
    })
  })

  describe('24.13 — Position Independence', () => {
    it('yields identical seed results regardless of administrative position or job appointment', () => {
      const res1 = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'Ph.D. in Chemistry',
        qualification_verified: true,
        position_title: 'Dean of College of Science',
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })
      const res2 = facultyInitialRankService.resolveInitialRankSync({
        qualification_code: 'Ph.D. in Chemistry',
        qualification_verified: true,
        position_title: 'Laboratory Coordinator',
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
      })

      expect(res1.resolved_initial_rank_code).toBe(res2.resolved_initial_rank_code)
      expect(res1.resolved_initial_rank_code).toBe('PROFESSOR_I')
    })
  })

  describe('24.14 — E1 / E2 / E3 Regression Integrity', () => {
    it('preserves exactly 26 Full-Time ranks in catalog', () => {
      expect(facultyRankCatalogService.getRankCount()).toBe(26)
    })

    it('preserves exactly 4 Part-Time titles in catalog', () => {
      expect(partTimeFacultyTitleService.getTitleCount()).toBe(4)
    })
  })
})
