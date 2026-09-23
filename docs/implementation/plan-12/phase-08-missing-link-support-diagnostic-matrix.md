# PLAN 12 — Phase 8 Missing-Link Support & Diagnostic Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Post-Activation Missing Linkage Handling

| Missing Institutional Entity | Student Presentation | Admin Diagnostic Signal | Stack Trace Exposed? |
|---|---|---|---|
| **Student Organization** | "Student organization not yet assigned" | `OPTIONAL_ABSENT` (Valid unassigned state) | **NO (0)** |
| **Org Moderator** | "Organization moderator not yet assigned" | `OPTIONAL_ABSENT` (Valid unassigned state) | **NO (0)** |
| **Program Coordinator** | "Program coordinator not yet assigned" | `OPTIONAL_ABSENT` (Valid unassigned state) | **NO (0)** |
| **Academic Program Enrollment**| "Academic program information unavailable. Please contact OSAD."| `REQUIRED_MISSING` (Actionable enrollment needed)| **NO (0)** |
| **College Linkage** | "College information unavailable. Please contact OSAD." | `INTEGRITY_ERROR` (Actionable college setup needed) | **NO (0)** |
| **Base Profile Association** | Controlled support error card with retry button | `INTEGRITY_ERROR` (Orphan account without profile) | **NO (0)** |
