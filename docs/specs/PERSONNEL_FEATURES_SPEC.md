# AchieveNest System Specification: Personnel Portal & Portfolio Canva View

**Document Version:** 3.0.0 (Comprehensive Personnel Features & Canva Booklet Presenter Architecture)  
**System:** AchieveNest Student & Personnel Achievement Management Platform  
**Target Roles:** Personnel (Faculty & Staff), Department Secretary (`department_secretary`), Human Resources (`hr_staff`), OSAD Admin (`osad_staff`)  
**Reference Specification:** NDMU Rating Sheet for Ranking (Notre Dame of Marbel University) & [`SYSTEM_ARCHITECTURE_ANALYSIS.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/SYSTEM_ARCHITECTURE_ANALYSIS.md)

---

## 1. Role Scope & Architectural Overview

### A. Role Definition & Scope
- **User Role Context**: Personnel / Faculty / Staff (`active_role_context: 'personnel'`).
- **Target User Scope**: Full-time and part-time academic faculty, department research coordinators, and institutional personnel across all university colleges (e.g., *College of Information Technology*, *College of Engineering, Architecture, and Computing*, *College of Business and Accountancy*).
- **Core System Purpose**: The **Personnel Portal** serves as the central hub for university faculty and staff to log professional accomplishments, maintain documentary proof certificates, monitor NDMU ranking points under official institutional evaluation criteria, compile digital portfolios, and preview their official faculty dossiers via an interactive **Canva Booklet View Presenter**.
- **Primary Operational Objectives**:
  1. Record line-item accomplishments across Area A (Professional Development), Area B (Productivity & Creative Work), and Area C (Service & Leadership).
  2. Upload and manage documentary evidence (PDF/image proofs) with automated file validation.
  3. Compile and track academic ranking portfolios through a multi-stage approval workflow (`DRAFT` → `SUBMITTED_TO_DEP_SEC` → `ENDORSED_TO_HR` → `HR_APPROVED`).
  4. Generate formal academic dossier booklets with zero internal scrollbars for department and HR review.

---

### B. Architectural Compliance (OOP & MVC Standard)
In strict compliance with project architectural guidelines ([`AGENTS.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/.agents/AGENTS.md) and [`SYSTEM_ARCHITECTURE_ANALYSIS.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/SYSTEM_ARCHITECTURE_ANALYSIS.md)):

```
+---------------------------------------------------------------------------------------------------+
| PERSONNEL PORTAL MVC ARCHITECTURAL PATTERN                                                        |
+---------------------------------------------------------------------------------------------------+
| [ DOMAIN MODELS ]                                                                                 |
|  - PersonnelPortfolioModel.js : Encapsulates score ceilings (Area A: 70, B: 50, C: 40, Max: 160)  |
|  - AchievementModel.js          : Encapsulates accomplishment schema, proof file & category codes |
|                                                                                                   |
| [ CONTROLLERS ]                                                                                   |
|  - PersonnelPortfolioController.js   : Business logic for portfolio submission, auto-populate    |
|  - PersonnelAchievementController.js : Search, filtering, CRUD & category sorting algorithms      |
|                                                                                                   |
| [ MVC BRIDGE HOOKS ]                                                                              |
|  - usePersonnelPortfolio.js    : Custom hook connecting Portfolio views to Controller             |
|  - usePersonnelAchievements.js : Custom hook connecting Achievement management to Controller     |
|                                                                                                   |
| [ VIEWS & COMPONENTS ]                                                                            |
|  - PersonnelDashboard.jsx        : Main Homepage container with hero banner & timeline           |
|  - PersonnelAchievementsPage.jsx : Comprehensive accomplishment management workbench              |
|  - PersonnelPortfolioPage.jsx    : Portfolio hub, ranking matrix, and export controls            |
|  - PersonnelPortfolioCanvaView.jsx: Zero-scrollbar Canva Booklet Presenter                       |
|  - AccountPage.jsx / SettingsPage.jsx : User profile & system preference management views         |
+---------------------------------------------------------------------------------------------------+
```

1. **Domain Models (`src/models/`)**:
   - [`PersonnelPortfolioModel.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/models/PersonnelPortfolioModel.js): Encapsulates portfolio schemas, academic year tagging, status state machine transitions, line-item item mappings, and point ceiling enforcement (Area A: 70 max, Area B: 50 max, Area C: 40 max, Overall Total: 160 max).
   - [`AchievementModel.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/models/AchievementModel.js): Encapsulates individual accomplishment schemas, category codes (`A.1` to `C.2`), proof document URL attachments, verification state flags (`Verified`, `Endorsed`, `Pending`), and tailored NDMU rating field metadata.

2. **Controllers (`src/controllers/`)**:
   - [`PersonnelPortfolioController.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/controllers/PersonnelPortfolioController.js): Handles portfolio compilation, auto-population from achievement vault, evaluation status checks, and submission triggers to Department Secretary / HR.
   - [`PersonnelAchievementController.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/controllers/PersonnelAchievementController.js): Implements CRUD operations, real-time search indexing, category filter algorithms, and portfolio attachment toggles.

3. **Bridge Hooks (`src/hooks/`)**:
   - [`usePersonnelPortfolio.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/hooks/usePersonnelPortfolio.js): Connects View components to `PersonnelPortfolioController`, managing active portfolio data, score updates, and Canva booklet state.
   - [`usePersonnelAchievements.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/hooks/usePersonnelAchievements.js): Connects View components to `PersonnelAchievementController`, managing filter states, live search suggestions, category groupings, popovers, and modal popups.

4. **Lightweight Views (`src/pages/`, `src/components/personnel/`)**:
   - Pure UI rendering components adhering strictly to design guidelines (high-contrast dark emerald aesthetics, responsive layouts, micro-animations, and zero raw state mutations).

---

## 2. Complete Sidebar Navigation Structure

The **Personnel Portal** sidebar ([`Sidebar.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/Sidebar.jsx)) provides a clean, two-group navigation hierarchy:

```
+-----------------------------------------------------------------------------------+
| PERSONNEL PORTAL SIDEBAR NAVIGATION MATRIX                                        |
+-----------------------------------------------------------------------------------+
| Header Badge : [ ShieldCheck ] Personnel Portal (Role Context: personnel)         |
| Search Bar   : [ Search ] "Search Portal..."                                      |
+-----------------------------------------------------------------------------------+
| NAVIGATION GROUP                                                                  |
|   1. Homepage       (Path: /personnel/dashboard)                                  |
|   2. Edit Portfolio (Path: /personnel/portfolio/edit)                             |
|   3. Portfolio      (Path: /personnel/portfolio)                                  |
|   4. Account        (Path: /personnel/account)                                    |
+-----------------------------------------------------------------------------------+
| ACCOUNT GROUP                                                                     |
|   5. Notifications  (Path: /personnel/notifications or Drawer)                   |
|   6. Settings       (Path: /personnel/settings)                                   |
|   7. Logout         (Action: Triggers logoutUser() -> Redirects to /)            |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Specification by Sidebar Section

---

### SECTION 1: HOMEPAGE (`/personnel/dashboard`)

The **Homepage** ([`PersonnelDashboard.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/pages/PersonnelDashboard.jsx)) serves as the primary executive command center for personnel, displaying real-time metrics, quick action triggers, digital credentials, and recent accomplishment timelines.

```
+---------------------------------------------------------------------------------------------------+
| HOMEPAGE LAYOUT STRUCTURE                                                                        |
+---------------------------------------------------------------------------------------------------+
| [ Dark Emerald Hero Banner ]                                                                      |
|  - Role Badge: CONTEXT: PERSONNEL | User: Dr. Maria Santos • EMP-2021-0842 • College of IT       |
|  - Trigger: [ Digital ID Barcode ] Button                                                         |
|  - 5 Stat Summary Cards: Total Achievements (Gold Border), Verified, Pending, Proofs, Status     |
+---------------------------------------------------------------------------------------------------+
| [ Quick Actions Bar ]                                                                             |
|  - Top Action Pills: + Log Seminar | + Log Publication | + Log Speaker | + Log Org/Service     |
|  - 3 Action Cards: [ Add Achievement ] | [ Manage Portfolio ] | [ Edit Basic Information ]        |
+---------------------------------------------------------------------------------------------------+
| [ Accomplishments Timeline ]                                                                      |
|  - Filter Chips: All | Degrees & Orgs | Seminars & Trainings | Lectures & Publications | ...      |
|  - Dynamic Record Cards: Category Icons, Status Badges, Proof Download & Detailed Modals          |
+---------------------------------------------------------------------------------------------------+
```

#### A. Dark Emerald Hero Header & Summary Metrics Banner
- **Container Styling**: High-impact dark emerald background (`#1b4332`) with gold accent elements and rounded corners (`rounded-3xl`).
- **Context Pill**: `CONTEXT: PERSONNEL` emerald badge.
- **User Bio Line**: `Dr. Maria Santos • EMP-2021-0842 • College of Information Technology`.
- **Digital ID Barcode Trigger**: Top-right action button rendering an interactive NDMU Faculty Barcode ID Modal ([`DigitalBarcodeIDCard.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/student/DigitalBarcodeIDCard.jsx)) displaying employee QR code, barcode, and designation.
- **5 Interactive Summary Metric Cards**:
  1. **`Total Achievements` Card**: Displays overall logged accomplishment count (e.g., `5 Records`) highlighted with an active gold/yellow border.
  2. **`Verified Records` Card**: Displays count of HR-verified achievements (e.g., `3 Items`).
  3. **`Pending Review` Card**: Displays count of items undergoing review (e.g., `1 Items`).
  4. **`Attached Proofs` Card**: Displays total uploaded documentary proof files (e.g., `5 Files`).
  5. **`Portfolio Status` Card**: Displays current portfolio stage (e.g., `Draft Portfolio`, `Submitted to DepSec`, `Endorsed to HR`, `HR Approved`) rendered in styled badge typography.

#### B. Quick Actions Bar & Action Cards
- **Top Quick Log Pills**:
  - `+ Log Seminar`: Launches accomplishment submission modal pre-set to *Seminars & Trainings*.
  - `+ Log Publication`: Launches accomplishment submission modal pre-set to *Lectures & Publications*.
  - `+ Log Speaker`: Launches accomplishment submission modal pre-set to *Lectures & Publications (Guest Speaker)*.
  - `+ Log Org/Service`: Launches accomplishment submission modal pre-set to *Service & Community*.
- **3 Primary Interactive Action Cards**:
  1. **`Add Achievement`**: Icon container with green circle badge; opens [`PersonnelSubmissionModal.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/personnel/PersonnelSubmissionModal.jsx).
  2. **`Manage Portfolio`**: Icon container with document badge; navigates to `/personnel/portfolio/edit`.
  3. **`Edit Basic Information`**: Icon container with edit badge; opens [`EditBasicInfoModal.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/personnel/EditBasicInfoModal.jsx) to update academic rank, designation, educational attainment, contact details, and years of service.

#### C. Accomplishments Timeline
- **Filter Navigation Chips**:
  - `All` (Default active dark pill)
  - `Degrees & Orgs`
  - `Seminars & Trainings`
  - `Lectures & Publications`
  - `Research & Awards`
  - `Instructional Materials`
  - `Service & Community`
- **Accomplishment Record Item Cards**:
  - Displays record title, date, issuer, academic year tag, and status pill (`HR Verified`, `Dept Endorsed`, `Pending Review`).
  - Attached document pill (`.pdf` filename) with immediate download trigger.
  - Interactive click handler opening the detailed preview modal ([`AchievementPreviewModal.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/personnel/AchievementPreviewModal.jsx)).

---

### SECTION 2: EDIT PORTFOLIO WORKSPACE (`/personnel/portfolio/edit`)

> [!NOTE]
> For the complete, dedicated deep-dive architectural specification and comparison between the output Portfolio view and the Edit Portfolio workspace, see [`EDIT_PORTFOLIO_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/docs/specs/EDIT_PORTFOLIO_SPEC.md).

The **Edit Portfolio** workspace ([`PersonnelPortfolioEditPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/pages/PersonnelPortfolioEditPage.jsx)) is designed as an **Interactive Live Portfolio Showcase & Inline Editor** with an uncluttered **Option A Header Hierarchy**. It renders the complete visual faculty portfolio layout — including the hero profile banner, experience timeline, key skills, and the NDMU Ranking Matrix (Area A, B, C) — with embedded inline editing controls and a dedicated section data-import toolbar.

```
+---------------------------------------------------------------------------------------------------+
| INTERACTIVE LIVE PORTFOLIO SHOWCASE & INLINE EDITOR ARCHITECTURE (OPTION A)                       |
+---------------------------------------------------------------------------------------------------+
| [ Top Header Page Bar ]                                                                           |
|  - Status Pill: [ LIVE INTERACTIVE PORTFOLIO ] | STATUS: DRAFT                                    |
|  - Page Header Action Toolbar:                                                                    |
|    * [ Preview Booklet ]            (Secondary Outline Button - Launches Canva Presenter)         |
|    * [ Submit Portfolio to DepSec ] (Primary Solid Emerald Button - Endorses portfolio)           |
+---------------------------------------------------------------------------------------------------+
| [ Hero Profile Banner & Header Toolbar ]                                                          |
|  - Left Curvy Green Shape, NDMU Seal, Faculty Avatar, Rank, Department & Credential Chips         |
|  - Action Trigger: [ Edit Bio & Info ] (Opens EditBasicInfoModal)                                 |
+---------------------------------------------------------------------------------------------------+
| [ Real-Time NDMU Point Ceilings Summary Grid ]                                                    |
|  - Area A Card : Claimed vs 70 Max Cap (Real-time score progress bar)                             |
|  - Area B Card : Claimed vs 50 Max Cap (Real-time score progress bar)                             |
|  - Area C Card : Claimed vs 40 Max Cap (Real-time score progress bar)                             |
|  - Grand Total : Verified Total vs 160 Max Cap (Capped Grand Score)                               |
+---------------------------------------------------------------------------------------------------+
| [ Full Portfolio Layout with Section Import & Inline Edit Controls ]                              |
|  - Area A: Professional Development Section:                                                      |
|    * Section Header Toolbar: [ Import Vault Entries ] + [ + Add Item to Area A ]                  |
|    * Line-Item Cards: Title, Category Code, Scope, Proof Badge + Inline [ Edit ] & [ Delete ]    |
|  - Area B: Productivity & Creative Work Section:                                                  |
|    * Section Header Toolbar: [ Import Vault Entries ] + [ + Add Item to Area B ]                  |
|    * Line-Item Cards: Title, Category Code, Scope, Proof Badge + Inline [ Edit ] & [ Delete ]    |
|  - Area C: Service & Leadership Section:                                                          |
|    * Section Header Toolbar: [ Import Vault Entries ] + [ + Add Item to Area C ]                  |
|    * Line-Item Cards: Title, Category Code, Scope, Proof Badge + Inline [ Edit ] & [ Delete ]    |
+---------------------------------------------------------------------------------------------------+
```

#### A. System Design & Color Palette Specifications
- **Hero Header Banner**: NDMU Dark Forest Emerald (`#1b4332`) curved banner backdrop, NDMU University Seal badge, and rounded-3xl surface containers (`rounded-3xl`).
- **Primary Surface Containers**: Clean White (`#ffffff`) in light mode and Dark Slate (`#0d1520` / `#0f172a`) in dark mode, with crisp borders (`border-slate-200 dark:border-slate-800`).
- **Typography & Icons**: Clean geometric sans-serif typography (`text-slate-900 dark:text-white`), paired with standard Lucide system icons (`FolderKanban`, `Award`, `FileText`, `CheckCircle2`, `ShieldCheck`).
- **Semantic Badge Pills**:
  - *Emerald Green (`bg-[#edf3ec] text-[#1e5831]`)*: Category tags & verified status badges.
  - *Gold Accent (`bg-amber-400 text-slate-950`)*: Highlighted score metrics & portfolio draft indicators.
  - *Amber Warning (`bg-amber-50 text-amber-800 border-amber-200`)*: Pending review states.
  - *Rose Alert (`bg-rose-50 text-rose-800 border-rose-200`)*: Return feedback & removal actions.

#### B. Direct Inline Editing Controls
Personnel can manage line-items directly within the live portfolio showcase:
1. **`Primary Header Submission`**: `Submit Portfolio to DepSec` stands as the single primary header action button.
2. **`Secondary Booklet Preview`**: `Preview Booklet` is positioned in the page header as a clean outline button.
3. **`Section Header Import & Add Toolbar`**: Each evaluation area card header features `Import Vault Entries` alongside `+ Add Item to Area A/B/C`.
4. **`Card-Level Edit Button`**: Every accomplishment entry displays an inline `Edit` button opening a pre-filled modification modal.
5. **`Card-Level Remove Button`**: Inline `Delete` icon button for instant entry removal with automatic point recalculation.

---

### SECTION 3: PORTFOLIO & CANVA BOOKLET VIEW (`/personnel/portfolio`)

The **Portfolio** section ([`PersonnelPortfolioPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/pages/PersonnelPortfolioPage.jsx)) serves as the formal output view and booklet presentation hub where personnel view their final compiled ranking breakdown, launch the **Canva Booklet View Presenter**, export official PDFs, and submit their portfolio for department/HR endorsement.

```
+---------------------------------------------------------------------------------------------------+
| PORTFOLIO HUB & CANVA BOOKLET VIEW ARCHITECTURE                                                   |
+---------------------------------------------------------------------------------------------------+
| [ Header Banner & Portfolio Status Bar ]                                                          |
|  - Current Academic Year (AY 2026-2027) | Status Pill (HR APPROVED / DRAFT / SUBMITTED)           |
|  - Action Buttons:                                                                                |
|    * [ Canva Booklet View ] (Primary Dark Emerald Button - Launches Interactive Presenter)        |
|    * [ Edit Basic Info ]   (Opens EditBasicInfoModal)                                             |
|    * [ Export PDF ]        (Opens ExportPortfolioPreviewModal)                                    |
|    * [ Submit Portfolio ]  (Triggers DepSec / HR submission pipeline)                             |
|    * [ Share Public Link ] (Copies shareable URL slug with toast confirmation)                    |
+---------------------------------------------------------------------------------------------------+
| [ Faculty Profile & Timeline Section ]                                                            |
|  - Profile Avatar, Designation, Department, Biography, Years of Service                           |
|  - Academic & Professional Experience Timeline (Research Coordinator, CHED Committee, IEEE)        |
|  - Core Competencies & Skill Ratings (AI, Data Analytics, Extension, Cloud Architecture)          |
+---------------------------------------------------------------------------------------------------+
| [ NDMU Faculty Ranking Point Ceiling & Score Matrix ]                                            |
|  - Area A Matrix (Professional Development): Educational Qualifications, Seminars - 70 Max Pts    |
|  - Area B Matrix (Productivity & Research) : Publications, Research, Materials   - 50 Max Pts    |
|  - Area C Matrix (Service & Leadership)    : Extension & Governance              - 40 Max Pts    |
|  - CAPPED GRAND TOTAL: 160 Max Points (Claimed vs Verified comparison)                            |
+---------------------------------------------------------------------------------------------------+
| [ CANVA BOOKLET VIEW PRESENTER MODAL ] (PersonnelPortfolioCanvaView.jsx)                          |
|  - Fullscreen Overlay with Zero Internal Scrollbars (Sized strictly at w-[750px] h-[980px])       |
|  - 16-Slide Complete Academic Dossier Deck (Cover, TOC, Separators, Items, Sign-Off)              |
+---------------------------------------------------------------------------------------------------+
```

#### A. Portfolio Action Controls & Public Sharing
- **`Canva Booklet View` Button**: High-visibility primary action button with document icon; launches the full-screen interactive dossier presenter ([`PersonnelPortfolioCanvaView.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/personnel/PersonnelPortfolioCanvaView.jsx)).
- **`Edit Basic Info` Button**: Launches modal to modify personal profile metadata.
- **`Export PDF` Button**: Launches preview modal ([`ExportPortfolioPreviewModal.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/student/ExportPortfolioPreviewModal.jsx)) configured for printable faculty dossier output.
- **`Submit Portfolio` Button**: Initiates verification workflow submission.
- **`Share Public Link` Button**: Copies custom shareable URL (`achievenest.ndmu.edu/p/dr-maria-santos`) to clipboard with animated toast notification.

#### B. Faculty Profile & Academic Experience Timeline
- **Profile Header Card**: Displays avatar photo, full name, academic rank, department, email, phone, location, and professional biography summary.
- **Academic Experience Timeline**: Interactive list detailing organizational roles, research coordinator positions, CHED committee memberships, and professional society affiliations.
- **Key Competencies**: Visual progress bars representing skill mastery levels (*Expert*, *Proficient*).

#### C. NDMU Faculty Ranking Point Ceiling & Score Matrix Table
The matrix enforces the strict point ceiling logic defined in `PersonnelPortfolioModel.js`:

| Area Category | Maximum Ceiling | Claimed Points | Verified Points | Ceiling Status |
| :--- | :---: | :---: | :---: | :--- |
| **Area A: Professional Development** | **70 Pts** | 75 Pts | 70 Pts | **Capped at 70 Pts** |
| **Area B: Productivity & Creative Work** | **50 Pts** | 48 Pts | 48 Pts | Within Ceiling |
| **Area C: Service & Leadership** | **40 Pts** | 35 Pts | 35 Pts | Within Ceiling |
| **CAPPED TOTAL SCORE** | **160 Pts** | **158 Pts** | **153 Pts** | **Verified Total: 153 / 160** |

---

### D. Detailed Canva Booklet View Presenter Specification (`PersonnelPortfolioCanvaView.jsx`)

The **Canva Booklet View Presenter** provides an elite presentation experience modeled after Canva digital booklets.

#### 1. Zero Internal Page Scrollbars Architecture
- **Strict Page Sizing**: Every slide page in [`PersonnelPortfolioCanvaView.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/personnel/PersonnelPortfolioCanvaView.jsx) is strictly dimensioned at `w-[750px] h-[980px]` with `overflow-hidden`.
- **Proof Image Sizing**: Embedded proof certificate preview images are capped at `h-[240px]`.
- **Zero Scroll Guarantee**: The layout fits inside `h-[980px]` with **zero vertical or horizontal scrollbars**.

#### 2. Formal Academic Color Palette & Aesthetics
- **Primary Formal Accent**: Deep NDMU Forest Green (`#1b4332`).
- **Neutral Background**: Crisp Pure White (`#ffffff`) and Off-White (`#f8fafc`).
- **Typography**: Dark Slate Charcoal (`#0f172a` / `#1e293b`).
- **Subdued Accents**: Refined Warm Gold (`#d97706`) and Crisp Dividers (`#e2e8f0`).

#### 3. Complete 16-Slide Deck Sequence

```
+-----------------------------------------------------------------------------------------------+
| CANVA PORTFOLIO BOOKLET SLIDE DECK SEQUENCE                                                   |
+-----------------------------------------------------------------------------------------------+
| Page 1  : Official NDMU Cover Page (Logo, Profile Card, Employee ID, Status Seal)             |
| Page 2  : Hierarchical Table of Contents (Area A, B, C breakdown & item navigation)          |
| Page 3  : CATEGORY SEPARATOR SLIDE - AREA A: PROFESSIONAL DEVELOPMENT                         |
| Page 4  : Item Slide (A.1 Ph.D. in Computer Science - Ateneo de Manila University)            |
| Page 5  : Item Slide (A.2 Vice President - Philippine Computer Society)                       |
| Page 6  : Item Slide (A.3 CHED AI Regional Training Workshop)                                 |
| Page 7  : CATEGORY SEPARATOR SLIDE - AREA B: PRODUCTIVITY AND CREATIVE WORK                   |
| Page 8  : Item Slide (B.1 DOST Keynote Speaker: Regional AI Summit)                           |
| Page 9  : Item Slide (B.2 IEEE Access Scopus Journal Publication)                             |
| Page 10 : Item Slide (B.3 NDMU Institutional Research Grant Completion)                       |
| Page 11 : Item Slide (B.4 NDMU Outstanding Research Faculty Award)                            |
| Page 12 : Item Slide (B.5 Data Structures Laboratory Manual Workbook)                         |
| Page 13 : CATEGORY SEPARATOR SLIDE - AREA C: SERVICE AND LEADERSHIP                           |
| Page 14 : Item Slide (C.1 Faculty Adviser: Computer Studies Society)                          |
| Page 15 : Item Slide (C.2 Koronadal LGU Smart Governance Literacy Extension)                  |
| Page 16 : Institutional Evaluator Sign-Off Page (DepSec & HR Signature Blocks & Official Seal)|
+-----------------------------------------------------------------------------------------------+
```

#### 4. Presenter Toolbar & Navigation Controls
- **Zoom Controls**: Zoom Out (-10%), Zoom Percentage Indicator (`100%`), Zoom In (+10%).
- **Slide Jump Thumbnails**: Sidebar drawer allowing instant jumping to any page.
- **Previous / Next Triggers**: Bottom navigation bar displaying current page index (`Page 4 of 16`).
- **Fullscreen Mode Toggle**: Expands presenter to true full-screen overlay.
- **Direct Print / PDF Export**: Initiates window print handler optimized for booklet layout.

---

### SECTION 4: ACCOUNT (`/personnel/account`)

The **Account** section ([`AccountPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/pages/AccountPage.jsx)) handles personal user details, security settings, avatar image customization, and self-service password updates.

```
+---------------------------------------------------------------------------------------------------+
| ACCOUNT PAGE STRUCTURE                                                                            |
+---------------------------------------------------------------------------------------------------+
| [ User Profile Card & Avatar Manager ]                                                            |
|  - Avatar Image with Camera Badge (Triggers Avatar URL Update Modal)                              |
|  - Full Name, Employee ID, User Type (personnel), Department & College Scope                      |
+---------------------------------------------------------------------------------------------------+
| [ Contact & Profile Details (Editable Form) ]                                                    |
|  - Full Name Input | Email Address Input | Phone Number Input                                    |
|  - Actions: [ Edit Details ] -> [ Save Changes ] (Triggers Toast Notification)                   |
+---------------------------------------------------------------------------------------------------+
| [ Account Security & Credentials ]                                                                |
|  - Institutional Security Badge & Password Reset Trigger                                          |
|  - Self-Service Password Change Modal (3-Step Wizard: Current Pass -> New Pass -> Success)        |
+---------------------------------------------------------------------------------------------------+
```

#### A. Personal Details & Profile Management
- Displays full name, employee ID, role context (`personnel`), assigned department, college, email address, and phone number.
- Toggleable inline edit mode allowing personnel to update phone numbers and personal email with instant toast confirmation.

#### B. Avatar Customization Modal
- Camera icon overlay on profile image opening an interactive avatar modal ([`setIsAvatarModalOpen`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/pages/AccountPage.jsx#L55)) to enter custom image URLs or select default academic avatars.

#### C. Self-Service Password Change Wizard (`isSelfServiceModalOpen`)
A 3-step security modal for credential updates:
- **Step 1**: Current password verification with show/hide toggle.
- **Step 2**: New password input with strength requirements (min 8 chars, numbers, symbols) and confirmation check.
- **Step 3**: Success screen with audit log timestamp.

---

### SECTION 5: NOTIFICATIONS (`/personnel/notifications`)

The **Notifications** section handles real-time alerts and system audit updates for personnel.

#### A. Alert Channels & Categories
1. **Verification Updates**: Notification when a Department Secretary endorses a portfolio (`"Department Secretary endorsed your portfolio to HR"`) or requests revisions (`"Portfolio returned for proof revision"`).
2. **HR Approvals**: Notification when Institutional HR finalizes ranking evaluation (`"HR Director approved your AY 2026-2027 Academic Rank"`).
3. **System Audit Alerts**: Notifications regarding security logins and profile updates.

#### B. Notification Controls
- **Filter Tabs**: `All`, `Unread`, `Verification`.
- **Action Buttons**: `Mark All as Read`, `Clear Notifications`.

---

### SECTION 6: SETTINGS (`/personnel/settings`)

The **Settings** section ([`SettingsPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/pages/SettingsPage.jsx)) provides global system preferences, theme toggles, portfolio privacy controls, and PDF formatting choices.

```
+---------------------------------------------------------------------------------------------------+
| SETTINGS PAGE ARCHITECTURE                                                                        |
+---------------------------------------------------------------------------------------------------+
| [ Theme & Appearance ]                                                                            |
|  - Light Mode vs Dark Mode Switcher (Integrated with useTheme hook)                               |
+---------------------------------------------------------------------------------------------------+
| [ Notification Preferences ]                                                                      |
|  - Toggles: Email Notifications | Push Notifications | Verification Alerts | Weekly Digest        |
+---------------------------------------------------------------------------------------------------+
| [ Public Portfolio Visibility & Sharing ]                                                          |
|  - Public Portfolio Toggle (Public / Private)                                                     |
|  - Custom URL Slug Generator: achievenest.ndmu.edu/p/dr-maria-santos | [ Copy Link ] Button       |
+---------------------------------------------------------------------------------------------------+
| [ PDF & Export Privacy Controls ]                                                                 |
|  - Checkboxes: Include Employee ID on PDF | Include Phone Number on PDF                             |
+---------------------------------------------------------------------------------------------------+
| [ Danger Zone ]                                                                                   |
|  - [ Reset Portfolio Draft ] | [ Request Account Deactivation ]                                   |
+---------------------------------------------------------------------------------------------------+
```

#### A. Theme & Appearance
- Toggle switch between Light Mode and Dark Mode, utilizing the project's custom [`useTheme.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/hooks/useTheme.js) hook with persistent `localStorage` sync.

#### B. Notification Preferences
- Granular toggles for email notifications, push alerts, verification status changes, and digest emails.

#### C. Public Portfolio Sharing
- **Public Visibility Toggle**: Enables or disables public web access to portfolio.
- **Shareable Slug Generator**: Generates shareable URL (`achievenest.ndmu.edu/p/dr-maria-santos`) with single-click copy button and toast notification.

#### D. PDF Export Privacy Controls
- Customization options to include or suppress sensitive details (Employee ID, Phone Number) on generated PDF booklets.

#### E. Danger Zone
- Options to clear draft portfolio caches or submit account deactivation requests.

---

### SECTION 7: LOGOUT

The **Logout** action ([`Sidebar.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/components/Sidebar.jsx#L32)) handles session cleanup:
- Triggers [`logoutUser()`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/src/services/authService.js).
- Clears local storage auth tokens and active role context state.
- Navigates the user back to the Root Login Page (`/`).

---

## 4. Multi-Role Verification Lifecycle & Self-Review Bypass Matrix

```
+---------------------------------------------------------------------------------------------------+
| PORTFOLIO LIFECYCLE & SELF-REVIEW BYPASS STATE MACHINE                                            |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
| [ DRAFT ] ------------(Personnel Submits)-----------> [ SUBMITTED_TO_DEP_SEC ]                      |
|   |                                                         |                                     |
|   | (If Faculty is DepSec - Self Review Bypass)             | (DepSec Evaluates)                  |
|   +---------------------------------------+                 |                                     |
|                                           v                 v                                     |
|                                     [ ENDORSED_TO_HR ] <----+                                     |
|                                           |                 |                                     |
|                                           |                 +-->(Returned)--> [ RETURNED ]        |
|                                     (HR Evaluates)                                                |
|                                           v                                                       |
|                                    [ HR_APPROVED ]                                                |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

### State Progression Rules
1. **`DRAFT`**: Portfolio created and edited by personnel. Items can be added, updated, or re-ordered.
2. **`SUBMITTED_TO_DEP_SEC`**: Submitted to Department Secretary for initial proof auditing and point validation.
3. **`ENDORSED_TO_HR`**: Department Secretary approves score line-items and forwards portfolio to HR.
4. **`HR_APPROVED`**: Final verification and academic rank sign-off by HR Director.
5. **`RETURNED_TO_PERSONNEL`**: Sent back by DepSec or HR with feedback notes for revision.
6. **Conflict of Interest / Self-Review Bypass**: If the personnel submitting the portfolio is themselves a Department Secretary, the system automatically bypasses department review and routes the portfolio directly to `ENDORSED_TO_HR` for HR Director sign-off.

---

## 5. Verification & Build Audit Summary

- **Automated Unit Test (`scratch/test_canva_view.js`)**: **PASSED** (Validated 16-slide sequence, zero internal scrollbar dimensions `w-[750px] h-[980px]`, and proof image ceilings).
- **Production Build Audit (`npx vite build`)**: Clean build with 0 errors.
