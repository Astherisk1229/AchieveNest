# Phase J2 Evidence: Multi-Cycle Revision Support

## Multi-Cycle Chain (V1 -> Rev1 -> V2 -> Rev2 -> V3)
1. **Cycle 1**:
   - V1 submitted -> Dean returns with Rev1 (`version_number: 1`, `status: 'open'`).
   - Personnel resubmits as V2 -> Rev1 becomes `resolved` with `resolved_by_version_number: 2`.
2. **Cycle 2**:
   - Dean reviews V2 -> returns with Rev2 (`version_number: 2`, `status: 'open'`).
   - Personnel resubmits as V3 -> Rev2 becomes `resolved` with `resolved_by_version_number: 3`.
3. **Preservation**:
   - Both Rev1 and Rev2 remain distinctly queryable in audit history. Rev1 is never overwritten by Rev2.
