/**
 * PersonnelWorkflowEventService.js
 *
 * Frontend Canonical Event & DTO Builder Service for Plan J — Phase J1.
 * Standardizes event creation payloads, validates required context, and manages
 * display presentation for audit history timelines.
 */

import PersonnelWorkflowEventRegistry, {
  CANONICAL_EVENT_KEYS,
  CANONICAL_STATUSES
} from './PersonnelWorkflowEventRegistry.js';

export default class PersonnelWorkflowEventService {
  /**
   * Builds and validates a canonical workflow event payload before dispatching.
   *
   * @param {string} eventKey
   * @param {Object} context { actor_user_id, actor_role, subject_personnel_id, evaluation_id, version_number, source_plan }
   * @param {Object} metadata Event-specific metadata fields
   * @returns {Object} Validated event payload
   */
  static buildEventPayload(eventKey, context = {}, metadata = {}) {
    PersonnelWorkflowEventRegistry.validateRequiredMetadata(eventKey, metadata);

    const evaluationId = context.evaluation_id || null;
    const versionNumber = context.version_number !== undefined ? Number(context.version_number) : null;
    const idempotencyKey = context.idempotency_key || PersonnelWorkflowEventRegistry.generateIdempotencyKey(
      eventKey,
      evaluationId,
      versionNumber,
      context.transition_nonce || null
    );

    return {
      event_key: eventKey,
      display_label: PersonnelWorkflowEventRegistry.getStatusDisplayLabel(eventKey),
      evaluation_id: evaluationId,
      version_number: versionNumber,
      actor_user_id: context.actor_user_id || context.actor_id || null,
      actor_role: context.actor_role || 'system',
      subject_personnel_id: context.subject_personnel_id || context.personnel_profile_id || null,
      source_plan: context.source_plan || 'Plan J',
      idempotency_key: idempotencyKey,
      occurred_at: context.occurred_at || new Date().toISOString(),
      metadata: { ...metadata },
    };
  }

  /**
   * Formats a raw event record from the API into a standardized UI timeline DTO.
   */
  static formatEventTimelineDTO(eventRow = {}) {
    const eventKey = eventRow.event_key || eventRow.event_type || 'unknown_event';
    const metadata = eventRow.metadata || eventRow.payload || {};

    return {
      id: eventRow.id || eventRow.event_id || null,
      event_key: eventKey,
      display_title: PersonnelWorkflowEventRegistry.getStatusDisplayLabel(eventKey),
      actor: {
        id: eventRow.actor_user_id || eventRow.performed_by || null,
        role: eventRow.actor_role || metadata.actor_role || 'system',
        name: metadata.actor_name || metadata.reviewer_name || null
      },
      evaluation_id: eventRow.evaluation_id || null,
      version_number: eventRow.version_number || metadata.version_number || null,
      occurred_at: eventRow.occurred_at || eventRow.created_at || new Date().toISOString(),
      metadata,
      source_plan: eventRow.source_plan || metadata.source_plan || 'Plan J'
    };
  }
}
