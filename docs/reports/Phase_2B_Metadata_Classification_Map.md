# Phase 2B — Metadata Classification Map
## Canonical Classification, Structured Schemas, and Scoring Component Routing

**Domain:** Campus Journalism Portfolio Metadata & Taxonomy  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:35:00 UTC+08:00  

---

## 1. Overview & Canonical Taxonomy Hierarchy

Phase 2 establishes a 100% deterministic mapping from student portfolio input records to the canonical Phase 1 award components without relying on ambiguous text parsing or heuristics.

```text
[Portfolio Category] Campus Journalism / Publication (2b09cd61-7a23-4466-be58-889398e8f201)
  │
  ├── [Subcategory 01] News Item (40000009-0001-0000-0000-000000000001)
  │     └── Routes to: COMP_JOURN_NEWS (RULE_JOURN_NEWS: 2 pts/item, cap 10)
  │
  ├── [Subcategory 02] Literary Work (40000009-0001-0000-0000-000000000002)
  │     └── Routes to: COMP_JOURN_LITERARY (RULE_JOURN_LITERARY: 2 pts/item, cap 10)
  │
  ├── [Subcategory 03] Column (40000009-0001-0000-0000-000000000003)
  │     └── Routes to: COMP_JOURN_COLUMN (RULE_JOURN_COLUMN: 4 pts/item, cap 20)
  │
  ├── [Subcategory 04] Editorial (40000009-0001-0000-0000-000000000004)
  │     └── Routes to: COMP_JOURN_EDITORIAL (RULE_JOURN_EDITORIAL: 4 pts/item, cap 20)
  │
  ├── [Subcategory 05] Member / Staff / Contributor Role (40000009-0001-0000-0000-000000000005)
  │     └── Routes to: COMP_JOURN_LEAD_ROLE (RULE_JOURN_LEAD_ROLE: 2 pts, cap 5)
  │
  └── [Subcategory 06] Publication Officer Role (40000009-0001-0000-0000-000000000006)
        └── Routes to: COMP_JOURN_LEAD_ROLE (RULE_JOURN_LEAD_ROLE: 3 pts, cap 5)

[Portfolio Category] Citation / Recognition (448beadb-a254-4cb6-84fb-a3d5f4f8822e)
  └── [Journalism Awards & Citations] (Structured recognition_level in metadata)
        ├── International / National Award -> COMP_JOURN_LEAD_AWARDS (3 pts, cap 5)
        └── Local Award / Citation -> COMP_JOURN_LEAD_AWARDS (2 pts, cap 5)

[Portfolio Category] Seminar / Training (802de57b-54d7-4d38-9433-052ca9636380)
  └── [Journalism Seminars] -> COMP_JOURN_LEAD_AWARDS (Supporting Evidence Only, 0 pts)
```

---

## 2. Canonical Publication Types Classification Matrix

| Publication Type | Subcategory UUID | Target Component Code | Mapping Rule Code | Points per Item | Cap | Max Records |
|---|---|---|---|---:|---:|---:|
| **News Item** | `40000009-0001-0000-0000-000000000001` | `COMP_JOURN_NEWS` | `MAP_JOURN_NEWS` | 2.00 | 10.00 | 5 |
| **Literary Work** | `40000009-0001-0000-0000-000000000002` | `COMP_JOURN_LITERARY` | `MAP_JOURN_LITERARY` | 2.00 | 10.00 | 5 |
| **Column** | `40000009-0001-0000-0000-000000000003` | `COMP_JOURN_COLUMN` | `MAP_JOURN_COLUMN` | 4.00 | 20.00 | 5 |
| **Editorial** | `40000009-0001-0000-0000-000000000004` | `COMP_JOURN_EDITORIAL` | `MAP_JOURN_EDITORIAL` | 4.00 | 20.00 | 5 |

---

## 3. Leadership Involvement Classification Matrix

| Role Family | Subcategory UUID / Key | Target Component Code | Mapping Rule Code | Qualifying Positions / Roles | Points | Cap |
|---|---|---|---|---|---:|---:|
| **Officer Family** | `40000009-0001-0000-0000-000000000006` | `COMP_JOURN_LEAD_ROLE` | `MAP_JOURN_OFFICER` | Editor-in-Chief, Associate Editor, Managing Editor, Section Editor, Publication Officer | 3.00 | 5.00 |
| **Member / Staff Family** | `40000009-0001-0000-0000-000000000005` | `COMP_JOURN_LEAD_ROLE` | `MAP_JOURN_MEMBER` | Staff Writer, Layout Artist, Contributor, Photojournalist, General Member | 2.00 | 5.00 |
| **No Qualifying Role** | Unmatched / None | — | — | Unaffiliated | 0.00 | 0.00 |

---

## 4. Journalism Recognition Classification Matrix

| Recognition Scope | Category UUID | Target Component Code | Mapping Rule Code | Required Structured Metadata | Points | Cap |
|---|---|---|---|---|---:|---:|
| **International Award** | `448beadb-a254-4cb6-84fb-a3d5f4f8822e` | `COMP_JOURN_LEAD_AWARDS` | `MAP_JOURN_AWARDS` | `{"recognition_level": "international"}` | 3.00 | 5.00 |
| **National Award** | `448beadb-a254-4cb6-84fb-a3d5f4f8822e` | `COMP_JOURN_LEAD_AWARDS` | `MAP_JOURN_AWARDS` | `{"recognition_level": "national"}` | 3.00 | 5.00 |
| **Local Award / Citation** | `448beadb-a254-4cb6-84fb-a3d5f4f8822e` | `COMP_JOURN_LEAD_AWARDS` | `MAP_JOURN_AWARDS` | `{"recognition_level": "local"}` | 2.00 | 5.00 |
| **Journalism Seminar / Training** | `802de57b-54d7-4d38-9433-052ca9636380` | `COMP_JOURN_LEAD_AWARDS` | `MAP_JOURN_SEMINARS` | `{"is_seminar_training": true}` | **0.00** (Supporting) | 0.00 |

---

## 5. Structured Metadata JSON Schemas

### 5.1 Publication Work Schema
```json
{
  "contribution_role": "writer",
  "publication_name": "The NDMU Herald",
  "issue_volume": "Vol. 42 No. 1",
  "page_number": "pp. 4-5",
  "article_url": "https://herald.ndmu.edu.ph/2025/10/editorial-ai-ethics"
}
```

### 5.2 Leadership Involvement Schema
```json
{
  "role_title": "Editor-in-Chief",
  "publication_organization": "The NDMU Herald",
  "academic_year": "AY 2025-2026",
  "start_date": "2025-08-01",
  "end_date": "2026-05-31",
  "appointment_ref": "OSAD-APPT-2025-042"
}
```

### 5.3 Journalism Recognition Schema
```json
{
  "award_title": "1st Place - Best Editorial Column",
  "conferring_body": "Philippine Information Agency (PIA) Region XII",
  "recognition_level": "national",
  "event_date": "2025-11-15",
  "is_journalism_related": true
}
```
