# Legacy Evidence & Backfill Strategy

## 1. Categorization of Legacy Records
Legacy evidence records are partitioned into clear integrity states:
1. **Certified Active**: Valid `evidence_id`, valid physical file, matching SHA-256 hash.
2. **Missing SHA-256**: Valid `evidence_id` and physical file, but hash column is empty. Computed safely during authorized background maintenance.
3. **Missing Physical Object**: `evidence_id` exists in database, but physical file is missing from protected storage. Flagged as `evidence_reference_reconciliation_required`.
4. **Ambiguous Linkage / Filename Only**: Historical records referencing only a filename without unambiguous UUID or accomplishment link. Flagged as `evidence_reference_reconciliation_required`.

## 2. Safe Backfill Invariants
- Backfills only execute when an unambiguous, authoritative relation exists (e.g. valid `accomplishment_id` mapping to a unique `evidence_id`).
- Backfills **never** guess links based on filename equality, title similarity, or date proximity.
- Unmatched or ambiguous records remain explicitly unresolved with status `evidence_reference_reconciliation_required`.
