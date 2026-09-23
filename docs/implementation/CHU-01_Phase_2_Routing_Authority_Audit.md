# CHU-01 Phase 2 — Routing Rule Reconciliation Authority Audit

**Document:** `CHU-01_Phase_2_Routing_Authority_Audit.md`
**Parent Plan:** CHU-01 — Core System Stabilization, Personnel Rules, and Demo Readiness
**Phase:** Phase 2 — Personnel Rule Reconciliation Remediation
**Date:** 2026-09-10
**Audit Status:** **AUDITED, FROZEN & AUTHORITATIVELY TRACEABLE**

---

## 1. Document Objective

This authority audit determines the exact, documented source-of-truth for every personnel reviewer and evaluator routing rule in AchieveNest.

As established by the CHU-01 Remediation Plan:
> **No routing behavior may be selected based on code history, convenience, test legacy, or assumptions. Every route must trace to an explicit, approved requirement or resolve strictly to `UNRESOLVED` (zero silent fallback).**

---

## 2. Authoritative Source Hierarchy & Classification

The following hierarchy of authority governs reviewer routing in AchieveNest:

1. **Plan G (Phases G0–G4)**: *Personnel Evaluation Track — Reviewer Routing, Authority & Evaluation Workspace* ([Plan G0 Audit Report](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/Personnel_Evaluation_Track_Plan_G_Phase_G0_Reviewer_Routing_Authority_Audit_Report.md), [Plan G1 Report](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/Personnel_Evaluation_Track_Plan_G_Phase_G1_Canonical_Reviewer_Routing_and_Queue_Assignment_Report.md)).
2. **Plan K (Phase K5)**: *Personnel Evaluation Track Final Closure & Traceability Matrix* ([Plan K5 Closure Report](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/Personnel_Evaluation_Track_Plan_K_Phase_K5_Final_Closure_Report.md), [Final Routing Matrix](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/evidence/plan-k-k5-final-closure/final-routing-matrix.md)).
3. **CHU-01 (Phase 2)**: *Core System Stabilization & Personnel Rule Reconciliation Plan* ([CHU-01 Phase 2 Evidence Report](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/CHU-01_Phase_2_Personnel_Rule_Reconciliation_Evidence_Report.md)).
4. **Institutional Governance (NDMU Personnel Policy)**: University governance boundary defining Dean scope within academic colleges and HR Office authority for university-wide administration.

---

## 3. Evidence Capture & Rule Source Inventory

| Reviewer Route Combination | Canonical Route | Authorized Reviewer Role | Scope Type | College Match Required | Authoritative Source Document | Authority Classification | Provenance Notes |
|---|---|---|---|---|---|---|---|
| **Case R1: Faculty + Academic** | **College Dean** | `dean` | `COLLEGE_ACADEMIC_SCOPE` | **Yes** | Plan G (Phase G0 Section 2, Phase G1 Section 2), Plan K5 Final Routing Matrix | **EXPLICITLY AUTHORIZED** | Faculty teaching in academic colleges are evaluated by their active assigned College Dean. Cross-college evaluation strictly prohibited. |
| **Case R2: Non-Teaching Faculty + Non-Academic** | **HR Office** | `hr_staff` | `UNIVERSITY_HR_SCOPE` | **No** | Plan G (Phase G0 Section 2, Phase G1 Section 2), Plan K5 Final Routing Matrix | **EXPLICITLY AUTHORIZED** | Non-teaching personnel assigned to administrative units / departments route directly to HR Staff queue. |
| **Faculty + Non-Academic** | **HR Office** | `hr_staff` | `UNIVERSITY_HR_SCOPE` | **No** | CHU-01 Phase 2 (Sections 2.5, 9.2, 14.1) | **EXPLICITLY AUTHORIZED** | Faculty placed in non-academic administrative departments route to HR Office for evaluation. |
| **Non-Teaching Faculty + Academic** | **HR Office** | `hr_staff` | `UNIVERSITY_HR_SCOPE` | **No** | CHU-01 Phase 2 (Sections 2.5, 9.2, 14.1) | **EXPLICITLY AUTHORIZED** | Non-teaching faculty attached to academic colleges route to HR Office for non-teaching evaluation scale processing. |
| **Dean (Faculty + Academic)** | **HR Office** | `hr_staff` | `UNIVERSITY_HR_SCOPE` | **No** | Plan G (Phase G0 Section 2, Phase G1 Section 2), Plan K5 Final Routing Matrix | **EXPLICITLY AUTHORIZED** | Self-evaluation is strictly prohibited; Deans are evaluated by HR Staff / Academic VP via HR queue. |
| **VP for Academics** | **HR Office** | `hr_staff` | `UNIVERSITY_HR_SCOPE` | **No** | Plan G (Phase G0 Section 2, Phase G1 Section 2), Plan K5 Final Routing Matrix | **EXPLICITLY AUTHORIZED** | University executive evaluations route to HR Office. |
| **VP for Administration** | **HR Office** | `hr_staff` | `UNIVERSITY_HR_SCOPE` | **No** | Plan G (Phase G0 Section 2, Phase G1 Section 2), Plan K5 Final Routing Matrix | **EXPLICITLY AUTHORIZED** | University executive evaluations route to HR Office. |
| **Missing Personnel Group** | `UNRESOLVED` | `null` | `null` | N/A | CHU-01 Phase 2 Section 9.3 & Plan G0 Section 3 | **EXPLICITLY AUTHORIZED** | Returns `status: 'unresolved'`, `reason_code: 'reviewer_route_unresolved'`. Zero silent fallback. |
| **Missing Organizational Side** | `UNRESOLVED` | `null` | `null` | N/A | CHU-01 Phase 2 Section 9.3 & Plan G0 Section 3 | **EXPLICITLY AUTHORIZED** | Returns `status: 'unresolved'`, `reason_code: 'reviewer_route_unresolved'`. Strictly no default to HR. |
| **Unsupported Combination / Classification** | `UNRESOLVED` | `null` | `null` | N/A | CHU-01 Phase 2 & Plan G0 Section 3 | **EXPLICITLY AUTHORIZED** | Unrecognized inputs cannot be evaluated until reconciled. |

---

## 4. Specific Resolution of Inquired Cases (R1 and R2)

### 4.1 Case R1: Faculty + Academic
- **Existing Route**: `Dean`
- **Authoritative Source**: Plan G (Phases G0 and G1, frozen in `NDMU-REVIEWER-ROUTING-V1`) and Plan K5 (Final Routing Matrix, Section 2).
- **Decision**: **CONFIRMED**
- **Explanation**: `Faculty + Academic -> Dean` is the foundational institutional evaluation route for all teaching faculty assigned to an academic college. It requires an active `college_id` match.

### 4.2 Case R2: Non-Teaching Faculty + Non-Academic
- **Existing Route**: `HR` (`hr_staff`)
- **Authoritative Source**: Plan G (Phases G0 and G1, frozen in `NDMU-REVIEWER-ROUTING-V1`) and Plan K5 (Final Routing Matrix, Section 2).
- **Decision**: **CONFIRMED**
- **Explanation**: Non-teaching personnel assigned to administrative units route to the University HR Scope queue (`hr_staff` / `hr_admin`).

---

## 5. Explicit Negative Exclusions & Non-Fallback Rules

1. **Department Secretary Exclusion**: Department Secretary is strictly NOT an authorized evaluator (Plan G0 Section 3).
2. **Self-Evaluation Prohibition**: Personnel candidates cannot review or evaluate their own submissions (Plan G0 Section 3).
3. **No Silent Fallback**: When input context is missing or unrecognized, resolver returns `status: 'unresolved'` and `authorized_reviewer_role: null` with full diagnostic inputs.

---

## 6. Audit Sign-Off

All reviewer routes encoded in `PersonnelReviewerRoutingRegistry.php` and `PersonnelReviewerRoutingRegistry.js` have been proven 100% traceable to approved, non-conflicting project specifications.

**ROUTING AUTHORITY AUDIT: COMPLETE & VERIFIED**
