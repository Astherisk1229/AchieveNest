# Evidence Mapping — Plan K Phase K0

Every requirement and matrix item maps to verifiable automated tests and persistent evidence:

| Acceptance Matrix ID | Primary Verification Test | Persisted Entities Checked | Evidence File |
|---|---|---|---|
| `K0-A01` | `PersonnelPlanAEndToEndA5.test.js` | `achievements` | `acceptance-matrix.md` |
| `K0-B01` | `PersonnelPlanBEndToEndB4.test.js` | `portfolio_snapshots` | `acceptance-matrix.md` |
| `K0-C01` $\dots$ `K0-C02` | `PersonnelPortfolioSubmissionC1.test.js`, `PersonnelPortfolioResubmissionC4.test.js` | `portfolio_versions`, `submissions` | `version-revision-cases.md` |
| `K0-D01` $\dots$ `K0-D05` | `PersonnelClassificationD1.test.js`, `PersonnelEvaluationEligibilityD3.test.js` | `personnel_profiles`, `profiles` | `personnel-model-freeze.md`, `eligibility-freeze.md` |
| `K0-D2-01` $\dots$ `K0-D2-09` | `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` | `personnel_college_affiliations`, `personnel_administrative_unit_affiliations` | `rank-case-freeze.md`, `acceptance-matrix.md` |
| `K0-E01` $\dots$ `K0-E02` | `FacultyRankProgressionE2.test.js` | `personnel_profiles`, `faculty_rank_history` | `rank-case-freeze.md` |
| `K0-F01` $\dots$ `K0-F04` | `PersonnelEvaluationScoringF4.test.jsx`, `PersonnelEvaluationResultF5.test.jsx` | `personnel_evaluations`, `evaluation_scores` | `scoring-case-freeze.md` |
| `K0-G01` $\dots$ `K0-G04` | `PersonnelReviewerRoutingG0.test.jsx`, `PersonnelReviewerAssignmentG1.test.jsx` | `reviewer_assignments` | `routing-matrix-freeze.md` |
| `K0-H01` $\dots$ `K0-H03` | `PersonnelEvaluationPrintH2.test.jsx`, `PersonnelPromotionDecisionH3.test.jsx` | `personnel_promotion_decisions` | `final-outcome-freeze.md` |
| `K0-I01` | `PersonnelAuthorizedEvidenceAccessI3.test.jsx` | `evidence_files` | `security-negative-cases.md` |
| `K0-J01` $\dots$ `K0-J04` | `PersonnelWorkflowStatusSyncJ4.test.jsx`, `PersonnelEvaluationAuditJ5.test.jsx` | `notifications`, `account_lifecycle_events` | `acceptance-matrix.md` |
| `K0-M01` | `PersonnelPlanKPhaseK0Audit.test.jsx` | `personnel_profiles` | `migration-cases.md` |
