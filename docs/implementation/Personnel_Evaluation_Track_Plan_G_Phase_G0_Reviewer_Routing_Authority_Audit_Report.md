# Personnel Evaluation Track — Plan G — Phase G0: Reviewer Routing, Authority & Evaluation Workspace Audit Report

**Phase G0 Status: COMPLETE & VERIFIED**  
**Canonical Routing Rule Version: `NDMU-REVIEWER-ROUTING-V1`**  
**Automated Regression Suite Baseline: 130 Test Files / 1007 Tests Passed (0 Failures)**

---

## 1. Executive Summary

Phase G0 establishes the audited and frozen reviewer-routing, reviewer-authority, and evaluation-workspace rules for **Plan G (Reviewer Routing, Authority & Evaluation Workspace)**.

The core governance boundary is frozen:
> **Plan G determines who evaluates and where official accepted points are recorded. Plan F remains the single authority for scoring rules, caps, validation, and Passed/Retained determination.**

---

## 2. Canonical Reviewer Routing Baseline

| Personnel Classification / Context | Canonical Assigned Reviewer | Scope Type | College Match Required | Scoring Authority |
| :--- | :--- | :--- | :--- | :--- |
| `Faculty + Academic` | **Dean** | `COLLEGE_ACADEMIC_SCOPE` | Yes (Active Assigned College) | **Plan F** |
| `Non-Teaching Faculty + Academic` | **Dean** | `COLLEGE_ACADEMIC_SCOPE` | Yes (Active Assigned College) | **Plan F** |
| `Non-Teaching Faculty + Non-Academic` | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |
| `Dean` (Faculty + Academic) | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |
| `VP for Academics` | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |
| `VP for Administration` | **HR Office (`hr_staff`)** | `UNIVERSITY_HR_SCOPE` | No | **Plan F** |

---

## 3. Explicit Exclusions & Fallback Governance

1. **Department Secretary Exclusion**: Department Secretary is strictly excluded from evaluator authority.
2. **Self-Evaluation Prohibition**: Personnel candidates cannot evaluate their own submissions.
3. **Scale Independence**: Evaluation scale code (`ADMINISTRATORS_RANKING_SCALE` or `NON_TEACHING_PERSONNEL_RANKING_SCALE`) does not determine reviewer identity; reviewer assignment is derived from authoritative personnel context.
4. **No Guessed Routing**: Unsupported or unconfirmed positions default to `reviewer_route_unresolved`.

---

## 4. Current-State Audit Summary

1. **Evaluator Role Inventory**: Evaluators are strictly limited to `dean` (for intra-college academic personnel) and `hr_staff` / `hr_admin` (for non-academic personnel, Deans, VPs, and university-wide oversight).
2. **Dean Scope Isolation**: Dean scope is derived from `dean_assignments` and `personnel_college_affiliations`. Cross-college evaluation access is blocked.
3. **Evaluator-Judgment Criteria**: B.3 (Research, max 40), B.6 (Creative Work, max 20), and B.5 (Non-Teaching Awards, max 30) require evaluator input. Scores are bounded by Plan F ceilings; unresolved state is preserved as `accepted_points = null`.
4. **Non-Teaching Area A**: Remains evaluator-only with 90-point weight. Personnel accomplishment submissions are prohibited.
5. **Stale Logic Classification**: Identified legacy free-text designation matching, advisory score badges, and prototype rating calculations for alignment in G1–G3.

---

## 5. Plan G Implementation Roadmap (G1–G4)

- **Phase G1**: Canonical Reviewer Routing & Queue Assignment (Backend routing service, reviewer assignment persistence, Dean/HR queues, `in_evaluation` transition).
- **Phase G2**: Evaluator Workspace & Evidence Review (Authorized detail page, split-view document inspection, Plan F explainability).
- **Phase G3**: Official Accepted-Point & Area A Evaluation Inputs (Accepted-point mutation, ceiling validation, Non-Teaching Area A rating inputs).
- **Phase G4**: Reviewer Workflow Validation, Cross-Role Security & Formal Plan G Closure.

---

## 6. Verification & Automated Test Summary

- **Focused Test Suite**: [`PersonnelReviewerRoutingG0.test.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelReviewerRoutingG0.test.jsx) — **15/15 tests passed (100%)**
- **Complete Test Suite Run**:
  ```
  Test Files  130 passed (130)
       Tests  1007 passed (1007)
    Duration  53.06s
  ```

---

## 7. Phase G0 Exit Declaration

All reviewer-routing rules, evaluator authority boundaries, judgment criteria, and workspace requirements have been fully audited, frozen into canonical registries, and verified by automated tests.

**PHASE G0 IS HEREBY COMPLETE AND FROZEN.**
