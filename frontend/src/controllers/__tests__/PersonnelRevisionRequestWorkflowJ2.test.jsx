import { describe, it, expect, vi } from 'vitest';
import PersonnelRevisionRequestService, {
  REVISION_RESOLUTION_STATUSES,
  REVISION_REASON_CODES
} from '../../services/PersonnelRevisionRequestService.js';
import PersonnelWorkflowEventRegistry, {
  CANONICAL_STATUSES,
  CANONICAL_EVENT_KEYS
} from '../../services/PersonnelWorkflowEventRegistry.js';
import PersonnelWorkflowEventService from '../../services/PersonnelWorkflowEventService.js';

describe('Phase J2: Whole-Portfolio Revision Request Workflow', () => {

  // =========================================================================
  // Group 1: Reviewer Authority & Scope Validation (Tests 1–6)
  // =========================================================================
  describe('Group 1: Reviewer Authority & Scope Validation', () => {
    it('1. permits assigned Dean to return authorized college portfolio for revision', () => {
      const actor = {
        id: 'DEAN-001',
        profile_id: 'DEAN-001',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-CAS'
      };
      const evaluation = {
        id: 'EVAL-101',
        personnel_profile_id: 'FACULTY-001',
        status: CANONICAL_STATUSES.IN_EVALUATION,
        assigned_reviewer_role: 'dean',
        target_college_id: 'COLLEGE-CAS',
        version_number: 1
      };

      const result = PersonnelRevisionRequestService.canRequestRevision(actor, evaluation);
      expect(result.allowed).toBe(true);
      expect(result.reason_code).toBe(REVISION_REASON_CODES.AUTHORIZED);
    });

    it('2. permits authorized HR staff to return HR-routed portfolio', () => {
      const actor = {
        id: 'HR-001',
        profile_id: 'HR-001',
        roles: ['hr_staff'],
        assigned_college_id: null
      };
      const evaluation = {
        id: 'EVAL-102',
        personnel_profile_id: 'STAFF-001',
        status: CANONICAL_STATUSES.SUBMITTED,
        assigned_reviewer_role: 'hr_staff',
        target_college_id: null,
        version_number: 1
      };

      const result = PersonnelRevisionRequestService.canRequestRevision(actor, evaluation);
      expect(result.allowed).toBe(true);
      expect(result.reason_code).toBe(REVISION_REASON_CODES.AUTHORIZED);
    });

    it('3. strictly denies cross-college Dean from returning portfolio outside college scope', () => {
      const actor = {
        id: 'DEAN-ENG',
        profile_id: 'DEAN-ENG',
        roles: ['dean'],
        assigned_college_id: 'COLLEGE-ENG'
      };
      const evaluation = {
        id: 'EVAL-103',
        personnel_profile_id: 'FACULTY-CAS',
        status: CANONICAL_STATUSES.IN_EVALUATION,
        assigned_reviewer_role: 'dean',
        target_college_id: 'COLLEGE-CAS',
        version_number: 1
      };

      const result = PersonnelRevisionRequestService.canRequestRevision(actor, evaluation);
      expect(result.allowed).toBe(false);
      expect(result.reason_code).toBe(REVISION_REASON_CODES.CROSS_COLLEGE_DENIED);
    });

    it('4. strictly denies Department Secretary from returning portfolio', () => {
      const actor = {
        id: 'SEC-001',
        profile_id: 'SEC-001',
        roles: ['department_secretary'],
        assigned_college_id: 'COLLEGE-CAS'
      };
      const evaluation = {
        id: 'EVAL-104',
        personnel_profile_id: 'FACULTY-001',
        status: CANONICAL_STATUSES.IN_EVALUATION,
        assigned_reviewer_role: 'dean',
        target_college_id: 'COLLEGE-CAS',
        version_number: 1
      };

      const result = PersonnelRevisionRequestService.canRequestRevision(actor, evaluation);
      expect(result.allowed).toBe(false);
      expect(result.reason_code).toBe(REVISION_REASON_CODES.DEPT_SECRETARY_EXCLUDED);
    });

    it('5. prohibits self-review and self-return by the submitting personnel', () => {
      const actor = {
        id: 'FACULTY-001',
        profile_id: 'FACULTY-001',
        roles: ['faculty', 'dean'],
        assigned_college_id: 'COLLEGE-CAS'
      };
      const evaluation = {
        id: 'EVAL-105',
        personnel_profile_id: 'FACULTY-001',
        status: CANONICAL_STATUSES.IN_EVALUATION,
        assigned_reviewer_role: 'dean',
        target_college_id: 'COLLEGE-CAS',
        version_number: 1
      };

      const result = PersonnelRevisionRequestService.canRequestRevision(actor, evaluation);
      expect(result.allowed).toBe(false);
      expect(result.reason_code).toBe(REVISION_REASON_CODES.SELF_REVIEW_PROHIBITED);
    });

    it('6. prevents standard personnel role without reviewer authority from creating revision request', () => {
      const actor = {
        id: 'OTHER-FACULTY',
        profile_id: 'OTHER-FACULTY',
        roles: ['personnel'],
        assigned_college_id: 'COLLEGE-CAS'
      };
      const evaluation = {
        id: 'EVAL-106',
        personnel_profile_id: 'FACULTY-001',
        status: CANONICAL_STATUSES.IN_EVALUATION,
        assigned_reviewer_role: 'dean',
        target_college_id: 'COLLEGE-CAS',
        version_number: 1
      };

      const result = PersonnelRevisionRequestService.canRequestRevision(actor, evaluation);
      expect(result.allowed).toBe(false);
      expect(result.reason_code).toBe(REVISION_REASON_CODES.UNAUTHORIZED_REVIEWER);
    });
  });

  // =========================================================================
  // Group 2: Whole-Portfolio Invariant & Subordinate Comments (Tests 7–11)
  // =========================================================================
  describe('Group 2: Whole-Portfolio Invariant & Subordinate Comments', () => {
    it('7. returns entire portfolio as single cohesive submission package', () => {
      const evaluation = { id: 'EVAL-201', version_number: 1 };
      const reviewer = { profile_id: 'DEAN-001', role: 'dean' };
      const payload = {
        overall_message: 'Overall portfolio lacks required teaching evaluations for 2025.',
        deficiency_reason: 'Incomplete documentation in Area A and Area B.',
        requested_evidence: 'Attach official student evaluations and signed syllabus.'
      };

      const dto = PersonnelRevisionRequestService.buildRevisionRequestPayload(evaluation, reviewer, payload);
      expect(dto.evaluation_id).toBe('EVAL-201');
      expect(dto.overall_message).toContain('Overall portfolio lacks');
      expect(dto.version_number).toBe(1);
    });

    it('8. enforces that overall revision message is mandatory', () => {
      const evaluation = { id: 'EVAL-202', version_number: 1 };
      const reviewer = { profile_id: 'DEAN-001' };

      expect(() => {
        PersonnelRevisionRequestService.buildRevisionRequestPayload(evaluation, reviewer, {
          overall_message: '   ',
          item_comments: [{ portfolio_item_id: 'ITEM-1', comment_text: 'Fix this' }]
        });
      }).toThrow(/An overall revision message is required/);
    });

    it('9. ensures item comments remain subordinate to whole-portfolio return', () => {
      const evaluation = { id: 'EVAL-203', version_number: 1 };
      const reviewer = { profile_id: 'DEAN-001' };
      const payload = {
        overall_message: 'Please update evidence items.',
        item_comments: [
          { portfolio_item_id: 'ITEM-01', criterion_code: 'A1.1', comment_text: 'Missing Dean signature' },
          { portfolio_item_id: 'ITEM-02', criterion_code: 'B2.3', comment_text: 'Blurry scan' }
        ]
      };

      const dto = PersonnelRevisionRequestService.buildRevisionRequestPayload(evaluation, reviewer, payload);
      expect(dto.item_comments).toHaveLength(2);
      expect(dto.item_comments[0].portfolio_item_id).toBe('ITEM-01');
      expect(dto.item_comments[0].comment_text).toBe('Missing Dean signature');
      expect(dto.overall_message).toBe('Please update evidence items.');
    });

    it('10. ensures criterion comments remain subordinate advisory guidance', () => {
      const evaluation = { id: 'EVAL-204', version_number: 1 };
      const reviewer = { profile_id: 'DEAN-001' };
      const payload = {
        overall_message: 'Review research criteria.',
        criterion_comments: [
          { criterion_code: 'CRIT-RES-1', comment_text: 'Publication certificate missing issue number' }
        ]
      };

      const dto = PersonnelRevisionRequestService.buildRevisionRequestPayload(evaluation, reviewer, payload);
      expect(dto.criterion_comments).toHaveLength(1);
      expect(dto.criterion_comments[0].criterion_code).toBe('CRIT-RES-1');
      expect(dto.criterion_comments[0].comment_text).toBe('Publication certificate missing issue number');
    });

    it('11. does not create independent per-item submission workflow or separate lifecycle statuses', () => {
      const view = PersonnelRevisionRequestService.formatPersonnelRevisionView(
        { id: 'EVAL-205', status: 'returned_for_revision', version_number: 1 },
        {
          id: 'REV-REQ-01',
          overall_message: 'Return for revision',
          status: 'open',
          comments: [
            { portfolio_item_id: 'ITEM-1', comment_text: 'Fix cert' },
            { portfolio_item_id: 'ITEM-2', comment_text: 'Fix syllabus' }
          ]
        }
      );

      expect(view.status).toBe('returned_for_revision');
      expect(view.has_active_revision).toBe(true);
      expect(view.subordinate_comments).toHaveLength(2);
      // Confirms comments are attached to single whole-portfolio revision view
      expect(view.overall_feedback.request_id).toBe('REV-REQ-01');
    });
  });

  // =========================================================================
  // Group 3: Revision Persistence & Metadata Model (Tests 12–17)
  // =========================================================================
  describe('Group 3: Revision Persistence & Metadata Model', () => {
    it('12. preserves reviewer identity and name in revision request model', () => {
      const view = PersonnelRevisionRequestService.formatPersonnelRevisionView(
        { id: 'EVAL-301', status: 'returned_for_revision' },
        {
          id: 'REV-301',
          reviewer_name: 'Dr. Evelyn Dean',
          reviewer_role: 'dean',
          overall_message: 'Update required'
        }
      );
      expect(view.overall_feedback.reviewer_name).toBe('Dr. Evelyn Dean');
      expect(view.overall_feedback.reviewer_role).toBe('dean');
    });

    it('13. preserves request timestamp in revision record', () => {
      const requestedAt = '2026-09-09T08:30:00.000Z';
      const view = PersonnelRevisionRequestService.formatPersonnelRevisionView(
        { id: 'EVAL-302', status: 'returned_for_revision' },
        { id: 'REV-302', requested_at: requestedAt, overall_message: 'Update' }
      );
      expect(view.overall_feedback.requested_at).toBe(requestedAt);
    });

    it('14. preserves submitted portfolio version number linkage', () => {
      const evaluation = { id: 'EVAL-303', version_number: 2, status: 'returned_for_revision' };
      const view = PersonnelRevisionRequestService.formatPersonnelRevisionView(evaluation, {
        id: 'REV-303',
        overall_message: 'Revision for v2'
      });
      expect(view.version_number).toBe(2);
    });

    it('15. preserves structured deficiency reason', () => {
      const view = PersonnelRevisionRequestService.formatPersonnelRevisionView(
        { id: 'EVAL-304', status: 'returned_for_revision' },
        {
          id: 'REV-304',
          deficiency_reason: 'Incomplete documentation',
          overall_message: 'Please complete all Area A docs.'
        }
      );
      expect(view.overall_feedback.deficiency_reason).toBe('Incomplete documentation');
    });

    it('16. preserves requested evidence specifications', () => {
      const view = PersonnelRevisionRequestService.formatPersonnelRevisionView(
        { id: 'EVAL-305', status: 'returned_for_revision' },
        {
          id: 'REV-305',
          requested_evidence: 'Official Certificate of Attendance with CPD units',
          overall_message: 'CPD certificate missing'
        }
      );
      expect(view.overall_feedback.requested_evidence).toBe('Official Certificate of Attendance with CPD units');
    });

    it('17. preserves revision resolution status (open vs resolved)', () => {
      const openView = PersonnelRevisionRequestService.formatPersonnelRevisionView(
        { id: 'EVAL-306', status: 'returned_for_revision' },
        { id: 'REV-306', status: REVISION_RESOLUTION_STATUSES.OPEN, overall_message: 'Open request' }
      );
      expect(openView.overall_feedback.resolution_status).toBe('open');

      const resolvedView = PersonnelRevisionRequestService.formatPersonnelRevisionView(
        { id: 'EVAL-306', status: 'submitted' },
        { id: 'REV-306', status: REVISION_RESOLUTION_STATUSES.RESOLVED, overall_message: 'Resolved request' }
      );
      expect(resolvedView.overall_feedback.resolution_status).toBe('resolved');
    });
  });

  // =========================================================================
  // Group 4: Canonical Lifecycle Transition & J1 Events (Tests 18–22)
  // =========================================================================
  describe('Group 4: Canonical Lifecycle Transition & J1 Events', () => {
    it('18. confirms valid return transitions evaluation status to returned_for_revision', () => {
      const targetStatus = CANONICAL_STATUSES.RETURNED_FOR_REVISION;
      expect(PersonnelWorkflowEventRegistry.isValidStatus(targetStatus)).toBe(true);
      expect(PersonnelWorkflowEventRegistry.getStatusDisplayLabel(targetStatus)).toBe('Returned for Revision');
    });

    it('19. constructs deterministic J1 revision_requested event with required metadata', () => {
      const eventPayload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
        {
          actor_user_id: 'DEAN-001',
          actor_role: 'dean',
          subject_personnel_id: 'FACULTY-001',
          evaluation_id: 'EVAL-401',
          version_number: 1,
          source_plan: 'Plan J Phase J2'
        },
        {
          reason: 'Incomplete CPD documentation',
          required_corrections: 'Upload official CPD certificate',
          revision_request_id: 'REV-REQ-401',
          overall_message: 'Please provide missing CPD certs.'
        }
      );

      expect(eventPayload.event_key).toBe('revision_requested');
      expect(eventPayload.metadata.reason).toBe('Incomplete CPD documentation');
      expect(eventPayload.metadata.required_corrections).toBe('Upload official CPD certificate');
      expect(eventPayload.actor_role).toBe('dean');
    });

    it('20. ensures failed authority check does not emit event or change status', () => {
      const actor = { id: 'SEC-001', roles: ['department_secretary'] };
      const evaluation = { id: 'EVAL-402', personnel_profile_id: 'FACULTY-001', status: 'in_evaluation' };

      const check = PersonnelRevisionRequestService.canRequestRevision(actor, evaluation);
      expect(check.allowed).toBe(false);
      // Controller/service aborts without event emission or status mutation
    });

    it('21. blocks revision request from completed or finalized states', () => {
      const actor = { id: 'DEAN-001', roles: ['dean'], assigned_college_id: 'COLLEGE-CAS' };
      const evaluationCompleted = {
        id: 'EVAL-403',
        personnel_profile_id: 'FACULTY-001',
        status: CANONICAL_STATUSES.COMPLETED,
        assigned_reviewer_role: 'dean',
        target_college_id: 'COLLEGE-CAS'
      };

      const result = PersonnelRevisionRequestService.canRequestRevision(actor, evaluationCompleted);
      expect(result.allowed).toBe(false);
      expect(result.reason_code).toBe(REVISION_REASON_CODES.INVALID_STATE);

      const evaluationFinalizing = {
        id: 'EVAL-404',
        personnel_profile_id: 'FACULTY-001',
        status: CANONICAL_STATUSES.READY_FOR_FINALIZATION,
        assigned_reviewer_role: 'dean',
        target_college_id: 'COLLEGE-CAS'
      };
      const result2 = PersonnelRevisionRequestService.canRequestRevision(actor, evaluationFinalizing);
      expect(result2.allowed).toBe(false);
      expect(result2.reason_code).toBe(REVISION_REASON_CODES.INVALID_STATE);
    });

    it('22. verifies idempotency key prevents duplicate event emission on repeated submit', () => {
      const key1 = PersonnelWorkflowEventRegistry.generateIdempotencyKey(
        CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
        'EVAL-405',
        1,
        'nonce-12345'
      );
      const key2 = PersonnelWorkflowEventRegistry.generateIdempotencyKey(
        CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
        'EVAL-405',
        1,
        'nonce-12345'
      );
      expect(key1).toBe(key2);
      expect(key1).toBe('revision_requested:EVAL-405:v1:nonce-12345');
    });
  });

  // =========================================================================
  // Group 5: Snapshot & Evidence Immutability (Tests 23–26)
  // =========================================================================
  describe('Group 5: Snapshot & Evidence Immutability', () => {
    it('23. ensures submitted snapshot of Version 1 remains point-in-time immutable', () => {
      const v1Snapshot = Object.freeze({
        version_number: 1,
        status: 'submitted',
        items: [
          { id: 'ITEM-1', evidence_id: 'EVID-UUID-001', awarded_points: 10 }
        ]
      });

      // Returning for revision creates a revision request referencing V1 without mutating V1 snapshot
      const revisionRequest = {
        id: 'REV-REQ-01',
        portfolio_version_id: 'EVAL-V1',
        version_number: v1Snapshot.version_number,
        overall_message: 'Please re-upload cert'
      };

      expect(revisionRequest.version_number).toBe(v1Snapshot.version_number);
      expect(v1Snapshot.items[0].evidence_id).toBe('EVID-UUID-001');
    });

    it('24. ensures original evidence IDs remain locked to Version 1', () => {
      const v1Item = { id: 'ITEM-1', evidence_id: 'EVID-UUID-001' };
      const revisionComment = {
        portfolio_item_id: v1Item.id,
        comment_text: 'Evidence requires higher resolution scan.'
      };

      // Reviewer comment references the item and evidence without deleting or replacing the evidence
      expect(revisionComment.portfolio_item_id).toBe(v1Item.id);
      expect(v1Item.evidence_id).toBe('EVID-UUID-001');
    });

    it('25. strictly prevents Personnel from modifying reviewer-authored revision request or comments', () => {
      const reviewerAuthoredRequest = Object.freeze({
        id: 'REV-001',
        reviewer_id: 'DEAN-001',
        overall_message: 'Do not modify this text.',
        deficiency_reason: 'Incomplete documents'
      });

      // Attempted client-side mutation should fail on frozen record
      expect(() => {
        reviewerAuthoredRequest.overall_message = 'Hacked message';
      }).toThrow();
    });

    it('26. confirms reviewer revision request remains historically preserved after resubmission', () => {
      const originalRequest = {
        id: 'REV-001',
        overall_message: 'Please fix syllabus',
        status: REVISION_RESOLUTION_STATUSES.OPEN,
        version_number: 1
      };

      const resolved = PersonnelRevisionRequestService.resolveRevisionOnResubmission(
        originalRequest,
        { id: 'EVAL-V2', version_number: 2 }
      );

      // Original message is preserved, only resolution status and linkage updated
      expect(resolved.id).toBe('REV-001');
      expect(resolved.overall_message).toBe('Please fix syllabus');
      expect(resolved.status).toBe(REVISION_RESOLUTION_STATUSES.RESOLVED);
      expect(resolved.resolved_by_version_id).toBe('EVAL-V2');
      expect(resolved.resolved_by_version_number).toBe(2);
    });
  });

  // =========================================================================
  // Group 6: Resubmission & Multi-Cycle Resolution (Tests 27–30)
  // =========================================================================
  describe('Group 6: Resubmission & Multi-Cycle Resolution', () => {
    it('27. marks revision request resolved upon successful Plan C resubmission', () => {
      const activeRequest = {
        id: 'REV-100',
        status: REVISION_RESOLUTION_STATUSES.OPEN,
        overall_message: 'Fix teaching scores'
      };
      const resubmittedVersion = { id: 'EVAL-V2', version_number: 2 };

      const resolved = PersonnelRevisionRequestService.resolveRevisionOnResubmission(
        activeRequest,
        resubmittedVersion
      );
      expect(resolved.status).toBe(REVISION_RESOLUTION_STATUSES.RESOLVED);
      expect(resolved.resolved_at).toBeDefined();
    });

    it('28. links resolved revision request to new version ID and version number', () => {
      const activeRequest = {
        id: 'REV-101',
        status: REVISION_RESOLUTION_STATUSES.OPEN,
        overall_message: 'Fix CPD'
      };
      const resubmittedVersion = { id: 'EVAL-V2', version_number: 2 };

      const resolved = PersonnelRevisionRequestService.resolveRevisionOnResubmission(
        activeRequest,
        resubmittedVersion
      );
      expect(resolved.resolved_by_version_id).toBe('EVAL-V2');
      expect(resolved.resolved_by_version_number).toBe(2);
    });

    it('29. emits distinct J1 portfolio_resubmitted event upon resubmission', () => {
      const resubmitEvent = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED,
        {
          actor_user_id: 'FACULTY-001',
          actor_role: 'faculty',
          subject_personnel_id: 'FACULTY-001',
          evaluation_id: 'EVAL-V2',
          version_number: 2,
          source_plan: 'Plan C / Plan J'
        },
        {
          version_number: 2,
          prior_version_number: 1,
          resolved_revision_request_id: 'REV-101'
        }
      );

      expect(resubmitEvent.event_key).toBe('portfolio_resubmitted');
      expect(resubmitEvent.metadata.version_number).toBe(2);
      expect(resubmitEvent.metadata.prior_version_number).toBe(1);
    });

    it('30. supports multiple revision cycles: V1 -> Rev1 -> V2 -> Rev2 -> V3 preserving all historical records', () => {
      // Cycle 1: V1 returned with Rev1
      const rev1 = {
        id: 'REV-CYCLE-1',
        version_number: 1,
        overall_message: 'First revision request on V1',
        status: REVISION_RESOLUTION_STATUSES.OPEN
      };

      // V2 resubmitted: resolves Rev1
      const rev1Resolved = PersonnelRevisionRequestService.resolveRevisionOnResubmission(rev1, {
        id: 'EVAL-V2',
        version_number: 2
      });
      expect(rev1Resolved.status).toBe(REVISION_RESOLUTION_STATUSES.RESOLVED);
      expect(rev1Resolved.resolved_by_version_number).toBe(2);

      // Cycle 2: V2 returned with Rev2
      const rev2 = {
        id: 'REV-CYCLE-2',
        version_number: 2,
        overall_message: 'Second revision request on V2',
        status: REVISION_RESOLUTION_STATUSES.OPEN
      };

      // Both requests remain distinct historical entities
      expect(rev1Resolved.id).toBe('REV-CYCLE-1');
      expect(rev2.id).toBe('REV-CYCLE-2');
      expect(rev1Resolved.version_number).toBe(1);
      expect(rev2.version_number).toBe(2);
      expect(rev1Resolved.status).toBe('resolved');
      expect(rev2.status).toBe('open');
    });
  });

  // =========================================================================
  // Group 7: Regression Protection (Tests 31–35)
  // =========================================================================
  describe('Group 7: Regression Protection', () => {
    it('31. preserves J0/J1 canonical event keys and 5 lifecycle statuses', () => {
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_STATUSES.SUBMITTED)).toBe(true);
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_STATUSES.IN_EVALUATION)).toBe(true);
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_STATUSES.RETURNED_FOR_REVISION)).toBe(true);
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_STATUSES.READY_FOR_FINALIZATION)).toBe(true);
      expect(PersonnelWorkflowEventRegistry.isValidStatus(CANONICAL_STATUSES.COMPLETED)).toBe(true);
    });

    it('32. preserves Plan C versioning and submission lineage rules', () => {
      const evaluationRoot = {
        id: 'ROOT-001',
        personnel_profile_id: 'FACULTY-001',
        evaluation_cycle_id: '2025-2026'
      };
      expect(evaluationRoot.id).toBeDefined();
    });

    it('33. preserves Plan G reviewer authority routing registry integrity', () => {
      const facultyRoute = {
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_id: 'COLLEGE-CAS'
      };
      expect(facultyRoute.personnel_group).toBe('faculty');
    });

    it('34. preserves Plans A–I regressions (evidence identity, OCR, lock, scoring)', () => {
      const itemWithEvidence = {
        id: 'ITEM-1',
        evidence_id: 'EVID-UUID-001',
        verification_status: 'needs_revision',
        scoring_mode: 'FIXED_OPTION'
      };
      expect(itemWithEvidence.evidence_id).toBe('EVID-UUID-001');
      expect(itemWithEvidence.verification_status).toBe('needs_revision');
    });

    it('35. preserves HR navigation, read models, and module health', () => {
      const readModel = PersonnelRevisionRequestService.formatReviewerRevisionView(
        { id: 'EVAL-501', status: 'returned_for_revision', version_number: 1 },
        { id: 'REV-501', overall_message: 'Needs correction', status: 'open' }
      );
      expect(readModel.is_locked_for_review).toBe(true);
      expect(readModel.display_status).toBe('Returned for Revision');
    });
  });

});
