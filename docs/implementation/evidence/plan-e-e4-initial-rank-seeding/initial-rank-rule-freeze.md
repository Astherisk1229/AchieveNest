# Phase E4 Evidence: Initial Rank Rule Freeze (`NDMU-DOC-ACAD-RANKS-2026-V1`)

## Frozen Base / Starting Academic Ranks for Full-Time Faculty

| Qualification Group | Authoritative Verified Degrees / Licensures | Canonical Base Rank Code | Canonical Base Display Label | Tier Code |
|---|---|---|---|---|
| **Doctoral** | PhD, EdD, Ph.D., Ed.D. | `PROFESSOR_I` | Professor I | `doctoral` |
| **Master's / Professional Graduate** | MA, MS, MAT, MD, LL.B, Priests / Equiv | `ASSISTANT_PROFESSOR` | Assistant Professor | `masters` |
| **Professional Licensure** | CPA, ENGR, MEDTECH, CHEMIST, NURSE, DVM, ARCHITECT, DMD (Verified Licensure = True) | `SENIOR_INSTRUCTOR` | Senior Instructor | `board_licensure` |
| **Baccalaureate / Non-Board Probationary** | AB, BSE, BS, or Professional degree without verified licensure | `ASSISTANT_INSTRUCTOR` | Assistant Instructor | `baccalaureate` |

## Core Rule Invariants
1. **No Level Guessing**: Missing ranks seed to canonical entry-level ranks only. Never guess advanced tiers (e.g. Professor II–IV, Associate Professor I–IV, etc.).
2. **Initial Seeding Only**: Applies to records with missing/unresolved ranks. Existing valid ranks are preserved.
