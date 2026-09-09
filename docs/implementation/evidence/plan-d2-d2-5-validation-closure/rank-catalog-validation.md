# Full-Time Rank Catalog Validation

## Verification Summary

1. **Authoritative Source**: The Full-Time Academic Rank dropdown integrates directly with `GET /api/v1/faculty-ranks` and the frozen Plan E catalog (`facultyRankCatalogService.FULL_TIME_RANKS`).
2. **Catalog Integrity**: Contains strictly the 26 canonical Plan E ranks across Doctoral, Master's, Board Licensure, and Baccalaureate tiers.
3. **No Free-Text**: The UI renders a structured single-select `<select>` control backed by canonical rank codes (e.g. `PROFESSOR_III`, `ASSOCIATE_PROFESSOR_II`, `ASSISTANT_PROFESSOR_I`, `INSTRUCTOR_I`).
4. **Part-Time Exclusion**: No Part-Time faculty titles (e.g., `Lecturer`, `Senior Lecturer`, `Professorial Lecturer`) appear in the Full-Time dropdown.
5. **Persistence**: The canonical rank code and display name are persisted to `personnel_profiles.current_rank_title` and `personnel_profiles.rank_level`.
6. **Server-Side Rejection**: Non-catalog ranks submitted to the provisioning or master-data endpoint return HTTP 422.

## Test Proof
- `PersonnelMasterDataDropdownsD2Phase1.test.jsx` (Tests 1–4) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 1) — PASSED
