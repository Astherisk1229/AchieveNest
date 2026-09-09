import { describe, it, expect } from 'vitest'
import PersonnelReviewerRoutingRegistry, {
  REVIEWER_ROLES,
  REVIEWER_SCOPE_TYPES,
  ROUTING_REASON_CODES
} from '../../services/PersonnelReviewerRoutingRegistry.js'
import PersonnelEvaluationScoringEngine from '../../services/PersonnelEvaluationScoringEngine.js'
import PersonnelEvaluationResultService, {
  RESULT_VOCABULARY,
  RESULT_STATUSES
} from '../../services/PersonnelEvaluationResultService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan G — Phase G0: Reviewer Routing, Authority & Evaluation Workspace Audit Suite', () => {

  // =========================================================================
  // 1. Canonical Reviewer Routing Matrix
  // =========================================================================
  describe('1. Canonical Reviewer Routing Rules', () => {
    it('routes Faculty + Academic to Dean within academic college scope', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CEAC'
      })

      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.COLLEGE_ACADEMIC_SCOPE)
      expect(route.target_college_id).toBe('COLLEGE-CEAC')
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.ROUTE_ASSIGNED)
    })

    it('routes Non-Teaching Faculty + Academic to Dean within academic college scope', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CHS'
      })

      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.COLLEGE_ACADEMIC_SCOPE)
      expect(route.target_college_id).toBe('COLLEGE-CHS')
    })

    it('routes Non-Teaching Faculty + Non-Academic to HR', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic'
      })

      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
      expect(route.target_college_id).toBeNull()
    })

    it('routes Dean evaluations to HR', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_dean: true
      })

      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
    })

    it('routes VP for Academics evaluations to HR', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_vp_academics: true
      })

      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
    })

    it('routes VP for Administration evaluations to HR', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        is_vp_administration: true
      })

      expect(route.status).toBe('resolved')
      expect(route.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
      expect(route.scope_type).toBe(REVIEWER_SCOPE_TYPES.UNIVERSITY_HR_SCOPE)
    })
  })

  // =========================================================================
  // 2. Unresolved & Unsupported Route Handling (No Guessed Reviewers)
  // =========================================================================
  describe('2. Unresolved Reviewer Handling', () => {
    it('returns status unresolved for unsupported combinations without guessing', () => {
      const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'non_academic' // Invalid combination
      })

      expect(route.status).toBe('unresolved')
      expect(route.authorized_reviewer_role).toBeNull()
      expect(route.reason_code).toBe(ROUTING_REASON_CODES.REVIEWER_ROUTE_UNRESOLVED)
    })

    it('prohibits scale code alone from determining reviewer identity', () => {
      // Both Faculty (Dean) and Dean (HR) use ADMINISTRATORS_RANKING_SCALE
      const facultyRoute = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_dean: false
      })
      const deanRoute = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        is_dean: true
      })

      expect(facultyRoute.authorized_reviewer_role).toBe(REVIEWER_ROLES.DEAN)
      expect(deanRoute.authorized_reviewer_role).toBe(REVIEWER_ROLES.HR)
    })
  })

  // =========================================================================
  // 3. Reviewer Authority & Scope Boundaries
  // =========================================================================
  describe('3. Reviewer Authority & Scope Access Control', () => {
    it('strictly excludes Department Secretary from evaluator authority', () => {
      const actor = {
        profile_id: 'USER-DEP-SEC',
        roles: ['department_secretary']
      }
      const evaluation = {
        personnel_profile_id: 'USER-FACULTY-1',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        target_college_id: 'COLLEGE-CEAC'
      }

      const isAuth = PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(actor, evaluation)
      expect(isAuth).toBe(false)
    })

    it('strictly prohibits Personnel self-evaluation / self-rating', () => {
      const actor = {
        profile_id: 'USER-FACULTY-1',
        roles: ['dean'], // Even if actor is a Dean
        assigned_college_id: 'COLLEGE-CEAC'
      }
      const evaluation = {
        personnel_profile_id: 'USER-FACULTY-1', // Same user!
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        target_college_id: 'COLLEGE-CEAC'
      }

      const isAuth = PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(actor, evaluation)
      expect(isAuth).toBe(false)
    })

    it('authorizes Dean only for their assigned college and rejects cross-college access', () => {
      const deanCEAC = {
        profile_id: 'DEAN-CEAC',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-CEAC'
      }
      const evalCEAC = {
        personnel_profile_id: 'FACULTY-1',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        target_college_id: 'COLLEGE-CEAC'
      }
      const evalCBA = {
        personnel_profile_id: 'FACULTY-2',
        assigned_reviewer_role: REVIEWER_ROLES.DEAN,
        target_college_id: 'COLLEGE-CBA'
      }

      expect(PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(deanCEAC, evalCEAC)).toBe(true)
      expect(PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(deanCEAC, evalCBA)).toBe(false)
    })

    it('authorizes HR Staff for university-wide HR assigned evaluations', () => {
      const hrActor = {
        profile_id: 'HR-USER-1',
        roles: ['hr_staff']
      }
      const hrEval = {
        personnel_profile_id: 'NON-TEACHING-1',
        assigned_reviewer_role: REVIEWER_ROLES.HR,
        target_college_id: null
      }

      expect(PersonnelReviewerRoutingRegistry.isAuthorizedReviewer(hrActor, hrEval)).toBe(true)
    })
  })

  // =========================================================================
  // 4. Downstream Plan F Consumption & Scoring Governance
  // =========================================================================
  describe('4. Plan F Scoring Governance Invariants in Reviewer Scope', () => {
    it('confirms evaluator accepted points must comply with Plan F Phase F4 ceilings', () => {
      // Research B.3 max 40.0
      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.3', 45.0)
      }).toThrow(/exceeds maximum ceiling \[40\]/i)

      // Creative Work B.6 max 20.0
      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.6', 25.0)
      }).toThrow(/exceeds maximum ceiling \[20\]/i)

      // Non-Teaching Awards B.5 max 30.0
      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.5', 35.0)
      }).toThrow(/exceeds maximum ceiling \[30\]/i)
    })

    it('confirms Non-Teaching Area A remains evaluator-only and personnel cannot submit entries', () => {
      expect(() => {
        PersonnelEvaluationScoringEngine.scoreItem({
          scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
          areaCode: 'A',
          category: 'Job Performance',
          entry: { title: 'Self Evaluation' }
        })
      }).toThrow(/evaluation-only section and does not permit personnel accomplishment mutations/i)
    })

    it('confirms Plan F Passed/Retained determination remains downstream of evaluator accepted points', () => {
      const evaluationContext = {
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        itemsByArea: {
          A: [{ accepted_points: 70.0 }],
          B: [{ accepted_points: 30.0 }],
          C: [{ accepted_points: 20.0 }]
        }
      }

      const result = PersonnelEvaluationResultService.determineResult(evaluationContext)
      expect(result.final_result).toBe(RESULT_VOCABULARY.PASSED)
      expect(result.result_status).toBe(RESULT_STATUSES.FINALIZED)
    })
  })
})
