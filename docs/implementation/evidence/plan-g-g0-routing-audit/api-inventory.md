# Personnel Evaluation Track — Plan G — Phase G0: API Inventory

## Evaluator Workflow Endpoints Inventory

| HTTP Method | Route Endpoint | Controller Action | Role Authorization | Purpose / Lifecycle Step |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/hr/evaluations` | `HREvaluationController::list` | `dean`, `hr_staff`, `hr_admin` | Lists submissions filtered by reviewer scope |
| `GET` | `/hr/evaluations/(:segment)` | `HREvaluationController::get` | Assigned Evaluator / HR | Fetches complete submission snapshot with items |
| `POST` | `/hr/evaluations/(:segment)/start` | `HREvaluationController::start` | Assigned Evaluator | Transitions evaluation from `submitted` to `in_evaluation` |
| `PATCH` | `/hr/evaluations/(:segment)/items/(:segment)/verify` | `HREvaluationController::verifyItem` | Assigned Evaluator | Records item verification status (`verified`, `ineligible`, `needs_revision`) |
| `PATCH` | `/hr/evaluations/(:segment)/items/(:segment)/rate` | `HREvaluationController::rateItem` | Assigned Evaluator | Records official accepted score and evaluator remarks |
| `POST` | `/hr/evaluations/(:segment)/ready` | `HREvaluationController::markReady` | Assigned Evaluator | Transitions from `in_evaluation` to `ready_for_finalization` |
| `POST` | `/hr/evaluations/(:segment)/return` | `HREvaluationController::returnEvaluation` | Assigned Evaluator | Returns evaluation to candidate with deficiency notes |
| `POST` | `/hr/evaluations/(:segment)/finalize` | `HREvaluationController::finalizeEvaluation` | Assigned Evaluator | Formally finalizes evaluation with immutable snapshot lock |
| `GET` | `/hr/evaluations/(:segment)/report` | `HREvaluationController::getReport` | Assigned Evaluator / HR / Candidate | Exports evaluation rating summary report |
