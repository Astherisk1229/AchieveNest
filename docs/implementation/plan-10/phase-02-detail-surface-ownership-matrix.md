# PLAN 10 — Phase 2 Detail Surface Ownership Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. View Details / Portfolio Inspector Surface Specifications

The **View Details / Portfolio Inspector** modal serves as the authoritative secondary inspection surface for comprehensive student metadata.

### 1.1 Complete Field Inventory in Detail Surface
1. **Student Header**: Full Name, Student Institutional ID, College Badge with Master Color.
2. **Academic & Enrollment Card**:
   - Academic Program Title & Code
   - College Full Name & Acronym
   - Year Level (e.g. `3rd Year`)
   - Enrollment Status (e.g. `Enrolled`)
   - Academic Year Placement (e.g. `2026-2027`)
3. **Account & Demographic Card**:
   - Institutional Email Address
   - Student Sex (`Male` / `Female` / `Prefer not to say` / `—`)
   - Account Lifecycle Status (`ACTIVE` / `SUSPENDED` / `ARCHIVED`)
   - Password State (`Active` vs. `Pending First Login`)
4. **Extracurricular & Organization Placements**:
   - Recognized Student Organization (if assigned)
   - Assigned Program Coordinator / Moderator
5. **Portfolio Accomplishments**:
   - Verified points, category breakdowns, and verified accomplishment records.

### 1.2 Sensitive Data Prohibition
The detail modal must **never** display plaintext passwords, password hashes, or active session tokens.
