# Phase 7C — Report and Export Specification
## PDF Layouts, CSV Schemas, Print CSS Standards, and Metadata Footers

**Domain:** Report & Export Specifications  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 23:05:00 UTC+08:00  

---

## 1. CSV / Spreadsheet Export Schema

```csv
award_cycle,generation_batch,student_id,student_name,institutional_id,program,college,publication_score,leadership_score,raw_score,raw_max,potential_score,threshold_percent,result,deliberation_status,snapshot_version,generated_at
"AY 2026-2027","batch_001","std_001","Maria Santos","STU-2024-001","BSIT","CEAC",54.00,8.00,62.00,70.00,88.57,80.00,"POTENTIAL_CANDIDATE","ENDORSED",1,"2027-03-20 10:00:00"
```

---

## 2. Institutional Report Metadata Footer

Every printed report and PDF output contains the canonical footer:

```text
────────────────────────────────────────────────────────────────────────────────────────
AchieveNest OSAD Reporting Engine • Award: Campus Journalism Award (CAMPUS_JOURNALISM_AWARD)
Award Cycle: AY 2026-2027 • Snapshot Version: 1 • Config Version: 0f85b20c • Generated: 2027-03-20
DISCLAIMER: Portfolio Potential Score represents portfolio-based discovery only. Moral Character (20 pts),
Panel Interview (10 pts), and official publication quality evaluation remain subject to OSAD human review.
────────────────────────────────────────────────────────────────────────────────────────
```

---

## 3. Print CSS Styling Standards

- `@media print` rules hide modal close buttons, backdrop overlays, and sidebar navigation chrome.
- Forces all multi-tier accordion sections (`CRIT_JOURN_PUB`, `CRIT_JOURN_LEAD`) to expand fully for complete visibility.
- Prevents table row orphans (`page-break-inside: avoid`).
