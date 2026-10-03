# AchieveNest — OSAD Award Evaluation & Portfolio Scoring
# Final API Inventory & Endpoint Directory

> **Document:** `osad-award-final-api-inventory.md`  
> **Status:** AUDITED & OPERATIONAL  

---

## 1. REST Endpoint Directory

| HTTP Verb | Path | Purpose | Required Role | Controller Method | Phase |
|---|---|---|---|---|---|
| `GET` | `/api/v1/osad/awards` | Lists active 15 award definitions with criteria and metadata | `osad_admin`, `evaluator` | `AwardEvaluationController::listAwards` | Phase 2 |
| `GET` | `/api/v1/osad/awards/{awardId}/students` | Returns eligible students for evaluation pool | `osad_admin`, `evaluator` | `AwardEvaluationController::studentsForEvaluation` | Phase 4 |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/evidence` | Returns relevant verified evidence mapped to award | `osad_admin`, `evaluator` | `AwardEvaluationController::studentEvidence` | Phase 4 |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/score` | Computes award-specific portfolio raw score and breakdown | `osad_admin`, `evaluator` | `AwardEvaluationController::studentScore` | Phase 5 |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/scoring-basis` | Detailed evidence traceability breakdown per component | `osad_admin`, `evaluator` | `AwardEvaluationController::studentScoringBasis` | Phase 5 |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/review` | Loads two-panel evaluation review workspace data | `osad_admin`, `evaluator` | `AwardEvaluationController::studentReviewWorkspace` | Phase 6 |
| `PATCH` | `/api/v1/osad/awards/{awardId}/students/{studentId}/manual-criteria` | Updates manual panel criteria scores (0 to max) | `osad_admin`, `evaluator` | `AwardEvaluationController::updateManualCriteria` | Phase 6 |
| `POST` | `/api/v1/osad/awards/{awardId}/students/{studentId}/finalize` | Finalizes evaluation transition to `EVALUATED` | `osad_admin`, `evaluator` | `AwardEvaluationController::finalizeEvaluation` | Phase 6 |
| `POST` | `/api/v1/osad/awards/{awardId}/students/{studentId}/recalculate` | Recalculates portfolio score from verified evidence | `osad_admin`, `evaluator` | `AwardEvaluationController::recalculateEvaluation` | Phase 6 |
| `POST` | `/api/v1/osad/awards/{awardId}/students/{studentId}/classify` | Classifies student against 80% candidate threshold | `osad_admin`, `evaluator` | `AwardEvaluationController::classifyPotentialCandidate` | Phase 7 |
| `GET` | `/api/v1/osad/awards/{awardId}/students/{studentId}/candidate-status` | Returns normalized score and candidate status | `osad_admin`, `evaluator` | `AwardEvaluationController::studentCandidateStatus` | Phase 7 |
| `GET` | `/api/v1/osad/awards/{awardId}/potential-candidates` | Lists qualified Potential Candidates in score order | `osad_admin`, `evaluator` | `AwardEvaluationController::listPotentialCandidates` | Phase 7 |
| `GET` | `/api/v1/osad/awards/{awardId}/evaluated-results` | Lists all evaluated students (transparent results) | `osad_admin`, `evaluator` | `AwardEvaluationController::listEvaluatedResults` | Phase 7 |

---

## 2. API Security and Error Contracts
- **Role Gating**: Protected by institutional OSAD bearer authentication tokens.
- **Consistent Response Formats**: Wrapped in standard `{ data: ... }` or `{ error: { code, message, details } }`.
- **Zero Information Leakage**: No database stack traces or raw SQL queries exposed on failure.
