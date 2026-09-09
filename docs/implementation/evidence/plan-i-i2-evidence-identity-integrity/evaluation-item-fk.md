# Explicit Evaluation-Item Evidence Foreign Key (RISK-I0-03 Closure)

## 1. Problem Addressed (RISK-I0-03)
Prior to Phase I2, evaluation items in some paths referenced evidence indirectly via filenames, achievement live references, or temporary URLs. This introduced the risk that live achievement edits or file movements could break or mutate historical evaluation items.

## 2. Technical Implementation
In Phase I2, `personnel_evaluation_items` explicitly stores `evidence_id` as a foreign key:
```php
$itemData = [
    'evaluation_id'    => $evaluationId,
    'accomplishment_id'=> $entry['accomplishment_id'] ?? null,
    'evidence_id'      => $evidenceId, // Explicit canonical UUID reference
    'category_code'    => $entry['category_code'] ?? 'GENERAL',
    'criterion_code'   => $entry['criterion_code'] ?? 'GENERAL',
    'claimed_points'   => $entry['points_claimed'] ?? $entry['claimed_points'] ?? 0.0,
    'accepted_points'  => 0.0,
    'status'           => 'pending',
    'created_at'       => date('Y-m-d H:i:s'),
];
```

## 3. Linkage Rules & Validation Guards
1. **Ownership Enforcement**: The `evidence_id` referenced by an evaluation item must belong to the same personnel being evaluated. Cross-owner evidence attachments are rejected with `invalid_evidence_reference`.
2. **Existence Verification**: The referenced evidence must exist in `personnel_accomplishment_evidence`. If nonexistent, creation fails with `invalid_evidence_reference`.
3. **No Filename Reliance**: Evaluation items cannot accept filenames or temporary URLs as evidence identity.
