# Phase F3: Environment & Preconditions Verification

## Execution Context
- **Target Scale**: `NON_TEACHING_PERSONNEL_RANKING_SCALE`
- **Applicable Personnel Classification**:
  - `Non-Teaching Faculty + Non-Academic`
- **Canonical Rule Version**: `NDMU-PERSONNEL-RATING-V2`
- **Canonical Scale Limits**:
  - Overall Maximum: `150.0`
  - Passing Score: `75.0`
  - Area A Maximum (`AREA_A_PERFORMANCE_PERSONAL_INDICATORS`): `90.0` (Evaluation-Only)
  - Area B Allocation (`AREA_B_SERVICE_LEADERSHIP`): `60.0` (Personnel Achievement Area)

## Precondition Health
- **Phase F0**: Completed (Canonical source matrix and configuration frozen).
- **Phase F1**: Completed (Server-authoritative scale assignment and dynamic portfolio binding).
- **Phase F2**: Completed (Administrators Ranking Scale configured and verified).
- **HR Navigation & Health**: All routes reachable and healthy.
- **Test Suite Status**: 127 test files / 943 tests passed (100% passing).
- **Workspace Architecture**: Shared portfolio workspace (`PersonnelPortfolioPage.jsx` / `PersonnelPortfolioEditPage.jsx`) and shared modal (`PersonnelSubmissionModal.jsx`) dynamically configured with 0 duplication.
