# Part-Time Title Catalog Validation

## Verification Summary

1. **Authoritative Source**: The Part-Time title dropdown integrates directly with `GET /api/v1/faculty-titles/part-time` and the frozen Plan E catalog (`partTimeFacultyTitleService.PART_TIME_TITLES`).
2. **Catalog Integrity**: Contains strictly the 4 canonical Plan E Part-Time titles:
   - `PT_PROFESSORIAL_LECTURER` ("Professorial Lecturer" — Doctoral tier)
   - `PT_ASSISTANT_PROFESSORIAL_LECTURER` ("Assistant Professorial Lecturer" — Master's tier)
   - `PT_SENIOR_LECTURER` ("Senior Lecturer" — Board Licensure tier)
   - `PT_LECTURER` ("Lecturer" — Baccalaureate tier)
3. **Full-Time Exclusion**: No Full-Time ranks appear in the Part-Time dropdown.
4. **Non-Progression Isolation**: Part-Time titles carry qualification-driven initial mapping without entering sequential evaluation rank progression.
5. **Server-Side Rejection**: Non-catalog titles submitted for part-time personnel are rejected server-side.

## Test Proof
- `PersonnelMasterDataDropdownsD2Phase1.test.jsx` (Tests 5–8) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 2) — PASSED
