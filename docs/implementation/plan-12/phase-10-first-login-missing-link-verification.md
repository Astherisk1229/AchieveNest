# PLAN 12 — Phase 10 First-Login & Missing-Link Verification
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Post-Activation & Support Verification

1. **First-Login Integration Flow**:
   - Activation via temporary credential change transitions immediately to `/student/account`.
   - The profile resolves from the newly activated bearer session without requiring client student ID parameters.
2. **Missing Account-to-Profile Linkage**:
   - If an activated user has no linked `student_profiles` row, the system presents a controlled support message (*"Unable to resolve linked student record. Please contact OSAD support."*).
   - `Stack traces / Raw database errors exposed`: **0**.
