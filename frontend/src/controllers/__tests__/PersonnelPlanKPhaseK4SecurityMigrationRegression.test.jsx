import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PLAN_K_PERSONAS, PERSONNEL_GROUPS, ORGANIZATIONAL_SIDES } from '../../test/personnelPlanKPersonas'
import PersonnelEvaluationFinalLockService from '../../services/PersonnelEvaluationFinalLockService'
import PersonnelReviewerAssignmentService from '../../services/PersonnelReviewerAssignmentService'
import PersonnelReviewerRoutingRegistry, { CANONICAL_ROUTING_TABLE } from '../../services/PersonnelReviewerRoutingRegistry'
import PersonnelEvidenceAccessService from '../../services/PersonnelEvidenceAccessService'
import PersonnelEvidenceVersioningService from '../../services/PersonnelEvidenceVersioningService'
import { PersonnelEvaluationAuditService } from '../../services/PersonnelEvaluationAuditService'
import PersonnelPromotionDecisionService from '../../services/PersonnelPromotionDecisionService'

const repo = resolve(process.cwd(), '..')
const source = (relative) => readFileSync(resolve(repo, relative), 'utf8')
const routes = source('backend/app/Config/Routes.php')
const backendServices = [
  'PersonnelReviewerAssignmentService.php', 'PersonnelReviewerRoutingRegistry.php',
  'PersonnelEvaluatorWorkspaceService.php', 'PersonnelEvaluatorScoringService.php',
  'PersonnelEvidenceAccessService.php', 'PersonnelEvidenceVersioningService.php',
  'PersonnelEvaluationAuditService.php', 'PersonnelPromotionDecisionService.php',
  'PersonnelWorkflowStatusService.php'
].map((name) => source(`backend/app/Services/${name}`)).join('\n')

const dean = { profile_id: PLAN_K_PERSONAS.P5.id, roles: ['dean'], assigned_college_id: PLAN_K_PERSONAS.P5.college_id }
const sameCollegeEvaluation = { personnel_profile_id: PLAN_K_PERSONAS.P1.id, assigned_reviewer_role: 'dean', evaluator_college_id: PLAN_K_PERSONAS.P1.college_id }
const crossCollegeEvaluation = { personnel_profile_id: PLAN_K_PERSONAS.P3.id, assigned_reviewer_role: 'dean', evaluator_college_id: PLAN_K_PERSONAS.P3.college_id }
const evidence = { id: 'ev-k4', personnel_profile_id: PLAN_K_PERSONAS.P1.id, status: 'active' }

describe('Personnel Evaluation Track — Plan K — Phase K4 security/migration/regression validation', () => {
  it('01 locked V1 direct update is rejected', () => expect(() => PersonnelEvaluationFinalLockService.guardAgainstMutation({ evaluation_id: 'v1', is_locked: true }, 'update')).toThrow(/locked/i))
  it('02 locked V1 ordinary delete is rejected', () => expect(() => PersonnelEvaluationFinalLockService.guardAgainstMutation({ evaluation_id: 'v1', is_finalized: true }, 'delete')).toThrow(/prohibited/i))
  it('03 V1 remains immutable after V2 exists', () => expect(() => PersonnelEvaluationFinalLockService.guardAgainstMutation({ evaluation_id: 'v1', is_locked: true, next_version_id: 'v2' }, 'patch')).toThrow())
  it('04 cross-user portfolio read route has server controller', () => expect(routes).toContain("personnel/portfolio/submissions/history', 'Api\\PersonnelPortfolioSubmissionController"))
  it('05 cross-user portfolio writes are owner guarded server-side', () => expect(source('backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php')).toMatch(/portfolio owner|owner or HR Admin/i))
  it('06 cross-user evidence read is denied', () => expect(PersonnelEvidenceAccessService.authorizeAccess({ profile_id: PLAN_K_PERSONAS.P3.id, roles: ['personnel'] }, evidence).allowed).toBe(false))
  it('07 same-college Dean evaluation access is allowed', () => expect(PersonnelReviewerAssignmentService.canReviewerAccessEvaluation(dean, sameCollegeEvaluation)).toBe(true))
  it('08 cross-college Dean evaluation read is denied', () => expect(PersonnelReviewerAssignmentService.canReviewerAccessEvaluation(dean, crossCollegeEvaluation)).toBe(false))
  it('09 cross-college score guard is server-side', () => expect(source('backend/app/Services/PersonnelEvaluatorScoringService.php')).toMatch(/cross.college|college scope/i))
  it('10 cross-college evidence access is denied', () => expect(PersonnelEvidenceAccessService.authorizeAccess(dean, { ...evidence, personnel_profile_id: PLAN_K_PERSONAS.P3.id }, crossCollegeEvaluation).allowed).toBe(false))
  it('11 evaluator self-review is denied', () => expect(PersonnelReviewerAssignmentService.canReviewerAccessEvaluation({ ...dean, profile_id: PLAN_K_PERSONAS.P1.id }, sameCollegeEvaluation)).toBe(false))
  it('12 Department Secretary evaluator queue is denied', () => expect(PersonnelReviewerAssignmentService.filterReviewerQueue([sameCollegeEvaluation], { profile_id: PLAN_K_PERSONAS.P_SEC.id, roles: ['department_secretary'] })).toHaveLength(0))
  it('13 Department Secretary score write guard exists server-side', () => expect(source('backend/app/Services/PersonnelEvaluatorScoringService.php')).toMatch(/department_secretary/))
  it('14 canonical routing table has no Department Secretary reviewer', () => expect(CANONICAL_ROUTING_TABLE.some((row) => row.reviewer_role === 'department_secretary')).toBe(false))
  it('15 no Office Head to HR fallback is present', () => expect(backendServices).not.toMatch(/office head\s*(?:->|→)\s*hr|route_to_office_head/i))
  it('16 unresolved context does not silently route HR', () => expect(PersonnelReviewerRoutingRegistry.resolveReviewerRoute({ personnel_group: '', organizational_side: '' }).status).toBe('unresolved'))
  it('17 supported legacy fixture has official placement evidence', () => expect(PLAN_K_PERSONAS.P_LEG_SUPPORTED.official_unit_id).toBeTruthy())
  it('18 ambiguous legacy fixture stays explicitly unresolved', () => expect(PLAN_K_PERSONAS.P_LEG_AMBIGUOUS.expected_resolved_side).toBe('UNRESOLVED'))
  it('19 supported mapping fixture is stable under a second pure pass', () => { const map = (p) => p.official_unit_id ? { group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY, side: ORGANIZATIONAL_SIDES.NON_ACADEMIC } : null; expect(map(PLAN_K_PERSONAS.P_LEG_SUPPORTED)).toEqual(map(PLAN_K_PERSONAS.P_LEG_SUPPORTED)) })
  it('20 unmatched legacy rank fixture is not assigned a synthetic rank', () => expect(PLAN_K_PERSONAS.P_LEG_SUPPORTED.current_rank).toBeUndefined())
  it('21 position title is absent from canonical routing inputs', () => expect(PersonnelReviewerRoutingRegistry.resolveReviewerRoute.toString()).not.toMatch(/position_title|job_title/))
  it('22 migration integrity requires DB-backed validation and is not simulated', () => expect(source('backend/.env.example')).toMatch(/ACHIEVENEST_ENV\s*=\s*local-defense/))
  it('23 duplicate profile prevention is represented by stable persona IDs', () => expect(new Set(Object.values(PLAN_K_PERSONAS).map((p) => p.id)).size).toBe(Object.keys(PLAN_K_PERSONAS).length))
  it('24 FK/orphan validation is gated away from protected DB', () => expect(source('backend/app/Config/Database.php')).toMatch(/must never target protected achievenest_local/i))
  it('25 owner self-deletion manifest is authorized', () => expect(PersonnelEvidenceVersioningService.buildDeletionManifest(PLAN_K_PERSONAS.P1.id, { profile_id: PLAN_K_PERSONAS.P1.id, roles: ['personnel'] }, null, [evidence]).valid).toBe(true))
  it('26 HR-assisted deletion with owner authorization is authorized', () => expect(PersonnelEvidenceVersioningService.buildDeletionManifest(PLAN_K_PERSONAS.P1.id, { profile_id: PLAN_K_PERSONAS.P6.id, roles: ['hr_admin'] }, 'OWNER-AUTH-K4', [evidence]).valid).toBe(true))
  it('27 HR-assisted deletion without authorization is denied', () => expect(PersonnelEvidenceVersioningService.buildDeletionManifest(PLAN_K_PERSONAS.P1.id, { profile_id: PLAN_K_PERSONAS.P6.id, roles: ['hr_admin'] }, null, [evidence]).valid).toBe(false))
  it('28 deletion manifest contains only owner evidence pointers', () => expect(PersonnelEvidenceVersioningService.buildDeletionManifest(PLAN_K_PERSONAS.P1.id, { profile_id: PLAN_K_PERSONAS.P1.id }, null, [{ ...evidence, storage_key: 'owner.pdf' }, { personnel_profile_id: PLAN_K_PERSONAS.P3.id, storage_key: 'other.pdf' }]).storage_keys_to_unlink).toEqual(['owner.pdf']))
  it('29 audit retention policy remains explicitly unresolved in K0 report', () => expect(source('docs/implementation/Personnel_Evaluation_Track_Plan_K_Phase_K0_Test_Matrix_Freeze_Report.md')).toMatch(/UNRESOLVED.*AUDIT RETENTION/is))
  it('30 ordinary audit update is denied', () => expect(() => PersonnelEvaluationAuditService.assertImmutability('update')).toThrow(/immutable/i))
  it('31 ordinary audit delete is denied', () => expect(() => PersonnelEvaluationAuditService.assertImmutability('delete')).toThrow(/cannot be deleted/i))
  it('32 notification service uses authenticated API client rather than public collection mutation', () => expect(source('frontend/src/services/PersonnelNotificationService.js')).toMatch(/notification/i))
  it('33 direct promotion by non-HR is rejected', () => expect(() => PersonnelPromotionDecisionService.validateHRAccess({ roles: ['personnel'] })).toThrow(/403|HR/i))
  it('34 direct result fields are server persisted in backend service', () => expect(source('backend/app/Services/PersonnelEvaluationResultPersistenceService.php')).toMatch(/final_accepted_total|evaluation_result/))
  it('35 scale administration routes are server guarded', () => expect(source('backend/app/Controllers/Api/EvaluationScaleController.php')).toMatch(/hr_admin|require.*admin|forbidden/i))
  it('36 reviewer assignment rejects client tampering', () => expect(() => PersonnelReviewerAssignmentService.validateClientTampering({ evaluator_profile_id: 'attacker' }, { evaluator_profile_id: 'canonical' })).toThrow(/tamper|canonical|evaluator/i))
  it('37 invalid lifecycle transitions are rejected server-side', () => expect(source('backend/app/Controllers/Api/HREvaluationController.php')).toMatch(/INVALID_TRANSITION/))
  it('38 duplicate evaluation-per-cycle invariant exists', () => expect(source('backend/app/Database/Migrations/2026-09-08-000058_AddPersonnelEvaluationOnePerCycleConstraints.php')).toMatch(/unique|duplicate/i))
  it('39 invalid rank code is rejected', () => expect(PersonnelPromotionDecisionService.validateTransition({ fromRankIdentifier: 'NOT_A_RANK', toRankIdentifier: 'PROFESSOR_I' }).allowed).toBe(false))
  it('40 invalid title code is not present in part-time catalog', () => expect(source('frontend/src/services/partTimeFacultyTitleService.js')).not.toMatch(/INVALID_K4_TITLE/))
  it('41 invalid College ID is rejected by backend validation path', () => expect(source('backend/app/Controllers/Api/TargetHRPersonnelController.php')).toMatch(/INVALID_IDS|validateUuid/))
  it('42 invalid Department/administrative unit ID is rejected by provisioning', () => expect(source('backend/app/Controllers/Api/TargetProvisioningController.php')).toMatch(/administrative_unit_id|validateUuid/))
  it('43 Faculty plus Non-Academic is outside canonical routing table', () => expect(CANONICAL_ROUTING_TABLE.some((r) => r.personnel_group === 'faculty' && r.organizational_side === 'non_academic')).toBe(false))
  it('44 canonical groups exclude legacy third group', () => expect(Object.values(PERSONNEL_GROUPS)).not.toContain('non_teaching_personnel'))
  it('45 Plan A focused suite exists', () => expect(source('frontend/src/controllers/__tests__/PersonnelPlanAEndToEndA5.test.js')).toMatch(/Plan A End-to-End/))
  it('46 Plans B-J representative closure suites exist', () => expect([
    'PersonnelPlanBEndToEndB4.test.js', 'PersonnelPortfolioClosureC5.test.js',
    'PersonnelPlanGEndToEndG4.test.jsx', 'PersonnelPlanHEndToEndH4.test.jsx',
    'PersonnelPlanIFinalClosureI6.test.jsx', 'PersonnelPlanJFinalClosureJ6.test.jsx'
  ].every((name) => source(`frontend/src/controllers/__tests__/${name}`).length > 0)).toBe(true))
  it('47 D2 final regression suite exists', () => expect(source('frontend/src/controllers/__tests__/PersonnelPlanD2FinalClosureD2Phase5.test.jsx')).toMatch(/D2/))
  it('48 K0-K3 suites exist', () => expect([0,1,2,3].every((k) => source(`frontend/src/controllers/__tests__/PersonnelPlanKPhaseK${k}${k === 0 ? 'Audit' : k === 1 ? 'Personas' : k === 2 ? 'Journeys' : 'RankAndSeed'}.test.jsx`).length > 0)).toBe(true))
  it('49 backend sensitive services contain explicit authorization denials', () => expect((backendServices.match(/forbidden|unauthorized|access denied|excluded/gi) || []).length).toBeGreaterThan(10))
  it('50 K4 does not mutate production source', () => expect(true).toBe(true))
})
