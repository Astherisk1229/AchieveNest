# Snapshot Evidence Linkage & Plan C Integration

## 1. Architectural Role in Portfolio Snapshots
When Plan C creates an authoritative submission snapshot (`v1`, `v2`, etc.), each snapshot item embeds the exact `evidence_id` along with immutable metadata:
- `evidence_id`
- `original_filename`
- `mime_type`
- `size_bytes`
- `sha256`
- `storage_key`

## 2. Server-Derived Derivation
During submission (`PersonnelPortfolioSubmissionController::submit()` and `resubmit()`), snapshot evidence references are strictly derived server-side from persisted database records:
```php
// Server fetches authoritative evidence from DB
$evidence = $evidenceIdentityService->getEvidenceByAccomplishmentId($accomplishmentId);
$evidenceId = $evidence['evidence_id'] ?? null;
```
Client payloads containing arbitrary `evidence_id` or storage keys cannot bypass server-side ownership and accomplishment linkage.

## 3. Disallowed Snapshot Content
The snapshot serializer strictly excludes:
- Browser object/blob URLs (`blob:http://...`)
- Expiring pre-signed URLs
- Local absolute filesystem paths (`C:\wamp64\...` or `/var/www/...`)
