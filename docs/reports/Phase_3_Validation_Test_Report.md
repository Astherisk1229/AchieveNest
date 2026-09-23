# Phase 3 — Validation Test Report
## Test Case Execution and Verification Results (TC-3.1 through TC-3.18)

**Domain:** Verification Workflow & Gate  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Execution Timestamp:** 2026-08-31 22:40:00 UTC+08:00  
**Overall Status:** **18 / 18 PASSED (100%)**  

---

## 1. Phase 3 Test Matrix Summary

| Test ID | Test Scenario | Target Precondition & Action | Expected Outcome | Result |
|---|---|---|---|:---:|
| **TC-3.1** | Valid Submission | Complete Campus Journalism News Item record (`draft` $\rightarrow$ `submitted`). | Status transitions to `submitted`. Submitted timestamp and audit record created. | **PASS** |
| **TC-3.2** | Incomplete Submission | Missing publication outlet during submission attempt. | Rejected with HTTP 422 (`MISSING_PUBLICATION_OUTLET`). Status remains `draft`. | **PASS** |
| **TC-3.3** | Authorized Verification | Program Coordinator approves complete submitted Editorial. | Status transitions to `verified`. Audit event and notification emitted. Eligible for scoring. | **PASS** |
| **TC-3.4** | Student Self-Verification | Student attempts calling verify on own record. | Blocked with HTTP 403 (`SELF_VERIFICATION_FORBIDDEN`). Status remains unchanged. | **PASS** |
| **TC-3.5** | Unauthorized Personnel Verification | Unscoped personnel attempts verification. | Blocked with HTTP 403 (`FORBIDDEN`). | **PASS** |
| **TC-3.6** | Revision Requested with Reason | Reviewer returns record with specific revision remark. | Status transitions to `revisions_requested`. Remarks recorded and visible to student. | **PASS** |
| **TC-3.7** | Revision Without Reason | Reviewer attempts revision request with empty remarks. | Rejected with HTTP 422 (`REMARKS_REQUIRED`). Action blocked. | **PASS** |
| **TC-3.8** | Rejection with Reason | Reviewer rejects invalid record with explanation. | Status transitions to `rejected`. Future scoring eligibility = false. | **PASS** |
| **TC-3.9** | Rejection Without Reason | Reviewer attempts rejection with empty remarks. | Rejected with HTTP 422 (`REMARKS_REQUIRED`). Action blocked. | **PASS** |
| **TC-3.10** | Verified Record Archived | Verified record has lifecycle updated to `archived`. | Verification status remains `verified`; future scoring eligibility resolves to false. | **PASS** |
| **TC-3.11** | Verified Record Superseded | Verified record marked `superseded`. | Future scoring eligibility resolves to false. | **PASS** |
| **TC-3.12** | Evidence Removed After Verification | Active evidence removed from verified record. | Gate evaluates `active_evidence_count = 0`; future scoring eligibility resolves to false. | **PASS** |
| **TC-3.13** | Multiple Evidence Files on Verified Record | 1 verified Editorial with 3 attached PDF files. | Evaluates as exactly 1 scoreable unit; files do not multiply achievements. | **PASS** |
| **TC-3.14** | Duplicate Verified Records | Two records identified for the same publication piece. | One marked superseded/rejected; only 1 active record passes the scoring gate. | **PASS** |
| **TC-3.15** | Legacy Verified but Incomplete | Pre-existing verified record missing publication type. | Fails structural completeness gate; resolves ineligible for scoring. | **PASS** |
| **TC-3.16** | Seminar Verified | Journalism training record verified and active. | Retrievable as supporting evidence; resolves to 0.0 scoring points potential. | **PASS** |
| **TC-3.17** | Stale Review Protection | Concurrent modification during review. | Concurrency checks warn reviewer to reload latest state before verification. | **PASS** |
| **TC-3.18** | Direct Status Tampering | Malicious client sends `status = verified` on general edit. | Edit endpoint ignores verifier fields; record remains unverified. | **PASS** |

---

## 2. Test Execution Output

```text
========================================================================
AchieveNest — Phase 3: Verification Workflow & Gate Verification
========================================================================
  TC-3.1   Complete News Item Submission                          [PASS]
  TC-3.2   Incomplete Submission Blocked (HTTP 422)               [PASS]
  TC-3.3   Authorized Reviewer Verification                       [PASS]
  TC-3.4   Student Self-Verification Blocked (HTTP 403)           [PASS]
  TC-3.5   Unauthorized Personnel Verification Blocked (HTTP 403) [PASS]
  TC-3.6   Revision Requested with Reason Recorded                [PASS]
  TC-3.7   Revision Request Without Reason Blocked (HTTP 422)     [PASS]
  TC-3.8   Rejection with Justification Recorded                  [PASS]
  TC-3.9   Rejection Without Reason Blocked (HTTP 422)            [PASS]
  TC-3.10  Verified Record Lifecycle Archival Ineligibility       [PASS]
  TC-3.11  Superseded Record Scoring Exclusion                    [PASS]
  TC-3.12  Evidence Removal Gate Invalidation                     [PASS]
  TC-3.13  Multiple Evidence Cardinality Guarantee                [PASS]
  TC-3.14  Duplicate Resolution Single-Eligibility Invariant      [PASS]
  TC-3.15  Legacy Incomplete Record Gate Ineligibility            [PASS]
  TC-3.16  Verified Seminar Supporting Record (0 Points)          [PASS]
  TC-3.17  Stale Review Concurrency Protection                    [PASS]
  TC-3.18  Direct Status Payload Tampering Defense                [PASS]
========================================================================
Phase 3 Verification Summary: 18 Passed, 0 Failed
========================================================================
```
