# Personnel Evaluation Track — Plan G — Phase G0: Stale Routing Logic Audit

## Stale Logic Inventory & Classification

| Artifact / Code Location | Stale Logic / Pattern | Classification | Remediation Plan (Plan G Roadmap) |
| :--- | :--- | :--- | :--- |
| `ReviewerResolverService.php` | Keyword search across free-text `designation_title` (e.g. `'director'`, `'coordinator'`, `'chair'`) | **Stale / Over-broad** | In G1, replace keyword matching with structured classification flags (`is_dean`, `is_vp_academics`, `is_vp_administration`). |
| `HRFacultyEvaluationOversightPage.jsx` | Hard-coded score badge logic (`>= 140 -> Recommended`, `>= 110 -> For Review`) | **Legacy Advisory UI** | In G2, align oversight badges with Plan F canonical thresholds (`120.00` Passing for Administrators, `75.00` for Non-Teaching). |
| `NDMURatingEngine.js` | Prototype rating engine calculating scores for Administrators scale only | **Duplicate Calculation Engine** | In G2/G3, supersede with direct calls to Plan F `PersonnelEvaluationScoringEngine.js`. |
| Legacy UI Labels | Mentions of `Submit to Department Secretary` in early mockups | **Legacy Label** | Department Secretary has zero evaluator permissions; ensure UI displays `Submitted to Dean / HR`. |
