# Foreign-Key Integrity & Linkage Guards

## 1. Database-Level Protections
- `personnel_evaluation_items.evidence_id` links directly to `personnel_accomplishment_evidence.evidence_id`.
- Indexed for efficient joins during evaluation compilation and snapshot generation.

## 2. Service-Level Validation Rules
The `PersonnelEvidenceIdentityService` enforces authorization rules above the database constraint:
1. **Ownership Constraint**: The evidence record's `personnel_id` must match the evaluation owner's `personnel_id`.
2. **Lifecycle Constraint**: Evidence in `archived` or `deleted` state cannot be attached to new evaluation items.
3. **Immutability of Historical References**: Modifying a live accomplishment's evidence link does not trigger cascading updates to historical evaluation items.

## 3. Rejection Reasons
- `invalid_evidence_reference`: Referenced evidence does not exist or belongs to another personnel.
- `unauthorized_evidence_linkage`: Attempt to attach another user's evidence.
- `missing_evidence_identity`: Creation attempt lacking valid evidence identifier where required.
