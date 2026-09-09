# Personnel Evaluation Track — Plan H — Phase H3: Deliberation, HR Promotion Decision & Approved Rank Update — Formal Report

## 1. Executive Summary

Phase H3 implements the authoritative **Post-Evaluation Deliberation, HR Promotion Decision, and Approved Rank Update** engine for Plan H. Phase H3 allows HR to record the official promotion decision (`Approved` or `Not Approved`) resulting from post-evaluation deliberation, keeps denied/retained cases at their current rank without demotion, and applies approved rank updates strictly validated against Plan E faculty rank progression rules and verified PhD exceptions.

**Authoritative Governance Rule**:
> **A Passed evaluation may proceed to deliberation, but Passed does not guarantee promotion. HR records the final Promotion Decision. Only an explicitly approved promotion may update rank/title, and that update must follow valid Plan E rank rules.**

---

## 2. Core Governance Invariants & Implementation

1. **Separation of Facts**:
   - `Evaluation Result` (`Passed` | `Retained`) is strictly separate from `Promotion Decision` (`Approved` | `Not Approved`).
   - A `Passed` evaluation never automatically promotes or advances rank without explicit HR recorded approval.

2. **Retained & Denied Evaluation Invariants**:
   - `Retained` evaluations are barred from promotion approval (`evaluation_result_not_eligible_for_promotion`).
   - `Not Approved` decisions preserve the candidate's current rank and title without demotion or rank history promotion entries (`is_promoted: false`).

3. **Approved Decisions & Plan E Validation**:
   - `Approved` promotions update candidate rank only through valid sequential progression paths (e.g. `Assistant Professor I -> Assistant Professor II`, `Associate Professor II -> Associate Professor III`).
   - Unsupported multi-step jumps, downward rank mutations, or unrelated rank transitions are rejected (`invalid_rank_transition`).
   - Confirmed PhD Exception (`Assistant Professor I -> Professor I`) is allowed if and only if verified PhD qualification evidence is present.

4. **Part-Time & Non-Teaching Boundaries**:
   - Part-Time Faculty are blocked from Full-Time academic rank progression (`part_time_not_eligible_for_promotion`).
   - Non-Teaching personnel are blocked from participating in Faculty rank progression (`unsupported_personnel_group`).

5. **Atomic Audit Trail & Rank History**:
   - An approved promotion atomically persists the decision, updates current rank, and creates a historical audit entry (`from_rank`, `to_rank`, `transition_type`, `recorded_by`, `recorded_at`, `plan_e_rule_reference`).
   - Previous rank remains immutably preserved in history.

6. **No President Auto-Approval & Idempotency**:
   - Zero auto-generation of President signatures or approval dates.
   - Repeated submissions of already recorded decisions are idempotent and prevent duplicate rank advancement.
   - Restricted strictly to authorized HR personnel (`hr_staff`, `hr_admin`); Candidates, Deans, and Secretaries are denied (`403 Forbidden`).

---

## 3. Services Delivered

1. **Backend Engine**:
   - [`PersonnelPromotionDecisionService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/PersonnelPromotionDecisionService.php)
2. **Frontend Engine**:
   - [`PersonnelPromotionDecisionService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/PersonnelPromotionDecisionService.js)
3. **Dedicated Focused Test Suite**:
   - [`PersonnelPromotionDecisionH3.test.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelPromotionDecisionH3.test.jsx) (23/23 tests passed)

---

## 4. Test Verification Results

- **Focused Test Suite**: `PersonnelPromotionDecisionH3.test.jsx` (23 tests passed, 0 failed, 29ms)
- **Full Repository Suite**: **138 test files passed / 1172 tests passed / 0 failures** (64.06s)

---

## 5. Exit Gate & Definition of Done

- [x] Passed evaluations proceed to deliberation without automatic promotion.
- [x] HR records the final Promotion Decision (`Approved` | `Not Approved`).
- [x] Evaluation Result and Promotion Decision remain distinct facts.
- [x] Retained evaluations barred from promotion approval.
- [x] Not Approved decisions preserve current rank/title without demotion.
- [x] Approved decisions update rank only through valid Plan E progression.
- [x] Normal progression is sequential; multi-step jumps are rejected.
- [x] Confirmed PhD exception honored only with verified qualification evidence.
- [x] Part-Time Faculty not moved into Full-Time rank progression.
- [x] Non-Teaching personnel barred from Faculty rank progression.
- [x] Approved rank update is atomic with decision persistence and rank history logging.
- [x] President approval / signature fields are not auto-filled.
- [x] Repeated decision submissions are idempotent.
- [x] HR authorization boundary enforced (Candidates, Deans, Secretaries denied).
- [x] Evidence package completed in `docs/implementation/evidence/plan-h-h3-promotion-decision/`.

**PHASE H3 COMPLETE — DELIBERATION, HR PROMOTION DECISION & PLAN E-VALIDATED APPROVED RANK UPDATE VERIFIED**
