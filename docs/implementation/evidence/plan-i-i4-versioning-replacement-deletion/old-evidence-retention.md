# Old Evidence Retention Rules

## 1. Retention Invariant
Replacing an attached evidence file on an active draft does **not** trigger physical file deletion or metadata purging of the older file if:
1. It is referenced by any historical submitted snapshot (`personnel_evaluation_items.evidence_id`).
2. It remains part of the institutional audit trail for multi-version deliberation.

The old evidence is retained indefinitely until the confirmed **Owner-Authorized Complete Deletion** workflow is explicitly initiated.
