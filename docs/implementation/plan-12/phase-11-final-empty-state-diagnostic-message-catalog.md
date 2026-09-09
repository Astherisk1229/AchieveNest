# PLAN 12 — Final Empty-State & Diagnostic Message Catalog
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Catalog of Empty States & Diagnostic Codes

| Condition | Student-Facing UI Text | Admin Diagnostic Classification | Actionable Office |
|---|---|---|---|
| **No Org Assigned** | "Student organization not yet assigned" | `OPTIONAL_ABSENT` | OSAD Leadership |
| **No Moderator Assigned** | "Organization moderator not yet assigned" | `OPTIONAL_ABSENT` | OSAD Leadership |
| **No Coordinator Assigned** | "Program coordinator not yet assigned" | `OPTIONAL_ABSENT` | Academic Dean / OSAD |
| **Missing Program Enrollment**| "Your academic program information is currently unavailable. Please contact OSAD." | `REQUIRED_MISSING` | Registrar / OSAD |
| **Missing College Link** | "College information unavailable. Please contact OSAD." | `INTEGRITY_ERROR` | OSAD Academic |
| **Technical Query Failure** | "Information temporarily unavailable" (with Retry) | `TEMPORARILY_UNAVAILABLE` | IT Infrastructure |
| **Multiple Active Conflict**| "Information temporarily unavailable" (with Retry) | `CONFLICT` | OSAD Admin |
