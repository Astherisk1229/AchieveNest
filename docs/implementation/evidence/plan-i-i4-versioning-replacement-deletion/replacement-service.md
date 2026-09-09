# Evidence Versioning & Replacement Service

## 1. Architectural Role
The versioning and replacement pipeline is managed by `PersonnelEvidenceVersioningService.php` (Backend) and mirrored in `PersonnelEvidenceVersioningService.js` (Frontend).

### Primary Responsibilities:
1. `canReplaceEvidence(...)`: Enforces lifecycle editability checks and ownership boundaries.
2. `replaceWorkingEvidence(...)`: Coordinates secure upload of replacement file, mints new `evidence_id`, and updates live accomplishment pointer while preserving historical references.
3. `purgeOwnerEvidence(...)`: Executes complete deletion by unlinking all physical files and cleaning DB records.
4. `cleanupPhysicalFile(...)`: Safely unlinks a specific physical file on disk with directory traversal validation.
5. `scanForOrphans(...)`: Diagnostics scanner for unreferenced files or broken database keys.
