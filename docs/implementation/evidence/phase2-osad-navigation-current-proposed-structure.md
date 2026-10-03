# Plan 06 Phase 2 — Current vs Proposed Navigation Structure
## Mapping of Current Flat Sequence to Task-Based Workflow Families

### Current Flat Architecture (Phase 1 Baseline)
```text
NAVIGATION (Flat Header)
  ├── 1. OSAD Dashboard (/osad/dashboard)
  ├── 2. Academic Structure (/osad/dashboard?tab=academic-structure)
  ├── 3. Student Accounts (/osad/dashboard?tab=accounts)
  ├── 4. Student Organizations (/osad/dashboard?tab=organizations)
  ├── 5. Awards & Scoring Criteria (/osad/dashboard?tab=awards)
  ├── 6. Certificate Templates (/osad/dashboard?tab=certificate-templates)
  ├── 7. Award Candidate Review (/osad/dashboard?tab=candidate-review)
  ├── 8. Accreditation Reports (/osad/dashboard?tab=reports)
  ├── 9. OSAD Activity Log (/osad/dashboard?tab=audit)
  └── 10. Password Resets (/osad/dashboard?tab=password-resets)
```

---

### Proposed Task-Based Architecture (Phase 2 Target)
```text
OVERVIEW
  └── OSAD Dashboard (/osad/dashboard)

STUDENT & INSTITUTIONAL SETUP
  ├── Academic Structure (/osad/dashboard?tab=academic-structure)
  ├── Student Accounts (/osad/dashboard?tab=accounts)
  ├── Student Organizations (/osad/dashboard?tab=organizations)
  └── Password Resets (/osad/dashboard?tab=password-resets)

PORTFOLIO & EVALUATION
  ├── Awards & Scoring Criteria (/osad/dashboard?tab=awards)
  └── Award Candidate Review (/osad/dashboard?tab=candidate-review)

EVENTS & CERTIFICATES
  └── Certificate Templates (/osad/dashboard?tab=certificate-templates)

GOVERNANCE & REPORTS
  ├── Accreditation Reports (/osad/dashboard?tab=reports)
  └── OSAD Activity Log (/osad/dashboard?tab=audit)
```

- **Total Items Preserved**: **10 / 10 (100%)**.
- **Route Changes**: **0 (Zero)**.
- **Permission Changes**: **0 (Zero)**.
