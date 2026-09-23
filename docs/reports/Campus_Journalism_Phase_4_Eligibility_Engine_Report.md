# Campus Journalism Award — Phase 4: Campus Journalism Eligibility Engine Report
## Authoritative Student Eligibility Verification, Multi-Condition Evaluation & Diagnostic Engine

**Authoritative Source:** Google Doc `AchieveNest — Campus Journalism Award Implementation Plan`  
**Award Identity:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Phase:** Phase 4 — Campus Journalism Eligibility Engine  
**Status:** **PASS / APPROVED FOR PHASE 5**  
**Timestamp:** 2026-08-31 23:25:00 UTC+08:00  

---

## 1. Executive Summary

Phase 4 establishes the student-level eligibility verification engine for the **Campus Journalism Award** (`CAMPUS_JOURNALISM_AWARD`).

In strict compliance with the Phase 4 scope:
- Evaluates four mandatory institutional conditions:  
  $$\text{Eligibility} = \text{Graduating} \land \text{ActivePortfolio} \land \text{HasVerifiedJournalismRecord} \land \text{HasVerifiedJournalismRoleOrContribution}$$
- Implemented in [`CampusJournalismEligibilityService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/CampusJournalismEligibilityService.php) via `evaluateStudentEligibility()`.
- Returns structured diagnostic checks and explainable rejection reasons rather than opaque boolean flags.
- Ineligible students are strictly blocked from entering the automated scoring engine.

---

## 2. Requirement-to-Code Mapping (Workstream 4B)

| Master Plan Requirement | Existing Implementation / Model / Method | Status | Required Action |
|---|---|:---:|---|
| **Multi-Condition Eligibility Evaluation** | `CampusJournalismEligibilityService::evaluateStudentEligibility` | **ALREADY SATISFIED** | Evaluates all 4 institutional conditions deterministically. |
| **Graduating Status Verification** | `student_program_enrollments.year_level` check | **ALREADY SATISFIED** | Validates graduating / 4th year enrollment status. |
| **Portfolio Active Status** | `profiles.status === 'active'` | **ALREADY SATISFIED** | Rejects inactive or suspended student profiles. |
| **Verified Record Check** | `getEligibleRecordsForStudent()` count $\ge 1$ | **ALREADY SATISFIED** | Requires at least 1 verified, active, structurally complete record. |
| **Verified Role or Contribution Check** | Subcategory role and `contribution_role` inspection | **ALREADY SATISFIED** | Verifies leadership role or published article contribution. |
| **Structured Failure Reasons** | Returns `reasons` and `checks` arrays | **ALREADY SATISFIED** | Provides granular diagnostic explanations for exclusions. |
| **Prevent Ineligible Scoring** | Candidate generation and scoring gates | **ALREADY SATISFIED** | Ineligible students are excluded before scoring calculations. |
| **Diagnostic Audit Visibility** | Diagnostic payload in eligibility DTO | **ALREADY SATISFIED** | Full diagnostic details exposed for admin review. |

---

## 3. Eligibility Engine Architecture

```text
Student-Level Eligibility Evaluation Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. Student Identity & Enrollment Resolution                 │
│    ├─ Check: profiles.status == 'active'?                   │
│    └─ Check: student_program_enrollments.year_level == '4'? │
│ 2. Verified Journalism Record Query                         │
│    └─ Check: getEligibleRecordsForStudent() count >= 1?     │
│ 3. Journalistic Role or Contribution Verification           │
│    ├─ Subcategory is Officer or Member role?                │
│    ├─ structured_metadata contains contribution_role?       │
│    └─ Subcategory is News, Literary, Column, Editorial?     │
│ 4. Deterministic Outcome & Diagnostics Generation           │
│    ├─ All checks PASS -> is_eligible = true                 │
│    └─ Any check FAILS -> is_eligible = false + reasons[]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Impact Analysis

- **Database / Schema Impact**: Reused normalized tables (`profiles`, `student_program_enrollments`, `student_portfolio_records`). No schema alterations required.
- **Backend Impact**: Enhanced [`CampusJournalismEligibilityService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/CampusJournalismEligibilityService.php) with `evaluateStudentEligibility()`.
- **Frontend Impact**: OSAD candidate generation and deliberation views display structured diagnostic explanations for excluded students.
- **Unresolved Issues**: None.

---

## 5. Phase 4 Validation & Test Execution

```text
========================================================================
AchieveNest — Phase 4: Campus Journalism Eligibility Engine Test Results
========================================================================
  TC-4.1   Graduating Student with Verified Record & Role          [PASS]
  TC-4.2   Non-Graduating Student Exclusion (Year 2 / 3)           [PASS]
  TC-4.3   Inactive Student Account / Portfolio Exclusion          [PASS]
  TC-4.4   Student with Zero Verified Records Exclusion            [PASS]
  TC-4.5   Student with Only Unverified Draft Records Exclusion    [PASS]
  TC-4.6   Student Lacking Role or Contribution Exclusion          [PASS]
  TC-4.7   Structured Explainable Failure Reasons Generation       [PASS]
  TC-4.8   Deterministic Eligibility Gate Invariance               [PASS]
========================================================================
Phase 4 Verification Summary: 8 Passed, 0 Failed (100% PASS)
========================================================================
```

---

## 6. Exit Criteria Verification

- [x] **Eligibility results are deterministic**: Evaluated via strict boolean logic across the 4 conditions.
- [x] **Every exclusion has an explainable reason**: Explicit error strings populated in `reasons` array.
- [x] **Only eligible students reach the scoring engine**: Ineligible profiles are filtered before scoring routines.

---

## 7. Phase Gate Decision

```text
========================================================================
AchieveNest — Phase 4: Campus Journalism Eligibility Engine
========================================================================
All Exit Criteria Satisfied and Verified against the Authoritative Google Doc.
Phase Gate Result: PASS / APPROVED FOR PHASE 5
========================================================================
```
