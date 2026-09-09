# Phase 1B — Campus Journalism Configuration Map
## Canonical Data Hierarchy and Scoring Rules Specification

**Award Master Name:** Campus Journalism Award  
**Award Code:** `CAMPUS_JOURNALISM_AWARD`  
**Award Definition UUID:** `50000001-0000-0000-0000-000000000023`  
**Published Version:** `v1.0 Published` (`0f85b20c-a461-11f1-a155-08453f707323`)  
**Timestamp:** 2026-08-31 22:30:00 UTC+08:00  

---

## 1. Award Hierarchy Overview

```text
[Award] Campus Journalism Award (100.00 Official Rubric / 70.00 Computable Raw Max)
  │
  ├── [Criterion 1] Character (20.00 pts, Non-computable, OFFICIAL)
  │
  ├── [Criterion 2] Verified Publication Evidence / Quality of Publication (60.00 pts, Computable, SYSTEM_OPERATIONALIZATION)
  │     ├── [Component A1] News Item Evidence (Max 10.00 pts)
  │     │     └── [Rule] 2.0 pts per item, sum_capped, cap 10.00 (max 5 records)
  │     │
  │     ├── [Component A2] Literary Evidence (Max 10.00 pts)
  │     │     └── [Rule] 2.0 pts per item, sum_capped, cap 10.00 (max 5 records)
  │     │
  │     ├── [Component A3] Column Evidence (Max 20.00 pts)
  │     │     └── [Rule] 4.0 pts per item, sum_capped, cap 20.00 (max 5 records)
  │     │
  │     └── [Component A4] Editorial Evidence (Max 20.00 pts)
  │           └── [Rule] 4.0 pts per item, sum_capped, cap 20.00 (max 5 records)
  │
  ├── [Criterion 3] Leadership in Campus Journalism (10.00 pts, Computable, OFFICIAL)
  │     ├── [Component B1] Leadership Involvement (Max 5.00 pts)
  │     │     └── [Rule] Officer = 3.0 pts, Member / Contributor = 2.0 pts, sum_capped, cap 5.00
  │     │
  │     └── [Component B2] Journalism Awards / Citations (Max 5.00 pts)
  │           └── [Rule] Int'l / National Award = 3.0 pts, Local Award / Citation = 2.0 pts, Seminars = 0.0 pts, cap 5.00
  │
  └── [Criterion 4] Interview (10.00 pts, Non-computable, OFFICIAL)
```

---

## 2. Authoritative Award Definition Record

```json
{
  "id": "50000001-0000-0000-0000-000000000023",
  "code": "CAMPUS_JOURNALISM_AWARD",
  "name": "Campus Journalism Award",
  "category": "journalism",
  "description": "Premier graduating award recognizing exemplary journalistic dedication, verified publication excellence, editorial integrity, and campus publication leadership.",
  "authority_status": "OFFICIAL",
  "source_fidelity_status": "VERIFIED",
  "is_catalog_visible": 1,
  "graduating_only": 1,
  "gender_restriction": null,
  "candidate_threshold_percent": 80.00,
  "status": "active",
  "active_scoring_version": "1.0"
}
```

---

## 3. Official Criteria Specifications (100.00 Points Rubric)

| Criterion Code | Criterion Name | Weight | Max Pts | Computable? | Authority Status | UUID |
|---|---|---:|---:|:---:|---|---|
| `CRIT_JOURN_CHARACTER` | Character | 20.00 | 20.00 | No (0) | `OFFICIAL` | `50000002-0023-0000-0000-000000000001` |
| `CRIT_JOURN_PUB_QUALITY` | Quality of Publication / Verified Evidence | 60.00 | 60.00 | **Yes (1)** | `SYSTEM_OPERATIONALIZATION` | `50000002-0023-0000-0000-000000000002` |
| `CRIT_JOURN_LEADERSHIP` | Leadership in Campus Journalism | 10.00 | 10.00 | **Yes (1)** | `OFFICIAL` | `50000002-0023-0000-0000-000000000003` |
| `CRIT_JOURN_INTERVIEW` | Interview | 10.00 | 10.00 | No (0) | `OFFICIAL` | `50000002-0023-0000-0000-000000000004` |
| **Totals** | **4 Criteria** | **100.00** | **100.00** | **70.00 Computable** | — | — |

---

## 4. Criterion Components Breakdown (Subcriteria)

| Component Code | Component Name | Parent Criterion Code | Max Pts | Sort Order | Authority Status | UUID |
|---|---|---|---:|---:|---|---|
| `COMP_JOURN_NEWS` | News Item Evidence | `CRIT_JOURN_PUB_QUALITY` | 10.00 | 1 | `SYSTEM_OPERATIONALIZATION` | `50000003-0023-0000-0000-000000000001` |
| `COMP_JOURN_LITERARY` | Literary Evidence | `CRIT_JOURN_PUB_QUALITY` | 10.00 | 2 | `SYSTEM_OPERATIONALIZATION` | `50000003-0023-0000-0000-000000000002` |
| `COMP_JOURN_COLUMN` | Column Evidence | `CRIT_JOURN_PUB_QUALITY` | 20.00 | 3 | `SYSTEM_OPERATIONALIZATION` | `50000003-0023-0000-0000-000000000003` |
| `COMP_JOURN_EDITORIAL` | Editorial Evidence | `CRIT_JOURN_PUB_QUALITY` | 20.00 | 4 | `SYSTEM_OPERATIONALIZATION` | `50000003-0023-0000-0000-000000000004` |
| `COMP_JOURN_LEAD_ROLE` | Leadership Involvement | `CRIT_JOURN_LEADERSHIP` | 5.00 | 1 | `OFFICIAL` | `50000003-0023-0000-0000-000000000005` |
| `COMP_JOURN_LEAD_AWARDS` | Journalism Awards / Citations | `CRIT_JOURN_LEADERSHIP` | 5.00 | 2 | `OFFICIAL` | `50000003-0023-0000-0000-000000000006` |

---

## 5. Authoritative Scoring Rules Specification

### 5.1 Publication Subcriteria Rules (Criterion 2)

#### 1. News Item Rule (`RULE_JOURN_NEWS`)
- **UUID:** `50000005-0023-0000-0000-000000000001`
- **Rule Type:** `sum_capped`
- **Points per Qualifying Record:** `2.00`
- **Maximum Points:** `10.00`
- **Maximum Contributing Records:** `5`
- **Rule Config JSON:**
  ```json
  {
    "points_per_item": 2.0,
    "cap": 10.0,
    "max_points": 10.0,
    "max_contributing_records": 5
  }
  ```
- **Authoritative Description:**
  > 2 points per verified published news item, maximum 10 points. Only qualifying verified published records contribute. Duplicate records, drafts, unpublished pieces, pending, rejected, deleted/inactive, or unverified records contribute 0 points. Maximum contributing records: 5.

#### 2. Literary Work Rule (`RULE_JOURN_LITERARY`)
- **UUID:** `50000005-0023-0000-0000-000000000002`
- **Rule Type:** `sum_capped`
- **Points per Qualifying Record:** `2.00`
- **Maximum Points:** `10.00`
- **Maximum Contributing Records:** `5`
- **Rule Config JSON:**
  ```json
  {
    "points_per_item": 2.0,
    "cap": 10.0,
    "max_points": 10.0,
    "max_contributing_records": 5
  }
  ```
- **Authoritative Description:**
  > 2 points per verified published literary work, maximum 10 points. Only qualifying verified published records contribute. Maximum contributing records: 5.

#### 3. Column Rule (`RULE_JOURN_COLUMN`)
- **UUID:** `50000005-0023-0000-0000-000000000003`
- **Rule Type:** `sum_capped`
- **Points per Qualifying Record:** `4.00`
- **Maximum Points:** `20.00`
- **Maximum Contributing Records:** `5`
- **Rule Config JSON:**
  ```json
  {
    "points_per_item": 4.0,
    "cap": 20.0,
    "max_points": 20.0,
    "max_contributing_records": 5
  }
  ```
- **Authoritative Description:**
  > 4 points per verified published column, maximum 20 points. Only qualifying verified published records contribute. Maximum contributing records: 5.

#### 4. Editorial Rule (`RULE_JOURN_EDITORIAL`)
- **UUID:** `50000005-0023-0000-0000-000000000004`
- **Rule Type:** `sum_capped`
- **Points per Qualifying Record:** `4.00`
- **Maximum Points:** `20.00`
- **Maximum Contributing Records:** `5`
- **Rule Config JSON:**
  ```json
  {
    "points_per_item": 4.0,
    "cap": 20.0,
    "max_points": 20.0,
    "max_contributing_records": 5
  }
  ```
- **Authoritative Description:**
  > 4 points per verified published editorial, maximum 20 points. Only qualifying verified published records contribute. Maximum contributing records: 5.

---

### 5.2 Leadership in Campus Journalism Rules (Criterion 3)

#### 5. Leadership Involvement Role Rule (`RULE_JOURN_LEAD_ROLE`)
- **UUID:** `50000005-0023-0000-0000-000000000005`
- **Rule Type:** `sum_capped`
- **Maximum Points:** `5.00`
- **Role Point Values:**
  - `Officer in campus publication`: **3.00 points**
  - `Member / Staff / Contributor`: **2.00 points**
  - `No qualifying role`: **0.00 points**
- **Rule Config JSON:**
  ```json
  {
    "role_points": {
      "officer": 3.0,
      "member": 2.0,
      "contributor": 2.0,
      "staff": 2.0
    },
    "cap": 5.0,
    "max_points": 5.0
  }
  ```
- **Authoritative Description:**
  > 3 points for Officer in campus publication, 2 points for Member/Staff/Contributor. Subsection maximum: 5 points.

#### 6. Journalism Awards / Citations Rule (`RULE_JOURN_LEAD_AWARDS`)
- **UUID:** `50000005-0023-0000-0000-000000000006`
- **Rule Type:** `sum_capped`
- **Maximum Points:** `5.00`
- **Recognition Point Values:**
  - `International journalism-related award`: **3.00 points**
  - `National journalism-related award`: **3.00 points**
  - `Local journalism-related award or citation`: **2.00 points**
  - `Journalism seminar / training`: **0.00 points** (Non-scoring supporting evidence)
- **Rule Config JSON:**
  ```json
  {
    "points_per_record": {
      "award_international": 3.0,
      "award_national": 3.0,
      "award_local": 2.0,
      "seminar": 0.0
    },
    "cap": 5.0,
    "max_points": 5.0
  }
  ```
- **Authoritative Description:**
  > 3 points for International/National journalism award, 2 points for Local journalism award or citation. Journalism seminars/trainings serve as non-scoring supporting evidence (0 points). Subsection maximum: 5 points.

---

## 6. Declarative Evidence Mapping Rules

| Mapping Rule Code | Target Component Code | Sourced Portfolio Category | Sourced Portfolio Subcategory | Priority | UUID |
|---|---|---|---|---:|---|
| `MAP_JOURN_NEWS` | `COMP_JOURN_NEWS` | Campus Journalism (`...f201`) | News Item (`...0001`) | 10 | `50000004-0023-0000-0000-000000000001` |
| `MAP_JOURN_LITERARY` | `COMP_JOURN_LITERARY` | Campus Journalism (`...f201`) | Literary Work (`...0002`) | 20 | `50000004-0023-0000-0000-000000000002` |
| `MAP_JOURN_COLUMN` | `COMP_JOURN_COLUMN` | Campus Journalism (`...f201`) | Column (`...0003`) | 30 | `50000004-0023-0000-0000-000000000003` |
| `MAP_JOURN_EDITORIAL` | `COMP_JOURN_EDITORIAL` | Campus Journalism (`...f201`) | Editorial (`...0004`) | 40 | `50000004-0023-0000-0000-000000000004` |
| `MAP_JOURN_OFFICER` | `COMP_JOURN_LEAD_ROLE` | Campus Journalism (`...f201`) | Publication Officer (`...0006`) | 10 | `50000004-0023-0000-0000-000000000005` |
| `MAP_JOURN_MEMBER` | `COMP_JOURN_LEAD_ROLE` | Campus Journalism (`...f201`) | Member/Contributor (`...0005`) | 20 | `50000004-0023-0000-0000-000000000006` |
| `MAP_JOURN_AWARDS` | `COMP_JOURN_LEAD_AWARDS` | Citation / Recognition (`...822e`) | All / Journalism Citation | 10 | `50000004-0023-0000-0000-000000000007` |
| `MAP_JOURN_SEMINARS` | `COMP_JOURN_LEAD_AWARDS` | Seminar / Training (`...6380`) | All / Journalism Seminar | 20 | `50000004-0023-0000-0000-000000000008` |

---

## 7. Gate 1B Conclusion & Approval

- **Gate Status:** **PASSED**
- All Campus Journalism point limits, record caps, role matrices, recognition tiers, non-scoring seminar mappings, and explanation strings are authoritatively configured in the data model. No points or business logic are embedded solely in frontend code.
