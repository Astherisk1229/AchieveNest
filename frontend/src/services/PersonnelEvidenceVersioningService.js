/**
 * PersonnelEvidenceVersioningService.js
 *
 * Frontend Authoritative Evidence Versioning, Replacement & Deletion Service for Plan I — Phase I4.
 * Governs replacement rules for working data, ensures immutable preservation of historical submitted versions,
 * and coordinates owner-authorized complete deletion cleanup.
 */

export const REPLACEMENT_STATUSES = Object.freeze({
  ALLOWED: 'replacement_allowed',
  LOCKED: 'portfolio_submission_locked',
  FORBIDDEN: 'evidence_access_forbidden',
  OWNER_REQUIRED: 'owner_authorization_required'
})

export default class PersonnelEvidenceVersioningService {
  /**
   * Validates whether an accomplishment's attached evidence can be replaced.
   */
  static canReplaceEvidence(actor = {}, accomplishment = {}, submissionContext = {}) {
    const actorId = String(actor.profile_id || actor.id || '')
    const ownerId = String(accomplishment.personnel_profile_id || accomplishment.personnel_id || '')

    // 1. Ownership check
    if (!actorId || (ownerId && actorId !== ownerId)) {
      return {
        allowed: false,
        reason_code: REPLACEMENT_STATUSES.FORBIDDEN,
        message: 'Only the achievement owner can replace attached evidence.'
      }
    }

    // 2. Locked Submission Check
    const submissionStatus = String(submissionContext.status || '').toLowerCase()
    if (['submitted', 'under_review', 'deliberated', 'finalized', 'locked'].includes(submissionStatus)) {
      return {
        allowed: false,
        reason_code: REPLACEMENT_STATUSES.LOCKED,
        message: `Evidence cannot be replaced while portfolio submission is locked in '${submissionStatus}'.`
      }
    }

    const accomplishmentStatus = String(accomplishment.status || 'active').toLowerCase()
    if (['submitted', 'locked', 'archived'].includes(accomplishmentStatus)) {
      return {
        allowed: false,
        reason_code: REPLACEMENT_STATUSES.LOCKED,
        message: `Accomplishment is locked in '${accomplishmentStatus}' status and cannot be modified.`
      }
    }

    return {
      allowed: true,
      reason_code: REPLACEMENT_STATUSES.ALLOWED,
      message: 'Evidence replacement permitted in editable working state.'
    }
  }

  /**
   * Simulates replacing evidence on an editable working accomplishment.
   * Preserves historical version linkage while updating the working record.
   */
  static replaceWorkingEvidence(accomplishment, newEvidenceRecord, historicalSnapshots = []) {
    const oldEvidenceId = accomplishment.evidence_id || accomplishment.primary_evidence_id || null
    const newEvidenceId = newEvidenceRecord.evidence_id || newEvidenceRecord.id

    // Update working accomplishment
    const updatedAccomplishment = {
      ...accomplishment,
      evidence_id: newEvidenceId,
      primary_evidence_id: newEvidenceId,
      fileName: newEvidenceRecord.original_filename || newEvidenceRecord.fileName,
      proof_file_name: newEvidenceRecord.original_filename || newEvidenceRecord.fileName,
      updated_at: new Date().toISOString()
    }

    // Verify historical snapshots remain immutable
    const preservedSnapshots = historicalSnapshots.map(snap => ({
      ...snap,
      items: snap.items.map(item => ({ ...item })) // Deep copy
    }))

    return {
      working_accomplishment: updatedAccomplishment,
      replaces_evidence_id: oldEvidenceId,
      new_evidence_id: newEvidenceId,
      historical_snapshots: preservedSnapshots
    }
  }

  /**
   * Validates and prepares an owner-authorized complete deletion manifest.
   */
  static buildDeletionManifest(ownerId, actor = {}, authorizationReference = null, evidenceRecords = []) {
    const actorId = String(actor.profile_id || actor.id || '')
    const actorRoles = Array.isArray(actor.roles) ? actor.roles : (actor.role ? [actor.role] : [])
    const isHR = actorRoles.includes('hr_staff') || actorRoles.includes('hr_admin')
    const isOwner = Boolean(actorId && actorId === ownerId)

    if (!isOwner && !isHR) {
      return {
        valid: false,
        reason_code: REPLACEMENT_STATUSES.FORBIDDEN,
        message: 'Only the record owner or HR on their behalf may execute complete deletion.'
      }
    }

    if (isHR && !authorizationReference) {
      return {
        valid: false,
        reason_code: REPLACEMENT_STATUSES.OWNER_REQUIRED,
        message: 'HR execution of complete deletion requires documented owner authorization reference.'
      }
    }

    const targetEvidence = evidenceRecords.filter(ev => {
      const evOwner = String(ev.personnel_id || ev.personnel_profile_id || ev.uploader_id || '')
      return evOwner === ownerId
    })

    return {
      valid: true,
      owner_id: ownerId,
      initiated_by: isHR ? 'hr_admin' : 'owner',
      authorization_reference: authorizationReference || 'owner_direct_request',
      evidence_count: targetEvidence.length,
      storage_keys_to_unlink: targetEvidence.map(ev => ev.storage_key || ev.storage_path).filter(Boolean),
      timestamp: new Date().toISOString()
    }
  }
}
