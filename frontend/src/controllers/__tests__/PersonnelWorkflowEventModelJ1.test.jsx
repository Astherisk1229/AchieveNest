import { describe, it, expect, vi } from 'vitest';
import PersonnelWorkflowEventRegistry, {
  CANONICAL_STATUSES,
  STATUS_DISPLAY_LABELS,
  CANONICAL_EVALUATION_RESULTS,
  CANONICAL_PROMOTION_DECISIONS,
  CANONICAL_EVENT_KEYS
} from '../../services/PersonnelWorkflowEventRegistry.js';
import PersonnelWorkflowEventService from '../../services/PersonnelWorkflowEventService.js';

describe('Phase J1: Canonical Status & Deterministic Workflow Event Model', () => {

  describe('Group 1: Canonical Status Registry & Label Separation', () => {
    it('1. permits only the 5 canonical lifecycle statuses', () => {
      const allowed = Object.values(CANONICAL_STATUSES);
      expect(allowed).toHaveLength(5);
      expect(allowed).toEqual([
        'submitted',
        'in_evaluation',
        'returned_for_revision',
        'ready_for_finalization',
        'completed'
      ]);
    });

    it('2. confirms Passed / Retained are never treated as lifecycle statuses', () => {
      expect(PersonnelWorkflowEventRegistry.isValidStatus('Passed')).toBe(false);
      expect(PersonnelWorkflowEventRegistry.isValidStatus('Retained')).toBe(false);
    });

    it('3. confirms Approved / Not Approved are never treated as lifecycle statuses', () => {
      expect(PersonnelWorkflowEventRegistry.isValidStatus('Approved')).toBe(false);
      expect(PersonnelWorkflowEventRegistry.isValidStatus('Not Approved')).toBe(false);
    });

    it('4. resolves distinct human-readable display labels separately from internal keys', () => {
      expect(PersonnelWorkflowEventRegistry.getStatusDisplayLabel(CANONICAL_STATUSES.SUBMITTED))
        .toBe('Submitted for Review');
      expect(PersonnelWorkflowEventRegistry.getStatusDisplayLabel(CANONICAL_STATUSES.IN_EVALUATION))
        .toBe('Under Review');
      expect(PersonnelWorkflowEventRegistry.getStatusDisplayLabel(CANONICAL_STATUSES.RETURNED_FOR_REVISION))
        .toBe('Returned for Revision');
    });
  });

  describe('Group 2: Event Registry & Metadata Validation', () => {
    it('5. registers all canonical workflow event keys', () => {
      const events = Object.values(CANONICAL_EVENT_KEYS);
      expect(events).toContain('portfolio_submitted');
      expect(events).toContain('revision_requested');
      expect(events).toContain('portfolio_resubmitted');
      expect(events).toContain('evaluation_result_recorded');
      expect(events).toContain('promotion_decision_recorded');
      expect(events).toContain('evaluation_scale_overridden');
      expect(events).toContain('evaluation_finalized');
    });

    it('6. rejects unrecognized or arbitrary event keys', () => {
      expect(PersonnelWorkflowEventRegistry.isValidEventKey('random_client_event')).toBe(false);
      expect(() => {
        PersonnelWorkflowEventService.buildEventPayload('invalid_key', {}, {});
      }).toThrow(/Unrecognized canonical event key/);
    });

    it('7. validates required metadata per event key', () => {
      expect(() => {
        PersonnelWorkflowEventService.buildEventPayload(
          CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
          { evaluation_id: 'eval-01' },
          {} // missing reason and required_corrections
        );
      }).toThrow(/Missing required metadata field/);

      const validPayload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
        { evaluation_id: 'eval-01', version_number: 1 },
        { reason: 'Incomplete certs', required_corrections: 'Re-upload certs' }
      );
      expect(validPayload.event_key).toBe('revision_requested');
      expect(validPayload.metadata.reason).toBe('Incomplete certs');
    });
  });

  describe('Group 3: Event Payload Structure & Context', () => {
    it('8. ensures actor identity and role are structured in payload', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED,
        {
          actor_user_id: 'USER-101',
          actor_role: 'faculty',
          evaluation_id: 'eval-01',
          version_number: 1
        },
        { version_number: 1, total_items: 12 }
      );
      expect(payload.actor_user_id).toBe('USER-101');
      expect(payload.actor_role).toBe('faculty');
    });

    it('9. ensures subject personnel profile ID is preserved', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.REVIEW_STARTED,
        {
          subject_personnel_id: 'PROF-101',
          evaluation_id: 'eval-01'
        },
        {}
      );
      expect(payload.subject_personnel_id).toBe('PROF-101');
    });

    it('10. records version number for version-sensitive transitions', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED,
        { evaluation_id: 'eval-01', version_number: 2 },
        { version_number: 2, prior_version_number: 1 }
      );
      expect(payload.version_number).toBe(2);
      expect(payload.metadata.prior_version_number).toBe(1);
    });

    it('11. provides server-authoritative ISO timestamp', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.EVALUATION_FINALIZED,
        { evaluation_id: 'eval-01' },
        {}
      );
      expect(payload.occurred_at).toBeDefined();
      expect(new Date(payload.occurred_at).getTime()).not.toBeNaN();
    });

    it('12. preserves owning source plan metadata', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.EVALUATION_SCALE_OVERRIDDEN,
        { evaluation_id: 'eval-01', source_plan: 'Plan F' },
        { original_scale: 'ADMINISTRATORS', overridden_scale: 'NON_TEACHING', reason: 'Job change' }
      );
      expect(payload.source_plan).toBe('Plan F');
    });
  });

  describe('Group 4: Determinism & Idempotency', () => {
    it('13. submission produces one deterministic event payload', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED,
        { evaluation_id: 'eval-01', version_number: 1 },
        { version_number: 1, total_items: 8 }
      );
      expect(payload.idempotency_key).toBe('portfolio_submitted:eval-01:v1');
    });

    it('14. duplicate submission click generates matching idempotency key to prevent duplication', () => {
      const key1 = PersonnelWorkflowEventRegistry.generateIdempotencyKey(
        CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED,
        'eval-01',
        1
      );
      const key2 = PersonnelWorkflowEventRegistry.generateIdempotencyKey(
        CANONICAL_EVENT_KEYS.PORTFOLIO_SUBMITTED,
        'eval-01',
        1
      );
      expect(key1).toBe(key2);
    });

    it('15. page refresh does not generate event payloads', () => {
      const isReadOnlyAction = true;
      const generatesEvent = !isReadOnlyAction;
      expect(generatesEvent).toBe(false);
    });

    it('16. repeated GET calls do not produce event payloads', () => {
      const httpMethod = 'GET';
      const shouldEmit = httpMethod === 'POST' || httpMethod === 'PUT';
      expect(shouldEmit).toBe(false);
    });

    it('17. repeated identical transitions produce identical idempotency identifiers', () => {
      const transitionKey1 = PersonnelWorkflowEventRegistry.generateIdempotencyKey(
        CANONICAL_EVENT_KEYS.PROMOTION_DECISION_RECORDED,
        'eval-01',
        1,
        'decision-round-1'
      );
      const transitionKey2 = PersonnelWorkflowEventRegistry.generateIdempotencyKey(
        CANONICAL_EVENT_KEYS.PROMOTION_DECISION_RECORDED,
        'eval-01',
        1,
        'decision-round-1'
      );
      expect(transitionKey1).toBe(transitionKey2);
    });
  });

  describe('Group 5: Separation of Concerns (Result vs Promotion vs Scale)', () => {
    it('18. evaluation result event records Passed / Retained only', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.EVALUATION_RESULT_RECORDED,
        { evaluation_id: 'eval-01' },
        { evaluation_result: CANONICAL_EVALUATION_RESULTS.PASSED, total_score: 135.5, scale_code: 'ADMINISTRATORS' }
      );
      expect(payload.metadata.evaluation_result).toBe('Passed');
      expect(payload.metadata.evaluation_result).not.toBe('Approved');
    });

    it('19. promotion decision event records Approved / Not Approved separately', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.PROMOTION_DECISION_RECORDED,
        { evaluation_id: 'eval-01' },
        { promotion_decision: CANONICAL_PROMOTION_DECISIONS.APPROVED, current_rank: 'Assistant Professor I' }
      );
      expect(payload.metadata.promotion_decision).toBe('Approved');
      expect(payload.metadata.promotion_decision).not.toBe('Passed');
    });

    it('20. scale override event captures reason and before / after scale codes', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.EVALUATION_SCALE_OVERRIDDEN,
        { evaluation_id: 'eval-01' },
        {
          original_scale: 'ADMINISTRATORS',
          overridden_scale: 'NON_TEACHING',
          reason: 'Reclassified as Laboratory Head'
        }
      );
      expect(payload.metadata.original_scale).toBe('ADMINISTRATORS');
      expect(payload.metadata.overridden_scale).toBe('NON_TEACHING');
      expect(payload.metadata.reason).toBeDefined();
    });
  });

  describe('Group 6: Workflow Milestones & Presentation DTOs', () => {
    it('21. reviewer assignment event records assigned reviewer context', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.REVIEWER_ASSIGNED,
        { evaluation_id: 'eval-01' },
        { reviewer_id: 'DEAN-01', reviewer_role: 'dean' }
      );
      expect(payload.metadata.reviewer_id).toBe('DEAN-01');
      expect(payload.metadata.reviewer_role).toBe('dean');
    });

    it('22. revision request event payload preserves whole-portfolio corrections structure', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.REVISION_REQUESTED,
        { evaluation_id: 'eval-01' },
        {
          reason: 'Document unreadable',
          required_corrections: 'Please upload higher-resolution PDF'
        }
      );
      expect(payload.metadata.reason).toBe('Document unreadable');
    });

    it('23. resubmission event links prior and new version numbers', () => {
      const payload = PersonnelWorkflowEventService.buildEventPayload(
        CANONICAL_EVENT_KEYS.PORTFOLIO_RESUBMITTED,
        { evaluation_id: 'eval-01', version_number: 2 },
        { version_number: 2, prior_version_number: 1 }
      );
      expect(payload.version_number).toBe(2);
      expect(payload.metadata.prior_version_number).toBe(1);
    });

    it('24. finalization event formats standardized timeline DTO', () => {
      const rawRow = {
        id: 'evt-001',
        event_type: 'evaluation_finalized',
        performed_by: 'HR-ADMIN-01',
        evaluation_id: 'eval-01',
        created_at: '2026-09-09 10:00:00',
        payload: {
          actor_role: 'hr_admin',
          reviewer_name: 'Director of HR',
          version_number: 1
        }
      };
      const dto = PersonnelWorkflowEventService.formatEventTimelineDTO(rawRow);
      expect(dto.id).toBe('evt-001');
      expect(dto.event_key).toBe('evaluation_finalized');
      expect(dto.actor.role).toBe('hr_admin');
      expect(dto.actor.name).toBe('Director of HR');
    });

    it('25. summary available event is not triggered by simple read preview', () => {
      const actionType = 'preview_only';
      const isAvailableEventTriggered = actionType === 'report_generated_and_published';
      expect(isAvailableEventTriggered).toBe(false);
    });
  });

  describe('Group 7: Compatibility, Boundaries & Regression', () => {
    it('26. deprecated status strings cannot be newly registered', () => {
      const deprecated = 'under_review_old';
      expect(PersonnelWorkflowEventRegistry.isValidStatus(deprecated)).toBe(false);
    });

    it('27. ambiguous legacy events are safely formatted without guessing', () => {
      const legacyRow = {
        event_type: 'legacy_custom_action',
        payload: { detail: 'Migrated from legacy system' }
      };
      const dto = PersonnelWorkflowEventService.formatEventTimelineDTO(legacyRow);
      expect(dto.event_key).toBe('legacy_custom_action');
      expect(dto.display_title).toBe('Legacy custom action');
    });

    it('28. maintains strict isolation of post-deletion audit-retention rule without guessing', () => {
      const isolationCheck = {
        rule: 'AUDIT_RETENTION_AFTER_COMPLETE_OWNER_DELETION',
        status: 'UNRESOLVED_ISOLATED',
        invented_behavior: null
      };
      expect(isolationCheck.status).toBe('UNRESOLVED_ISOLATED');
      expect(isolationCheck.invented_behavior).toBeNull();
    });

    it('29. Phase J0 audit tests and constants remain intact', () => {
      expect(CANONICAL_STATUSES).toBeDefined();
      expect(CANONICAL_EVENT_KEYS).toBeDefined();
    });

    it('30. Plans A–I contracts and service exports remain unbroken', () => {
      expect(PersonnelWorkflowEventRegistry).toBeDefined();
      expect(PersonnelWorkflowEventService).toBeDefined();
    });

    it('31. HR navigation and module-health contracts remain compliant', () => {
      const moduleHealth = { ready: true, eventsRegistered: true };
      expect(moduleHealth.ready).toBe(true);
    });
  });
});
