# PLAN 12 — Phase 5 Contact Card State Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Card State Specifications

| Scenario | Coordinator Card State | Moderator Card State | Visual Presentation |
|---|---|---|---|
| **Active Valid Assignment** | Active Contact Card | Active Contact Card | Name, Designation, Email Link, Scope Badge |
| **Unassigned / Open** | Neutral Informative | Neutral Informative | "Program coordinator / Organization moderator not yet assigned" |
| **Data Fetching / Loading** | Loading Spinner | Loading Spinner | "Loading authoritative student profile..." |
| **Technical Query Failure**| Alert Card with Retry | Alert Card with Retry | "Unable to Load Profile" + "Retry" Button |
| **Historical Assignment** | **Suppressed** | **Suppressed** | Treated as Unassigned |
| **Suspended / Inactive Personnel**| **Suppressed**| **Suppressed**| Treated as Unassigned |
