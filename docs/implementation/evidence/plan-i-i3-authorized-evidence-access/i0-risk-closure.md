# Plan I0 Risk Closure Matrix (Phase I3)

## 1. Closed Risks

| Risk ID | Title / Requirement | Status | Resolution Detail |
| :--- | :--- | :--- | :--- |
| **RISK-I0-01** | Reviewer preview URL uses filename-based construction | **CLOSED** | Replaced with authenticated `GET /api/v1/evidence/personnel/{id}/preview` and `GET /api/v1/evidence/personnel/{id}/download` streaming controllers using canonical `evidence_id`. |
| **RISK-I0-03** | `personnel_evaluation_items` explicit FK `evidence_id` | **CLOSED** | Closed in Phase I2. |
| **RISK-I0-04** | SHA-256 duplicate advisory detection | **CLOSED** | Closed in Phase I2. |

---

## 2. Deferred Risks (Remaining Open by Canonical Plan)

| Risk ID | Title / Requirement | Status | Target Phase | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **RISK-I0-02** | Owner-authorized purge must unlink physical files | **OPEN** | **Phase I4 / I6** | Replacement workflows (I4) and physical unlink cleanup (I6) require dedicated audit-trailed lifecycles. |
| **RISK-I0-05** | Malware scanner placeholder | **DOCUMENTED** | **Phase I1 / Future** | Architecture hook established in I1 pipeline; integration configured for institutional AV daemon. |
