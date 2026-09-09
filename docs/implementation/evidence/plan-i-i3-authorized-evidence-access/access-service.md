# Canonical Evidence Access Service

## 1. Architectural Authority
Evidence authorization and streaming resolution are governed by `PersonnelEvidenceAccessService.php` (Backend) and mirrored in `PersonnelEvidenceAccessService.js` (Frontend).

### Key Responsibilities:
1. `getEvidenceMetadata(string $evidenceId)`: Resolves canonical metadata from database by UUID.
2. `buildAccessDecision(array $actor, string $evidenceId, string $accessType, array $evaluationContext)`: Builds structured, scope-aware authorization decisions.
3. `resolvePhysicalFile(string $storageKey)`: Safe filesystem resolution with directory traversal defenses.
4. `sanitizeHeaderFilename(string $filename)`: Neutralizes CRLF and quotes for safe Content-Disposition headers.
5. `logAccessAudit(...)`: Emits audit logs without exposing secrets, tokens, or local server paths.

## 2. Decision Reason Codes
- `owner_access_allowed`: Valid authenticated owner access.
- `dean_scope_allowed`: Authorized College Dean within assigned academic college.
- `hr_scope_allowed`: Authorized HR administrator/staff within institutional governance.
- `cross_college_access_denied`: Attempted access by a Dean to an evaluation outside assigned college.
- `self_review_access_denied`: Attempted review by candidate Dean over own portfolio.
- `review_assignment_missing`: Dean attempted access on HR-routed evaluation or unassigned scope.
- `evidence_deleted`: Evidence row exists with `deleted`/`purged` lifecycle status.
- `evidence_not_found`: Evidence record does not exist.
- `storage_object_missing`: Database row present but physical file is missing from disk.
- `evidence_access_forbidden`: Default deny for unauthorized actors.
