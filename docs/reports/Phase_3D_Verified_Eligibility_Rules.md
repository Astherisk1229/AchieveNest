# Phase 3D — Verified Eligibility Rules
## Mathematical Logic, Scoring Gate Conditions, and Derived State Calculations

**Domain:** Verified-Only Scoring Gate  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:40:00 UTC+08:00  

---

## 1. The Verified-Only Eligibility Formula

To guarantee that only authentic, complete, and legally valid records enter future scoring calculations, the backend gate evaluates the following boolean expression:

$$\text{Eligible} = C_{\text{journalism}} \land M_{\text{resolved}} \land D_{\text{complete}} \land E_{\text{active}} \land V_{\text{verified}} \land L_{\text{active}} \land \neg S_{\text{superseded}} \land \neg R_{\text{removed}}$$

Where:
- $C_{\text{journalism}}$: `category_id = '2b09cd61-7a23-4466-be58-889398e8f201'` (or mapped citation/seminar)
- $M_{\text{resolved}}$: `subcategory_id` maps to an authoritative component (`COMP_JOURN_NEWS`, `COMP_JOURN_LITERARY`, `COMP_JOURN_COLUMN`, `COMP_JOURN_EDITORIAL`, `COMP_JOURN_LEAD_ROLE`, `COMP_JOURN_LEAD_AWARDS`)
- $D_{\text{complete}}$: Structured metadata contains non-empty title, outlet, valid publication date, and contribution role
- $E_{\text{active}}$: Active evidence attachment count $\ge 1$
- $V_{\text{verified}}$: `status = 'verified'`
- $L_{\text{active}}$: Lifecycle status is `active`
- $\neg S_{\text{superseded}}$: Record is not superseded
- $\neg R_{\text{removed}}$: Record is not soft-deleted or removed

---

## 2. Verification vs. Lifecycle Eligibility Decision Matrix

| Verification Status ($V$) | Lifecycle Status ($L$) | Active Evidence? ($E$) | Metadata Complete? ($D$) | Future Scoring Eligible? | Scoring Points Assigned in Phase 3 |
|---|---|:---:|:---:|:---:|:---:|
| `verified` | `active` | **Yes ($\ge 1$)** | **Yes** | **YES (ELIGIBLE)** | **0.00** (Deferred to Phase 4) |
| `verified` | `archived` | Yes | Yes | **NO** | 0.00 |
| `verified` | `superseded` | Yes | Yes | **NO** | 0.00 |
| `verified` | `removed` | Yes | Yes | **NO** | 0.00 |
| `verified` | `active` | **No (0 files)** | Yes | **NO** | 0.00 |
| `verified` | `active` | Yes | **No** | **NO** | 0.00 |
| `submitted` | `active` | Yes | Yes | **NO** | 0.00 |
| `revisions_requested` | `active` | Yes | Yes | **NO** | 0.00 |
| `rejected` | `active` | Yes | Yes | **NO** | 0.00 |
| `draft` | `active` | Yes | Yes | **NO** | 0.00 |

---

## 3. Implementation in Backend Service

The single backend source of truth is encapsulated in `App\Services\CampusJournalismEligibilityService::evaluateRecordEligibility(array $record)`. This service is directly injected into the Phase 4 scoring engine, guaranteeing that future calculations never bypass verification or duplicate gate conditions.
