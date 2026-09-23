# Submitted Snapshot Immutability Guard

## 1. Historical Reference Protection
- When Plan C creates an authoritative submission snapshot (e.g. Version 1), all evaluation item rows freeze their respective `evidence_id` foreign keys.
- Working draft modifications never alter historical `personnel_evaluation_items.evidence_id` foreign keys or serialized snapshot payload JSONs.

## 2. Test Verification
- Test 2.1: `preserves Version 1 evidence_id when working draft replaces evidence for Version 2` (PASSED).
