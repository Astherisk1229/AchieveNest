# Phase I0 Risk Closure Matrix (Phase I2)

## 1. Closed Risks

| Risk ID | Title / Requirement | Status | Resolution Detail |
| :--- | :--- | :--- | :--- |
| **RISK-I0-03** | `personnel_evaluation_items` must store explicit FK `evidence_id` | **CLOSED** | Migration `2026-09-09-000067_AddEvidenceIdToPersonnelEvaluationItems.php` applied; `PersonnelPortfolioSubmissionController` snapshot submission and resubmission updated; strict ownership validation implemented. |
| **RISK-I0-04** | Duplicate-content advisory detection should use SHA-256 | **CLOSED** | Non-blocking SHA-256 duplicate detection implemented in `PersonnelEvidenceIdentityService`; non-unique DB index added; privacy-preserving cross-owner match controls verified. |

---

## 2. Deferred Risks (Remaining Open by Canonical Plan)

| Risk ID | Title / Requirement | Status | Target Phase | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **RISK-I0-01** | Reviewer preview URL rewire & authenticated streaming | **OPEN** | **Phase I3** | Belongs to reviewer preview and tokenized streaming authorization track. |
| **RISK-I0-02** | Evidence replacement, purge & physical unlink lifecycle | **OPEN** | **Phase I4 / I6** | Replacement workflows (I4) and physical unlink cleanup (I6) require dedicated audit-trailed lifecycles. |
| **RISK-I0-05** | Malware scanner placeholder | **DOCUMENTED** | **Phase I1 / Future** | Architecture hook established in I1 pipeline; integration configured for institutional AV daemon. |
