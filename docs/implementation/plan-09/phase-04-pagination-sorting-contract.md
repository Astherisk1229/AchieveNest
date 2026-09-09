# PLAN 09 — Phase 4 Pagination & Sorting Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Deterministic Sorting Contract

To guarantee that pagination is 100% deterministic and free of order shifting across concurrent requests or page transitions, the server enforces a three-level order clause:

```sql
ORDER BY 
    p.last_name ASC,
    p.first_name ASC,
    p.id ASC
```

### Purpose of Components
1. **`p.last_name ASC`**: Primary alphabetical sorting by student surname.
2. **`p.first_name ASC`**: Secondary alphabetical sorting by student given name.
3. **`p.id ASC`**: Unique UUID primary key tie-breaker ensuring deterministic sequence when multiple students share identical names.

---

# 2. Pagination Contract

| Property | Default Value | Valid Range | Implementation Rule |
|---|---|---|---|
| **Page Index** | `1` | `>= 1` | 1-indexed pagination |
| **Page Size** | `25` (Frontend UI) | `1` to `100` | Limits batch size for performance |
| **Offset Computation** | `(page - 1) * page_size` | `>= 0` | Standard offset math |
| **Stability Guarantee** | High | N/A | Because `p.id` acts as tie-breaker, pagination offset yields deterministic subsets |

---

# 3. New Creation Placement Rule

- **Alphabetical View**: Newly created students appear on the page dictated by their surname.
- **Frontend Recommendation (Phase 5/6)**: Upon successful student creation, the frontend UI can optionally highlight the newly provisioned student or display an instant success notification with a direct filter/search option to locate the row immediately.
