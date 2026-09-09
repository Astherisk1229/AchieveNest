# PLAN 10 — Phase 8 Recovery Action Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. State-to-Recovery Action Mapping

| Page / Row Condition | User Presentation | Primary Action CTA | Secondary Recovery Action | Context Preservation |
|---|---|---|---|---|
| **True Empty** | "No student accounts have been created yet." | `Add Student Account` | N/A | 0 records count |
| **Search Empty** | "No student accounts found matching \"{term}\"." | `Clear Search` | Adjust search query | Preserves college/program filters |
| **Filtered Empty**| "No student accounts match your filter criteria." | `Reset All Filters` | Remove individual filter chips | Preserves active chips bar |
| **List Failure** | "Student Accounts could not be loaded." | `Retry` | N/A | Preserves search & filter inputs |
| **Post-Commit Error**| "Student created, but list could not refresh." | `Retry List` | `View Created Student` | Does NOT resubmit create form |
| **Permission Denied**| "You do not have permission to view these accounts." | Re-authenticate / Logout | N/A | Hides all data rows |
