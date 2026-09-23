# Plan E Phase E2 — Confirmed PhD Exception Verification

## 1. Exception Specification

- **Source Reference**: `NDMU-DOC-ACAD-RANKS-2026-V1/PHD-EXCEPTION-AP1-P1`
- **From Rank**: `ASSISTANT_PROFESSOR_I` (Assistant Professor I)
- **To Rank**: `PROFESSOR_I` (Professor I)
- **Required Qualification Context**: Verified Doctor of Philosophy (`Ph.D.`) or Doctor of Education (`Ed.D.`) (`has_verified_phd = true`).

---

## 2. Test & Verification Results

1. **Context Flag Present & True (`has_verified_phd: true`)**:
   - `getAllowedTransitions('ASSISTANT_PROFESSOR_I', { has_verified_phd: true })` returns both:
     - `normal_next_rank`: `ASSISTANT_PROFESSOR_II` (Normal sequential)
     - `allowed_exception_transitions`: `[PROFESSOR_I]` (PhD Exception)
   - `validateTransition('ASSISTANT_PROFESSOR_I', 'PROFESSOR_I', { has_verified_phd: true })` returns `allowed: true`.
2. **Context Flag Absent / False (`has_verified_phd: false`)**:
   - `getAllowedTransitions('ASSISTANT_PROFESSOR_I', { has_verified_phd: false })` returns only `normal_next_rank` (`ASSISTANT_PROFESSOR_II`).
   - `validateTransition('ASSISTANT_PROFESSOR_I', 'PROFESSOR_I', { has_verified_phd: false })` returns `allowed: false` with reason code `qualification_exception_not_satisfied`.
