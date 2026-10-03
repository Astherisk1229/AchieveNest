# Faculty Status & Employment Status Separation Validation

## Verification Summary

1. **Clear Field Separation**:
   - **Faculty Engagement / Faculty Status**:
     - `Full-time Faculty` (`full_time_faculty`)
     - `Part-time Faculty` (`part_time_faculty`)
   - **Employment Status**:
     - `Permanent` (`permanent`)
     - `Probationary` (`probationary`)
2. **Independent Mutability**:
   - Changing Employment Status between `probationary` and `permanent` does NOT alter, reset, or mutate the faculty member's current academic rank or part-time title.
3. **Dedicated Schema Fields**:
   - Persisted separately to `personnel_profiles.faculty_engagement` and `personnel_profiles.employment_status`.

## Test Proof
- `PersonnelPlanD2Phase0Audit.test.jsx` (Tests 1–12) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 19) — PASSED
