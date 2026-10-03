# Personnel Evaluation Database Map

| Domain | Physical table(s) on current HEAD | Create migration | Later schema migrations | Runtime owner / endpoint |
|---|---|---|---|---|
| Identity | `profiles` | 000001 | 000002–000004, 000053, 000055, 000060–000061 | `TargetHRPersonnelController`; GET/PUT `/api/v1/hr/personnel/(:segment)/master-data` |
| Personnel profile | `personnel_profiles` | 000015 | 000060, 000061 | `FacultyStatusService`, `PersonnelClassificationService`; same master-data routes |
| Colleges | `colleges` | 000001 | 000014, 000029 | `CollegeService`; GET `/api/v1/osad/colleges` |
| Administrative units | `administrative_units` | 000014 | 000024 embeds permanent reference data | `TargetHRPersonnelController`, `TargetProvisioningController` |
| Full/part-time ranks | `faculty_rank_catalog` | 000064 | 000066 inserts part-time rows | `FacultyRankCatalogService`, `PartTimeFacultyTitleService`; GET `/api/v1/faculty-ranks`, GET `/api/v1/faculty-titles/part-time` |
| Rank transitions | `faculty_rank_transitions` | 000065 | None found | `FacultyRankProgressionService` |
| Qualifications | `personnel_qualifications` | 000061 | None found | `FacultyInitialRankService`; POST `/api/v1/faculty-ranks/resolve-initial` |
| Annual review | `personnel_annual_reviews` | 000062 | None found | `DeanAnnualReviewService`; GET/POST `/api/v1/dean/annual-reviews` |
| Evaluation instruments | `evaluation_scales`, `evaluation_scale_versions`, `evaluation_scale_areas`, `evaluation_scale_categories`, `evaluation_scale_subcategories`, `evaluation_scale_criteria`, `evaluation_scale_change_events` | 000063 | None found | `EvaluationScaleResolver`; GET `/api/v1/personnel/evaluation-scale` |
| Portfolio/accomplishments | `personnel_accomplishments`, `personnel_accomplishment_evidence` | 000008 | 000012, 000013 | submission controller; POST `/api/v1/personnel/portfolio/submit` |
| Evaluation lineage | `personnel_evaluation_roots` | 000059 | None found | `HREvaluationService` and workflow services |
| Evaluation lifecycle | `personnel_evaluations`, `personnel_evaluation_items` | 000005 | 000010–000013, 000019, 000057–000059, 000067 | `HREvaluationController`; POST `/api/v1/hr/evaluations/(:segment)/start`, POST `/api/v1/hr/evaluations/(:segment)/finalize` |
| Audit | `personnel_evaluation_events`, `audit_logs` | 000005, 000018 | 000010–000012 affect evaluation audit/index behavior | `PersonnelEvaluationAuditService`; GET `/api/v1/hr/audit` is implemented by `HRPersonnelController::audit` |
| Notifications | `notifications` | 000018 | None found | `PersonnelWorkflowNotificationService`; no dedicated public workflow-notification route |

## Corrected non-table labels

The former names `part_time_faculty_titles`, `personnel_portfolio_submissions`, `personnel_evidence_records`, `personnel_evaluation_audits`, and `personnel_workflow_notifications` do not appear in migration or runtime source as physical tables. They are documentation concepts mapped above to current physical storage. This is a proven correction, not a schema proposal.

Migration 000024, 000063, 000064, and 000066 are migrations with embedded reference-data inserts. They are not CodeIgniter Seeder classes.

## Documentation Reconciliation

Reconciled against repository HEAD: `e8004d9fbe979a14f4e1a408ffd37458173e4e18`

Reconciliation date: `2026-09-09`

Source of truth: Actual repository contents and active runtime configuration.
