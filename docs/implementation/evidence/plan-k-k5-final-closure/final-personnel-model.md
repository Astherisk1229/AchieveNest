# Final Personnel Classification Model Summary

### Canonical Active Model
- **Personnel Groups**: `faculty`, `non_teaching_faculty`
- **Organizational Side**: `academic`, `non_academic`

### Valid Combinations (3 Canonical Codes)
1. `FACULTY_ACADEMIC` $\rightarrow$ Faculty (Academic)
2. `NON_TEACHING_FACULTY_ACADEMIC` $\rightarrow$ Non-Teaching Faculty (Academic)
3. `NON_TEACHING_FACULTY_NON_ACADEMIC` $\rightarrow$ Non-Teaching Faculty (Non-Academic)

### Strictly Unsupported Combinations
- `Faculty + Non-Academic` (Rejected on write with 422)

### Legacy Migration Model
- `non_teaching_personnel` is retired from active selection. It reconciles to `non_teaching_faculty` ONLY when backed by authoritative institutional placement evidence. Ambiguous records remain explicitly **UNRESOLVED**.
