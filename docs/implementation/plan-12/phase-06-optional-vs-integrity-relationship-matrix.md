# PLAN 12 — Phase 6 Optional-vs-Integrity Relationship Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Relationship Cardinality & Integrity Rules

| Relationship Layer | Required by Policy? | Valid If Absent? | Classification When Missing |
|---|---|---|---|
| **Account -> Student Profile** | **YES** | **NO** | `INTEGRITY_ERROR` (Profile link missing) |
| **Student -> Academic Program** | **YES** | **NO** | `REQUIRED_MISSING` (Needs enrollment) |
| **Program -> College** | **YES** | **NO** | `INTEGRITY_ERROR` (Program lacks college) |
| **Student -> Organization** | **NO** | **YES** | `OPTIONAL_ABSENT` (Unassigned org) |
| **Organization -> Moderator** | **NO** | **YES** | `OPTIONAL_ABSENT` (Unassigned mod) |
| **Program -> Coordinator** | **NO** | **YES** | `OPTIONAL_ABSENT` (Unassigned coord) |
