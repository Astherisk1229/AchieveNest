# Phase 2 — Legacy Data Compatibility Report
## Backward Compatibility, Legacy Record Handling, and Zero-Guessing Policy

**Domain:** Portfolio Data Compatibility & Migration Safety  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:35:00 UTC+08:00  

---

## 1. Executive Policy: No Silent Inferences or Guessed Classifications

A foundational principle of Phase 2 is **strict adherence to factual source data**:
1. **Never infer publication type from free-text titles** (e.g. an article entitled "My Opinion on Student Governance" must not be automatically classified as an `Editorial` or `Column` without explicit user or verifier classification).
2. **Never infer recognition levels from event titles** (e.g. an event named "National Journalism Convention" must not automatically populate `recognition_level = 'national'` without authoritative structured confirmation).
3. **Never infer officer status from free-text descriptions** (e.g. "helped lead the editorial team" must not be automatically classified as `Officer` without an official appointment role).

---

## 2. Compatibility with Existing Non-Journalism Records

| Portfolio Category | Impact of Phase 2 Rollout | Backward Compatibility Status |
|---|---|:---:|
| **Academic Excellence** | No new mandatory fields imposed. Standard GPA and honor validation preserved. | **100% Compatible (No Change)** |
| **Sports & Athletics** | Existing event date / academic year rules preserved without interference. | **100% Compatible (No Change)** |
| **Socio-Cultural / Performing Arts** | Standard showcase and competition metadata preserved. | **100% Compatible (No Change)** |
| **Community Service & Volunteerism** | Existing beneficiary and outreach hours structures preserved. | **100% Compatible (No Change)** |
| **Campus Ministry** | Existing faith formation and ministry service records preserved. | **100% Compatible (No Change)** |
| **Student Organizations & Clubs** | Existing membership and governance records preserved. | **100% Compatible (No Change)** |

---

## 3. Legacy Journalism Records Handling Protocol

Pre-existing student portfolio achievements categorized under `Campus Journalism` that were created before Phase 2 structured metadata enforcement shall be handled as follows:

```text
Legacy Journalism Record Ingestion Protocol:
┌─────────────────────────────────────────────────────────────┐
│ 1. Record remains visible and accessible in student profile. │
│ 2. Record retains its original title, date, and attachments.│
│ 3. Status is flagged as "Incomplete Classification".        │
│ 4. Record contributes 0 points to candidate generation until │
│    student or verifier completes structured metadata.       │
│ 5. Student is prompted to update publication type and role. │
└─────────────────────────────────────────────────────────────┘
```

### Reconciliation Workflow:
- If a legacy record is edited by the student, the Phase 2 conditional form fields become active.
- Upon re-submission with required metadata (Publication Type, Outlet, Date, Contribution Role, Evidence), the record transitions to `submitted` and becomes verification-ready for Phase 3.
