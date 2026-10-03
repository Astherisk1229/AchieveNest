# Plan A Upload Path Trace

## Complete End-to-End Trace
1. **User Interaction**: User opens `PersonnelSubmissionModal.jsx` / `PersonnelAchievementsPage.jsx` and selects a proof file.
2. **Frontend Security Check**:
   - `SecurityController.validateFileUpload(file)` validates:
     - File size <= 10MB (`SecurityController.MAX_FILE_SIZE_BYTES`).
     - Allowed MIME types (`application/pdf`, `image/jpeg`, `image/png`).
     - Magic Byte signature verification (%PDF, .PNG, JPEG).
3. **Optional OCR Pre-Extraction**:
   - `OcrScanController.processDocumentScan(file)` extracts text and suggests category/fields with zero-fabrication constraints.
4. **Accomplishment Creation**:
   - `personnelAccomplishmentService.createAccomplishment` posts accomplishment record metadata.
5. **Evidence Upload**:
   - `personnelAccomplishmentService.uploadEvidence(accomplishmentId, file)` posts multipart file to `/api/v1/personnel/accomplishments/{id}/evidence`.
6. **Backend Processing**:
   - `PersonnelAccomplishmentController::addEvidence` receives uploaded file.
   - `LocalEvidenceStorageService::validateFile` validates size, extension, server-side MIME type via `finfo_file`.
   - `LocalEvidenceStorageService::storeFile` saves file to `writable/uploads/evidence/personnel/{ownerUuid}/{accomplishmentId}/{fileUuid}.ext`.
   - Computes SHA256 checksum and detected MIME type.
   - Inserts record into `personnel_accomplishment_evidence` within a DB transaction.
   - If DB insert fails, the stored physical file is immediately unlinked.
7. **Read Model Reload**:
   - Accomplishment list updates and displays uploaded proof with download stream link.
