# Legacy Classification Current State Audit

### Prior Blocker
In earlier implementations, `validatePair()` in `PersonnelClassificationService.php` automatically normalized `non_teaching_personnel` into `non_teaching_faculty` during regular active validation without checking placement evidence, and `resolveFromRecord()` fell back to `non_teaching_faculty` + `non_academic` by default.

### Remediation Applied
- Active `validatePair()` strictly accepts only canonical two-group values (`faculty`, `non_teaching_faculty`). Active input using `non_teaching_personnel` is rejected with `422 INVALID_PERSONNEL_CLASSIFICATION`.
- `resolveLegacyPlacement()` was created to reconcile legacy records strictly via authoritative institutional assignment evidence:
  - Confirmed College assignment $\rightarrow$ Non-Teaching Faculty + Academic (`LEGACY_MAPPING_SUPPORTED_BY_COLLEGE`).
  - Confirmed Administrative Unit assignment $\rightarrow$ Non-Teaching Faculty + Non-Academic (`LEGACY_MAPPING_SUPPORTED_BY_ADMIN_UNIT`).
  - Missing placement $\rightarrow$ Strictly **UNRESOLVED** (`LEGACY_MAPPING_AMBIGUOUS_NO_PLACEMENT`).
  - Conflicting placement $\rightarrow$ Strictly **UNRESOLVED** (`LEGACY_MAPPING_CONFLICTING_PLACEMENT`).
