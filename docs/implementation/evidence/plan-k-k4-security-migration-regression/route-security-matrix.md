# Route Security Matrix

| Endpoint class | Route/controller | Server guard | K4 result |
|---|---|---|---|
| Portfolio mutation/purge | `PersonnelPortfolioSubmissionController` | owner/HR plus authorization reference | synthetic/source pass; live blocked |
| Evaluation score/revision/finalize | `HREvaluationController` | authenticated actor, reviewer/HR scope, transition validation | source/service pass; live blocked |
| Evidence | `EvidenceController` | `PersonnelEvidenceAccessService` | synthetic pass; live blocked |
| Rank/promotion | rank and evaluation controllers | HR/reviewer and transition services | synthetic/source pass |
| Audit | `HRPersonnelController::audit` | HR guard | source pass; live blocked |
| Notifications | Plan J service/API path | recipient/context filtering | regression pass; live K4 negative blocked |
