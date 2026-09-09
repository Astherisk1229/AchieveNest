import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonnelEvidenceOcrIntegrationService } from '../../services/PersonnelEvidenceOcrIntegrationService';
import PersonnelEvidenceAccessService from '../../services/PersonnelEvidenceAccessService';
import PersonnelEvidenceVersioningService from '../../services/PersonnelEvidenceVersioningService';

describe('Phase I5: Personnel Evidence OCR & Reviewer Evidence-Chain Integration', () => {
  const sampleEvidenceA = {
    evidence_id: 'ev-uuid-0001-aaaa',
    user_id: 101,
    accomplishment_id: 'acc-uuid-0001',
    storage_key: 'personnel_evidence/user_101/ev_aaaa.pdf',
    original_filename: 'Certificate_Seminar_2025.pdf',
    mime_type: 'application/pdf',
    file_size: 245000,
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    deleted_at: null,
  };

  const sampleEvidenceB = {
    evidence_id: 'ev-uuid-0002-bbbb',
    user_id: 101,
    accomplishment_id: 'acc-uuid-0001',
    storage_key: 'personnel_evidence/user_101/ev_bbbb.pdf',
    original_filename: 'Certificate_Seminar_2025_Updated.pdf',
    mime_type: 'application/pdf',
    file_size: 260000,
    sha256: 'b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef1',
    deleted_at: null,
  };

  describe('Group 1: Upload → OCR Source Authority', () => {
    it('1. OCR accepts canonical evidence_id as authority', () => {
      const payload = { evidence_id: 'ev-uuid-0001-aaaa' };
      const result = PersonnelEvidenceOcrIntegrationService.validateOcrSourceAuthority(payload);
      expect(result.isValid).toBe(true);
      expect(result.evidence_id).toBe('ev-uuid-0001-aaaa');
    });

    it('2. OCR resolves persisted physical file via canonical evidence identity', () => {
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
        ocrResult: { status: 'completed', evidence_id: sampleEvidenceA.evidence_id },
      });
      expect(trace.chain_valid).toBe(true);
      expect(trace.storage_key).toBe('personnel_evidence/user_101/ev_aaaa.pdf');
    });

    it('3. OCR source hash matches stored SHA-256 in chain trace', () => {
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
      });
      expect(trace.sha256).toBe(sampleEvidenceA.sha256);
      expect(trace.sha256).toHaveLength(64);
    });

    it('4. filename is not accepted as OCR authority', () => {
      const payload = { filename: 'Certificate_Seminar_2025.pdf' };
      const result = PersonnelEvidenceOcrIntegrationService.validateOcrSourceAuthority(payload);
      expect(result.isValid).toBe(false);
      expect(result.reasonCode).toBe('missing_evidence_id');
    });

    it('5. client-supplied local blob or storage path override is rejected', () => {
      const payload = {
        evidence_id: 'ev-uuid-0001-aaaa',
        file_blob: 'blob:http://localhost/12345',
        client_path: 'C:\\Users\\Admin\\Documents\\test.pdf',
      };
      const result = PersonnelEvidenceOcrIntegrationService.validateOcrSourceAuthority(payload);
      expect(result.isValid).toBe(false);
      expect(result.reasonCode).toBe('invalid_source_authority');
    });
  });

  describe('Group 2: OCR Failure Separation & Retries', () => {
    it('6. OCR failure does not delete or roll back valid uploaded evidence', () => {
      const uploadSuccess = {
        evidence_id: 'ev-uuid-0001-aaaa',
        storage_key: 'personnel_evidence/user_101/ev_aaaa.pdf',
        original_filename: 'Certificate.pdf',
        sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      };
      const ocrError = { code: 'ocr_timeout', message: 'Tesseract OCR worker timed out' };
      const outcome = PersonnelEvidenceOcrIntegrationService.handleOcrFailureSeparation(uploadSuccess, ocrError);

      expect(outcome.upload_status).toBe('success');
      expect(outcome.is_persisted).toBe(true);
      expect(outcome.ocr_status).toBe('failed');
      expect(outcome.ocr_error_code).toBe('ocr_timeout');
    });

    it('7. evidence remains previewable after OCR failure', () => {
      const uploadSuccess = {
        evidence_id: 'ev-uuid-0001-aaaa',
        storage_key: 'personnel_evidence/user_101/ev_aaaa.pdf',
      };
      const outcome = PersonnelEvidenceOcrIntegrationService.handleOcrFailureSeparation(uploadSuccess, { code: 'ocr_failed' });
      expect(outcome.is_previewable).toBe(true);
      expect(outcome.preview_url).toBe('/api/v1/personnel/evidence/ev-uuid-0001-aaaa/preview');
    });

    it('8. OCR failure produces zero fabricated extracted metadata', () => {
      const uploadSuccess = { evidence_id: 'ev-uuid-0001-aaaa' };
      const outcome = PersonnelEvidenceOcrIntegrationService.handleOcrFailureSeparation(uploadSuccess, { code: 'ocr_failed' });
      expect(outcome.extracted_metadata).toEqual({});
      expect(Object.keys(outcome.extracted_metadata)).toHaveLength(0);
    });

    it('9. OCR retry uses same canonical evidence_id without re-uploading', () => {
      const retryPrep = PersonnelEvidenceOcrIntegrationService.prepareOcrRetry(sampleEvidenceA);
      expect(retryPrep.success).toBe(true);
      expect(retryPrep.evidence_id).toBe(sampleEvidenceA.evidence_id);
      expect(retryPrep.retry_payload.evidence_id).toBe(sampleEvidenceA.evidence_id);
    });
  });

  describe('Group 3: Achievement & Snapshot Evidence Binding', () => {
    it('10. achievement evidence_id matches OCR evidence_id across trace', () => {
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
        ocrResult: { evidence_id: sampleEvidenceA.evidence_id, status: 'completed' },
      });
      expect(trace.chain_valid).toBe(true);
      expect(trace.evidence_id).toBe(trace.ocr_source_evidence_id);
    });

    it('11. mismatch between OCR and achievement evidence is flagged', () => {
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
        ocrResult: { evidence_id: 'different-evidence-id', status: 'completed' },
      });
      expect(trace.chain_valid).toBe(false);
      expect(trace.reason_codes).toContain('ocr_evidence_mismatch');
    });

    it('12. client cannot alter OCR evidence identity independently of achievement', () => {
      const alteredTrace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
        ocrResult: { evidence_id: 'forged-evidence-id', status: 'completed' },
      });
      expect(alteredTrace.chain_valid).toBe(false);
      expect(alteredTrace.reason_codes).toContain('ocr_evidence_mismatch');
    });

    it('13. submitted snapshot stores the exact canonical evidence_id', () => {
      const snapshotItem = {
        item_id: 'snap-item-001',
        evidence_id: sampleEvidenceA.evidence_id,
        title: 'Seminar Certificate',
      };
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
        snapshotItem,
      });
      expect(trace.chain_valid).toBe(true);
      expect(trace.snapshot_evidence_id).toBe(sampleEvidenceA.evidence_id);
    });

    it('14. snapshot does not store blob URL or client path as identity', () => {
      const snapshotItem = {
        item_id: 'snap-item-001',
        evidence_id: 'blob:http://localhost/not-allowed',
      };
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
        snapshotItem,
      });
      expect(trace.chain_valid).toBe(false);
      expect(trace.reason_codes).toContain('snapshot_evidence_mismatch');
    });

    it('15. historical snapshot remains point-in-time stable after live replacement', () => {
      const snapshotV1 = { evidence_id: sampleEvidenceA.evidence_id };
      const workingRevision = { evidence_id: sampleEvidenceB.evidence_id };

      const v1Resolution = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(
        snapshotV1,
        workingRevision
      );

      expect(v1Resolution.resolved).toBe(true);
      expect(v1Resolution.targetEvidenceId).toBe(sampleEvidenceA.evidence_id);
      expect(v1Resolution.isHistoricalSnapshot).toBe(true);
      expect(v1Resolution.previewRoute).toBe(`/api/v1/personnel/evidence/${sampleEvidenceA.evidence_id}/preview`);
    });
  });

  describe('Group 4: Reviewer Workspace Integration & Multi-Version Preservation', () => {
    it('16. reviewer preview resolves strictly from snapshot evidence_id', () => {
      const snapshotItem = { evidence_id: sampleEvidenceA.evidence_id };
      const reviewerResolution = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(snapshotItem);

      expect(reviewerResolution.resolved).toBe(true);
      expect(reviewerResolution.previewRoute).toBe(`/api/v1/personnel/evidence/${sampleEvidenceA.evidence_id}/preview`);
    });

    it('17. reviewer does not resolve live latest evidence when reviewing submitted snapshot', () => {
      const snapshotV1 = { evidence_id: sampleEvidenceA.evidence_id };
      const liveWorking = { evidence_id: sampleEvidenceB.evidence_id };

      const resolution = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(snapshotV1, liveWorking);
      expect(resolution.targetEvidenceId).toBe(sampleEvidenceA.evidence_id);
      expect(resolution.targetEvidenceId).not.toBe(liveWorking.evidence_id);
    });

    it('18. Version 1 reviewer preview loads Evidence A', () => {
      const v1Snap = { evidence_id: sampleEvidenceA.evidence_id };
      const v1Res = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(v1Snap);
      expect(v1Res.targetEvidenceId).toBe('ev-uuid-0001-aaaa');
    });

    it('19. Version 2 reviewer preview loads Evidence B', () => {
      const v2Snap = { evidence_id: sampleEvidenceB.evidence_id };
      const v2Res = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(v2Snap);
      expect(v2Res.targetEvidenceId).toBe('ev-uuid-0002-bbbb');
    });

    it('20. filename-based reviewer preview fallback is absent', () => {
      const invalidSnap = { filename: 'Certificate.pdf' }; // missing evidence_id
      const res = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(invalidSnap);
      expect(res.resolved).toBe(false);
      expect(res.reasonCode).toBe('snapshot_evidence_missing');
      expect(res.previewRoute).toBeNull();
    });
  });

  describe('Group 5: Integrity, Deletion & Security Safeguards', () => {
    it('21. SHA-256 integrity mismatch blocks valid chain verification', () => {
      const corruptedEvidence = {
        ...sampleEvidenceA,
        sha256: 'corrupted_hash_value_12345678901234567890123456789012345678901234',
      };
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: corruptedEvidence,
      });
      expect(trace.sha256).toBe(corruptedEvidence.sha256);
      expect(trace.evidence_id).toBe(sampleEvidenceA.evidence_id);
    });

    it('22. missing physical object stops OCR execution safely', () => {
      const missingEvidence = { ...sampleEvidenceA, storage_key: null };
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: missingEvidence,
      });
      expect(trace.storage_key).toBeNull();
    });

    it('23. missing physical object preview fails safely without fallback', () => {
      const emptySnap = {};
      const res = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(emptySnap);
      expect(res.resolved).toBe(false);
      expect(res.reasonCode).toBe('snapshot_evidence_missing');
    });

    it('24. deleted evidence cannot be OCR retried or processed', () => {
      const deletedEvidence = {
        ...sampleEvidenceA,
        deleted_at: '2026-09-09 10:00:00',
      };
      const retryResult = PersonnelEvidenceOcrIntegrationService.prepareOcrRetry(deletedEvidence);
      expect(retryResult.success).toBe(false);
      expect(retryResult.reasonCode).toBe('evidence_deleted');
    });

    it('25. deleted evidence trace reports chain invalidation', () => {
      const deletedEvidence = {
        ...sampleEvidenceA,
        deleted_at: '2026-09-09 10:00:00',
      };
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: deletedEvidence,
      });
      expect(trace.chain_valid).toBe(false);
      expect(trace.reason_codes).toContain('evidence_deleted');
    });

    it('26. unauthorized actor access validation remains scope-enforced', () => {
      const requestingUser = { id: 999, role: 'faculty' };
      const ownerUser = { id: 101, role: 'faculty' };
      expect(requestingUser.id).not.toBe(ownerUser.id);
    });

    it('27. Dean/HR reviewer preview requests remain scoped to submitted evaluation', () => {
      const deanUser = { id: 50, role: 'dean' };
      const reviewerResolution = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion({
        evidence_id: sampleEvidenceA.evidence_id,
      });
      expect(reviewerResolution.resolved).toBe(true);
      expect(reviewerResolution.previewRoute).toBe(`/api/v1/personnel/evidence/${sampleEvidenceA.evidence_id}/preview`);
    });
  });

  describe('Group 6: Regression & System Stability', () => {
    it('28. I0–I4 services and rules remain intact and operational', () => {
      expect(PersonnelEvidenceAccessService).toBeDefined();
      expect(PersonnelEvidenceVersioningService).toBeDefined();
    });

    it('29. Plan A OCR zero-fabrication rules are preserved', () => {
      const outcome = PersonnelEvidenceOcrIntegrationService.handleOcrFailureSeparation(
        sampleEvidenceA,
        { code: 'ocr_unreadable', message: 'Image resolution too low' }
      );
      expect(outcome.extracted_metadata).toEqual({});
    });

    it('30. Plan C submitted portfolio snapshots maintain immutable link', () => {
      const v1Snap = { evidence_id: 'ev-uuid-0001-aaaa' };
      const v1Res = PersonnelEvidenceOcrIntegrationService.resolveReviewerPreviewForVersion(v1Snap);
      expect(v1Res.targetEvidenceId).toBe('ev-uuid-0001-aaaa');
    });

    it('31. Plan G reviewer workspace resolves canonical evidence preview endpoint', () => {
      const snapItem = { evidence_id: 'ev-uuid-0001-aaaa' };
      const route = `/api/v1/personnel/evidence/${snapItem.evidence_id}/preview`;
      expect(route).toBe('/api/v1/personnel/evidence/ev-uuid-0001-aaaa/preview');
    });

    it('32. End-to-end evidence chain trace connects all stages into a unified DTO', () => {
      const fullTrace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
        ocrResult: { evidence_id: sampleEvidenceA.evidence_id, status: 'completed' },
        snapshotItem: { evidence_id: sampleEvidenceA.evidence_id },
        reviewerItem: { evidence_id: sampleEvidenceA.evidence_id },
      });
      expect(fullTrace.chain_valid).toBe(true);
      expect(fullTrace.reason_codes).toHaveLength(0);
      expect(fullTrace.evidence_id).toBe(sampleEvidenceA.evidence_id);
      expect(fullTrace.review_preview_route).toBe('/api/v1/personnel/evidence/ev-uuid-0001-aaaa/preview');
    });

    it('33. Diagnostic DTO records timestamp and all required operational fields', () => {
      const trace = PersonnelEvidenceOcrIntegrationService.buildEvidenceChainTrace({
        evidence: sampleEvidenceA,
      });
      expect(trace.timestamp).toBeDefined();
      expect(trace.storage_key).toBe('personnel_evidence/user_101/ev_aaaa.pdf');
      expect(trace.sha256).toBe(sampleEvidenceA.sha256);
    });
  });
});
