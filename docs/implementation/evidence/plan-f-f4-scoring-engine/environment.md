# Phase F4: Environment & Preconditions Verification

## Execution Context
- **Canonical Rule Version**: `NDMU-PERSONNEL-RATING-V2`
- **Supported Evaluation Scales**:
  1. `ADMINISTRATORS_RANKING_SCALE` (Max: 160.0, Passing: 120.0, Area A: 70.0, Area B: 50.0, Area C: 40.0)
  2. `NON_TEACHING_PERSONNEL_RANKING_SCALE` (Max: 150.0, Passing: 75.0, Area A: 90.0 eval-only, Area B: 60.0 allocation)
- **Scoring Engine**: `PersonnelEvaluationScoringService.php` (Backend Authority) & `PersonnelEvaluationScoringEngine.js` (Frontend Mirror)
- **Precondition Status**:
  - Phases F0, F1, F2, F3: Complete.
  - Test Suite Baseline: 128 test files / 967 tests passed / 0 failures (100% pass rate).
