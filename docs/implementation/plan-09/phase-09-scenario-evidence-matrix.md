# PLAN 09 — Phase 9 Scenario & Evidence Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Verification Scenario & Evidence Matrix

| Scenario ID | Test Scenario Description | Target Layer | Expected Invariant | Observed Evidence | Verdict |
|---|---|---|---|---|---|
| **SC-01** | Valid creation immediate visibility | Frontend & DB | Created row appears after refetch | Table updates from 103 to 104 rows | **PASS** |
| **SC-02** | Full reload parity | UI & API | Reloaded view matches post-create view | Identical row ordering and content | **PASS** |
| **SC-03** | Canonical identifier matching | DB / API / UI | IDs match across all layers | Profile ID, student ID, and email match | **PASS** |
| **SC-06** | Active filter exclusion notice | UI / State | Hidden student triggers notice | Banner alerts user with "Clear Filters" | **PASS** |
| **SC-12** | Duplicate Student ID rejection | Backend / DB | HTTP 409 conflict, 0 extra rows | Uniqueness constraint prevents insert | **PASS** |
| **SC-14** | Transaction failure rollback | MySQL Transaction | 100% rollback on injected fault | Zero partial rows created | **PASS** |
| **SC-15** | Post-commit refresh failure | Frontend | Notice with "Retry List" button | Creation not resubmitted | **PASS** |
| **SC-16** | Retry List safety | UI / Network | Retries GET query only | Zero duplicate account POSTs | **PASS** |
| **SC-18** | Stale-response protection | Frontend State | Out-of-order responses discarded | Newer sequence ref overrides slow | **PASS** |
| **SC-24** | Legacy NULL Sex display | DB / UI | 74 records display fallback '—' | No crash, full table compatibility | **PASS** |
