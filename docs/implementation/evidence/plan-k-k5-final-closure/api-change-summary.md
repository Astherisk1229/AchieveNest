# Canonical Personnel Evaluation API Route Map

| HTTP Method | Route Path | Controller | Core Purpose | Owning Plan |
|---|---|---|---|---|
| GET | `/api/faculty-ranks` | `FacultyRankCatalogController` | List 26 canonical Full-Time ranks | Plan E |
| GET | `/api/part-time-faculty-titles` | `PartTimeFacultyTitleController` | List 4 canonical Part-Time titles | Plan E |
| POST | `/api/hr/recommend-rank` | `FacultyInitialRankController` | Resolve preferred rank recommendation | Plan D2 / E |
| GET | `/api/target/hr-personnel` | `TargetHRPersonnelController` | List personnel with master data & placement | Plan D / D2 |
| POST | `/api/target/provisioning/personnel` | `TargetProvisioningController` | Onboard personnel with master data validation | Plan D / D2 |
| POST | `/api/personnel/portfolio/submit` | `PersonnelPortfolioSubmissionController` | Submit whole-portfolio version | Plan C |
| POST | `/api/personnel/evaluations/score` | `PersonnelEvaluationScoringController` | Record evaluator item scores | Plan F / G |
| POST | `/api/personnel/evaluations/request-revision` | `PersonnelRevisionRequestController` | Return portfolio for revision | Plan J / C |
| POST | `/api/personnel/evaluations/finalize` | `HREvaluationController` | Finalize evaluation & lock record | Plan H |
| GET | `/api/personnel/evaluations/print/:id` | `PersonnelEvaluationPrintController` | Generate deliberation print summary | Plan H |
| POST | `/api/personnel/evaluations/promotion-decision` | `PersonnelPromotionDecisionController` | Record HR promotion decision | Plan H |
| POST | `/api/personnel/evidence/upload` | `PersonnelEvidenceUploadController` | Secure evidence upload | Plan A / I |
| GET | `/api/personnel/notifications` | `PersonnelNotificationController` | Fetch persisted notifications | Plan J |
| GET | `/api/personnel/audit-trail` | `PersonnelEvaluationAuditController` | Fetch immutable audit timeline | Plan J |
| POST | `/api/personnel/owner-delete` | `PersonnelAccountLifecycleController` | Execute owner-authorized deletion | Plan K / I |
