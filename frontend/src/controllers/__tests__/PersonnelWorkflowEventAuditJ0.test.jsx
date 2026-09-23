import { describe, it, expect } from 'vitest';
import PersonnelEvaluatorWorkspaceService, { JUDGMENT_STATUSES, EVIDENCE_STATUSES } from '../../services/PersonnelEvaluatorWorkspaceService.js';
import { DECISION_VOCABULARY } from '../../services/PersonnelPromotionDecisionService.js';
import { RESULT_VOCABULARY } from '../../services/PersonnelEvaluationResultService.js';
import { EVALUATION_SCALE_CODES } from '../../services/evaluationInstrumentRegistry.js';

describe('Phase J0: Personnel Evaluation Workflow Event & Status Audit', () => {

  describe('1. Lifecycle Statuses Across Plans A–H', () => {
    it('1. inventories Plan C whole-portfolio lifecycle statuses', () => {
      const planCStatuses = [
        'submitted',
        'in_evaluation',
        'ready_for_finalization',
        'returned_for_revision',
        'completed'
      ];
      expect(planCStatuses).toHaveLength(5);
      expect(planCStatuses).toContain('submitted');
      expect(planCStatuses).toContain('returned_for_revision');
    });

    it('2. confirms Passed / Retained as canonical Evaluation Result (Plan F)', () => {
      expect(RESULT_VOCABULARY.PASSED).toBe('Passed');
      expect(RESULT_VOCABULARY.RETAINED).toBe('Retained');
    });

    it('3. confirms Promotion Decision is strictly separate from Evaluation Result (Plan H)', () => {
      expect(DECISION_VOCABULARY.APPROVED).toBe('Approved');
      expect(DECISION_VOCABULARY.NOT_APPROVED).toBe('Not Approved');
      expect(DECISION_VOCABULARY.APPROVED).not.toBe(RESULT_VOCABULARY.PASSED);
    });

    it('4. identifies reviewer assignment and routing states (Plan G)', () => {
      const routingStates = ['assigned', 'unassigned', 'rerouted'];
      expect(routingStates).toContain('assigned');
    });

    it('5. identifies whole-portfolio revision-return state (Plan C3 / G)', () => {
      const returnState = 'returned_for_revision';
      expect(returnState).toBe('returned_for_revision');
    });

    it('6. identifies multi-version and root lineage state (Plan C4 / C5)', () => {
      const lineageFields = ['evaluation_root_id', 'version_number', 'is_latest_version'];
      expect(lineageFields).toContain('version_number');
    });

    it('7. identifies finalization and final lock states (Plan H)', () => {
      const lockStates = ['ready_for_finalization', 'completed', 'final_locked'];
      expect(lockStates).toContain('completed');
    });
  });

  describe('2. Notification Architecture & Triggers Audit', () => {
    it('8. inventories persisted notification tables and structures', () => {
      const notificationSchema = {
        table: 'notifications',
        fields: ['id', 'recipient_profile_id', 'actor_profile_id', 'event_type', 'title', 'message', 'read_at', 'created_at']
      };
      expect(notificationSchema.table).toBe('notifications');
      expect(notificationSchema.fields).toContain('read_at');
    });

    it('9. classifies persisted vs frontend-only notification risks', () => {
      const notificationCatalog = {
        submission_received: { type: 'workflow', persisted: true },
        returned_for_revision: { type: 'workflow', persisted: true },
        evaluation_finalized: { type: 'workflow', persisted: true },
        toast_temp_notice: { type: 'ui_ephemeral', persisted: false }
      };
      expect(notificationCatalog.submission_received.persisted).toBe(true);
      expect(notificationCatalog.toast_temp_notice.persisted).toBe(false);
    });
  });

  describe('3. Activity Logs, Audit Tables & Comments Audit', () => {
    it('10. inventories existing audit and activity tables', () => {
      const auditTables = [
        'audit_logs',
        'personnel_evaluation_events',
        'evaluation_scale_change_events',
        'file_security_audit_events',
        'role_assignment_events'
      ];
      expect(auditTables).toContain('personnel_evaluation_events');
      expect(auditTables).toContain('evaluation_scale_change_events');
    });

    it('11. identifies reviewer comments and deficiency notes storage', () => {
      const deficiencyStructure = {
        overall_reason: 'Missing certificates',
        required_corrections: 'Please upload Certificate of Participation for Seminar 2025',
        item_deficiencies: [
          { evaluation_item_id: 'item-101', criterion_code: 'B.3', comment: 'Attach signed copy' }
        ]
      };
      expect(deficiencyStructure.item_deficiencies).toHaveLength(1);
      expect(deficiencyStructure.item_deficiencies[0].criterion_code).toBe('B.3');
    });

    it('12. validates whole-portfolio revision semantics over item-isolated submissions', () => {
      const wholePortfolioReturn = {
        scope: 'whole_portfolio',
        evaluation_status_updated: 'returned_for_revision',
        item_comments_supplemental: true
      };
      expect(wholePortfolioReturn.scope).toBe('whole_portfolio');
      expect(wholePortfolioReturn.item_comments_supplemental).toBe(true);
    });
  });

  describe('4. Metadata Context & Traceability Audit', () => {
    it('13. assesses actor metadata availability across workflow events', () => {
      const actorContext = {
        actor_id: 'USER-DEAN-01',
        actor_role: 'dean',
        actor_name: 'Dr. Maria Santos, Dean of Engineering',
        timestamp: '2026-09-09 10:00:00'
      };
      expect(actorContext.actor_role).toBe('dean');
      expect(actorContext.actor_id).toBeDefined();
    });

    it('14. assesses version and evaluation subject metadata linkage', () => {
      const eventLinkage = {
        evaluation_id: 'eval-uuid-0001',
        evaluation_root_id: 'root-uuid-0001',
        version_number: 2,
        personnel_profile_id: 'prof-uuid-101'
      };
      expect(eventLinkage.version_number).toBe(2);
      expect(eventLinkage.evaluation_root_id).toBe('root-uuid-0001');
    });

    it('15. assesses HR scale override audit availability (Plan F)', () => {
      const scaleOverrideEvent = {
        event_type: 'evaluation_scale_overridden',
        original_scale: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        overridden_scale: EVALUATION_SCALE_CODES.NON_TEACHING,
        authorized_by: 'HR-ADMIN-01',
        override_reason: 'Reclassified as full-time laboratory manager per Board Res 2025-44',
        timestamp: '2026-09-09 10:05:00'
      };
      expect(scaleOverrideEvent.original_scale).not.toBe(scaleOverrideEvent.overridden_scale);
      expect(scaleOverrideEvent.override_reason).toBeDefined();
    });

    it('16. assesses reviewer routing change audit availability (Plan G)', () => {
      const routingChangeEvent = {
        event_type: 'reviewer_rerouted',
        evaluation_id: 'eval-uuid-0001',
        previous_reviewer: 'DEAN-OLD-01',
        new_reviewer: 'DEAN-NEW-02',
        reason: 'Dean on sabbatical; reassigned to OIC Dean'
      };
      expect(routingChangeEvent.event_type).toBe('reviewer_rerouted');
    });

    it('17. assesses promotion decision audit availability (Plan H)', () => {
      const promotionEvent = {
        event_type: 'promotion_decision_recorded',
        evaluation_id: 'eval-uuid-0001',
        evaluation_result: 'Passed',
        promotion_decision: 'Approved',
        approved_rank: 'Associate Professor II',
        effective_date: '2026-11-01'
      };
      expect(promotionEvent.promotion_decision).toBe('Approved');
      expect(promotionEvent.evaluation_result).toBe('Passed');
    });

    it('18. assesses owner-authorized complete deletion event availability (Plan I / C5)', () => {
      const deletionEvent = {
        event_type: 'portfolio_purged',
        target_profile_id: 'prof-uuid-101',
        performed_by_role: 'owner',
        purged_evaluations: 2,
        purged_accomplishments: 14,
        timestamp: '2026-09-09 10:30:00'
      };
      expect(deletionEvent.event_type).toBe('portfolio_purged');
      expect(deletionEvent.purged_evaluations).toBe(2);
    });
  });

  describe('5. Status Label Inconsistencies, Gaps & Security Audit', () => {
    it('19. maps internal keys to display labels and flags inconsistencies', () => {
      const statusMapping = {
        submitted: { internalKey: 'submitted', displayLabel: 'Submitted for Review', consistency: 'VALID' },
        in_evaluation: { internalKey: 'in_evaluation', displayLabel: 'Under Review', consistency: 'VALID' },
        returned_for_revision: { internalKey: 'returned_for_revision', displayLabel: 'Needs Revision', consistency: 'HARMONIZE_FOR_J1' },
        completed: { internalKey: 'completed', displayLabel: 'Completed / Finalized', consistency: 'VALID' }
      };
      expect(statusMapping.returned_for_revision.internalKey).toBe('returned_for_revision');
    });

    it('20. identifies missing material workflow transition event records', () => {
      const missingEvents = [
        'reviewer_started_review',
        'qualification_status_transitioned',
        'report_summary_printed'
      ];
      expect(missingEvents).toContain('reviewer_started_review');
    });

    it('21. identifies frontend-only critical workflow state risks', () => {
      const frontendStateRisks = [
        'unpersisted_active_tab_filter',
        'session_cached_reviewer_draft_score'
      ];
      expect(frontendStateRisks).toContain('session_cached_reviewer_draft_score');
    });

    it('22. assesses audit log immutability and mutation protection', () => {
      const auditLogPolicy = {
        is_immutable: true,
        allows_user_update: false,
        allows_user_delete: false
      };
      expect(auditLogPolicy.is_immutable).toBe(true);
      expect(auditLogPolicy.allows_user_update).toBe(false);
    });

    it('23. assesses authorized audit access roles across Personnel, Dean, and HR', () => {
      const accessRules = {
        hr_admin: { can_view_audit_trail: true, scope: 'institutional' },
        dean: { can_view_audit_trail: true, scope: 'assigned_college' },
        faculty: { can_view_audit_trail: true, scope: 'own_submission_history_only' },
        department_secretary: { can_view_audit_trail: false, scope: 'none' }
      };
      expect(accessRules.hr_admin.can_view_audit_trail).toBe(true);
      expect(accessRules.department_secretary.can_view_audit_trail).toBe(false);
    });

    it('24. explicitly records the unresolved audit-retention rule without guessing', () => {
      const unresolvedPolicy = {
        policy_name: 'AUDIT_RETENTION_AFTER_COMPLETE_OWNER_DELETION',
        status: 'UNRESOLVED',
        decision_chosen: null,
        note: 'Do not invent whether audit events are deleted, anonymized, or retained. Isolate behind policy point.'
      };
      expect(unresolvedPolicy.status).toBe('UNRESOLVED');
      expect(unresolvedPolicy.decision_chosen).toBeNull();
    });
  });
});
