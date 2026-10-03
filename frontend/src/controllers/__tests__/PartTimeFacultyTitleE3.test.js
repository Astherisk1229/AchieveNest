import { describe, it, expect, vi, beforeEach } from 'vitest'
import { partTimeFacultyTitleService } from '../../services/partTimeFacultyTitleService'
import apiClient from '../../services/apiClient'

vi.mock('../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Personnel Evaluation Track — Plan E — Phase E3: Part-Time Faculty Title & Qualification Mapping Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // 1. Catalogue Inventory & Frozen Labels
  // =========================================================================
  describe('1. Catalogue Inventory & Frozen Labels', () => {
    it('E3-INV-001: contains exactly 4 frozen Part-Time Faculty Titles', () => {
      expect(partTimeFacultyTitleService.getTitleCount()).toBe(4)
      expect(partTimeFacultyTitleService.PART_TIME_TITLES).toHaveLength(4)
    })

    it('E3-INV-002: preserves exact official labels and stable codes for all 4 titles', () => {
      const titles = partTimeFacultyTitleService.PART_TIME_TITLES

      expect(titles[0]).toEqual({
        code: 'PT_PROFESSORIAL_LECTURER',
        label: 'Professorial Lecturer',
        tier: 'doctoral',
        qualification_wording: 'Ph.D./Ed.D.',
        order: 1,
      })

      expect(titles[1]).toEqual({
        code: 'PT_ASSISTANT_PROFESSORIAL_LECTURER',
        label: 'Assistant Professorial Lecturer',
        tier: 'masters',
        qualification_wording: 'MA/MS/MAT/MD/LL.B./Priests or Equivalent',
        order: 2,
      })

      expect(titles[2]).toEqual({
        code: 'PT_SENIOR_LECTURER',
        label: 'Senior Lecturer',
        tier: 'board_licensure',
        qualification_wording: 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/ARCHITECT/DMD',
        order: 3,
      })

      expect(titles[3]).toEqual({
        code: 'PT_LECTURER',
        label: 'Lecturer',
        tier: 'baccalaureate',
        qualification_wording: 'AB/BSE/BS or Equivalent',
        order: 4,
      })
    })

    it('E3-INV-003: maintains unique codes and unique labels', () => {
      const codes = partTimeFacultyTitleService.PART_TIME_TITLES.map((t) => t.code)
      const labels = partTimeFacultyTitleService.PART_TIME_TITLES.map((t) => t.label)

      expect(new Set(codes).size).toBe(4)
      expect(new Set(labels).size).toBe(4)
    })
  })

  // =========================================================================
  // 2. Authoritative Qualification Mappings
  // =========================================================================
  describe('2. Authoritative Qualification Mappings', () => {
    it('E3-MAP-001: maps verified Doctoral qualifications (PhD/EdD) to Professorial Lecturer', async () => {
      const mockResult = {
        resolved_title: {
          title_code: 'PT_PROFESSORIAL_LECTURER',
          display_label: 'Professorial Lecturer',
        },
        status: 'RESOLVED',
        reason_code: 'resolved_doctoral',
        qualification_group: 'doctoral',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'Doctor of Philosophy in Education (Ph.D.)',
        is_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/faculty-titles/part-time/resolve', {
        qualification: 'Doctor of Philosophy in Education (Ph.D.)',
        is_verified: true,
        faculty_engagement: 'part_time_faculty',
        personnel_group: 'faculty',
      })
      expect(res.resolved_title.title_code).toBe('PT_PROFESSORIAL_LECTURER')
      expect(res.reason_code).toBe('resolved_doctoral')
    })

    it('E3-MAP-002: maps verified Master/Professional qualifications to Assistant Professorial Lecturer', async () => {
      const mockResult = {
        resolved_title: {
          title_code: 'PT_ASSISTANT_PROFESSORIAL_LECTURER',
          display_label: 'Assistant Professorial Lecturer',
        },
        status: 'RESOLVED',
        reason_code: 'resolved_masters_professional',
        qualification_group: 'masters',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'Master of Science in Information Technology (MSIT)',
        is_verified: true,
      })

      expect(res.resolved_title.title_code).toBe('PT_ASSISTANT_PROFESSORIAL_LECTURER')
      expect(res.reason_code).toBe('resolved_masters_professional')
    })

    it('E3-MAP-003: maps verified Professional Board Licensures to Senior Lecturer', async () => {
      const mockResult = {
        resolved_title: {
          title_code: 'PT_SENIOR_LECTURER',
          display_label: 'Senior Lecturer',
        },
        status: 'RESOLVED',
        reason_code: 'resolved_licensed_professional',
        qualification_group: 'board_licensure',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'Certified Public Accountant (CPA Licensure)',
        is_verified: true,
      })

      expect(res.resolved_title.title_code).toBe('PT_SENIOR_LECTURER')
      expect(res.reason_code).toBe('resolved_licensed_professional')
    })

    it('E3-MAP-004: maps verified Baccalaureate qualifications to Lecturer', async () => {
      const mockResult = {
        resolved_title: {
          title_code: 'PT_LECTURER',
          display_label: 'Lecturer',
        },
        status: 'RESOLVED',
        reason_code: 'resolved_baccalaureate',
        qualification_group: 'baccalaureate',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'Bachelor of Science in Accountancy (BSA)',
        is_verified: true,
      })

      expect(res.resolved_title.title_code).toBe('PT_LECTURER')
      expect(res.reason_code).toBe('resolved_baccalaureate')
    })
  })

  // =========================================================================
  // 3. Unverified & Unmapped Handling (Zero Guessing)
  // =========================================================================
  describe('3. Unverified & Unmapped Handling', () => {
    it('E3-UNV-001: returns qualification_not_verified when qualification is unverified', async () => {
      const mockResult = {
        resolved_title: null,
        status: 'UNRESOLVED',
        reason_code: 'qualification_not_verified',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'Master of Arts in Education',
        is_verified: false,
      })

      expect(res.resolved_title).toBeNull()
      expect(res.status).toBe('UNRESOLVED')
      expect(res.reason_code).toBe('qualification_not_verified')
    })

    it('E3-UNV-002: returns qualification_unmapped for unrecognized qualification text', async () => {
      const mockResult = {
        resolved_title: null,
        status: 'UNRESOLVED',
        reason_code: 'qualification_unmapped',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'Special Certificate in Leadership 2026',
        is_verified: true,
      })

      expect(res.resolved_title).toBeNull()
      expect(res.status).toBe('UNRESOLVED')
      expect(res.reason_code).toBe('qualification_unmapped')
    })
  })

  // =========================================================================
  // 4. Boundary Protection & Non-Progression Enforcement
  // =========================================================================
  describe('4. Boundary Protection & Non-Progression', () => {
    it('E3-BND-001: rejects resolution when personnel context is Full-Time Faculty', async () => {
      const mockResult = {
        resolved_title: null,
        status: 'INELIGIBLE',
        reason_code: 'not_part_time_faculty',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'Ph.D. in Mathematics',
        is_verified: true,
        faculty_engagement: 'full_time_faculty',
      })

      expect(res.status).toBe('INELIGIBLE')
      expect(res.reason_code).toBe('not_part_time_faculty')
    })

    it('E3-BND-002: rejects resolution when personnel context is Non-Teaching personnel', async () => {
      const mockResult = {
        resolved_title: null,
        status: 'INELIGIBLE',
        reason_code: 'unsupported_personnel_group',
      }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: mockResult } })

      const res = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'BS Biology',
        is_verified: true,
        personnel_group: 'non_teaching_faculty',
      })

      expect(res.status).toBe('INELIGIBLE')
      expect(res.reason_code).toBe('unsupported_personnel_group')
    })

    it('E3-BND-003: maintains position independence (changing administrative position does not change Part-Time title)', async () => {
      const mockResult = {
        resolved_title: { title_code: 'PT_LECTURER', display_label: 'Lecturer' },
        status: 'RESOLVED',
        reason_code: 'resolved_baccalaureate',
      }
      apiClient.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const res1 = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'BS Accountancy',
        is_verified: true,
        position_title: 'Lecturer I',
      })

      const res2 = await partTimeFacultyTitleService.resolveTitleFromQualification({
        qualification: 'BS Accountancy',
        is_verified: true,
        position_title: 'Department Assistant',
      })

      expect(res1.resolved_title.title_code).toBe(res2.resolved_title.title_code)
    })
  })
})
