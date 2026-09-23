# PLAN 10 — Phase 1 College Color Master-Data Audit
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Authoritative College Color Master Storage

The authoritative source of truth for College Color is:
- **Table**: `colleges`
- **Field**: `colleges.acronym_badge_color` (Type: `VARCHAR(7)`, Hex format `#RRGGBB`)
- **Frontend Model**: `src/models/CollegeModel.js` (`this.acronym_badge_color`)

---

# 2. Configured Master Data Inventory

| College ID | Code | Full Name | Configured `acronym_badge_color` | Fallback Color |
|---|---|---|---|---|
| `5f427d0d-284d-438c-8a59-a04abec04de9` | **CEAC** | College of Engineering, Architecture, and Computing | **`#371683`** (Deep Purple) | `#16834A` |
| `20000000-0000-0000-0000-000000000001` | **CET** | College of Engineering and Technology | `NULL` | `#16834A` |
| `20000000-0000-0000-0000-000000000002` | **CBA** | College of Business and Accountancy | `NULL` | `#16834A` |
| `20000000-0000-0000-0000-000000000003` | **CAS** | College of Arts and Sciences | `NULL` | `#16834A` |
| `20000000-0000-0000-0000-000000000004` | **CTE** | College of Teacher Education | `NULL` | `#16834A` |
| `20000000-0000-0000-0000-000000000005` | **CHS** | College of Health Sciences | `NULL` | `#16834A` |

---

# 3. Integration Gap & Next Steps

1. **API Selection Gap**: `TargetProvisioningController::listStudents` currently selects `c.name AS college_name, c.code AS college_code`, but omits `c.acronym_badge_color AS college_color`.
2. **Frontend Fallback**: The frontend component should consume `user.college_color || '#16834A'` to render rich, colored pill badges for college acronyms.
