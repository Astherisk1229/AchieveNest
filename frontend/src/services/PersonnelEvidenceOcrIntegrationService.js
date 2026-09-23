/**
 * PersonnelEvidenceOcrIntegrationService.js
 *
 * Phase I5: Authoritative OCR & Reviewer Evidence-Chain Integration Service (Frontend).
 *
 * Enforces:
 * 1. Upload -> OCR -> Snapshot -> Reviewer preview uses one traceable evidence identity.
 * 2. OCR reads the exact persisted evidence object by canonical evidence_id.
 * 3. OCR failure remains decoupled from file persistence success (upload succeeds, evidence remains valid and previewable).
 * 4. Zero fabricated metadata upon OCR failure.
 * 5. Reviewer preview resolves exact submitted snapshot evidence_id, not live/latest replacement evidence.
 * 6. Historical Version 1 retains Evidence A after working revision / Version 2 replaces with Evidence B.
 * 7. Deleted/missing evidence produces safe, controlled errors without filename fallback.
 */

export class PersonnelEvidenceOcrIntegrationService {
  /**
   * Validate that an OCR request initiates strictly from canonical evidence_id.
   * Rejects client blob URLs, raw local filesystem paths, or filename-only references.
   */
  static validateOcrSourceAuthority(requestPayload) {
    if (!requestPayload || typeof requestPayload !== 'object') {
      return {
        isValid: false,
        reasonCode: 'invalid_payload',
        message: 'OCR request payload must be an object containing a valid evidence_id.',
      };
    }

    const { evidence_id, filename, file_blob, client_path, storage_path } = requestPayload;

    if (!evidence_id || typeof evidence_id !== 'string' || evidence_id.trim() === '') {
      return {
        isValid: false,
        reasonCode: 'missing_evidence_id',
        message: 'OCR requires a canonical evidence_id. Filename-only or blob OCR is not allowed.',
      };
    }

    if (file_blob || client_path || storage_path) {
      // Client attempted to supply client-local authority or override storage path
      return {
        isValid: false,
        reasonCode: 'invalid_source_authority',
        message: 'Client cannot supply local file blobs or storage paths as OCR authority.',
      };
    }

    return {
      isValid: true,
      evidence_id: evidence_id.trim(),
    };
  }

  /**
   * Handle OCR failure without rolling back file persistence.
   * Ensures upload result remains valid, file is previewable, and no fabricated data is produced.
   */
  static handleOcrFailureSeparation(uploadResult, ocrError) {
    if (!uploadResult || !uploadResult.evidence_id) {
      throw new Error('Cannot handle OCR failure: uploadResult is missing canonical evidence_id');
    }

    return {
      evidence_id: uploadResult.evidence_id,
      upload_status: 'success',
      is_persisted: true,
      file_path: uploadResult.file_path || uploadResult.storage_key,
      original_filename: uploadResult.original_filename,
      sha256: uploadResult.sha256,
      ocr_status: 'failed',
      ocr_error_code: ocrError?.code || 'ocr_failed',
      ocr_error_message: ocrError?.message || 'OCR processing failed or timed out',
      extracted_metadata: {}, // ZERO fabricated metadata
      is_previewable: true,
      preview_url: `/api/v1/personnel/evidence/${uploadResult.evidence_id}/preview`,
    };
  }

  /**
   * Prepare OCR retry using canonical evidence identity.
   * Reuses the existing evidence record and exact persisted file without re-uploading.
   */
  static prepareOcrRetry(existingEvidence) {
    if (!existingEvidence || !existingEvidence.evidence_id) {
      return {
        success: false,
        reasonCode: 'evidence_not_found',
        message: 'Cannot retry OCR: Evidence record is missing or has no evidence_id.',
      };
    }

    if (existingEvidence.deleted_at) {
      return {
        success: false,
        reasonCode: 'evidence_deleted',
        message: 'Cannot retry OCR: Evidence has been deleted by the owner.',
      };
    }

    return {
      success: true,
      evidence_id: existingEvidence.evidence_id,
      retry_payload: {
        evidence_id: existingEvidence.evidence_id,
      },
      source_sha256: existingEvidence.sha256,
    };
  }

  /**
   * Build diagnostic evidence chain trace DTO across the full lifecycle.
   */
  static buildEvidenceChainTrace({
    evidence,
    ocrResult = null,
    snapshotItem = null,
    reviewerItem = null,
  }) {
    const evidenceId = evidence?.evidence_id || null;
    const isDeleted = Boolean(evidence?.deleted_at);
    const ocrSourceId = ocrResult?.evidence_id || null;
    const snapshotEvidenceId = snapshotItem?.evidence_id || null;
    const reviewerEvidenceId = reviewerItem?.evidence_id || null;

    const reasons = [];

    if (!evidenceId) {
      reasons.push('evidence_not_found');
    }

    if (isDeleted) {
      reasons.push('evidence_deleted');
    }

    if (ocrResult && ocrSourceId && ocrSourceId !== evidenceId) {
      reasons.push('ocr_evidence_mismatch');
    }

    if (snapshotItem && snapshotEvidenceId && snapshotEvidenceId !== evidenceId) {
      reasons.push('snapshot_evidence_mismatch');
    }

    if (reviewerItem && reviewerEvidenceId && reviewerEvidenceId !== evidenceId) {
      reasons.push('reviewer_evidence_mismatch');
    }

    const isValid = reasons.length === 0 && Boolean(evidenceId);

    return {
      evidence_id: evidenceId,
      owner_id: evidence?.user_id || evidence?.owner_id || null,
      accomplishment_id: evidence?.accomplishment_id || null,
      storage_key: evidence?.storage_key || evidence?.file_path || null,
      sha256: evidence?.sha256 || null,
      ocr_status: ocrResult?.status || (ocrResult?.error ? 'failed' : 'pending'),
      ocr_source_evidence_id: ocrSourceId,
      snapshot_evidence_id: snapshotEvidenceId,
      reviewer_evidence_id: reviewerEvidenceId,
      review_preview_route: evidenceId ? `/api/v1/personnel/evidence/${evidenceId}/preview` : null,
      chain_valid: isValid,
      reason_codes: reasons,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Resolve reviewer preview for a specific submitted version vs working revision.
   * Prohibits substitution of live or newer replacement evidence for a submitted snapshot.
   */
  static resolveReviewerPreviewForVersion(submittedSnapshotItem, workingRevisionItem = null) {
    if (!submittedSnapshotItem || !submittedSnapshotItem.evidence_id) {
      return {
        resolved: false,
        reasonCode: 'snapshot_evidence_missing',
        previewRoute: null,
      };
    }

    // Always resolve strictly by submitted snapshot's evidence_id
    const targetEvidenceId = submittedSnapshotItem.evidence_id;

    return {
      resolved: true,
      targetEvidenceId,
      previewRoute: `/api/v1/personnel/evidence/${targetEvidenceId}/preview`,
      isHistoricalSnapshot: Boolean(
        workingRevisionItem && workingRevisionItem.evidence_id !== targetEvidenceId
      ),
      submittedEvidenceId: targetEvidenceId,
      workingEvidenceId: workingRevisionItem?.evidence_id || null,
    };
  }
}
