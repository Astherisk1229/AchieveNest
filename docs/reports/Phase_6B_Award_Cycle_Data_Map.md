# Phase 6B — Award Cycle Data Map
## Award Cycle Entity Model, Lifecycle States, Evidence Cutoff, and Authorization Rules

**Domain:** Award Cycle Management  
**Target Award:** Campus Journalism Award (`CAMPUS_JOURNALISM_AWARD`)  
**Timestamp:** 2026-08-31 22:55:00 UTC+08:00  

---

## 1. Award Cycle Entity Schema

```sql
CREATE TABLE IF NOT EXISTS public.award_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  academic_year text NOT NULL,
  graduation_batch text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','generation_locked','under_deliberation','closed','archived')),
  evidence_cutoff_at timestamptz,
  candidate_generation_open_at timestamptz,
  candidate_generation_close_at timestamptz,
  deliberation_start_at timestamptz,
  deliberation_end_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 2. Award Cycle Lifecycle State Machine

```text
┌──────────────┐
│    DRAFT     │
└──────┬───────┘
       │ (Admin opens cycle for portfolio submissions & verification)
       ▼
┌──────────────┐
│     OPEN     │◄──────────────────────────────────┐
└──────┬───────┘                                   │
       │ (OSAD executes candidate generation run)  │ (Admin reopens
       ▼                                           │  for regeneration)
┌───────────────────────┐                          │
│   GENERATION_LOCKED   │──────────────────────────┘
└──────┬────────────────┘
       │ (Committee begins review & deliberation)
       ▼
┌────────────────────────┐
│   UNDER_DELIBERATION   │
└──────┬─────────────────┘
       │ (Deliberation concludes; winners officially announced)
       ▼
┌──────────────┐
│    CLOSED    │
└──────┬───────┘
       │ (Archived for historical records)
       ▼
┌──────────────┐
│   ARCHIVED   │
└──────────────┘
```

---

## 3. Evidence Cutoff Enforcement Standard

- **Cutoff Field**: `student_portfolio_records.occurrence_date` (or `start_date`) $\le \text{evidence\_cutoff\_at}$.
- **Verification Rule**: Only records verified prior to generation execution are eligible.
- **Immutability Guarantee**: Records uploaded or verified after `evidence_cutoff_at` do not alter existing locked snapshots.
