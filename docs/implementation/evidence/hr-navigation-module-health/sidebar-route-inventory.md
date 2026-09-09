# HR Sidebar Navigation & Route Inventory

| Sidebar Item | Route Path | Component | Target File | Role Context | API / Data Source | Initial Status | Verified Status |
|---|---|---|---|---|---|---|---|
| **HR Dashboard** | `/hr/dashboard` | `HRDashboardPage` | `src/pages/hr-admin/HRDashboardPage.jsx` | `hr_admin` / `hr_staff` | `/hr/dashboard`, `/hr/personnel` | STABLE | PASS |
| **Personnel Directory** | `/hr/personnel-directory` | `HRPersonnelDirectoryPage` | `src/pages/hr-admin/HRPersonnelDirectoryPage.jsx` | `hr_admin` / `hr_staff` | `/hr/personnel`, `/hr/personnel/:id/master-data` | CRASH on null read | PASS (Repaired) |
| **Evaluation Submissions** | `/hr/evaluation-submissions` | `HREvaluationSubmissionsPage` | `src/pages/hr-admin/HREvaluationSubmissionsPage.jsx` | `hr_admin` / `hr_staff` | `/hr/evaluation/submissions` | STABLE | PASS |
| **Faculty Evaluation & Ranking** | `/hr/faculty-evaluation-and-ranking` | `HRFacultyEvaluationOversightPage` | `src/pages/hr-admin/HRFacultyEvaluationOversightPage.jsx` | `hr_admin` / `hr_staff` | `useHR()` / Portfolios | UNBOUND PROPS | PASS (Repaired) |
| **HR Audit Trail** | `/hr/audit-trail` | `HRAuditTrailPage` | `src/pages/hr-admin/HRAuditTrailPage.jsx` | `hr_admin` / `hr_staff` | `/hr/audit` | STABLE | PASS |
| **Rank Assignment Logs** | `/hr/rank-assignment-logs` | `HRRankAssignmentLogsPage` | `src/pages/hr-admin/HRRankAssignmentLogsPage.jsx` | `hr_admin` / `hr_staff` | `/hr/audit` (RANK logs) | STABLE | PASS |
| **Password Resets** | `/hr/password-resets` | `HRPasswordResetRequestsPage` | `src/pages/hr-admin/HRPasswordResetRequestsPage.jsx` | `hr_admin` / `hr_staff` | `/password-resets` | STABLE | PASS |
| **Account** | `/hr/account` | `AccountPage` | `src/pages/common/AccountPage.jsx` | `hr_admin` / `hr_staff` | `/auth/me` | STABLE | PASS |
| **Settings** | `/hr/settings` | `SettingsPage` | `src/pages/common/SettingsPage.jsx` | `hr_admin` / `hr_staff` | Client Preferences | STABLE | PASS |

### Legacy Route Redirects
- `/hr/profile` ➔ `/hr/account` (301 replace)
- `/hr/personnel-governance` ➔ `/hr/personnel-directory` (301 replace)
- `/hr/verification-queue` ➔ `/hr/evaluation-submissions` (301 replace)
- `/hr/faculty-ranking-and-matrix` ➔ `/hr/faculty-evaluation-and-ranking` (301 replace)
- `/hr/accreditation-and-audit-logs` ➔ `/hr/audit-trail` (301 replace)
