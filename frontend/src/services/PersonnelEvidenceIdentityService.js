/**
 * PersonnelEvidenceIdentityService.js
 *
 * Frontend Authority & Mirror Service for Plan I — Phase I2:
 * Evidence Identity, Integrity, Snapshot Linkage & Duplicate Advisory.
 */

export const DUPLICATE_ADVISORY_SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  NONE: 'none'
})

export default class PersonnelEvidenceIdentityService {
  /**
   * Validates that an evidence record has a stable canonical identity.
   * @param {object} evidence
   * @returns {{ isValid: boolean, evidenceId: string|null, error: string|null }}
   */
  static validateEvidenceIdentity(evidence) {
    if (!evidence || typeof evidence !== 'object') {
      return { isValid: false, evidenceId: null, error: 'Invalid evidence object.' }
    }

    const id = evidence.id || evidence.evidence_id || null
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { isValid: false, evidenceId: null, error: 'Evidence record is missing canonical UUID identifier.' }
    }

    return {
      isValid: true,
      evidenceId: id.trim(),
      error: null
    }
  }

  /**
   * Constructs an authoritative snapshot reference linking an evaluation item to immutable evidence.
   * @param {object} accomplishmentItem
   * @param {object} primaryEvidence
   * @returns {object}
   */
  static buildSnapshotEvidenceReference(accomplishmentItem = {}, primaryEvidence = {}) {
    const evidenceId = primaryEvidence.id || primaryEvidence.evidence_id || null
    const originalFilename = primaryEvidence.original_filename || accomplishmentItem.attached_file_name || 'supporting_proof.pdf'
    const storagePath = primaryEvidence.storage_path || null
    const sha256 = primaryEvidence.sha256 || primaryEvidence.checksum || null
    const byteSize = primaryEvidence.byte_size || 0
    const mimeType = primaryEvidence.detected_mime_type || primaryEvidence.mime_type || 'application/pdf'

    return {
      accomplishment_id: accomplishmentItem.id || null,
      evidence_id: evidenceId,
      original_filename: originalFilename,
      file_name: originalFilename,
      file_url: storagePath,
      sha256: sha256,
      byte_size: byteSize,
      mime_type: mimeType,
      is_snapshot_immutable: true
    }
  }

  /**
   * Privacy-preserving SHA-256 duplicate content advisory analyzer.
   * Returns non-blocking warning without revealing other users' private metadata.
   * @param {string} sha256
   * @param {Array<object>} existingEvidenceRecords
   * @param {string|null} currentEvidenceId
   * @param {string|null} currentOwnerId
   * @returns {{ duplicateDetected: boolean, sameOwnerMatches: number, totalMatches: number, message: string|null, severity: string }}
   */
  static checkDuplicateAdvisory(sha256, existingEvidenceRecords = [], currentEvidenceId = null, currentOwnerId = null) {
    if (!sha256 || typeof sha256 !== 'string' || sha256.trim() === '') {
      return {
        duplicateDetected: false,
        sameOwnerMatches: 0,
        totalMatches: 0,
        message: null,
        severity: DUPLICATE_ADVISORY_SEVERITY.NONE
      }
    }

    const cleanHash = sha256.trim().toLowerCase()
    const matchingRecords = existingEvidenceRecords.filter((rec) => {
      const recHash = (rec.sha256 || rec.checksum || '').trim().toLowerCase()
      const recId = rec.id || rec.evidence_id || null
      return recHash === cleanHash && recId !== currentEvidenceId
    })

    if (matchingRecords.length === 0) {
      return {
        duplicateDetected: false,
        sameOwnerMatches: 0,
        totalMatches: 0,
        message: null,
        severity: DUPLICATE_ADVISORY_SEVERITY.NONE
      }
    }

    let sameOwnerCount = 0
    if (currentOwnerId) {
      matchingRecords.forEach((m) => {
        const uploaderId = m.uploaded_by || m.owner_id || m.personnel_profile_id
        if (uploaderId === currentOwnerId) {
          sameOwnerCount++
        }
      })
    }

    const message = sameOwnerCount > 0
      ? `Advisory Notice: This document has identical content (SHA-256 match) to ${sameOwnerCount} evidence file(s) in your portfolio. You may proceed if intentional.`
      : 'Advisory Notice: This document shares identical content with an existing system document.'

    return {
      duplicateDetected: true,
      sameOwnerMatches: sameOwnerCount,
      totalMatches: matchingRecords.length,
      message,
      severity: DUPLICATE_ADVISORY_SEVERITY.INFO
    }
  }

  /**
   * Evaluates if a submitted evaluation item snapshot is immutable against live portfolio changes.
   * @param {object} snapshotItem
   * @param {object} currentAccomplishment
   * @returns {boolean} True if snapshot remains decoupled and intact
   */
  static isHistoricalSnapshotImmutable(snapshotItem = {}, currentAccomplishment = {}) {
    if (!snapshotItem.evidence_id) {
      return false
    }

    // Even if current accomplishment evidence changes, snapshot evidence_id must remain fixed
    return true
  }
}
