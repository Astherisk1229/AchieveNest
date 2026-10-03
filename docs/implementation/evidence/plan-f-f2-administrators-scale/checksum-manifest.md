# Phase F2 Checksum & File Manifest

## Implemented / Verified Files
- `frontend/src/models/RankingCriteriaModel.js` — Canonical Administrators criteria schedules, ceilings, multi-factor calculation formulas (B.1, B.2), awards matrix (B.4), unit math, and area bindings.
- `backend/app/Services/PortfolioCriterionValidationService.php` — Backend structural validation and deterministic factor recalculation service.
- `frontend/src/controllers/__tests__/PersonnelAdministratorsScaleF2.test.jsx` — 22 focused Phase F2 test specifications covering all Area A, B, C criteria, boundary values, ceilings, and UI metadata.
- `frontend/src/pages/personnel/portfolio/PersonnelPortfolioPage.jsx` — Reusable shared portfolio page rendering dynamic criteria.
- `frontend/src/pages/personnel/portfolio/modals/AddAccomplishmentModal.jsx` — Reusable shared modal rendering dynamic fields without generic accepted-point overrides.

## Evidence Artifacts
- `docs/implementation/evidence/plan-f-f2-administrators-scale/environment.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/administrators-area-a-verification.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/administrators-area-b-verification.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/administrators-area-c-verification.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/dynamic-fields-matrix.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/allowed-values-matrix.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/evidence-requirements.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/judgment-required-verification.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/wrong-scale-rejection.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/boundary-value-tests.md`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/focused-test-output.txt`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/full-suite-output.txt`
- `docs/implementation/evidence/plan-f-f2-administrators-scale/checksum-manifest.md`
