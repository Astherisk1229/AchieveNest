# Phase F3 Checksum & File Manifest

## Implemented / Modified Source Files
- `frontend/src/models/RankingCriteriaModel.js` — Canonical Non-Teaching criteria constants, Area A weights, Area B sub-ceilings, B.1/B.2/B.4/B.3 calculation helpers, scale area provider `getAreasForScale`, and required proof mapper.
- `backend/app/Services/PortfolioCriterionValidationService.php` — Backend validation service supporting Non-Teaching Area A read-only mutation guard, Non-Teaching Area B scoring rules (B.1-B.5), and cross-scale payload protection.
- `frontend/src/controllers/__tests__/PersonnelNonTeachingScaleF3.test.jsx` — 22 focused Phase F3 test specifications covering Area A evaluation-only restrictions, Area B criteria schedules, boundary tests, wrong-scale rejection, and UI metadata.

## Evidence Artifacts
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/environment.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/non-teaching-area-a-verification.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/non-teaching-area-b-verification.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/area-a-readonly-api-guard.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/dynamic-fields-matrix.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/allowed-values-matrix.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/evidence-requirements.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/server-derived-years-verification.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/b5-judgment-rule-verification.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/wrong-scale-rejection.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/boundary-value-tests.md`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/focused-test-output.txt`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/full-suite-output.txt`
- `docs/implementation/evidence/plan-f-f3-non-teaching-scale/checksum-manifest.md`
