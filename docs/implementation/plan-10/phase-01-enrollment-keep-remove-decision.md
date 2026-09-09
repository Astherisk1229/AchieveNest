# PLAN 10 — Phase 1 Enrollment Keep/Remove Decision Record
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Empirical Evidence & Distribution Analysis

### 1.1 Database Distribution in `student_profiles`
- **Total Student Profiles**: `103`
- **`enrollment_status = 'enrolled'`**: `103` (100.0%)
- **`enrollment_status = 'graduated'`**: `0` (0.0%)
- **`enrollment_status = 'inactive'`**: `0` (0.0%)
- **`enrollment_status = NULL`**: `0` (0.0%)

### 1.2 Operational Dependency Audit
- **Filtering**: There is no filter for enrollment status; OSAD administrators filter students by Year Level, College, Program, and Account Status.
- **Workflow Triggers**: No operational buttons, modals, or lifecycle actions in the Student Accounts directory change or evaluate `enrollment_status`.
- **Visual Impact**: Occupies ~100px of table width across all breakpoints while displaying the identical static badge `"Enrolled"` on every row.

---

# 2. Decision & Justification

```text
========================================================================
ENROLLMENT DECISION: REMOVE FROM DEFAULT TABLE
DESTINATION: MOVE TO VIEW DETAILS / PORTFOLIO INSPECTOR
========================================================================
```

### Justification:
1. **Zero Information Entropy**: A 100% constant column communicates no differentiating information.
2. **De-cluttering & Congestion Relief**: Removing the redundant `Enrollment` column reclaims 100px of horizontal table space, eliminating horizontal truncation of Program names.
3. **No Loss of Data**: `enrollment_status` remains preserved in the database and API responses, and will be displayed inside the student's **View Details / Portfolio Inspector** modal.
