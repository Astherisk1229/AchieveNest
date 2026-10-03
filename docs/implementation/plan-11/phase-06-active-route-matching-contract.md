# PLAN 11 — Phase 6 Active Route Matching Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Executive Summary

This report documents the normalized route matching algorithms, query parameter handling, active state visual contracts, and authorization synchronizations under **Plan 11 Phase 6 — Active Route and Authorization Consistency**.

### Key Route Matching Rules
1. **Pure Router Authority**:
   - Active state is derived exclusively from `useLocation().pathname` and `useSearchParams().get('tab')`.
   - Manual state variables (`activeItem`, `selectedMenu`) are strictly `0`.
2. **Dashboard Tab & Alias Normalization**:
   - Matches tab parameters and established workflow aliases (e.g. `academic-structure` matches `colleges` & `programs`; `accounts` matches `students` & `student-accounts`).
3. **Prefix Safety**:
   - Exact route segment comparisons prevent false positives between routes with overlapping text prefixes.

---

# 2. Matching Logic Specification

```javascript
const isTabOrPathActive = (item) => {
  const currentCleanPath = location.pathname.split('?')[0]
  const itemCleanPath = item.path.split('?')[0]
  
  if (item.tab && isDashboardPage) {
    const activeTab = (activeTabParam || 'overview').toLowerCase()
    const itemTab = item.tab.toLowerCase()
    if (activeTab === itemTab) return true
    if (itemTab === 'academic-structure' && ['colleges', 'programs'].includes(activeTab)) return true
    if (itemTab === 'accounts' && ['students', 'student-accounts'].includes(activeTab)) return true
    if (itemTab === 'organizations' && ['orgs', 'student-organizations'].includes(activeTab)) return true
    if (itemTab === 'password-resets' && ['resets'].includes(activeTab)) return true
    if (itemTab === 'awards' && ['criteria', 'award-categories'].includes(activeTab)) return true
    if (itemTab === 'candidate-review' && ['awardees', 'candidates'].includes(activeTab)) return true
    if (itemTab === 'certificate-templates' && ['templates'].includes(activeTab)) return true
    if (itemTab === 'reports' && ['accreditation', 'compliance'].includes(activeTab)) return true
    if (itemTab === 'audit' && ['activity-log', 'logs', 'audit-logs'].includes(activeTab)) return true
    return false
  }
  
  return currentCleanPath === itemCleanPath
}
```
