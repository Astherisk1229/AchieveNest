# Phase 5C — Scoring Accordion Specification
## Expandable Multi-Tier Hierarchy, Detailed Dropdowns, and Evidence Table Layout

**Domain:** Scoring Accordion & Explainability UI  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:50:00 UTC+08:00  

---

## 1. Multi-Tier Visual Hierarchy

```text
Level 1: Criteria Sections
  ├── [▼] 1. Verified Publication Evidence (54.00 / 60.00 pts)
  │     ├── [▼] News Item (10.00 / 10.00 pts, Cap Applied)
  │     │     ├── Rule summary & counts (7 qualifying, 5 counted, 2 cap-reached)
  │     │     └── Evidence Table (Article A, B, C, D, E, F, G)
  │     ├── [►] Literary Works (8.00 / 10.00 pts)
  │     ├── [►] Columns (16.00 / 20.00 pts)
  │     └── [►] Editorials (20.00 / 20.00 pts, Cap Applied)
  │
  ├── [▼] 2. Leadership in Campus Journalism (8.00 / 10.00 pts)
  │     ├── [▼] Leadership Involvement (3.00 / 5.00 pts)
  │     │     └── Evidence Table (Editor-in-Chief, AY 2025-2026, +3.0 pts)
  │     └── [▼] Journalism Awards & Citations (5.00 / 5.00 pts)
  │           └── Evidence Table (National Award: +3.0, Local Citation: +2.0, Seminar: 0.0 Supporting)
  │
  └── [i] 3. OSAD Human-Evaluated Rubric Criteria
        ├── Moral Character / Conduct (20.00 pts Max) — Not automatically scored
        └── Panel Interview / Deliberation (10.00 pts Max) — Not automatically scored
```

---

## 2. Table Column Schema & Visual Badges

| Column Name | Data Field | Display Style | Example Value |
|---|---|---|---|
| **Title / Work** | `record.title` | Truncated, bold font | *Editorial: The Ethical Horizon of AI* |
| **Outlet / Body** | `record.publication_outlet` | Regular text | *The NDMU Herald* |
| **Date / Period** | `record.publication_date` | Muted small text | *2025-10-15* |
| **Verification** | `record.verification_status` | Emerald Badge (`#eef7f0`) | `Verified` |
| **Contribution** | `record.contribution_status` | Status Badge | `COUNTED` / `CAP_REACHED` / `SUPPORTING_ONLY` |
| **Points Awarded**| `record.points_awarded` | Bold right-aligned | `+4.0`, `+2.0`, `+0.0` |
