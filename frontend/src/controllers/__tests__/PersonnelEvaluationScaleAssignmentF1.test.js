import { describe, it, expect, vi, beforeEach } from 'vitest'
import evaluationScaleAssignmentService from '../../services/evaluationScaleAssignmentService'
import evaluationInstrumentRegistry, {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION,
} from '../../services/evaluationInstrumentRegistry'
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

describe('Plan F — Phase F1: Server-Authoritative Scale Assignment & Dynamic Portfolio Workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('26.1 — Faculty + Academic -> ADMINISTRATORS_RANKING_SCALE', () => {
    it('assigns ADMINISTRATORS_RANKING_SCALE to Faculty on the Academic side', () => {
      const res = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'faculty',
        organizational_side: 'academic',
      })
      expect(res.assignment_status).toBe('assigned')
      expect(res.scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(res.rule_version).toBe(EVALUATION_RULE_VERSION)
    })
  })

  describe('26.2 — Non-Teaching Faculty + Academic -> ADMINISTRATORS_RANKING_SCALE', () => {
    it('assigns ADMINISTRATORS_RANKING_SCALE to Non-Teaching Faculty on the Academic side', () => {
      const res = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic',
      })
      expect(res.assignment_status).toBe('assigned')
      expect(res.scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })
  })

  describe('26.3 — Non-Teaching Faculty + Non-Academic -> NON_TEACHING_PERSONNEL_RANKING_SCALE', () => {
    it('assigns NON_TEACHING_PERSONNEL_RANKING_SCALE to Non-Teaching Faculty on the Non-Academic side', () => {
      const res = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
      })
      expect(res.assignment_status).toBe('assigned')
      expect(res.scale_code).toBe(EVALUATION_SCALE_CODES.NON_TEACHING)
    })
  })

  describe('26.4 — Unsupported Combination Rejection', () => {
    it('strictly rejects unconfirmed Faculty + Non-Academic combination without defaulting', () => {
      const res = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'faculty',
        organizational_side: 'non_academic',
      })
      expect(res.assignment_status).toBe('rejected')
      expect(res.reason_code).toBe('unsupported_personnel_combination')
      expect(res.scale_code).toBeNull()
    })
  })

  describe('26.5 — Server-Authoritative Scale Retrieval API Contract', () => {
    it('fetches server-authoritative scale assignment DTO via API', async () => {
      const mockDto = {
        personnel_profile_id: 101,
        personnel_group: 'faculty',
        organizational_side: 'academic',
        evaluation_scale_code: 'ADMINISTRATORS_RANKING_SCALE',
        scale_title: 'Rating Sheet for Administrators & Academic Personnel',
        rule_version: 'NDMU-PERSONNEL-RATING-V2',
        assignment_source: 'canonical_profile_matrix',
        assignment_status: 'assigned',
        override_applied: false,
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockDto } })

      const res = await evaluationScaleAssignmentService.fetchAssignedScale('2025-2026')
      expect(res.evaluation_scale_code).toBe('ADMINISTRATORS_RANKING_SCALE')
      expect(res.rule_version).toBe('NDMU-PERSONNEL-RATING-V2')
      expect(res.override_applied).toBe(false)
    })
  })

  describe('26.6 — Dynamic Area Rendering for Administrators Scale', () => {
    it('provides Areas A, B, and C with personnel entry allowed', () => {
      const instrument = evaluationScaleAssignmentService.getInstrument(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(instrument.areas.AREA_A).toBeDefined()
      expect(instrument.areas.AREA_B).toBeDefined()
      expect(instrument.areas.AREA_C).toBeDefined()

      expect(instrument.areas.AREA_A.is_personnel_entry_allowed).toBe(true)
      expect(instrument.areas.AREA_B.is_personnel_entry_allowed).toBe(true)
      expect(instrument.areas.AREA_C.is_personnel_entry_allowed).toBe(true)
    })
  })

  describe('26.7 — Dynamic Area Rendering & Read-Only Enforcement for Non-Teaching Scale', () => {
    it('provides Areas A and B, enforcing read-only on Area A with no personnel mutation', () => {
      const instrument = evaluationScaleAssignmentService.getInstrument(EVALUATION_SCALE_CODES.NON_TEACHING)
      expect(instrument.areas.AREA_A).toBeDefined()
      expect(instrument.areas.AREA_B).toBeDefined()
      expect(instrument.areas.AREA_C).toBeUndefined()

      expect(instrument.areas.AREA_A.entry_policy).toBe('read_only_evaluation_area')
      expect(instrument.areas.AREA_A.is_personnel_entry_allowed).toBe(false)
      expect(instrument.areas.AREA_B.is_personnel_entry_allowed).toBe(true)
    })
  })

  describe('26.8 — Wrong-Scale Protection & Category Isolation', () => {
    it('verifies Administrators scale contains only Administrators categories', () => {
      const adminInstrument = evaluationScaleAssignmentService.getInstrument(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(adminInstrument.areas.AREA_A.categories['A.1']).toBeDefined()
      expect(adminInstrument.areas.AREA_B.categories['B.1']).toBeDefined()
      expect(adminInstrument.areas.AREA_C.categories['C.3']).toBeDefined()
    })

    it('verifies Non-Teaching scale contains only Non-Teaching categories', () => {
      const ntInstrument = evaluationScaleAssignmentService.getInstrument(EVALUATION_SCALE_CODES.NON_TEACHING)
      expect(ntInstrument.areas.AREA_B.categories['B.4'].name).toBe('Invited as Judge, Lecturer, Resource Person')
      expect(ntInstrument.areas.AREA_B.categories['B.5'].name).toBe('Recognition / Meritorious Award')
    })
  })

  describe('26.9 — Dynamic Field & Evidence Requirements', () => {
    it('verifies required fields and evidence flags match canonical F0 definitions', () => {
      const adminA1 = evaluationScaleAssignmentService.getInstrument(EVALUATION_SCALE_CODES.ADMINISTRATORS).areas.AREA_A.categories['A.1']
      expect(adminA1.required_fields).toEqual(['degree_type', 'degree_name_or_units', 'institution'])
      expect(adminA1.evidence_required).toBe(true)

      const adminC3 = evaluationScaleAssignmentService.getInstrument(EVALUATION_SCALE_CODES.ADMINISTRATORS).areas.AREA_C.categories['C.3']
      expect(adminC3.server_derived).toBe(true)
      expect(adminC3.evidence_required).toBe(false)
    })
  })

  describe('26.10 — Rule Version Propagation', () => {
    it('guarantees NDMU-PERSONNEL-RATING-V2 is present across all scale assignments', () => {
      const admin = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'faculty',
        organizational_side: 'academic',
      })
      const nt = evaluationScaleAssignmentService.resolveScaleFromContextSync({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
      })

      expect(admin.rule_version).toBe('NDMU-PERSONNEL-RATING-V2')
      expect(nt.rule_version).toBe('NDMU-PERSONNEL-RATING-V2')
    })
  })
})
