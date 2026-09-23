# Parent Plan K Definition of Done Matrix

| Requirement | Evidence Source | Status |
|---|---|---|
| Final two-group model passes end-to-end | `PersonnelClassificationService.php`, `PersonnelPlanKPhaseK4Remediation.test.jsx` | **PASS** — Canonical 2-group model validated |
| Academic / Non-Academic reviewer routing correct | `PersonnelReviewerRoutingRegistry.js`, `PersonnelPlanKPhaseK2Journeys.test.jsx` | **PASS** — Deans & HR routing verified |
| Full-Time / Part-Time eligibility correct | `FacultyStatusService.php`, `PersonnelEvaluationEligibilityD3.test.js` | **PASS** — Part-Time rank exclusion verified |
| Plan E seed & rank rules pass (26 FT ranks, 4 PT titles) | `facultyRankCatalogService.js`, `partTimeFacultyTitleService.js`, `PersonnelPlanKPhaseK3RankAndSeed.test.jsx` | **PASS** — Exact 26 ranks & 4 titles verified |
| Plan F scoring and Passed / Retained pass | `EvaluationInstrumentRegistry.php`, `PersonnelEvaluationResultF5.test.jsx` | **PASS** — Passed ≠ Promoted rule enforced |
| Plan H deliberation & promotion separation passes | `PersonnelPromotionDecisionService.php`, `PersonnelPlanHEndToEndH4.test.jsx` | **PASS** — Approved / Not Approved separation verified |
| Security and migration negative tests pass | `PersonnelPlanKPhaseK4SecurityMigrationRegression.test.jsx`, `VerifyPlanKPhaseK4Remediation.php` | **PASS** — Authorization boundaries verified |
| Plan A regression-free (61 tests passed) | `plan-a-regression.md`, `PersonnelPlanAEndToEndA5.test.js` | **PASS** — Full regression suite passing |
| Plan K contains zero new business rules | Complete validation-only diff audit | **PASS** — Implementation complete; 5 governance policy boundaries remain explicitly unresolved |
