# PLAN 12 — Phase 2 Personnel Privacy & Field-Minimization Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Privacy Boundary & Field Filtering

| Field Category | Specific Attributes | API Response Inclusion | Security Verdict |
|---|---|---|---|
| **Approved Public Personnel Contact** | `full_name`, `email` (`@ndmu.edu.ph`), `designation_title`, `avatar_url` | **INCLUDED** | Safe Institutional Contact |
| **Private Personnel Contact** | Personal mobile, home phone, personal email, home address | **EXCLUDED** | **PROHIBITED (0 Leaks)** |
| **Authentication & Security Internals**| `password_hash`, temporary password flags, security tokens | **EXCLUDED** | **PROHIBITED (0 Leaks)** |
| **Personnel HR Evaluation Data** | Performance scores, ranking criteria, review remarks | **EXCLUDED** | **PROHIBITED (0 Leaks)** |
