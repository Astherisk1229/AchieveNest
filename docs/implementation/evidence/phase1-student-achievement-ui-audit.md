# AchieveNest — Plan 04 Phase 1
## Evidence: Student Achievement UI & Component Audit

---

### 1. Frontend Entry Points & File Inventory

| Component / File | Role | Current Behavior |
|---|---|---|
| `frontend/src/pages/student/StudentAchievementsPage.jsx` | Student Achievements Hub | Displays achievement metrics, filters, and "Add Achievement" button. Hardcodes 6 categories (`Academic`, `Leadership`, `Community`, `Sports`, `Recognition`, `Professional Development`). |
| `frontend/src/pages/student/modals/AchievementSubmissionModal.jsx` | Add/Edit Achievement Modal | 3-step wizard static generic form with hardcoded category dropdown (5 options: `Academic`, `Leadership`, `Athletics`, `Volunteerism & Community`, `Arts & Culture`). No subcategories, no dynamic fields. |
| `frontend/src/pages/student/modals/StudentAchievementPreviewModal.jsx` | Detail / Preview Modal | Displays achievement details, status badges, and proof download action. |
| `frontend/src/pages/student/StudentAchievementPopoverMenu.jsx` | Context Action Popover | Offers Favorite, Add to Portfolio, Edit, and Delete actions. |
| `frontend/src/hooks/useStudentAchievements.js` | Custom Hook / MVC Bridge | Manages achievements state, category filtering, search, and modal triggers. |
| `frontend/src/controllers/StudentAchievementController.js` | Controller | Handles local storage (`achievenest_student_achievements`) and client CRUD actions. |

---

### 2. Add Achievement Trigger & Navigation Sequence

1. User clicks **"Add Achievement"** on `StudentAchievementsPage.jsx`.
2. `AchievementSubmissionModal` opens at Step 1:
   - Step 1: Basic Info (`title`, `eventName`, `issuerOrganization`).
   - Step 2: Scope & Rank (`categoryId`, `scopeLevel`, `rankConferred`, `academicYear`, `semester`, `dateAchieved`).
   - Step 3: Proof & Summary (`description`, `attachedFile`, `participationPhoto`).
3. Form submits and appends record to localStorage.

---

### 3. Disconnect Between Frontend UI & Authoritative Backend

- **Frontend Categories**: 5 or 6 hardcoded legacy categories (`Academic`, `Leadership`, `Community`/`Volunteerism`, `Sports`/`Athletics`, `Recognition`, `Professional Development`/`Arts & Culture`).
- **Backend Database**: Exactly 9 normalized categories and 57 subcategories in `portfolio_categories` and `portfolio_subcategories`.
- **Form Architecture**: Current UI is a **Static Generic Form**; it does not dynamically render Category-Specific Fields or structured metadata.
