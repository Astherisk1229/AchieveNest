# PLAN 12 — Phase 6 Administrative Diagnostic Classification Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. 6-State Diagnostic Model

| Classification Code | State Meaning | Example Scenario | Student-Visible Text | Admin Diagnostic View |
|---|---|---|---|---|
| `COMPLETE` | Valid active relationship | Enrolled in BSCS under CITE | Normal display | Status: Valid & Active |
| `OPTIONAL_ABSENT` | Valid unassigned optional entity| No organization assigned | "Student organization not yet assigned" | Status: Optional / Open |
| `REQUIRED_MISSING` | Missing required institutional entity| No active program enrollment | "Program information unavailable" | Action: Needs Program Enrollment |
| `INTEGRITY_ERROR` | Broken relational join / missing FK | Coordinator ID references missing row | "Contact information unavailable"| Action: Missing Personnel Profile |
| `TEMPORARILY_UNAVAILABLE`| Network / DB query exception | Database connection timeout | "Information temporarily unavailable"| Status: Upstream Service Fault |
| `CONFLICT` | Conflicting active assignments | Multiple active coordinators | "Information temporarily unavailable"| Action: Inconsistent Active State |
