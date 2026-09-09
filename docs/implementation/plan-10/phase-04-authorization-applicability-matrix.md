# PLAN 10 — Phase 4 Authorization & Applicability Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Action Authorization & RBAC Boundaries

| Operational Action | Target Backend Endpoint | Allowed Roles | Pre-Conditions | Confirmation Required? |
|---|---|---|---|---|
| **View Portfolio / Details** | `GET /api/v1/osad/students/:id` | `osad_admin` | Valid account ID | No |
| **Reset Temporary Password** | `POST /api/v1/osad/provision/reset-student-password` | `osad_admin` | `status = 'active'` | **Yes** (Confirm modal) |
| **Approve Reset Request** | `POST /api/v1/osad/provision/approve-reset-request` | `osad_admin` | `request.status = 'pending'` | **Yes** (Toast notification) |
| **Suspend Student Account** | `POST /api/v1/osad/provision/suspend-student` | `osad_admin` | `status = 'active'` | **Yes** (Confirm modal) |
| **Archive Student Account** | `POST /api/v1/osad/provision/archive-student` | `osad_admin` | `status != 'archived'` | **Yes** (Destructive confirm) |
| **Restore Student Account** | `POST /api/v1/osad/provision/restore-student` | `osad_admin` | `status = 'archived'` | **Yes** (Confirm modal) |
