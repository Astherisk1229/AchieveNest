import { describe, it, expect } from 'vitest'
import PersonnelEvaluatorWorkspaceService, {
  EVIDENCE_STATUSES,
  JUDGMENT_STATUSES
} from '../../services/PersonnelEvaluatorWorkspaceService.js'
import {
  REVIEWER_ROLES
} from '../../services/PersonnelReviewerRoutingRegistry.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan G — Phase G2: Evaluator Workspace, Snapshot Review & Evidence Suite', () => {

  const sampleAdminSnapshot = {
    items: [
      {
        id: 'ev-1',
        categoryArea: 'areaA',
        criterionCode: 'A.1',
        title: 'Ph.D. Computer Science Diploma',
        raw_points: 40.0,
        criterion_capped_points: 40.0,
        awardedPoints: 40.0,
        fileName: 'PhD_Diploma_Ana_Reyes.pdf',
        evaluatorRemarks: 'Ph.D. degree validated from accredited institution.'
      },
      {
        id: 'ev-2',
        categoryArea: 'areaA',
        criterionCode: 'A.2',
        title: 'IEEE Senior Professional Member',
        raw_points: 5.0,
        criterion_capped_points: 5.0,
        awardedPoints: 5.0,
        fileName: 'IEEE_Membership_Cert.pdf',
        evaluatorRemarks: 'Active professional membership verified.'
      },
      {
        id: 'ev-3',
        categoryArea: 'areaB',
        criterionCode: 'B.3',
        title: 'Institutional Research on Deep Learning',
        evaluator_judgment_required: true,
        accepted_points: null, // Unresolved judgment
        fileName: 'CHED_Research_Report.pdf',
        evaluatorRemarks: 'Research output awaiting evaluator score.'
      },
      {
        id: 'ev-4',
        categoryArea: 'areaC',
        criterionCode: 'C.1',
        title: 'Computer Society Club Moderator',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        awardedPoints: 20.0,
        fileName: null, // Missing proof test
        evaluatorRemarks: 'Service rendered as moderator.'
      }
    ]
  }

  const sampleNonTeachingSnapshot = {
    items: [
      {
        id: 'ev-nt-1',
        categoryArea: 'areaB',
        criterionCode: 'B.1',
        title: 'Club Moderator Service',
        raw_points: 30.0,
        criterion_capped_points: 30.0,
        awardedPoints: 30.0,
        fileName: 'Moderator_Cert.pdf'
      },
      {
        id: 'ev-nt-2',
        categoryArea: 'areaB',
        criterionCode: 'B.5',
        title: 'Meritorious Service Award 2026',
        evaluator_judgment_required: true,
        accepted_points: null, // Pending judgment
        fileName: 'Merit_Award.pdf'
      }
    ]
  }

  // =========================================================================
  // 1. Reviewer Authorization & Access Control
  // =========================================================================
  describe('1. Reviewer Authorization & Scope Access Control', () => {
    it('allows assigned Dean to open evaluation within their authorized academic college', () => {
      const evaluation = {
        evaluation_id: 'EVAL-CEAC-01',
        personnel_profile_id: 'USER-FACULTY-1',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CEAC',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS
      }
      const deanActor = {
        profile_id: 'USER-DEAN-CEAC',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-CEAC'
      }

      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, sampleAdminSnapshot)
      expect(workspace.is_read_only_snapshot).toBe(true)
      expect(workspace.evaluation_id).toBe('EVAL-CEAC-01')
      expect(workspace.personnel_context.assigned_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
    })

    it('denies access to a Dean attempting to open an evaluation from another college', () => {
      const evaluation = {
        evaluation_id: 'EVAL-CBA-01',
        personnel_profile_id: 'USER-FACULTY-2',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CBA',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS
      }
      const deanCEAC = {
        profile_id: 'USER-DEAN-CEAC',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-CEAC' // CEAC Dean trying to access CBA evaluation
      }

      expect(() => {
        PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanCEAC, sampleAdminSnapshot)
      }).toThrow(/Cross-college access prohibited/i)
    })

    it('allows assigned HR staff to open HR-assigned evaluations', () => {
      const evaluation = {
        evaluation_id: 'EVAL-HR-NT-01',
        personnel_profile_id: 'USER-NT-01',
        assigned_reviewer_role: REVIEWER_ROLES.HR,
        evaluator_college_id: null,
        evaluation_scale_code: EVALUATION_SCALE_CODES.NON_TEACHING
      }
      const hrActor = {
        profile_id: 'USER-HR-1',
        roles: ['hr_staff']
      }

      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, hrActor, sampleNonTeachingSnapshot)
      expect(workspace.evaluation_id).toBe('EVAL-HR-NT-01')
      expect(workspace.scale_context.is_non_teaching).toBe(true)
    })

    it('strictly denies Department Secretary access to evaluator workspace', () => {
      const evaluation = {
        evaluation_id: 'EVAL-CEAC-01',
        personnel_profile_id: 'USER-FACULTY-1',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CEAC'
      }
      const secActor = {
        profile_id: 'USER-DEP-SEC',
        roles: ['department_secretary']
      }

      expect(() => {
        PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, secActor, sampleAdminSnapshot)
      }).toThrow(/Department Secretary role does not possess evaluator authority/i)
    })

    it('strictly denies Personnel candidate access to evaluator workspace for self-review', () => {
      const evaluation = {
        evaluation_id: 'EVAL-DEAN-SELF',
        personnel_profile_id: 'USER-DEAN-CEAC', // Same ID!
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CEAC'
      }
      const candidateActor = {
        profile_id: 'USER-DEAN-CEAC',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-CEAC'
      }

      expect(() => {
        PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, candidateActor, sampleAdminSnapshot)
      }).toThrow(/Self-review prohibited/i)
    })
  })

  // =========================================================================
  // 2. Administrators Ranking Scale Workspace Rendering
  // =========================================================================
  describe('2. Administrators Scale Rendering (Areas A, B, C)', () => {
    const evaluation = {
      evaluation_id: 'EVAL-ADMIN-01',
      personnel_profile_id: 'USER-FACULTY-1',
      assigned_reviewer_role: REVIEWER_ROLES.DEAN,
      evaluator_college_id: 'COLLEGE-CEAC',
      evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS
    }
    const deanActor = { profile_id: 'USER-DEAN-CEAC', roles: ['dean'], assigned_college_id: 'COLLEGE-CEAC' }

    it('renders Areas A, B, and C with Plan F caps (70, 50, 40)', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, sampleAdminSnapshot)
      expect(workspace.areas.AREA_A.max_points).toBe(70.0)
      expect(workspace.areas.AREA_B.max_points).toBe(50.0)
      expect(workspace.areas.AREA_C.max_points).toBe(40.0)
      expect(workspace.scale_context.maximum_score).toBe(160.0)
      expect(workspace.scale_context.passing_score).toBe(120.0)
    })

    it('renders evaluator-judgment item B.3 as awaiting_evaluator with max 40.0 pts', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, sampleAdminSnapshot)
      const b3Item = workspace.areas.AREA_B.items.find(i => i.criterion_code === 'B.3')

      expect(b3Item).toBeDefined()
      expect(b3Item.is_evaluator_judgment_required).toBe(true)
      expect(b3Item.max_allowed_points).toBe(40.0)
      expect(b3Item.accepted_points).toBeNull()
      expect(b3Item.evaluator_judgment_status).toBe(JUDGMENT_STATUSES.AWAITING_EVALUATOR)
      expect(workspace.scale_context.pending_judgment_count).toBe(1)
      expect(workspace.scale_context.scoring_completeness).toBe('pending_evaluator_judgment')
    })
  })

  // =========================================================================
  // 3. Non-Teaching Personnel Ranking Scale Workspace Rendering
  // =========================================================================
  describe('3. Non-Teaching Scale Rendering (Area A Read-Only & Area B)', () => {
    const evaluation = {
      evaluation_id: 'EVAL-NT-01',
      personnel_profile_id: 'USER-NT-01',
      assigned_reviewer_role: REVIEWER_ROLES.HR,
      evaluation_scale_code: EVALUATION_SCALE_CODES.NON_TEACHING
    }
    const hrActor = { profile_id: 'USER-HR-1', roles: ['hr_staff'] }

    it('renders Area A as strictly read-only evaluator structure with 90.0 pts max', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, hrActor, sampleNonTeachingSnapshot)
      const areaA = workspace.areas.AREA_A

      expect(areaA.is_evaluator_only).toBe(true)
      expect(areaA.max_points).toBe(90.0)
      expect(areaA.rating_structure).toHaveLength(3)
      expect(areaA.items).toHaveLength(0) // No personnel accomplishment items in Area A
    })

    it('renders Area B with submitted achievements and B.5 judgment pending status', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, hrActor, sampleNonTeachingSnapshot)
      const areaB = workspace.areas.AREA_B
      expect(areaB.max_points).toBe(60.0)
      expect(areaB.items).toHaveLength(2)

      const b5Item = areaB.items.find(i => i.criterion_code === 'B.5')
      expect(b5Item.is_evaluator_judgment_required).toBe(true)
      expect(b5Item.max_allowed_points).toBe(30.0)
      expect(b5Item.evaluator_judgment_status).toBe(JUDGMENT_STATUSES.AWAITING_EVALUATOR)
    })
  })

  // =========================================================================
  // 4. Evidence Inspection & Missing Evidence Handling
  // =========================================================================
  describe('4. Evidence Review & Missing Proof State Handling', () => {
    const evaluation = {
      evaluation_id: 'EVAL-ADMIN-01',
      personnel_profile_id: 'USER-FACULTY-1',
      assigned_reviewer_role: REVIEWER_ROLES.DEAN,
      evaluator_college_id: 'COLLEGE-CEAC',
      evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS
    }
    const deanActor = { profile_id: 'USER-DEAN-CEAC', roles: ['dean'], assigned_college_id: 'COLLEGE-CEAC' }

    it('provides valid preview URL and status for attached evidence documents', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, sampleAdminSnapshot)
      const a1Item = workspace.areas.AREA_A.items.find(i => i.criterion_code === 'A.1')

      expect(a1Item.evidence_reference.status).toBe(EVIDENCE_STATUSES.PREVIEW_READY)
      expect(a1Item.evidence_reference.file_name).toBe('PhD_Diploma_Ana_Reyes.pdf')
      expect(a1Item.evidence_reference.preview_url).toContain('/api/v1/evidence/preview/PhD_Diploma_Ana_Reyes.pdf')
      expect(a1Item.evidence_reference.warning_message).toBeNull()
    })

    it('renders controlled warning and evidence_unavailable status when required proof is missing', () => {
      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, sampleAdminSnapshot)
      const c1Item = workspace.areas.AREA_C.items.find(i => i.criterion_code === 'C.1')

      expect(c1Item.evidence_reference.status).toBe(EVIDENCE_STATUSES.EVIDENCE_UNAVAILABLE)
      expect(c1Item.evidence_reference.file_name).toBeNull()
      expect(c1Item.evidence_reference.preview_url).toBeNull()
      expect(c1Item.evidence_reference.warning_message).toContain('attachment is missing or unavailable')
    })
  })

  // =========================================================================
  // 5. Runtime Resilience (Empty and Safe Fallback States)
  // =========================================================================
  describe('5. Runtime Resilience & Empty States', () => {
    it('safely handles empty snapshot without fatal exceptions', () => {
      const evaluation = {
        evaluation_id: 'EVAL-EMPTY-01',
        personnel_profile_id: 'USER-FACULTY-1',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        evaluator_college_id: 'COLLEGE-CEAC',
        evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS
      }
      const deanActor = { profile_id: 'USER-DEAN-CEAC', roles: ['dean'], assigned_college_id: 'COLLEGE-CEAC' }

      const workspace = PersonnelEvaluatorWorkspaceService.getEvaluationWorkspace(evaluation, deanActor, { items: [] })
      expect(workspace.areas.AREA_A.items).toHaveLength(0)
      expect(workspace.areas.AREA_B.items).toHaveLength(0)
      expect(workspace.areas.AREA_C.items).toHaveLength(0)
      expect(workspace.scale_context.pending_judgment_count).toBe(0)
      expect(workspace.scale_context.scoring_completeness).toBe('scoring_complete')
    })
  })
})
