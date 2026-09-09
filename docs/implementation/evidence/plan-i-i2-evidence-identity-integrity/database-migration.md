# Database Migration Specification (Phase I2)

## 1. Migration File Details
- **Migration**: `2026-09-09-000067_AddEvidenceIdToPersonnelEvaluationItems.php`
- **Target Tables**:
  1. `personnel_evaluation_items`
  2. `personnel_accomplishment_evidence`

## 2. DDL Schema Changes
```sql
-- 1. Add evidence_id foreign key column to evaluation items table
ALTER TABLE personnel_evaluation_items 
ADD COLUMN evidence_id VARCHAR(64) NULL AFTER accomplishment_id;

-- 2. Create index on evidence_id for rapid resolution and relationship joins
CREATE INDEX idx_eval_item_evidence_id ON personnel_evaluation_items (evidence_id);

-- 3. Add SHA-256 index on evidence table for fast duplicate advisory lookups
CREATE INDEX idx_personnel_evidence_sha256 ON personnel_accomplishment_evidence (sha256);
```

## 3. Backward Compatibility & Non-Destructive Design
- The `evidence_id` column is nullable to support criteria/items that legitimately do not require physical proof documents (e.g. evaluator-only ratings or administrative metrics).
- Existing evaluation item records remain valid; legacy records with missing evidence links are marked with `evidence_reference_reconciliation_required` when inspected.
- The `sha256` index is non-unique to allow deliberate and valid reuse of evidence across distinct accomplishments.
