# Stable Identity Validation

## Verification Summary

1. **Foreign Key Integrity**:
   - Institutional College: `college_id` UUID stored in `personnel_college_affiliations` referencing `colleges.id`.
   - Academic Programs: `academic_program_id` UUIDs stored in `personnel_academic_program_affiliations`.
   - Administrative Unit / Department: `administrative_unit_id` UUID stored in `personnel_administrative_unit_affiliations` referencing `administrative_units.id`.
2. **Canonical Codes**:
   - Full-Time Academic Ranks: Persisted with canonical uppercase codes (e.g. `PROFESSOR_I`, `INSTRUCTOR_I`).
   - Part-Time Faculty Titles: Persisted with canonical uppercase codes (e.g. `PT_PROFESSORIAL_LECTURER`).
3. **No Display Label Primary Identity**: Labels are derived projection properties; backend relations and integrity rely strictly on stable UUIDs and canonical codes.

## Test Proof
- `PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx` (Tests 30–35) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Tests 1–9) — PASSED
