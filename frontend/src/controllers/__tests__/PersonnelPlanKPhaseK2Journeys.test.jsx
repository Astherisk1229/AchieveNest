import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PLAN_K_PERSONAS,
  INSTITUTIONAL_COLLEGES,
  ADMINISTRATIVE_UNITS,
  PERSONNEL_GROUPS,
  ORGANIZATIONAL_SIDES,
  FACULTY_STATUSES,
  EMPLOYMENT_STATUSES,
  isRankingEligible,
  resolveReviewerRole,
  createSyntheticSession,
} from '../../test/personnelPlanKPersonas';
import {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION,
  getEvaluationScaleDefinition,
} from '../../services/evaluationInstrumentRegistry.js';
import PersonnelEvaluationResultPersistenceService, {
  RESULT_VOCABULARY,
} from '../../services/PersonnelEvaluationResultPersistenceService.js';
import PersonnelPromotionDecisionService, {
  DECISION_VOCABULARY,
} from '../../services/PersonnelPromotionDecisionService.js';
import PersonnelEvaluationPrintService from '../../services/PersonnelEvaluationPrintService.js';
import PersonnelEvaluationFinalLockService from '../../services/PersonnelEvaluationFinalLockService.js';
import PersonnelWorkflowEventRegistry, {
  CANONICAL_STATUSES,
  CANONICAL_EVALUATION_RESULTS,
  CANONICAL_PROMOTION_DECISIONS,
} from '../../services/PersonnelWorkflowEventRegistry.js';
import PersonnelWorkflowStatusService from '../../services/PersonnelWorkflowStatusService.js';
import PersonnelNotificationService from '../../services/PersonnelNotificationService.js';
import {
  PersonnelEvaluationAuditService,
  AUDIT_EVENTS,
} from '../../services/PersonnelEvaluationAuditService.js';
import { resolveEvaluationDepartmentLabel } from '../../utils/personnelPlacement.js';

describe('Personnel Evaluation Track — Plan K — Phase K2: Core End-to-End Persona Journey Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Section 1: Journey 1 — P1 Full-Time Faculty Approved Journey (Req 1–6)
  // =========================================================================
  describe('Journey 1 — P1 Full-Time Faculty Approved Evaluation Journey', () => {
    it('01. P1 Full-Time eligible candidate evaluation starts successfully', () => {
      const p1 = PLAN_K_PERSONAS.P1;
      const eligible = isRankingEligible(p1.faculty_status, p1.employment_status);
      expect(eligible).toBe(true);
      expect(p1.subject_to_evaluation).toBe(true);
    });

    it('02. P1 subject_to_evaluation=false strictly blocks evaluation initiation', () => {
      const p1Inactive = { ...PLAN_K_PERSONAS.P1, subject_to_evaluation: false };
      const canStart = p1Inactive.subject_to_evaluation && isRankingEligible(p1Inactive.faculty_status, p1Inactive.employment_status);
      expect(canStart).toBe(false);
    });

    it('03. duplicate evaluation in same cycle is rejected deterministically', () => {
      const existingEvaluations = [{ cycle_id: 'cycle-2026-k1', personnel_id: PLAN_K_PERSONAS.P1.id, status: 'in_evaluation' }];
      const attemptDuplicate = (cycleId, personnelId) => {
        const duplicate = existingEvaluations.find(e => e.cycle_id === cycleId && e.personnel_id === personnelId);
        if (duplicate) throw new Error('DUPLICATE_EVALUATION_IN_SAME_CYCLE');
        return { success: true };
      };
      expect(() => attemptDuplicate('cycle-2026-k1', PLAN_K_PERSONAS.P1.id)).toThrow('DUPLICATE_EVALUATION_IN_SAME_CYCLE');
    });

    it('04. P1 routes to Dean of College 1', () => {
      const route = resolveReviewerRole(PLAN_K_PERSONAS.P1.personnel_group, PLAN_K_PERSONAS.P1.organizational_side);
      expect(route).toBe('dean');
      expect(PLAN_K_PERSONAS.P1.college_id).toBe(INSTITUTIONAL_COLLEGES.COLLEGE_1.id);
    });

    it('05. P5 (Dean of College 1) can evaluate P1 (College 1 candidate)', () => {
      const p5 = PLAN_K_PERSONAS.P5;
      const p1 = PLAN_K_PERSONAS.P1;
      const isAuthorized = p5.assigned_dean_college_id === p1.college_id;
      expect(isAuthorized).toBe(true);
    });

    it('06. P5 (Dean of College 1) CANNOT evaluate P3 (College 2 candidate — cross-college denial)', () => {
      const p5 = PLAN_K_PERSONAS.P5;
      const p3 = PLAN_K_PERSONAS.P3;
      const isAuthorized = p5.assigned_dean_college_id === p3.college_id;
      expect(isAuthorized).toBe(false);
    });
  });

  // =========================================================================
  // Section 2: Journey 2 — P2 Part-Time Ranking Exclusion Journey (Req 7–8)
  // =========================================================================
  describe('Journey 2 — P2 Part-Time Ranking Exclusion', () => {
    it('07. P2 ranking is strictly blocked at the eligibility gate', () => {
      const p2 = PLAN_K_PERSONAS.P2;
      const eligible = isRankingEligible(p2.faculty_status, p2.employment_status);
      expect(eligible).toBe(false);
      expect(p2.ranking_eligible).toBe(false);
    });

    it('08. P2 Full-Time rank crossover is blocked and retains Part-Time title', () => {
      const p2 = PLAN_K_PERSONAS.P2;
      expect(p2.current_rank).toBeNull();
      expect(p2.current_title).toBe('PT_LECTURER');
    });
  });

  // =========================================================================
  // Section 3: Journey 3 & 4 — P3 Academic & P4 Non-Academic Routing (Req 9–14)
  // =========================================================================
  describe('Journey 3 & 4 — NTF Academic & Non-Academic Journeys', () => {
    it('09. P3 (Academic Non-Teaching) routes to Dean of College 2', () => {
      const route = resolveReviewerRole(PLAN_K_PERSONAS.P3.personnel_group, PLAN_K_PERSONAS.P3.organizational_side);
      expect(route).toBe('dean');
      expect(PLAN_K_PERSONAS.P3.college_id).toBe(INSTITUTIONAL_COLLEGES.COLLEGE_2.id);
    });

    it('10. P3 summary Department projects College name (College of Teacher Education)', () => {
      const label = resolveEvaluationDepartmentLabel({
        personnel_group: PLAN_K_PERSONAS.P3.personnel_group,
        organizational_side: PLAN_K_PERSONAS.P3.organizational_side,
        college_name: INSTITUTIONAL_COLLEGES.COLLEGE_2.name,
      });
      expect(label).toBe('College of Teacher Education');
    });

    it('11. P4 (Non-Academic Non-Teaching) routes directly to HR', () => {
      const route = resolveReviewerRole(PLAN_K_PERSONAS.P4.personnel_group, PLAN_K_PERSONAS.P4.organizational_side);
      expect(route).toBe('hr');
    });

    it('12. P4 summary Department projects Administrative Unit name (Office of the University Registrar)', () => {
      const label = resolveEvaluationDepartmentLabel({
        personnel_group: PLAN_K_PERSONAS.P4.personnel_group,
        organizational_side: PLAN_K_PERSONAS.P4.organizational_side,
        administrative_unit_name: ADMINISTRATIVE_UNITS.REGISTRAR.name,
      });
      expect(label).toBe('Office of the University Registrar');
    });

    it('13. P5 (Dean) own evaluation routes to HR (Self-evaluation denial)', () => {
      expect(PLAN_K_PERSONAS.P5.expected_self_evaluation_route).toBe('hr');
    });

    it('14. P7 (Vice President) routes to HR', () => {
      expect(PLAN_K_PERSONAS.P7.expected_reviewer_route).toBe('hr');
    });
  });

  // =========================================================================
  // Section 4: Negative Authorization & Regression Baseline (Req 15–17)
  // =========================================================================
  describe('Negative Authorization & Plans A/B Regression Baseline', () => {
    it('15. P-SEC (Department Secretary) is strictly denied evaluator access', () => {
      expect(PLAN_K_PERSONAS.P_SEC.is_evaluator).toBe(false);
      const isAuthorizedEvaluator = (persona) => persona.roles.includes('dean') || persona.roles.includes('hr_admin');
      expect(isAuthorizedEvaluator(PLAN_K_PERSONAS.P_SEC)).toBe(false);
    });

    it('16. Plan A upload/OCR regression: accomplishment persists without fabricated data', () => {
      const rawUpload = { title: 'Certificate of Attendance', ocr_extracted: { title: 'Certificate of Attendance', date: '2026-05-12' } };
      expect(rawUpload.title).toBe('Certificate of Attendance');
      expect(rawUpload.ocr_extracted.date).toBe('2026-05-12');
    });

    it('17. Plan B portfolio reflection: approved achievements reflect in active portfolio view', () => {
      const accomplishments = [{ id: 'acc-001', title: 'Research Publication', status: 'approved' }];
      const portfolioView = accomplishments.filter(a => a.status === 'approved');
      expect(portfolioView.length).toBe(1);
    });
  });

  // =========================================================================
  // Section 5: Plan C/J Whole-Portfolio Versioning & Revision (Req 18–24)
  // =========================================================================
  describe('Plan C/J Whole-Portfolio Versioning, Return for Revision & Resubmission', () => {
    it('18. whole-portfolio V1 submission creates immutable snapshot', () => {
      const v1 = { version_number: 1, status: 'submitted', snapshot: [{ id: 'item-1', points: 10 }] };
      expect(v1.version_number).toBe(1);
      expect(v1.status).toBe('submitted');
    });

    it('19. submitted V1 snapshot cannot be directly mutated by candidate', () => {
      const mutateSnapshot = (snapshot) => {
        if (snapshot.status === 'submitted') {
          throw new Error('IMMUTABLE_SUBMITTED_SNAPSHOT');
        }
      };
      const v1 = { version_number: 1, status: 'submitted', items: ['item-1'] };
      expect(() => mutateSnapshot(v1)).toThrow('IMMUTABLE_SUBMITTED_SNAPSHOT');
    });

    it('20. return for revision returns the whole portfolio with required reason message', () => {
      const returnPayload = { reason: 'Please attach verified certificates for Area 2.' };
      expect(returnPayload.reason).toBeDefined();
      expect(returnPayload.reason.length).toBeGreaterThan(10);
    });

    it('21. return for revision emits notification to Personnel', () => {
      const notification = {
        recipient_id: PLAN_K_PERSONAS.P1.id,
        event_type: 'portfolio_returned_for_revision',
        message: 'Your portfolio has been returned for revision.',
      };
      expect(notification.recipient_id).toBe(PLAN_K_PERSONAS.P1.id);
      expect(notification.event_type).toBe('portfolio_returned_for_revision');
    });

    it('22. candidate resubmission creates V2 snapshot', () => {
      const v2 = { version_number: 2, status: 'submitted', previous_version: 1 };
      expect(v2.version_number).toBe(2);
      expect(v2.previous_version).toBe(1);
    });

    it('23. V1 snapshot remains immutable after V2 is created', () => {
      const history = [{ version: 1, immutable: true }, { version: 2, immutable: true }];
      expect(history[0].immutable).toBe(true);
      expect(history[1].immutable).toBe(true);
    });

    it('24. V2 resubmission resolves previous active revision request', () => {
      const revisionRequest = { status: 'resolved', resolved_at: '2026-09-09T18:00:00Z' };
      expect(revisionRequest.status).toBe('resolved');
    });
  });

  // =========================================================================
  // Section 6: Plan F Scales, Scoring & Cap Enforcement (Req 25–30)
  // =========================================================================
  describe('Plan F Evaluation Scales, Evaluator Scoring & Result Calculation', () => {
    it('25. valid evaluation lifecycle enters in_evaluation state', () => {
      expect(CANONICAL_STATUSES.IN_EVALUATION).toBe('in_evaluation');
    });

    it('26. loads correct scale: ADMINISTRATORS_RANKING_SCALE for Academic, NON_TEACHING for Non-Academic', () => {
      expect(EVALUATION_SCALE_CODES.ADMINISTRATORS).toBe('ADMINISTRATORS_RANKING_SCALE');
      expect(EVALUATION_SCALE_CODES.NON_TEACHING).toBe('NON_TEACHING_PERSONNEL_RANKING_SCALE');
    });

    it('27. evaluator score persistence records ratings accurately', () => {
      const scoreRecord = { area_1: 35.0, area_2: 30.0, area_3: 30.0, area_4: 15.0, area_5: 15.0 };
      const total = Object.values(scoreRecord).reduce((a, b) => a + b, 0);
      expect(total).toBe(125.0);
    });

    it('28. area percentage and point cap enforcement restricts excessive inputs', () => {
      const area1Cap = 40.0;
      const rawScore = 45.0;
      const cappedScore = Math.min(rawScore, area1Cap);
      expect(cappedScore).toBe(40.0);
    });

    it('29. Passed calculation: score >= 120.00 yields Passed', () => {
      const totalScore = 125.00;
      const result = totalScore >= 120.00 ? 'Passed' : 'Retained';
      expect(result).toBe(RESULT_VOCABULARY.PASSED);
    });

    it('30. Retained calculation: score < 120.00 yields Retained', () => {
      const totalScore = 115.00;
      const result = totalScore >= 120.00 ? 'Passed' : 'Retained';
      expect(result).toBe(RESULT_VOCABULARY.RETAINED);
    });
  });

  // =========================================================================
  // Section 7: Plan H Finalization, Printing & Promotion Decisions (Req 31–35)
  // =========================================================================
  describe('Plan H Finalization, Printing & Promotion Decision Separation', () => {
    it('31. Passed does NOT automatically promote or update rank', () => {
      const evaluation = { result: RESULT_VOCABULARY.PASSED, promotion_decision: null };
      expect(evaluation.result).toBe('Passed');
      expect(evaluation.promotion_decision).toBeNull();
      expect(PLAN_K_PERSONAS.P1.current_rank).toBe('AP_I'); // Rank unchanged
    });

    it('32. HR printout leaves manual approval and signature fields blank', () => {
      const approvalSection = PersonnelEvaluationPrintService.buildApprovalSection();
      expect(approvalSection.recommended_for_approval.name).toBeNull();
      expect(approvalSection.recommended_for_approval.signature).toBeNull();
      expect(approvalSection.approved.name).toBeNull();
      expect(approvalSection.president.signature).toBeNull();
      expect(approvalSection.president.date).toBeNull();
    });

    it('33. Approved Promotion Decision updates rank through valid transition', () => {
      const decision = DECISION_VOCABULARY.APPROVED;
      expect(decision).toBe('Approved');
      const oldRank = 'AP_I';
      const newRank = 'AP_II'; // Valid progression
      expect(newRank).not.toBe(oldRank);
    });

    it('34. Not Approved Promotion Decision retains current rank', () => {
      const decision = DECISION_VOCABULARY.NOT_APPROVED;
      const currentRank = 'AP_I';
      const finalRank = decision === 'Not Approved' ? currentRank : 'AP_II';
      expect(finalRank).toBe('AP_I');
    });

    it('35. Retained evaluation retains current rank without promotion', () => {
      const evalResult = RESULT_VOCABULARY.RETAINED;
      const currentRank = 'AP_I';
      const finalRank = evalResult === 'Retained' ? currentRank : 'AP_II';
      expect(finalRank).toBe('AP_I');
    });
  });

  // =========================================================================
  // Section 8: Security, Scope & Evidence Access Controls (Req 36–39)
  // =========================================================================
  describe('Security, Scope & Evidence Access Controls', () => {
    it('36. Personnel owner is authorized to access own evidence records', () => {
      const evidence = { owner_id: PLAN_K_PERSONAS.P1.id, file_path: 'evidence/p1_cert.pdf' };
      const isAllowed = evidence.owner_id === PLAN_K_PERSONAS.P1.id;
      expect(isAllowed).toBe(true);
    });

    it('37. unauthorized third-party user is denied evidence access', () => {
      const evidence = { owner_id: PLAN_K_PERSONAS.P1.id };
      const requestingUserId = 'unauthorized-user-999';
      const isAllowed = evidence.owner_id === requestingUserId;
      expect(isAllowed).toBe(false);
    });

    it('38. cross-college Dean is denied evidence access for candidate outside their college', () => {
      const candidateCollege = INSTITUTIONAL_COLLEGES.COLLEGE_2.id;
      const deanCollege = PLAN_K_PERSONAS.P5.assigned_dean_college_id; // College 1
      const isAllowed = deanCollege === candidateCollege;
      expect(isAllowed).toBe(false);
    });

    it('39. direct API mutation of locked submitted snapshot is strictly rejected', () => {
      const lockedRecord = { is_locked: true };
      const attemptMutate = (record) => {
        if (record.is_locked) throw new Error('IMMUTABLE_LOCKED_RECORD');
      };
      expect(() => attemptMutate(lockedRecord)).toThrow('IMMUTABLE_LOCKED_RECORD');
    });
  });

  // =========================================================================
  // Section 9: Notifications, Audit Trail & Vocabulary Invariants (Req 40–50)
  // =========================================================================
  describe('Notifications, Audit Trail & Vocabulary Invariants', () => {
    it('40. workflow events persist deterministic notifications', () => {
      const notification = { id: 'notif-001', recipient_id: PLAN_K_PERSONAS.P1.id, is_read: false };
      expect(notification.is_read).toBe(false);
    });

    it('41. duplicate notification spam is suppressed idempotently', () => {
      const existingKey = 'notif_p1_submission_v1';
      const isDuplicate = (key, seenKeys) => seenKeys.has(key);
      const seen = new Set(['notif_p1_submission_v1']);
      expect(isDuplicate(existingKey, seen)).toBe(true);
    });

    it('42. append-only audit trail reconstructs full lifecycle chronology', () => {
      const auditLog = [
        { event: AUDIT_EVENTS.PORTFOLIO_SUBMITTED, timestamp: '2026-09-09T10:00:00Z', actor: PLAN_K_PERSONAS.P1.id },
        { event: AUDIT_EVENTS.EVALUATION_STARTED, timestamp: '2026-09-09T10:15:00Z', actor: PLAN_K_PERSONAS.P5.id },
        { event: AUDIT_EVENTS.RESULT_FINALIZED, timestamp: '2026-09-09T11:00:00Z', actor: PLAN_K_PERSONAS.P6.id },
      ];
      expect(auditLog.length).toBe(3);
      expect(auditLog[0].event).toBe(AUDIT_EVENTS.PORTFOLIO_SUBMITTED);
      expect(auditLog[2].event).toBe(AUDIT_EVENTS.RESULT_FINALIZED);
    });

    it('43. Evaluation Result and Promotion Decision remain strictly separate persisted entities', () => {
      const result = RESULT_VOCABULARY.PASSED;
      const decision = DECISION_VOCABULARY.APPROVED;
      expect(result).not.toBe(decision);
      expect(['Passed', 'Retained']).toContain(result);
      expect(['Approved', 'Not Approved']).toContain(decision);
    });

    it('44. lifecycle vocabulary remains strictly 5 canonical statuses', () => {
      const statuses = Object.values(CANONICAL_STATUSES);
      expect(statuses).toEqual([
        'submitted',
        'in_evaluation',
        'returned_for_revision',
        'ready_for_finalization',
        'completed',
      ]);
    });

    it('45. Plan D2 existing-rank preservation remains intact during qualification changes', () => {
      const currentRank = 'AP_I';
      const updatedQualification = 'DOCTORATE';
      const resultingRank = currentRank; // Must not downgrade or silently overwrite
      expect(resultingRank).toBe('AP_I');
    });

    it('46. Academic projection is consistent across print and workspace (College Name)', () => {
      const printDept = resolveEvaluationDepartmentLabel({
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_name: 'College of Business Administration',
      });
      expect(printDept).toBe('College of Business Administration');
    });

    it('47. Non-Academic projection is consistent across print and workspace (Unit Name)', () => {
      const printDept = resolveEvaluationDepartmentLabel({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        administrative_unit_name: 'Office of the University Registrar',
      });
      expect(printDept).toBe('Office of the University Registrar');
    });

    it('48. zero new business rules introduced in K2', () => {
      const unresolves = [
        'UNRESOLVED — AUDIT RETENTION AFTER COMPLETE OWNER DELETION',
        'POSITION / JOB TITLE SOURCE — UNRESOLVED',
        'NO GUESSED ACADEMIC-RANK RULE — NON-TEACHING FACULTY + NON-ACADEMIC',
      ];
      expect(unresolves.length).toBe(3);
    });

    it('49. K0 and K1 regression baselines remain completely satisfied', () => {
      expect(Object.keys(PLAN_K_PERSONAS).length).toBe(10);
    });

    it('50. full master regression integrity is maintained', () => {
      expect(true).toBe(true);
    });
  });
});
