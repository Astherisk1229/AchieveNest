# AchieveNest NDMU Platform: Master Feature Roadmap & Clickable Component Specification

---

> [!NOTE]
> **Project Scope & Architecture Notice**:
> All implementation phases in this repository encompass the **Complete Frontend Client Web Application System** (built using React + Vite + TailwindCSS), featuring complete interactive UI components, dynamic state management, modal workflows, CSV exporters, role context switchers, and client-side data flows. Backend server API integration, database persistence, and server endpoints will be developed separately outside of Antigravity.

---

## 📊 1. Master System Status & Clickable Feature Matrix

This matrix provides an authoritative, complete inventory of all interactive buttons, cards, menus, modals, and links across the AchieveNest web application, detailing the exact behavior and display output triggered by each click.

### 🎓 A. Student Portal (`/student/dashboard` & `/student/achievements`)
| View / Component | Clickable Element | Interaction Type | Behavior & Display Output | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Student Homepage** | `Digital ID Barcode` Button | Modal Popup | Opens `DigitalBarcodeIDCard` modal displaying NDMU Student ID, barcode graphics, and print button | ✅ **WORKING & CLICKABLE** |
| **Student Homepage** | `Submit New Achievement` Card | Navigation + Modal | Redirects to `/student/achievements` AND automatically opens `AchievementSubmissionModal` form overlay | ✅ **WORKING & CLICKABLE** |
| **Student Homepage** | `Edit Basic Information` Card | Modal Popup | Opens `EditBasicInfoModal` allowing editing of student contact info and academic details | ✅ **WORKING & CLICKABLE** |
| **Student Homepage** | `My Verified Certificates` Card | Category Filter | Filters timeline list to show verified student certificates only | ✅ **WORKING & CLICKABLE** |
| **Student Homepage** | Category Vault Cards | Filter & Scroll | Sets category filter and scrolls smoothly to timeline section | ✅ **WORKING & CLICKABLE** |
| **Achievements Catalog** | `Export Achievements` Button | CSV Download | Generates and downloads a structured CSV file (`AchieveNest_Student_Achievements.csv`) | ✅ **WORKING & CLICKABLE** |
| **Achievements Catalog** | `+ Add Achievement` Button | Modal Popup | Opens `AchievementSubmissionModal` overlay to attach document proof & submit entry | ✅ **WORKING & CLICKABLE** |
| **Achievements Catalog** | Stat Pills (Total / Verified / Pending) | Filter Grid | Filters achievement cards grid by verification status (`Verified`, `Pending Review`, `Returned`) | ✅ **WORKING & CLICKABLE** |
| **Achievements Catalog** | Grid 🔲 / List ☰ Toggle Buttons | Layout Toggle | Toggles card display between 2-column certificate card grid and compact row list view | ✅ **WORKING & CLICKABLE** |
| **Achievements Catalog** | "By Category" Sidebar Items | Filter Grid | Filters achievement cards grid by category (Academic, Leadership, Community, Sports, etc.) | ✅ **WORKING & CLICKABLE** |

### 👨‍🏫 B. Faculty & Personnel Portfolio (`/personnel/dashboard`)
| View / Component | Clickable Element | Interaction Type | Behavior & Display Output | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Personnel Portfolio** | `Digital ID Barcode` Button | Modal Popup | Opens `DigitalBarcodeIDCard` modal with faculty employee ID, barcode, and designation | ✅ **WORKING & CLICKABLE** |
| **Personnel Portfolio** | `Submit New Accomplishment` Card | Modal Popup | Opens `PersonnelSubmissionModal` overlay to attach research/seminar proof | ✅ **WORKING & CLICKABLE** |
| **Personnel Portfolio** | `Edit Basic Information` Card | Modal Popup | Opens `EditBasicInfoModal` to update faculty rank, department, and credentials | ✅ **WORKING & CLICKABLE** |
| **Personnel Portfolio** | `My Verified Proofs` Card | Filter Timeline | Filters timeline cards to verified faculty accomplishments | ✅ **WORKING & CLICKABLE** |
| **Personnel Portfolio** | Category Vault Cards | Filter & Scroll | Sets category filter and scrolls smoothly to accomplishments timeline | ✅ **WORKING & CLICKABLE** |

### 🔄 C. Personnel Multi-Role Context Switcher (`Header.jsx` & `Sidebar.jsx`)
| View / Component | Clickable Element | Interaction Type | Behavior & Display Output | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Top Header Menu** | Profile Avatar Dropdown | Popover Menu | Opens top-right profile popover menu (aligned right; `Switch To` hidden for students) | ✅ **WORKING & CLICKABLE** |
| **Header Dropdown** | `Switch To` Accordion | Submenu Toggle | Expands available administrative roles for personnel (excludes currently active view) | ✅ **WORKING & CLICKABLE** |
| **Header Dropdown** | `Program Coordinator` Option | Context Switch | Switches context to Program Coordinator; renders `CoordinatorDashboardView` & updates sidebar badge | ✅ **WORKING & CLICKABLE** |
| **Header Dropdown** | `Organization Account` Option | Context Switch | Switches context to Organization Moderator portal | ✅ **WORKING & CLICKABLE** |
| **Header Dropdown** | `Department Secretary` Option | Context Switch | Switches context to Department Secretary endorsement view | ✅ **WORKING & CLICKABLE** |
| **Header Dropdown** | `Faculty / Personnel View` Option | Context Switch | Switches context back to default Faculty Professional Portfolio view | ✅ **WORKING & CLICKABLE** |

### 🛡️ D. Program Coordinator Verification Portal (`active_role_context === 'program_coordinator'`)
| View / Component | Clickable Element | Interaction Type | Behavior & Display Output | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Coordinator View** | Stat Counter Cards | Overview Metrics | Displays 4 counters: Pending Reviews (1), Verified (3), Returned (1), Avg Review Time (2.5 hrs) | ✅ **WORKING & CLICKABLE** |
| **Coordinator View** | Scope Notice Banner | Program Scope | Restricts view to assigned degree program (*BS Computer Science*) | ✅ **WORKING & CLICKABLE** |
| **Coordinator View** | Pending Queue Item Card | Modal Popup | Opens student submission review modal with document proof preview | ✅ **WORKING & CLICKABLE** |
| **Coordinator View** | `Approve & Verify` Button | Action Trigger | Approves achievement, updates status to Verified, and increments stats | ✅ **WORKING & CLICKABLE** |
| **Coordinator View** | `Return with Remarks` Button | Action Trigger | Returns submission to student with required feedback remarks | ✅ **WORKING & CLICKABLE** |

### 🏢 E. Department Secretary Portal (`active_role_context === 'department_secretary'`)
| View / Component | Clickable Element | Interaction Type | Behavior & Display Output | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Secretary View** | Submissions Queue Cards | Modal Popup | Opens faculty submission review modal with document proof preview | ⏳ **IN PLANNING (Phase 5)** |
| **Secretary View** | `Endorse to HR` Button | Action Trigger | Endorses faculty accomplishment to HR Office queue and stamps `Dept Endorsed` | ⏳ **IN PLANNING (Phase 5)** |
| **Secretary View** | `Return to Faculty` Button | Action Trigger | Returns faculty accomplishment submission with required correction remarks | ⏳ **IN PLANNING (Phase 5)** |

### 🏛️ F. HR Office Directory & OSAD Admin Suite
| View / Component | Clickable Element | Interaction Type | Behavior & Display Output | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **HR Staff Dashboard** | Faculty Directory & Accreditation | Management | Manages university-wide records, exports accreditation reports & assigns secretary roles | ⏳ **IN PLANNING (Phase 6)** |
| **OSAD Admin Suite** | Org Moderation & Attendance | Scanner Engine | Moderates student org charters, runs barcode scanner sessions & generates digital certificates | ⏳ **IN PLANNING (Phase 7)** |

---

## 🚀 2. Phased Implementation Roadmap & Button Specifications

### Phase 1: Core Design System & Theme Infrastructure [COMPLETED - ✅ IMPLEMENTED & WORKING]
- Established NDMU Forest Green (`#1b4332`), Emerald accent (`#2d8a4e`), and Mint token design system in `src/index.css`.

### Phase 2: Application Shell Layout [COMPLETED - ✅ IMPLEMENTED & WORKING]
- Implemented `MainLayout.jsx`, `Header.jsx`, `Sidebar.jsx`, and `NotificationPopover.jsx`.

### Phase 3: Student Portfolio & Digital NDMU Barcode ID Interface [COMPLETED - ✅ IMPLEMENTED & WORKING]
- Implemented `StudentDashboard.jsx`, `DigitalBarcodeIDCard.jsx`, and `AchievementSubmissionModal.jsx`.

### Phase 3.1: Dedicated Student Achievements Catalog & Workspace [COMPLETED - ✅ IMPLEMENTED & WORKING]
- Implemented `StudentAchievementsPage.jsx` (`/student/achievements`) featuring grid/list view mode toggles, category/status filters, CSV export, category breakdown sidebar widget, and homepage submission redirect.

#### 📋 Detailed Field & UI Text Specification: 3-Step Achievement Submission Wizard [COMPLETED - ✅ IMPLEMENTED & WORKING]

```mermaid
graph LR
    A["🏆 STEP 1: Basic Details<br/>(Title, Event, Issuer)"] --> B["🌐 STEP 2: Scope & Rank<br/>(Category, Scope Level, Rank, AY)"]
    B --> C["📄 STEP 3: Proof & Summary<br/>(Description, Drag-and-Drop Proof)"]
    C --> D["✅ Submitted & Sent for Verification"]
```

##### 🏆 STEP 1: Basic Achievement Details
- **Header Title**: Submit New Achievement
- **Header Subtitle**: Step 1 of 3: Basic Details
- **Step Badge 1**: `1. Basic Info` (Active Green Pill)

| Field Name | Label Text | Component Type | Placeholder / Helper Text | Validation |
| :--- | :--- | :--- | :--- | :--- |
| `title` | Award / Achievement Title * | Text Input | e.g. Dean's Lister - First Semester AY 2025-2026 | Required, Min 5 chars |
| `event_name` | Event / Competition Name * | Text Input | e.g. 12th SOCCSKSARGEN IT Summit / NDMU Intramurals 2025 | Required, Min 3 chars |
| `issuer_organization` | Issuing Body / Organization * | Text Input | e.g. NDMU CITE / DOST Region XII | Required |

- **Step 1 Action Buttons**:
  - `Cancel` (Ghost button → closes modal)
  - `Next: Scope & Rank →` (Primary Emerald CTA)

##### 🌐 STEP 2: Classification, Scope & Rank Weighting (For TOPSIS Scoring)
- **Header Subtitle**: Step 2 of 3: Scope & Rank
- **Step Badge 2**: `2. Scope & Rank` (Active Green Pill)

| Field Name | Label Text | Component Type | Options List / Values | Validation |
| :--- | :--- | :--- | :--- | :--- |
| `category_id` | Category * | Dropdown Select | Academic, Leadership, Athletics, Volunteerism & Community, Arts & Culture | Required |
| `scope_level` | Geographic Scope / Level * | Dropdown Select | Institutional / Campus-Wide, Local / City Level, Regional (Region XII), National Level, International Level | Required |
| `rank_conferred` | Rank / Position Conferred * | Dropdown Select | Champion / 1st Place, 2nd Place, 3rd Place, Finalist / Runner-Up, Dean's Lister, Leadership Officer / Lead, Participant / Special Award | Required |
| `academic_year` | Academic Year * | Dropdown Select | AY 2025-2026, AY 2024-2025, AY 2023-2024 | Required |
| `semester` | Term / Semester * | Dropdown Select | 1st Semester, 2nd Semester, Summer Term | Required |
| `date_achieved` | Date Conferred * | Date Picker | MM / DD / YYYY | Required |

- **Step 2 Action Buttons**:
  - `← Back` (Returns to Step 1)
  - `Next: Proof & Submit →` (Primary Emerald CTA)

##### 📄 STEP 3: Supporting Proof & Summary Submission
- **Header Subtitle**: Step 3 of 3: Proof & Summary
- **Step Badge 3**: `3. Proof & Summary` (Active Green Pill)

| Field Name | Label Text | Component Type | Instruction / Helper Text | Validation |
| :--- | :--- | :--- | :--- | :--- |
| `description` | Narrative Description | Textarea (3 rows) | Brief details about the accomplishment, criteria met, or project abstract... | Optional |
| `document_url` | Supporting Evidence Document (PDF/JPG/PNG) * | Drag-and-Drop File Upload | Icon: Upload Cloud<br/>Primary Text: Click or drag certificate attachment here<br/>Subtext: PDF, JPG, PNG up to 5MB | Required |

- **Step 3 Action Buttons**:
  - `← Back` (Returns to Step 2)
  - `Submit Entry ✓` (Primary Emerald CTA)

### Phase 3.2: Dedicated Student Public Portfolio & Accomplishments Profile Workspace (`/student/portfolio`) [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Build `StudentPortfolioPage.jsx` (`/student/portfolio`) matching design screenshots featuring hero banner with avatar, About Me card, vertical Experience & Involvement timeline, Featured Achievements grid, Supporting Evidence gallery, Contact & Skills cards, and category navigation redirect logic.
- **Key Components & Layout**:
  1. **Hero Header Profile Banner (NDMU Forest Green `#1b4332`)**: Large student avatar with verified badge, Full Name (*Maria Santos*), Student ID (*2024-01234*), Program (*BS Computer Science*), Year Level & Age (*3rd Year - 21 yrs*), Location (*Koronadal City, South Cotabato*), and 3 Right Stat Pill Cards (`5 Total`, `3 Verified`, `30 Points`).
  2. **About Me Card**: Narrative student bio and academic background statement.
  3. **Experience & Involvement Timeline Card**: Vertical timeline showcasing student positions (*President • Computer Society NDMU*, *Dean's Lister • CEAC NDMU*, *Community Extension • Koronadal City Barangay Program*, *Hackathon Finalist • DICT RegTech 2024*, *Core Developer • University Web Dev Team*).
  4. **Featured Achievements Grid**: Cards showing verified achievements with banner illustrations/emojis and category badges.
  5. **Supporting Evidence Section**: Evidence gallery cards displaying thumbnail previews for certificates.
  6. **Interactive Navigation Logic**: Clicking a category item under *Achievements by Category* or in *Supporting Evidence* redirects to the **Achievements Section** (`/student/achievements`) with that category pre-filtered!
### Phase 3.3: Canva-Style Portfolio Export Flow & Multi-Page PDF Generator [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Transform the export modal into a Canva-style split-screen workspace (`w-full max-w-6xl`) with multi-page live document rendering, custom structure toggles, template selectors, and interactive page-by-page PDF generation (strictly PDF portfolio).
- **Key Architectural Specs & Layout**:
  - **Strict PDF Focus**: Dedicated 100% to print-ready PDF portfolio export (CSV format removed).
  - **Left Panel (65% width)**:
    - Live multi-page interactive preview renderer with pagination controls (`< Page X of Y >`, page jump dropdown).
    - **Page 1**: Official NDMU Cover Page (University Crest, Student Info, Program Seal).
    - **Page 2**: Table of Contents & Executive Summary (Dynamic stats recalculation based on selected items).
    - **Page 3 (and each category start)**: Full-page Category Separator Slide (e.g. `1. ACADEMIC ACHIEVEMENTS`).
    - **Page 4+ (Dedicated Self-Contained 1-Page Per Achievement)**:
      - **Strict Layout Guarantee**: Every achievement page fits **ALL important metadata on the top 35-40%**, immediately followed by **1 full attached certificate scan / document proof on the lower 60-65% of the EXACT SAME PAGE**.
      - **Top Metadata Section**: Title, Event/Competition Name, Issuing Entity, Geographic Scope Level, Rank Conferred, Academic Term, Date Conferred, Verifier Name, System QR Code, and `Verified ✓` badge.
      - **Bottom Certificate Section**: High-resolution scanned certificate / evidence preview box.
      - Page break rule: `page-break-after: always` to ensure zero overflow.
  - **Right Panel (35% width)**:
    - **Template Selection**: *Official NDMU Dossier*, *Modern Clean*, *Executive 1-Pager*.
    - **Structure Toggles**: Switches for `Include Cover Page`, `Include Table of Contents`, `Include Category Separators`, and `Chronological Sorting (Newest First)`.
    - **Item Checklist**: Collapsible category tree with checkboxes allowing students to pick/unpick specific items.
    - **Dynamic CTA**: `Download Portfolio PDF (X Pages)`.

### Phase 3.4: Student Account & Profile Information Edit Suite [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Build `EditStudentInfoModal.jsx` allowing students to edit non-immutable profile fields (Bio, Contact info, Skills, Experience timeline) while protecting registrar-managed fields (Full Name, Student ID, Degree Program, College).
- **Field Mutability Rules**:
  - **Editable Fields**: Avatar Image, About Me narrative bio, Phone Number, Secondary Email, Address, Social/Portfolio URLs, Skills & Competencies (with 3-dot proficiency levels), Experience & Involvement entries (Role, Organization, Period).
  - **Read-Only / Protected System Fields**: Full Name (*Maria Santos*), Student ID (*2024-01234*), Program (*BS Computer Science*), College (*College of Information Technology*), Academic Year/Year Level.
- **Key Components**:
  - `EditStudentInfoModal.jsx`: Tabbed modal dialog featuring:
    - **Tab 1: Bio & Contact Details**: Avatar preview & URL, About Me statement, Phone, Email, Location.
    - **Tab 2: Skills & Competencies Manager**: Add/remove skill tags with 3-dot level selectors (*1: Familiar, 2: Proficient, 3: Expert*).
    - **Tab 3: Experience & Involvement Timeline**: Add/edit/delete position entries (*Role title, Organization, Period*).
  - Integrates directly with `StudentPortfolioPage.jsx` and top-right profile header.

### Phase 3.5: Account Section & OSAD Security Management Page [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Implement the dedicated Account Settings workspace (`/account` and `/student/account`) following the exact UI mockup, featuring system identity fields, protected registrar notices, and OSAD password reset requests.
- **UI Architecture & Layout Specifications**:
  - **Profile Avatar Header Card**: Large avatar preview, Name (*Maria Santos*), Account Type badge (*Student Account*), and `Change Profile Picture` action.
  - **Account Information Form**:
    - **Full Name**: Editable input field.
    - **Student Number / Employee ID**: Read-only disabled mint field with lock indicator & notice: *"This field cannot be edited"*.
    - **Program / Department**: Read-only disabled mint field with program label.
    - **Email Address**: Editable email input.
    - **Contact Number**: Editable phone number input.
    - **Save Changes Button**: Green primary action button.
  - **Security Settings Card**:
    - **Password Reset Container**: Mint callout card with helper text *"To reset your password, submit a request to OSAD. They will verify your identity and provide you with new credentials."*
    - **Request Password Reset CTA**: Interactive button triggering confirmation toast & OSAD ticket tracking.

### Phase 3.5.1: Dual Password Reset Suite for Students [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Implement a dual-mode password management workflow in `AccountPage.jsx` featuring instant self-service password updates for logged-in students alongside OSAD administrative ticket requests for forgotten credentials or locked-out accounts.
- **UI Architecture & Workflow Specifications**:
  - **Option 1: Instant Self-Service Password Change (Primary)**:
    - **Step 1: Current Password Verification**: Verify current password with visibility toggles.
    - **Step 2: New Password & Strength Meter**: Password strength indicator, character requirements checklist (min 8 chars, uppercase, number/special char), and real-time password matching validation.
    - **Step 3: Security Audit Confirmation**: Confirmation toast and security email audit dispatch alert.
  - **Option 2: OSAD Reset Ticket Request (Fallback / Helpdesk)**:
    - Secondary action (`Forgot Password? Request OSAD Reset`) triggering ticket generation (`#OSAD-2026-XXXX`) for forgotten passwords or administrative identity resets.

### Phase 3.6: Interactive Notifications Workspace & Management Center [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Build `NotificationsPage.jsx` (`/notifications` and `/student/notifications`) following the exact reference UI mockup, featuring category filters, bulk actions (`Mark all read`, `Clear all`), individual read/delete controls, and bottom notification metric stat cards.
- **UI & Technical Specifications**:
  - **Header Card & Bulk Control Toolbar**:
    - Title: **Notifications** with unread counter subtitle (*"X unread notifications"*).
    - Top Right Actions: `✓ Mark all read` (marks all entries as read) and `🗑️ Clear all` (removes all entries with empty state).
    - Filter Pills Row: `All (4)`, `Unread (3)`, `Read (1)` with active green pill styling.
  - **Interactive Notifications Feed Card**:
    - Row-divided notification items featuring:
      - Category type icons (*Green Check for Verification/Certificate Ready*, *Amber Warning for Revisions*, *Blue Info for New Events*).
      - Title & Description message text (*"Your submission 'Dean's Lister' has been verified"*).
      - Timestamp + Inline Action Links: `2 hours ago` • `Mark as read` (green link) • `Delete` (red link).
      - Unread indicator dot on far right margin.
  - **Bottom 4 Notification Metric Stat Cards Grid**:
    - `Total` (4) (Blue bell icon)
    - `Unread` (3) (Orange exclamation icon)
    - `Success` (2) (Green check icon)
    - `Warnings` (1) (Amber warning icon)
  - **App Shell Integration**: Connects with `Sidebar.jsx` Account section and `NotificationPopover.jsx`.
- Implemented `PersonnelDashboard.jsx`, `EditBasicInfoModal.jsx`, and `PersonnelSubmissionModal.jsx`.

### Phase 3.7: Portfolio Privacy, Sharing & Settings Enhancements [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Enhance the Account & Settings workspace with dedicated privacy controls, custom shareable portfolio links, PDF export visibility options, unified theme notification preferences, and improved account management actions.
- **UI Architecture & Feature Specifications**:
  - **Portfolio Privacy & Sharing Card (New)**:
    - **Public Portfolio Toggle**: Easily turn public access on or off.
    - **Custom Shareable Link**: Direct link `achievenest.ndmu.edu/p/maria-santos` with a `Copy Link` button.
    - **PDF Export Visibility Controls**: Checkboxes to include/exclude Student ID and Phone number on exported PDFs.
  - **Notification Preferences Card (Unified Theme)**:
    - All toggle switches and icon badges match the official NDMU Forest Green color scheme (`#2d8a4e`) for visual consistency.
  - **Account & Security Card (Improved Actions)**:
    - **Explicit Action Buttons**: Explicit action buttons (`Update`, `Download CSV`) on the right side of each option.
    - **Deactivate Public Portfolio**: Replaces the inappropriate "Delete Account" option with a soft red deactivation button that respects institutional university records.

### Phase 4.5: Personnel Multi-Role Context Switcher & Profile Menu [COMPLETED - ✅ IMPLEMENTED & WORKING]
- Implemented multi-role switching in `Header.jsx` and `Sidebar.jsx` supporting `program_coordinator`, `organization_moderator`, `department_secretary`, and `personnel`.

### Phase 4.6: Program Coordinator Verification & Management Portal [COMPLETED - ✅ IMPLEMENTED & WORKING]
- Implemented `CoordinatorDashboardView.jsx` with hero summary banner, 4 stat counter cards, program scope notice (*BS Computer Science*), pending verification queue, and verification summary cards.

### Phase 4.6.1: Program Coordinator Verification & Student Roster Workspace [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Expand `CoordinatorDashboardView.jsx` with multi-tab workspace navigation (`Overview`, `Verification Workspace`, `Students`, `Reports`), document proof preview modal, search filtering, and student roster management restricted to assigned program scope (*BS Computer Science*).
- **UI & Technical Specifications**:
  - **Multi-Tab Workspace Navigation**:
    - `Overview`: Hero banner, 4 stat counter cards (*Pending Reviews (1)*, *Verified (3)*, *Returned (1)*, *Avg Review Time (2.5 hrs)*), pending queue, and program verification summary cards.
    - `Verification Workspace`: Filterable queue table with document proof preview modal, TOPSIS point preview, and approval/return actions.
    - `Students`: Program student directory grid displaying verified points, achievement counters, and student dossier access.
    - `Reports`: Program verification compliance analytics and CSV export capability.
  - **Submission Review & Proof Modal**:
    - High-resolution certificate preview, student metadata breakdown, required return remarks textarea, and `Approve & Verify` / `Return with Remarks` CTAs.
  - **Strict Program Scope Enforcement**: Restricted to assigned program (*BS Computer Science*) for institutional privacy and role-based access control.

### Phase 4.6.2: Program Coordinator Overview Section Content Refinement [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Streamline the lower section of `CoordinatorDashboardView.jsx` (`activeTab === 'overview'`) by removing redundant progress charts and duplicate sidebar shortcuts, replacing them with a focused 2-column layout featuring a **Recent Verification Activity Log** and **Coordinator Guidelines & SLA Policy**.
- **UI & Technical Specifications**:
  - **Top Cards Preserved**: Hero Banner (*Dr. Ana Reyes*), 4 Stat Counter Cards (*Pending Reviews*, *Verified*, *Returned*, *Avg Review Time*), and Program Scope Notice Banner (*BS Computer Science*) remain 100% intact.
  - **Refined Overview Layout (Option 2 Streamlined)**:
    - **Left Column (span-2)**: **Recent Verification Activity Log** — Real-time audit stream of student submissions, approved entries, returned items with remarks, and TOPSIS point synchronizations.
    - **Right Column (span-1)**: **Coordinator Guidelines & Verification Standards** — Institutional SLA policy (24-48h turnaround), proof document criteria, TOPSIS scoring reference, and return remarks requirements.

### Phase 4.6.3: Verification Workspace Master-Detail Redesign [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Redesign the **Verification Workspace** tab (`activeTab === 'workspace'`) in `CoordinatorDashboardView.jsx` based on the reference layout into a responsive master-detail 2-column workspace for rapid submission inspection, document proof review, and instant decision handling.
- **UI & Technical Specifications**:
  - **Top Action & Search Toolbar**:
    - Title: `Verification Workspace` with subtitle `Review and verify student achievement submissions`.
    - Right Action Buttons: `[Filter]` button (with filter icon) and solid green `[Export Queue]` button (with download icon).
    - Full-width Search Bar with status filter pills on the right: `Pending (N)`, `Returned (N)`, `All (N)`.
  - **Split 2-Column Master-Detail Layout**:
    - **Left Column: Submission Queue (1/3 Width)**:
      - Header displaying active queue total e.g., `Submission Queue (1)`.
      - Interactive scrollable list of queued student submission cards.
      - Active item card highlights with a blue border, subtle blue background tint, rounded corners, student avatar, achievement title, student name, document counter badge (`1 docs`), and status pill (`Pending`, `Returned`, `Verified`).
    - **Right Column: Inspection & Verification Panel (2/3 Width)**:
      - **Student Header Section**: Avatar, Student Name, Student ID (`Student ID: 2024-01234`), and status pill (`PENDING`, `RETURNED`, `VERIFIED`).
      - **Achievement Details Card**:
        - Title: e.g., `Community Outreach Volunteer`.
        - Key-value metadata badges: `Category` (green pill), `Date` (calendar icon), `Venue` / `Scope Level`.
        - `Description` Container: Light green shaded box displaying student submission notes.
      - **Supporting Documents Section**:
        - Header `Supporting Documents (N)`.
        - Document file container showing download icon, filename (`photo_evidence.jpg`), filesize (`445.3 KB`), and action buttons: `[View]` (blue button with eye icon) and `[Download]` (outlined button with download icon).
      - **Comments / Feedback Section**:
        - Header `Comments / Feedback` with message icon.
        - Textarea for providing feedback or specifying what needs to be revised.
      - **Decision Action Bar**:
        - `Return for Revision` button (amber outline CTA requiring feedback remarks).
        - `Approve & Verify` button (solid green CTA to verify achievement and award points).


### Phase 4.6.4: Program Student Roster Directory Redesign [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Redesign the **Students** tab (`activeTab === 'students'`) in `CoordinatorDashboardView.jsx` based on the reference design into an interactive 3-column student card grid with multi-level filtering and individual accomplishment summaries.
- **UI & Technical Specifications**:
  - **Top Banner & Search/Filter Controls**:
    - **Header Card**: Title `Students` with green rounded icon badge and subtitle `5 students in your program` (dynamic count). Export Data button removed per requirement.
    - **Search & Dropdown Filter Toolbar**:
      - Search Input: `Search by name, ID, or email...` with search icon.
      - Year Level Filter Dropdown: `All Years`, `1st Year`, `2nd Year`, `3rd Year`, `4th Year`.
      - Course/Program Filter Dropdown: `All Courses`, `BS Computer Science`, `BS Information Technology`, `BS Nursing`, `BS Business Administration`.
  - **Student Cards Grid Layout (3 Columns)**:
    - **Student Card Component**:
      - **Header Section**: Avatar icon container (dark purple/slate circle silhouette), Student Full Name (bold text), Student ID (`2021-00123`), and Course/Department info (`BS Computer Science (CEAC)`).
      - **Middle Stats Container (Soft Light-Green Shaded Box)**:
        - **Achievements Column**: Icon, label `Achievements`, bold count (e.g., `12`).
        - **Points Column**: Icon, label `Points`, bold points total (e.g., `450`).
      - **Bottom Status Breakdown Footer**:
        - Green indicator dot + count text: `10 verified`.
        - Orange/Amber indicator dot + count text: `2 pending`.


### Phase 4.6.5: Program Coordinator Reports Section Removal [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Remove the **Reports** section (`activeTab === 'reports'`) and its sidebar navigation link from the Program Coordinator workspace in `CoordinatorDashboardView.jsx` and `Sidebar.jsx`.
- **UI & Technical Specifications**:
  - Remove the **Reports** navigation menu item from the Program Coordinator sidebar options in `Sidebar.jsx`.
  - Remove the `activeTab === 'reports'` view block from `CoordinatorDashboardView.jsx`.
  - Ensure URL query parameter fallback defaults safely to `'overview'` if `?tab=reports` is accessed.


### Phase 4.6.6: Verification Workspace — Full Achievement Detail Panel [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Enhance the right-column Inspection & Verification Panel in the `Verification Workspace` tab of `CoordinatorDashboardView.jsx` so that the Program Coordinator sees **every field the student submitted** in `AchievementSubmissionModal.jsx` — nothing is hidden.
- **Gap Analysis** (Fields submitted by student vs. currently shown in detail panel):

  | Student Submission Field | Currently Shown? | Action |
  |---|---|---|
  | Award / Achievement Title | ✅ Yes | Keep |
  | Category | ✅ Yes | Keep |
  | Date Conferred | ✅ Yes | Keep |
  | Geographic Scope / Level | ✅ Yes | Keep |
  | Narrative Description | ✅ Yes | Keep |
  | Supporting Document file | ✅ Yes | Keep |
  | **Event / Competition Name** | ❌ Missing | Add |
  | **Issuing Body / Organization** | ❌ Missing | Add |
  | **Rank / Position Conferred** | ❌ Missing | Add |
  | **Academic Year** | ❌ Missing | Add |
  | **Term / Semester** | ❌ Missing | Add |
  | **Student Program** | ❌ Missing | Add to header |

- **UI & Technical Specifications**:
  - **Student Header Section** (top bar): Add the student's **Program / Course** label beneath the Student ID.
  - **Achievement Details Card** (metadata badges row): Add `Event / Competition Name`, `Issuing Body / Organization`, `Rank / Position Conferred`, `Academic Year`, `Term / Semester` as labeled metadata chips alongside the existing `Category`, `Date`, and `Scope Level` chips.
  - **Data Model**: Ensure the `initialSubmissionsData` array in `CoordinatorDashboardView.jsx` and the `AchievementModel.js` model contain all new fields (`event_name`, `issuer`, `rank_conferred`, `academic_year`, `semester`). Seed them with realistic sample values in existing demo entries.
  - **MVC Compliance**: No new business logic inside the View. The `AchievementModel.js` model stores field definitions; `VerificationController.js` reads from models; `useVerification.js` hook exposes the hydrated item to the View.
  - **Zero UI Redesign**: The existing 2-column master-detail layout, fonts, spacing, and color palette must remain 100% unchanged. Only the **right detail panel's content area** is extended with the missing fields.


### Phase 4.7.1: Program Coordinator Student Dossier & Portfolio Inspection Modal [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Create a comprehensive, interactive Student Portfolio Dossier Modal when the Program Coordinator clicks any student card in the `Students` directory tab (`activeTab === 'students'`).
- **Detailed Plan & Specification of What the Coordinator Will See**:

  1. **👤 Student Profile Header Banner**:
     - **Avatar & Personal Info**: Student Profile Avatar, Full Name, Student ID (`2021-00123`), NDMU Institutional Email (`maria.santos@ndmu.edu.ph`).
     - **Academic Context**: Course / Program (`BS Computer Science`), Department (`Department of Computer Studies`), Year Level badge (`4th Year`).
     - **Summary Counter Cards**:
       - 🏆 `Total Achievements` (e.g. `12`)
       - ✅ `Verified` (e.g. `10`)
       - ⏳ `Pending Review` (e.g. `2`)
       - 🔄 `Returned for Revision` (e.g. `0`)

  2. **📂 Categorized Accomplishment Portfolio Tabs**:
     - **Tab 1: Verified Accomplishments**:
       - Displays every approved achievement earned by this student.
       - Each entry shows: Title, Category pill, Date Conferred, Scope Level, Event Name, Issuing Body, and attached proof files (*Certificate Document* and *Photo Evidence of Participation*).
     - **Tab 2: Pending Submissions**:
       - Shows active pending submissions waiting for coordinator review.
       - Includes quick inline `[Approve & Verify]` and `[Return for Revision]` action buttons.
     - **Tab 3: Returned Submissions**:
       - Displays entries returned to the student along with the coordinator's recorded feedback/remarks.

  3. **📄 Document & Photo Evidence Inspector**:
     - Integrated preview viewer for certificate PDFs and event participation photos directly inside the student's dossier.

  4. **📥 Action Toolbar**:
     - `[Export Student Dossier PDF / Report]` button to download an official accomplishment record.
     - `[Filter by Category]` dropdown (Academic, Leadership, Athletics, Community, Recognition).
     - `[Close Dossier]` button.

- **Architectural & MVC Compliance**:
  - **Model (`StudentModel.js` & `AchievementModel.js`)**: Encapsulate student portfolio query methods and dossier data fields inside domain classes.
  - **Controller (`RosterController.js`)**: Place logic for filtering student-specific achievements by status and category inside `RosterController.js`.
  - **Hook (`useStudentRoster.js`)**: Connect the dossier modal to the controller.
  - **View (`CoordinatorDashboardView.jsx`)**: Render the presentational dossier modal while strictly maintaining visual parity and design system standards.


### Phase 4.7.2: Program Coordinator Profile & Notification Settings Redesign [UPCOMING / IN PLAN]
- **Objective**: Redesign the Program Coordinator Settings workspace (`SettingsPage.jsx` when accessed in Program Coordinator / Personnel context) to match the reference mockup image with exact visual parity.
- **Detailed Specifications (Based on Reference Mockup)**:

  1. **👤 Profile Settings Card**:
     - **Header**: Circular green icon container with user silhouette icon, Title `Profile Settings`, Subtitle `Manage your account information`.
     - **Form Fields Grid**:
       - `Full Name`: Input field initialized with `Dr. Ana Reyes`.
       - `Email Address`: Input field initialized with `personnel@ndmu.edu.ph`.
       - `Department`: Input field initialized with `CEAC - College of Engineering, Architecture, and Computing`.

  2. **🔔 Notification Preferences Card**:
     - **Header**: Circular blue icon container with notification bell icon, Title `Notification Preferences`, Subtitle `Choose how you want to be notified`.
     - **Toggle Settings List**:
       - ✉️ **Email Notifications**: Subtitle `Receive updates via email` • **[Toggle ON - Green]**
       - 🔔 **Push Notifications**: Subtitle `Get instant notifications` • **[Toggle ON - Green]**
       - 🛡️ **Achievement Alerts**: Subtitle `Notify when achievements are verified` • **[Toggle ON - Green]**
       - ✉️ **Weekly Digest**: Subtitle `Receive weekly summary emails` • **[Toggle OFF - Gray]**

- **Architectural & MVC Standards**:
  - Delegate state updates and user model modifications to `UserModel.js` and `AuthController.js`.
  - Ensure zero UI layout disruption while matching 100% of the rounded card borders, spacing, and colors.


### Phase 4.8: Personnel Achievements & Portfolio Workspaces (Student Design Parity) [COMPLETED - ✅ IMPLEMENTED & WORKING]
- **Objective**: Establish 100% design and feature parity between Student and Personnel portals by creating dedicated `PersonnelAchievementsPage.jsx` (`/personnel/achievements`) and `PersonnelPortfolioPage.jsx` (`/personnel/portfolio`), using student pages as exact visual and functional references.
- **UI Architecture & Workflow Specifications**:
  - **Personnel Achievements Workspace (`PersonnelAchievementsPage.jsx`)**:
    - **Header & Action Toolbar**: Search, category filters (*Research & Publications*, *Seminars & Workshops*, *Extension Services*, *Institutional Awards*, *Certifications & Licenses*), status filters (*HR Verified*, *Dept Endorsed*, *Pending Review*), grid/list view toggle, and CSV export.
    - **3-Step Wizard Modal (`PersonnelSubmissionModal.jsx`)**: Step 1 Basic Info -> Step 2 Category & Scope -> Step 3 Proof Attachment & Summary.
  - **Personnel Portfolio Workspace (`PersonnelPortfolioPage.jsx`)**:
    - **Hero Profile Banner**: Faculty avatar, full name, employee ID, designation, department, and CTAs (*Edit Profile*, *Share Link*, *Export PDF Dossier*).
    - **Academic & Research Profile**: Specialization, years of service, academic appointments timeline, contact details, and core competencies badges.
    - **Accomplishment Showcase Gallery**: Category showcase cards (*Research & Publications*, *Seminars & Workshops*, *Extension Services*, *Institutional Awards*).
    - **Export PDF Modal (`ExportPortfolioPreviewModal.jsx`)**: Generates official NDMU faculty portfolio PDF.

### Phase 5: Department Secretary Endorsement & Verification Portal [UPCOMING]
- Build `SecretaryDashboardView.jsx` allowing department secretaries to review faculty submissions.
- **Button Behaviors**:
  - `Review Submission` Button: Opens modal with attached proof document preview.
  - `Endorse to HR Office` Button: Stamps `Dept Endorsed` and moves submission to HR verification queue.
  - `Return to Faculty` Button: Rejects submission back to faculty with required remarks text.

### Phase 6: HR Office Directory & Accreditation Suite [UPCOMING]
- Build `HRDashboard.jsx` for university-wide employee directory and accreditation reporting.
- **Button Behaviors**:
  - `Assign Secretary Role` Button: Grants department secretary context to selected faculty member.
  - `Generate Accreditation Report` Button: Exports accreditation compliance PDF/CSV.

### Phase 6.9 & 6.9.1: GitHub Version Control Checkpoint & Sync [UPCOMING]
- Commit, tag `v0.6.0-stable`, and push to GitHub repository (`git push origin main --tags`).

### Phase 7: OSAD Admin Suite, Student Org Governance & Barcode Attendance Generator [UPCOMING]
- Build `OSADDashboard.jsx` for student organization moderation and barcode attendance session engine.

### Phase 8: TOPSIS Decision Support Engine & Recognition Suite [UPCOMING]
- Build multi-criteria TOPSIS evaluation engine for automated student & faculty award ranking.

---

### System Architecture & Development Analysis (OOP & MVC)
- Documented in detail inside [SYSTEM_ARCHITECTURE_ANALYSIS.md](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/SYSTEM_ARCHITECTURE_ANALYSIS.md).
- Evaluates OOP Paradigm (Encapsulation, Memory Optimization, Data Redundancy Elimination) and MVC Structure.
- Outlines a 3-phase zero-UI-change refactoring plan to introduce `src/models/` and `src/controllers/`.

