# Phase F4 Checksum & File Manifest

## Implemented / Verified Source Files
- `backend/app/Services/PersonnelEvaluationScoringService.php` — Authoritative backend scoring engine, deterministic rule evaluators, cap enforcement, evaluator judgment constraints, and explainability generator.
- `frontend/src/services/PersonnelEvaluationScoringEngine.js` — Canonical frontend scoring engine mirror.
- `frontend/src/controllers/__tests__/PersonnelEvaluationScoringF4.test.jsx` — 24 focused Phase F4 test specifications covering all scoring calculations, cap hierarchies, forged score rejections, and explainability traces.

## Evidence Package Artifacts
- `docs/implementation/evidence/plan-f-f4-scoring-engine/environment.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/rule-execution-matrix.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/administrators-scoring-verification.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/non-teaching-scoring-verification.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/cap-enforcement-verification.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/evaluator-judgment-verification.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/forged-payload-rejection.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/required-fields-validation.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/evidence-validation.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/explainability-examples.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/historical-rule-version-verification.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/boundary-value-tests.md`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/focused-test-output.txt`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/full-suite-output.txt`
- `docs/implementation/evidence/plan-f-f4-scoring-engine/checksum-manifest.md`
