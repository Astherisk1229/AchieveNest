# PLAN 10 — Phase 5 Permission & Backend Guard Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Action Authorization & Backend Guard Matrix

| UI Action Name | Frontend Visibility Guard | Target Backend Route | Controller Method | RBAC Guard / Permission |
|---|---|---|---|---|
| **View Details** | All OSAD Users | `GET /api/v1/osad/students/:id` | `TargetProvisioningController::getStudent` | `role: osad_admin` |
| **Reset Password** | `isPendingFirstLogin` or Admin | `POST /api/v1/osad/provision/reset-student-password` | `TargetProvisioningController::resetPassword` | `role: osad_admin` + active JWT |
| **Approve Reset Request**| Pending Requests tab | `POST /api/v1/osad/provision/approve-reset-request` | `TargetProvisioningController::approveReset` | `role: osad_admin` + active JWT |
