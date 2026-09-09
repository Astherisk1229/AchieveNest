# Current Storage Provider Audit

## Identified Storage Provider
- **Provider / Platform**: Local Protected Filesystem Storage managed via backend service `App\Services\LocalEvidenceStorageService`.
- **Storage Root**: `WRITEPATH . 'uploads/evidence/'` (`backend/writable/uploads/evidence/`).
- **Container Structure**:
  - `student/`: Stored proof documents for OSAD student awards.
  - `personnel/`: Stored proof documents for faculty/personnel ranking and accomplishments.
  - `quarantine/`: Staged partition for suspicious/unverified files.
  - `tmp/`: Temporary processing area.
- **Key / Path Naming Convention**:
  - Format: `{domain}/{ownerUuid}/{recordUuid}/{fileUuid}.{extension}`
  - Example: `personnel/6f70932c-3932-4467-96a8-202a0a2dfca1/acc-8910/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf`
- **Upload Mechanism**: Multipart HTTP POST (`POST /api/v1/personnel/accomplishments/{id}/evidence`) handled by `PersonnelAccomplishmentController::addEvidence`.
- **Retrieval Mechanism**: Authenticated streaming endpoint (`GET /api/v1/evidence/personnel/{id}/download`) handled by `EvidenceController::personnelDownload`.
- **Deletion Mechanism**: `LocalEvidenceStorageService::deletePhysicalFile` called during accomplishment deletion.
