# Schema & Migration Summary for Personnel Evaluation Track

| Migration File | Table(s) Created / Modified | Core Purpose | Owning Plan |
|---|---|---|---|
| `2026-09-08-000057_AddPersonnelPortfolioMultiVersionSupport.php` | `personnel_portfolio_submissions` | Multi-version portfolio submissions & lineage | Plan C / I |
| `2026-09-08-000058_AddPersonnelEvaluationOnePerCycleConstraints.php` | `personnel_evaluations` | 1 evaluation per cycle constraint | Plan C / D |
| `2026-09-08-000059_CreatePersonnelEvaluationRootsAndLineage.php` | `personnel_evaluations`, `personnel_evaluation_items` | Evaluation roots and item scoring lineage | Plan F / G |
| `2026-09-08-000060_AddPersonnelGroupAndOrganizationalSide.php` | `personnel_profiles` | Personnel Group & Organizational Side columns | Plan D |
| `2026-09-08-000061_AddEvaluationScaleCodeToEvaluations.php` | `personnel_evaluations` | Server-assigned evaluation scale code | Plan F |
| `2026-09-08-000062_CreatePersonnelEvaluationAudits.php` | `personnel_evaluation_audits` | Append-only audit trail table | Plan J |
| `2026-09-08-000063_CreatePersonnelWorkflowNotifications.php` | `personnel_workflow_notifications` | Persisted workflow notification table | Plan J |
| `2026-09-08-000064_AddPromotionDecisionToEvaluations.php` | `personnel_evaluations` | HR promotion decision columns | Plan H |
| `2026-09-08-000065_SeedFacultyRankCatalog.php` | `faculty_ranks`, `faculty_rank_transitions` | 26 canonical Full-Time ranks & transitions | Plan E |
| `2026-09-08-000066_SeedPartTimeFacultyTitles.php` | `part_time_faculty_titles` | 4 canonical Part-Time titles | Plan E |
| `2026-09-09-000067_AddEvidenceIdToPersonnelEvaluationItems.php` | `personnel_evaluation_items` | Multi-version evidence ID linkage | Plan I |
