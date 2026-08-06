# AchieveNest — Program Coordinator Features & Workflow Specification

This document provides an exhaustive, highly detailed specification of all system features, layout sections, interactive elements, data models, and user click pathways for the **Program Coordinator** role in **AchieveNest**.

---

## 1. Role Scope & Architectural Overview

### A. Role Definition
- **User Role**: Program Coordinator (e.g., *Dr. Ana Reyes — BS Computer Science Program Coordinator, Department of Computer Studies, CEAC*).
- **Primary Responsibility**: Review, audit, approve, or return student achievement submissions within their assigned academic program scope, inspect student achievement dossiers, and generate official accreditation CSV reports.

### B. Architectural Compliance (OOP & MVC)
- **Domain Models (`src/models/`)**:
  - Encapsulates student entities (`UserModel.js`), submitted achievements (`AchievementModel.js`), and verification records using ES6 classes with private fields and getter methods.
- **Controllers (`src/controllers/`)**:
  - `VerificationController.js`: Manages verification status transitions (`Pending` $\rightarrow$ `Verified` / `Returned`), filter algorithms, and report generation.
  - `OrganizationController.js`: Manages departmental roster filtering and category classifications.
- **MVC Bridge Hooks (`src/hooks/`)**:
  - `useVerification.js`: Custom React hook bridging the View components to `VerificationController`.
  - `useStudentRoster.js`: Custom React hook providing filtered student roster states.
- **Lightweight Views (`src/components/coordinator/CoordinatorDashboardView.jsx`)**:
  - Focused strictly on layout, Tailwind CSS styling, responsive grid structure, and user interaction rendering.

---

## 2. Top Header & Interactive Summary Cards

### A. Dashboard Header Bar
- **Page Title**: `Program Coordinator Hub`
- **Scope Badge**: Displays assigned academic scope (e.g., `BS Computer Science • CEAC Department`).
- **Export CSV Button**:
  - **User Click Action**: Clicking **"Export CSV Report"** invokes `handleExportCSVReport()`, generating and downloading `Verification_Report_BS_Computer_Science_[timestamp].csv`.
  - **Toast Feedback**: Displays temporary toast: `"BS Computer Science verification CSV report downloaded!"`.

### B. Interactive Metric Counter Cards (4 Summary Cards)
The 4 top counter cards serve as interactive filter buttons to navigate directly to target workspace sections:

1. **`PENDING VERIFICATIONS` Card**:
   - **Displays**: Total count of submissions awaiting review (e.g., `2 Pending`).
   - **Visual Styling**: Amber-tinted glass card with clock icon.
   - **User Click Action**: Clicking this card switches the view to `tab=workspace` with `statusFilter=Pending`.

2. **`VERIFIED ACHIEVEMENTS` Card**:
   - **Displays**: Total count of approved student achievements (e.g., `10 Verified`).
   - **Visual Styling**: Emerald-tinted glass card with shield check icon.
   - **User Click Action**: Clicking this card switches the view to `tab=workspace` with `statusFilter=Verified`.

3. **`RETURNED FOR REVISION` Card**:
   - **Displays**: Total count of submissions returned to students for corrections (e.g., `1 Returned`).
   - **Visual Styling**: Rose-tinted glass card with return arrow icon.
   - **User Click Action**: Clicking this card switches the view to `tab=workspace` with `statusFilter=Returned`.

4. **`TOTAL ENROLLED STUDENTS` Card**:
   - **Displays**: Total number of registered students in the program (e.g., `5 Students`).
   - **Visual Styling**: Slate/Blue-tinted glass card with users icon.
   - **User Click Action**: Clicking this card switches the view to `tab=students`.

---

## 3. Departmental Overview Section (`tab=overview`)

The **Departmental Overview** section provides a high-level analytics dashboard for monitoring verification velocity and category distribution.

### A. Analytics & Progress Velocity Grid
- **Approval Rate Widget**: Displays visual percentage breakdown of Approved vs. Pending vs. Returned achievements.
- **Category Breakdown Chart**: Categorizes program achievements into Academic, Leadership, Community, Athletics, and Culture & Arts.

### B. Recent Submissions Feed
- **Interactive Feed Cards**: Displays recent student submissions sorted chronologically.
- **User Click Actions per Item**:
  - **Click Card / "Review"**: Opens `selectedReviewItem` modal for deep inspection.
  - **Click "Approve"**: Approves the submission directly with toast feedback.
  - **Click "Return"**: Prompts for return remarks and returns submission to student.

---

## 4. Verification Queue & Review Workspace (`tab=workspace`)

The **Verification Queue Workspace** is the core operational hub for reviewing, auditing, approving, and returning student achievement submissions, built using standardized typography tokens and an intuitive Master-Detail layout.

### A. Typography & Design Tokens
- **Metadata Labels**: Standardized across all fields (`text-[11px] font-bold text-slate-500 uppercase tracking-wide`).
- **Section Headers & Titles**: Standardized typography scale (`text-base font-extrabold text-slate-900` for headers; `text-lg font-extrabold text-slate-900` for titles).
- **NDMU Color Token Standards**: NDMU Dark Emerald (`#1b4332`), Forest Emerald Accent (`#2d8a4e`), Soft Emerald Tints (`bg-emerald-50 text-emerald-800`), Slate Neutrals (`slate-900`, `slate-700`, `slate-500`), and semantic status badges (`Pending` 🟡 Blue/Amber, `Verified` 🟢 Emerald, `Returned` 🔴 Rose/Amber).

### B. Unified Search, Status & Integrated Filter Control Bar
- **Strict Active Academic Year Scope (`AY 2025-2026`)**: All items in the Verification Workspace are strictly locked to the current active **AY 2025-2026**. Past academic years (e.g., AY 2024-2025) are archived and completely excluded from active coordinator verification.
- **Search Bar Input**: Real-time text search filtering by Student Name, Student ID (e.g., `2024-01234`), Achievement Title, or Issuing Organization.
- **Status Filter Tabs**:
  - **`All`**: Displays active academic year queue history.
  - **`Pending`**: Filters strictly for items needing coordinator evaluation (`bg-blue-600 text-white`).
  - **`Returned`**: Displays items returned for student revisions (`bg-amber-600 text-white`).
  - **`Verified`**: Displays approved achievements (`bg-[#1b4332] text-white`).
- **Integrated Filter Controls (Row 2)**:
  - **Category**: `All Categories`, `Academic`, `Leadership`, `Community`, `Athletics`, `Culture & Arts`, `Research`.
  - **Scope Level**: `All Scope Levels`, `Institutional`, `Local / City`, `Regional`, `National`, `International`.
  - **Active Academic Year Badge**: Static badge displaying `AY 2025-2026 (Active)`.
  - **Sort Order**: `Sort: Newest First`, `Sort: Oldest First`, `Sort: Student Name A-Z`, `Sort: Title A-Z`.




### C. Master-Detail Queue & Inspection Panel (`CoordinatorDashboardView.jsx`)
1. **Left Master Queue List (Minimal Queue Box)**:
   - **Minimal Header Box**: Clean, light gray header (`bg-slate-50 border-b border-slate-200/80`) displaying `Submission Queue` and subtle item count badge.
   - **Queue Item Cards**:
     - Minimal Avatar badge (`bg-slate-100 text-slate-700 font-extrabold`; converts to `#1b4332` emerald badge when selected).
     - Student Name & Student ID subtitle (`Angela Castro • 2024-05678`).
     - Category pill badge (`Academic`, `Athletics`, `Community`, `Leadership`).
     - Status pill badge with semantic colors (`Pending Review`, `Verified`, `Returned`).
     - Supporting proof files counter (`X docs`).
     - Selected Card State: Soft Emerald tint (`bg-[#f2f9f4]`), sleek 3px accent bar (`border-l-3 border-[#1b4332]`), bold emerald title, and active pill badge (`Viewing`).


2. **Right Inspection Panel**:
   - **Student Profile Header**: Avatar, Full Name, Student ID, Program Scope, and Status Pill Badge.
   - **Achievement Title & Metadata Grid**: Standardized 6-grid field layout (*Category, Scope Level, Rank/Position, Date Conferred, Academic Year, Term/Semester*).
   - **Event & Issuing Organization Cards**: Dedicated cards for event name and issuing body.
   - **Narrative Description**: Structured container (`bg-slate-50 border border-slate-200/80 rounded-xl p-4`).
   - **Supporting Documents & Evidence**: High-contrast attachment cards with file type icon, filename, file size, and primary **View** & **Download** actions.
   - **Feedback Remarks Textarea**: Dedicated textarea for return or audit comments.
   - **Decision Action Bar**: Primary NDMU Emerald **Approve & Verify** button (`bg-[#1b4332] hover:bg-[#2d8a4e]`) and Amber **Return for Revision** button.


---

## 5. Interactive Review & Document Inspection Modal

When a coordinator clicks **"Review"** or **"Inspect Proof"** on any submission card, the **Detailed Verification Modal** (`selectedReviewItem`) opens.

### A. Modal Layout & Evidence Viewer
1. **Left Panel — Complete Metadata Summary**:
   - Displays all submission details, category points weighting, and student profile info.
2. **Right Panel — Document Proof Previewer**:
   - **PDF Proof Document Box**: Displays attached certificate/transcript PDF (`attached_file_name`).
   - **Participation Photo Viewport**: Renders submitted event photo evidence (`participation_photo_name`).

### B. Verification Action Controls & Click Pathways

#### 1. Click "Approve Achievement" (Green Button)
- **System Action**: Calls `handleApprove(itemId)`.
- **State Updates**:
  - Updates submission status to `Verified`.
  - Awards verified achievement points to student's profile.
  - Closes review modal.
  - Triggers toast: `"Achievement approved & verified successfully!"`.

#### 2. Click "Return for Revision" (Amber/Rose Button)
- **System Action**: Expands return remarks textarea input (`returnRemarks`).
- **Validation**: Ensures remarks are provided before submission.
- **User Click Action**: Clicking **"Confirm Return"**:
  - Calls `handleReturn(itemId, remarks)`.
  - Updates submission status to `Returned`.
  - Attaches coordinator's return remarks explaining required corrections.
  - Closes review modal.
  - Triggers toast: `"Achievement returned to student with remarks."`.

---

## 6. Student Roster & Student Dossier Inspector (`tab=students`)

The **Student Roster** section allows coordinators to inspect the full achievement portfolio and verified point tally of every student in their academic program using a clean, user-friendly **Interactive Student Data Table**.

### A. Roster Filters & Search Bar
- **Search Bar Input**: Search by Student Full Name or Student ID.
- **Year Level Filter Dropdown**: Filter by `1st Year`, `2nd Year`, `3rd Year`, or `4th Year`.
- **Course Filter Dropdown**: Filter by specific academic program options.

### B. Simplified High-Readability Student Data Table (`CoordinatorDashboardView.jsx`)
The student roster is rendered in a simplified, 5-column data table designed for high contrast and rapid visual scanning while preserving NDMU brand colors (`#1b4332` emerald theme):

| Table Column | Data Rendered & Alignment | Interactive Features |
| :--- | :--- | :--- |
| **Student Information** | Avatar photo (40px), Full Name (`font-extrabold text-slate-900`), Student ID (`font-mono`), & Institutional Email (Left-Aligned). | Hovering highlights the student row in soft green; clicking anywhere on the row opens the **Student Dossier Modal**. |
| **Program & Year** | Academic Program title & Year Level pill badge (`4th Year`, `3rd Year`) (Left-Aligned). | Clean departmental taxonomy breakdown. |
| **Achievements** | Large achievement count (e.g., `12`) with verified/pending status subtitle (`10 Verified • 2 Pending`) (Centered). | Quantitative accomplishment tally with instant audit visibility. |
| **Verified Merit Points** | Horizontal emerald point badge (`⭐ 450 Points`) (Centered). | High-visibility emerald badge displaying total accredited merit points. |
| **Action** | NDMU Dark Emerald Button **`[ 👁️ Inspect Dossier ]`** (Centered). | Opens the **Student Achievements Portfolio Inspector Modal** (`selectedStudentDossier`). |


#### User Click Pathways per Student Row:
- **Click Student Row or "Inspect Dossier" Button**: Opens the **Student Achievements Portfolio Inspector Modal** (`selectedStudentDossier`), granting full access to inspect verified, pending, and returned student credentials.



---

## 7. Interactive Student Achievements Portfolio Inspector Modal

When a coordinator clicks **"Inspect Dossier"** on any student card, the **Student Achievements Portfolio Inspector Modal** (`selectedStudentDossier`) opens.

### A. Student Header Summary
- Renders Student Name, Avatar, Student ID, Academic Program, Year Level, and Total Verified Points badge.

### B. Dossier Navigation Tabs
- **`Verified Achievements` Tab**: Lists all approved achievements in student's portfolio.
- **`Pending Approval` Tab**: Lists items awaiting review.
- **`Returned` Tab**: Lists returned items with coordinator feedback.

### C. Category Filter Dropdown
- Filters student's achievements by: `All Categories`, `Academic`, `Leadership`, `Community`, `Athletics`, `Culture & Arts`.

### D. Detailed Achievement Item Inspection & Document View
- Clicking any achievement in the student's dossier opens a Canva-style side preview displaying the certificate PDF, photo evidence, and full accreditation details.

---

## 8. Navigation & Tab Switcher Reference Table

| Navigation Tab | URL Parameter | Primary Features |
| :--- | :--- | :--- |
| **Departmental Overview** | `?tab=overview` | Analytics velocity chart, category breakdown, recent submission queue. |
| **Verification Workspace** | `?tab=workspace` | Full review queue, search bar, status tabs (`Pending`, `Verified`, `Returned`), Review Modal with PDF/photo inspector, Approve/Return actions. |
| **Student Roster & Dossiers** | `?tab=students` | Program student list, year level filters, Student Dossier Inspector Modal with complete achievement history. |

---

## 9. Verification Commands & Build Validation

- **Production Build Command**: `npm run build`
- **Development Server**: `npm run dev` (Runs locally at `http://localhost:5173`)
- **Visual & Layout Parity Guarantee**: All updates adhere strictly to Tailwind CSS styling standards, NDMU brand colors, glassmorphism UI cards, and zero UI disruption guidelines.
