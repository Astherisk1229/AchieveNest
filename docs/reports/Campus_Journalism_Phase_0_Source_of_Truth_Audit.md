# Campus Journalism Award — Phase 0: Scope Freeze and Source-of-Truth Verification
## Authoritative Source Audit, Constant Freezing, and Zero-Drift Baseline

**Authoritative Source:** Google Doc `AchieveNest — Campus Journalism Award Implementation Plan`  
**Award Identity:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Phase:** Phase 0 — Scope Freeze and Source-of-Truth Verification  
**Status:** **PASS / APPROVED FOR PHASE 1**  
**Timestamp:** 2026-08-31 23:14:00 UTC+08:00  

---

## 1. Executive Summary

Phase 0 establishes the authoritative baseline and prevents implementation drift for the **Campus Journalism Award** (`CAMPUS_JOURNALISM_AWARD`).

In strict accordance with the Google Doc specification:
1. **Scoring Constants Frozen**:
   - News Items (`COMP_JOURN_NEWS`): $2.0\text{ pts / record}$, Cap = $10.00\text{ pts}$ (Max 5).
   - Literary Works (`COMP_JOURN_LITERARY`): $2.0\text{ pts / record}$, Cap = $10.00\text{ pts}$ (Max 5).
   - Columns (`COMP_JOURN_COLUMN`): $4.0\text{ pts / record}$, Cap = $20.00\text{ pts}$ (Max 5).
   - Editorials (`COMP_JOURN_EDITORIAL`): $4.0\text{ pts / record}$, Cap = $20.00\text{ pts}$ (Max 5).
   - Leadership Involvement (`COMP_JOURN_LEAD_ROLE`): Officer = $3.0\text{ pts}$, Member = $2.0\text{ pts}$, Cap = $5.00\text{ pts}$.
   - Awards & Citations (`COMP_JOURN_LEAD_AWARDS`): Int/Nat = $3.0\text{ pts}$, Local = $2.0\text{ pts}$, Seminars = $0.0\text{ pts}$ (`SUPPORTING_ONLY`), Cap = $5.00\text{ pts}$.
   - **Portfolio Raw Score Maximum**: $70.00\text{ Points}$ ($60.00\text{ pts}$ Publication + $10.00\text{ pts}$ Leadership).
   - **Qualifying Candidate Threshold**: $\text{Raw Score} \ge 56.00 / 70.00 \iff \text{Potential Score} \ge 80.00\%$.
2. **Non-Computable Criteria Isolation**:
   - Moral Character ($20.00\text{ pts}$) and Panel Interview ($10.00\text{ pts}$) are explicitly excluded from automated scoring and labeled as *Not automatically scored by AchieveNest*.
3. **Exact Output Label Standard**:
   - Label: `"Potential Campus Journalism Award Candidate — Portfolio-Based"` enforced verbatim in backend and frontend.
4. **Zero Duplication**:
   - Existing normalized structures (`profiles`, `student_portfolio_records`, `student_portfolio_evidence_files`, `award_cycles`, `award_student_evaluation_summaries`) are reused safely without redundant tables.

---

## 2. Requirement-to-Code Mapping (Workstream 0B)

| Master Plan Requirement | Existing Implementation / Component | Status | Required Action |
|---|---|:---:|---|
| **News: 2 pts, max 10** | `CampusJournalismScoringService::COMP_NEWS` | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Literary: 2 pts, max 10** | `CampusJournalismScoringService::COMP_LITERARY` | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Column: 4 pts, max 20** | `CampusJournalismScoringService::COMP_COLUMN` | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Editorial: 4 pts, max 20** | `CampusJournalismScoringService::COMP_EDITORIAL` | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Leadership: max 5** | `CampusJournalismScoringService::COMP_ROLE` (Officer 3, Member 2) | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Awards: max 5** | `CampusJournalismScoringService::COMP_AWARDS` (Int/Nat 3, Local 2, Seminar 0) | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Raw Max: 70 pts** | `CampusJournalismScoringService::RAW_MAX_SCORE = 70.0` | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Threshold: 80% (56/70)** | `CampusJournalismScoringService::THRESHOLD_RAW = 56.0` | **ALREADY SATISFIED** | None. Preserved exact constant. |
| **Character/Interview Excluded**| Isolated in `AwardEvaluationController` & `CampusJournalismScoringBasisModal` | **ALREADY SATISFIED** | Labeled "Not automatically scored". |
| **Exact Output Label** | `status_label` in backend service & modal header | **SATISFIED (UPDATED)** | Updated verbatim to `"Potential Campus Journalism Award Candidate — Portfolio-Based"`. |
| **No Schema Bloat** | Reused existing normalized schema | **ALREADY SATISFIED** | No duplicate tables or redundant fields. |

---

## 3. Impact Analysis

- **Database / Schema Impact**: None. Existing normalized schema is fully compliant.
- **Backend Impact**: Updated `status_label` in [`CampusJournalismScoringService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/CampusJournalismScoringService.php#L482) to the exact verbatim string.
- **Frontend Impact**: Updated modal badge in [`CampusJournalismScoringBasisModal.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/modals/CampusJournalismScoringBasisModal.jsx#L61) to display `"Potential Campus Journalism Award Candidate — Portfolio-Based"`.
- **Validation Evidence**: All scoring constants, caps, and status labels verified against the authoritative Google Doc.
- **Unresolved Issues**: None.

---

## 4. Phase 0 Exit Criteria Verification

- [x] **Every scoring rule is mapped to an implementation requirement**: Verified.
- [x] **No undocumented assumptions remain in scoring constants**: Verified.
- [x] **Reusable existing data structures are identified**: Verified.

---

## 5. Phase Gate Decision

```text
========================================================================
AchieveNest — Phase 0: Scope Freeze & Source-of-Truth Verification
========================================================================
All Exit Criteria Satisfied and Verified against the Authoritative Google Doc.
Phase Gate Result: PASS / APPROVED FOR PHASE 1
========================================================================
```
