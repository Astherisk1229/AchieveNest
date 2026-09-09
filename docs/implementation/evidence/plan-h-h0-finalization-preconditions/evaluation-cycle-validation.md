# Evaluation Cycle Validation Verification

## Single Valid Personnel / Evaluation Cycle Invariants

1. **Cycle Verification**:
   - Evaluation cycle (`academic_year`) must be present and formatted correctly (e.g., `2025-2026`).
   - Missing cycle triggers `evaluation_cycle_missing`.
   - Malformed cycle triggers `evaluation_cycle_invalid`.
2. **Duplicate Active Record Prevention**:
   - Multiple active evaluation records for the same employee in the same cycle are prohibited.
   - Detected duplicates trigger `duplicate_cycle_evaluation`.
