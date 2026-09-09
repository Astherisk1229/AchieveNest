# Phase 3 Deliverable: Eligibility Gate Engine Architecture

**Document Identifier:** `docs/audits/osad-award-phase3-eligibility-gate-engine.md`  
**Phase:** 3 of 8 (Eligibility Gate Engine)  
**Authoritative Source:** *AchieveNest — OSAD Award Evaluation & Portfolio Scoring Implementation Plan — COMPLETE*  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Status:** **GATE ENGINE IMPLEMENTED & VERIFIED**

---

## 1. Executive Summary

Phase 3 implements the authoritative award-level eligibility gate that determines whether a student is permitted to enter the evaluation pool for a selected award **before any award evidence is mapped or scored**.

The engine operates in [`AwardEligibilityService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardEligibilityService.php) and enforces four strict gates:
1. **Award Active Gate**: Award exists and `status === 'active'`.
2. **Student Profile Active Gate**: Student profile exists in `profiles` (`account_type === 'student'`) and `status === 'active'`.
3. **Graduation Gate**: Restricted to graduating students (4th year / senior) when `award.graduating_only === 1`. Open-pool awards allow all year levels.
4. **Sex Gate**: Enforces exact match against official student profile `Sex` / `gender` when `award.gender_restriction` is `FEMALE` or `MALE`. Non-sex-gated awards allow all students regardless of gender.

---

## 2. Deterministic Evaluation Flow

```text
Selected Award + Student Profile
    │
    ├─► 1. Award Exists & Active?
    │       No  ──► Fail (AWARD_NOT_FOUND / AWARD_INACTIVE)
    │       Yes
    │
    ├─► 2. Student Profile Exists & Active?
    │       No  ──► Fail (STUDENT_NOT_FOUND / STUDENT_PROFILE_INACTIVE)
    │       Yes
    │
    ├─► 3. Graduation Gate (award.graduating_only)
    │       Required & Not Graduating ──► Fail (GRADUATING_REQUIREMENT_NOT_MET)
    │       Required & Year Missing   ──► Fail (GRADUATING_STATUS_MISSING)
    │       Passed or Open Pool
    │
    ├─► 4. Sex Gate (award.gender_restriction)
    │       Required & Sex Mismatch ──► Fail (SEX_REQUIREMENT_NOT_MET)
    │       Required & Sex Missing  ──► Fail (SEX_VALUE_MISSING)
    │       Passed or Non-Sex-Gated
    │
    └─► 5. Structured Diagnostic Output
            All Passed ──► is_eligible = true, reasons = []
```

---

## 3. Strict Boundary Invariant

- **Phase 3 Scope**: Determines only if the student is permitted to enter consideration for an award.
- **Explicit Invariant**: Does **NOT** score evidence, does **NOT** compute raw points, does **NOT** calculate percentages, does **NOT** generate rankings, and does **NOT** assign Potential Candidate status.
