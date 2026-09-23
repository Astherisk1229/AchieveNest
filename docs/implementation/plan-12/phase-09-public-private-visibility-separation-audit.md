# PLAN 12 — Phase 9 Public/Private Visibility Separation Audit
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Surface Isolation & Authorization Separation

| Surface Dimension | Private Student Profile (`/student/account`) | Public Portfolio (`/portfolio/:slug`) | Separation Invariant |
|---|---|---|---|
| **Route Access** | Requires authenticated student session | Public / Guest Accessible | Strict Route Guard |
| **API Endpoint** | `GET /api/v1/student/profile` | `GET /api/v1/public/portfolio/:slug` | Separate Endpoints |
| **Data Scope** | Full institutional placement, contacts | Public accomplishments & badges only | Separate DTOs |
| **Cache Key** | `['student-profile', userId, role]` | `['public-portfolio', slug]` | Distinct Query Keys |
| **Institutional Email**| Displayed for student's own reference | Hidden unless publicly consented | Field Minimization |
