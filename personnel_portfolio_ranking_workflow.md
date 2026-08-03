# Personnel Ranking Portfolio Workflow & System Architecture Specification
**Document Version:** 1.0.0  
**Target System:** AchieveNest Student & Personnel Achievement Management Platform  
**Target Roles:** Personnel (Faculty/Staff), Department Secretary (`dep_sec`), Human Resources (`hr`)  
**Reference Document:** NDMU Rating Sheet for Ranking (Notre Dame of Marbel University)

---

## 1. Executive Summary & Workflow Overview

This specification defines the complete workflow, data structures, evaluation rules, and system implementation plan for the **Personnel Ranking Portfolio System** in AchieveNest. 

### Hybrid Vault-to-Portfolio Architecture (Item-by-Item Logging -> Consolidated Submission)
To balance personnel convenience with evaluator efficiency, AchieveNest utilizes a **Hybrid Vault-to-Portfolio Architecture**:

```
[ Step 1: Personal Vault ]        ---> Personnel logs accomplishments individually year-round
           │                           (Certificates, Publications, Seminars, Degrees)
           ▼
[ Step 2: 1-Click Import ]        ---> Personnel opens NDMU Ranking Portfolio & clicks
           │                           "Auto-Populate from Vault" into Areas A, B, & C
           ▼
[ Step 3: Area Ceiling Check ]    ---> System computes live Area Ceilings (A: 70, B: 50, C: 40)
           │                           showing Raw Earned vs Accepted Capped Scores
           ▼
[ Step 4: Unified Batch Submit ]  ---> Personnel submits 1 CONSOLIDATED PORTFOLIO to Department Secretary
```

* **Why this replaces noisy item-by-item reviews:**  
  While personnel can record accomplishments individually in their personal vault as they happen, evaluators (Department Secretary & HR) do **not** review items one by one. Evaluators review **one consolidated NDMU Rating Sheet Portfolio** per personnel per evaluation period. This eliminates dozens of repetitive review notifications and enforces maximum area ceiling caps (70, 50, 40) seamlessly.

### Personnel Homepage Redesign Specification (NDMU Ranking Metrics)
> [!IMPORTANT]
> **Replacing Loose Item Count Cards with Portfolio Ranking Metrics:**  
> Legacy cards displaying loose achievement counts (`Total Records`, `HR Verified`, `Pending Review`, `Dept Endorsed`, `Total Proofs`) were relevant only to student-style one-by-one verification. For Personnel, the **5 Hero Metric Cards** on the Personnel Homepage are updated to reflect official NDMU Ranking Portfolio metrics:
>
> 1. **Accepted Ranking Score Card:** Displays accepted total score (e.g. `123 / 160 Max Pts`) with raw earned sub-badge.
> 2. **Area A: Professional Development Card:** Displays Area A score (e.g. `50 / 70 Max Pts`).
> 3. **Area B: Productivity & Creative Work Card:** Displays Area B score (e.g. `50 / 50 Max Pts`).
> 4. **Area C: Service & Leadership Card:** Displays Area C score (e.g. `23 / 40 Max Pts`).
> 5. **Portfolio Ranking Status Card:** Displays lifecycle status (`Draft Portfolio`, `Under Review`, `Endorsed to HR`, `HR Approved & Locked`).

### Hierarchy & Role Responsibilities
```
 [ HR (Human Resources) ]  ---> Global Authority, Final Score Audit, Ranking Score Lock
           |
           v
 [ Department Secretary ] ---> First-Level Reviewer (Department-Scoped), Line-Item Point Verification
           |
           v
 [ University Personnel ] ---> Vault Creator & Portfolio Submitter (Faculty & Staff)
```

1. **Personnel (`Personnel`)**: Records individual accomplishments in their Vault throughout the year, auto-populates their NDMU Ranking Portfolio, reviews claimed scores, and submits the batch portfolio to their Department Secretary.
2. **Department Secretary (`dep_sec`)**: Reviews portfolios of personnel assigned to their specific department/college. Verifies evidence files, validates claimed scores, inputs verified points per line item, writes remarks, and endorses the portfolio to HR.
3. **HR Administrator (`hr`)**: Receives endorsed portfolios from Department Secretaries across all university units. Conducts final audit, verifies score ceiling caps, approves ranking points, locks official rank status, or returns portfolios for revision.

---

## 2. NDMU Ranking Portfolio Structure & Scoring Rules

The portfolio format strictly mirrors the 5-page **NDMU Rating Sheet for Ranking** with exact point values, category breakdowns, scope multipliers, and area ceiling caps.

```
+-----------------------------------------------------------------------------------+
|                            NDMU RATING SHEET SUMMARY                              |
+------------------------------------+-----------------------+----------------------+
| Area                               | Maximum Area Ceiling  | Primary Components   |
+------------------------------------+-----------------------+----------------------+
| A. Professional Development        | 70 Points Max         | Degrees, Orgs,       |
|                                    |                       | Seminars/Trainings   |
| B. Productivity & Creative Work    | 50 Points Max         | Lectures, Papers,    |
|                                    |                       | Research, Awards,    |
|                                    |                       | Instructional Mat.   |
| C. Service and Leadership          | 40 Points Max         | Extra-Curricular,    |
|                                    |                       | Community, Years Svc |
+------------------------------------+-----------------------+----------------------+
| TOTAL MAXIMUM RANKING SCORE        | 160 Points Max                               |
+------------------------------------+----------------------------------------------+
```

---

### Area A: Professional Development (Maximum: 70 Points)

#### A.1 Degree/s (Max 40 Points)
* **Ph.D. Degree Holder**: `40 pts`
* **Ph.D. Units Earned**: `2 pts` per 3 graduate units (Max `10 pts`)
  * *Scale:* 3 units = 2 pts | 6 units = 4 pts | 9 units = 6 pts | 12 units = 8 pts | 15+ units = 10 pts
* **MA Degree Holder**: `20 pts` max
* **MA Units Earned**: `1 pt` per 3 graduate units (Max `10 pts`)
  * *Scale:* 3 units = 1 pt | 6 units = 2 pts | 9 units = 3 pts ... | 30+ units = 10 pts
* **Fields:** Degree Title, Major/Specialization, Institution Name, Graduation Year / Units Completed, Diploma/Transcript Proof (`PDF/Image`).

#### A.2 Active Membership to Professional Organizations (Max 10 Points)
* **Regular Member**: `5 pts` per active membership
* **Officer / Board Member**: `10 pts` per office or position held
* **Fields:** Organization Name, Position Held (`Member` / `Officer`), Period Covered (School Year), Certificate of Membership/Appointment Proof.

#### A.3 Attendance to Seminars / Trainings for Professional Development (Max 20 Points)
* **Scoring Table by Scope/Tier:**
  * **In-House (NDMU):** `3 pts`
  * **City / Provincial:** `4 pts`
  * **Regional:** `6 pts`
  * **National:** `8 pts`
  * **International:** `10 pts`
* **Fields:** Seminar/Training Title, Venue, Date Covered, Scope (`In-house`, `City/Provincial`, `Regional`, `National`, `International`), Certificate of Participation/Completion Proof.

---

### Area B: Productivity and Creative Work (Maximum: 50 Points)

#### B.1 Guest Lecturer / Consultant / Judge / Resource Person (Max 40 Points)
* **Sponsoring Organization:** `NDMU` vs. `External Agencies / Other Schools`
* **Extent of Talk:** `1 hr`, `Half day`, `1 day`, `2 days`, `More days`
* **Participants Scope:** `Local`, `Regional`, `National`, `International`
* **Role Types:** `Reactor`, `Keynote Speaker`, `Facilitator`, `Consultant`, `Judge`, `Organizer`
* **Point Matrix:** Points range from `1 pt` (1 hr local reactor) to `10 pts` (multi-day international keynote/consultant).
* **Fields:** Activity Title, Sponsoring Organization, Extent of Talk, Participants Level, Role, Certificate / Invitation Proof.

#### B.2 Publication (Scholarly Paper / Article / Research Output / Book) (Max 40 Points)
* **Scope Tiers:** `Local`, `Regional`, `National`, `International`
* **Publication Categories & Point Schedule:**
  * **Commentary:** Local (1), Regional (2), National (1), International (2)
  * **Reviews:** Local (2), Regional (3), National (4), International (5)
  * **Compilation:** Local (3), Regional (4), National (5), International (5)
  * **Article:** Local (1), Regional (2), National (3), International (4)
  * **Scholarly Paper:** Local (2), Regional (3), National (4), International (5)
  * **Monograph:** Local (3), Regional (4), National (4), International (5)
  * **Research Output:** Local (4), Regional (5), National (5), International (5)
  * **Book:** Local (3), Regional (4), National (5), International (5)
* **Fields:** Publication Title, Scope, Publication Type, Journal/Publisher Name, ISSN/ISBN, Date Published, Publication Copy Proof.

#### B.3 Conduct of Research (Max 40 Points)
* **Fields:** Research Project Title, Funding Agency/Source, Project Status (`Completed`, `Ongoing`), Completion Date, Official Research Report / Endorsement Proof.

#### B.4 Professional Recognition or Awards (Max 40 Points)
* **Role Matrix:**
  * **Nominee:** Local (5), Provincial/Regional (15), National (20), International (20)
  * **Awardee:** Local (10), Provincial/Regional (30), National (40), International (40)
* **Fields:** Award Title, Awarding Body, Role (`Nominee`, `Awardee`), Scope, Certificate / Plaque Photo Proof.

#### B.5 Production of Instructional Materials (Max 40 Points)
* **Material Categories & Points:**
  * **Audio-Visual Aids:** `10 pts`
  * **Modules:** `10 pts`
  * **Reviewers (Bound):** `10 pts`
  * **Others (Bound Workbook, Exercises, Lecture Notes):** `20 pts`
* **Fields:** Material Title/Description, Material Type, Academic Year, Approval/Copyright Proof.

#### B.6 Creative Work (Max 20 Points)
* **Fields:** Description of Creative Work, Venue / Exhibition Date, Scope, Documentation Proof.

---

### Area C: Service and Leadership (Maximum: 40 Points)

#### C.1 Involvement in Extra-Curricular Activities / Recognized School Orgs (Max 40 Sub-total)
* **C.1.1 Moderator of Clubs/Organizations:** `Max 20 pts`
* **C.1.2 Coach / Trainer:** `Max 20 pts`
* **C.1.3 Membership in Working Committees:** `Max 20 pts`
* **C.1.4 Render Service during Intramurals, etc.:** `Max 20 pts`
* **Fields:** Activity / Org Title, Role, School Year / Period Covered, Designation Letter Proof.

#### C.2 Community Involvement (Max 30 Sub-total)
* **C.2.1 Active involvement in church activities:** `Max 25 pts`
* **C.2.2 Active involvement in community / civic activities:** `Max 25 pts`
* **C.2.3 Support to charity and community projects:** `Max 5 pts`
* **Fields:** Activity Description, Church/Civic Org Name, Date/Period, Certificate of Appreciation Proof.

#### C.3 Number of Years of Service at NDMU (Max 10 Points)
* **Formula:** `1 point for every 2 full years of service`
  $$\text{Points} = \min\left(10, \left\lfloor \frac{\text{Years of Service}}{2} \right\rfloor\right)$$
  *(e.g., 2 yrs = 1 pt | 4 yrs = 2 pts | 10 yrs = 5 pts | 20+ yrs = 10 pts)*

---

## 3. End-to-End State Machine & Lifecycle Flow

```
[DRAFT] (Personnel builds portfolio) 
   │
   ▼
[SUBMITTED_TO_DEP_SEC] (Department Secretary reviews assigned dept personnel)
   │
   ├──────────► [RETURNED_TO_PERSONNEL] (Revisions requested)
   │                  │
   │                  └──────────► Resubmitted
   ▼
[ENDORSED_TO_HR] (Department Secretary verifies & endorses to HR)
   │
   ├──────────► [RETURNED_TO_DEP_SEC] (HR flags Dep Sec evaluation error)
   │
   ▼
[HR_APPROVED] (HR performs final audit & locks ranking score)
```

### Detailed Lifecycle Steps

#### Step 1: Personnel Portfolio Composition (`DRAFT` -> `SUBMITTED_TO_DEP_SEC`)
* Personnel opens the **Personnel Ranking Portfolio Form**.
* Rather than logging individual items, the UI provides a tabbed/accordion view matching NDMU Rating Sheet Sections A, B, and C.
* Personnel adds line items under each sub-category, uploads proof files (PDF/JPG), and inputs claimed points.
* The system dynamic calculator computes live claimed sub-totals and area totals while enforcing ceiling caps (A: 70, B: 50, C: 40).
* Personnel clicks **"Submit Portfolio for Department Evaluation"**. State updates to `SUBMITTED_TO_DEP_SEC`.

#### Step 2: Department Secretary Review & Verification (`SUBMITTED_TO_DEP_SEC` -> `ENDORSED_TO_HR`)
* Department Secretary logs into AchieveNest and navigates to the **Department Personnel Portfolios** tab.
* The system filters portfolios so the Department Secretary **only sees personnel belonging to their assigned department/college** (e.g., CEAC Secretary sees CEAC faculty).
* Department Secretary opens the portfolio in a **Split-Screen Evaluator Workbench**:
  * **Left Side:** Portfolio Entries with line-item verification controls (Claimed Points vs. Verified Points input, Checkboxes for Verified Proof).
  * **Right Side:** Document Proof Viewer (renders PDF/images attached to the specific item).
* Department Secretary verifies each claim, adjusts points if proof is partial or non-compliant, adds evaluator notes per section, and signs with a Digital Signature Stamp.
* Department Secretary selects **"Endorse to HR"**. State transitions to `ENDORSED_TO_HR`.
* Alternatively, if proof is missing, Dep Sec clicks **"Return to Personnel with Remarks"** (`RETURNED_TO_PERSONNEL`).

#### Step 3: HR Audit & Final Ranking Lock (`ENDORSED_TO_HR` -> `HR_APPROVED`)
* HR Officer opens the **University Ranking Masterboard**.
* HR sees endorsed portfolios from all departments, filtered by Department, College, or Status.
* HR reviews the Department Secretary's verified scores and conducts a final institutional compliance audit.
* HR can edit final verified points if an institutional rule was misapplied, or approve the Department Secretary's evaluation.
* Upon confirmation, HR clicks **"Approve & Lock Official Ranking Score"**.
* State transitions to `HR_APPROVED` (`LOCKED_RANKING_RECORD`). The final ranking score is permanently bound to the Personnel's record for promotion and ranking period reports.

---

## 4. Key Considerations & Business Logic Rules

### 1. Department Scoping & Security Constraints
* **Department Secretary Role Scoping:** A Department Secretary's token/session context contains `assigned_department_id` (e.g., `DEP-CEAC`). SQL/LocalStorage queries for pending portfolios MUST enforce `WHERE department_id = assigned_department_id`.
* **HR Global Access:** HR users hold global permission scope (`department_id = *`), allowing them to assign department secretaries, view all university portfolios, and override evaluation scores if necessary.

### 2. HR Maximum Point Ceiling & Capping Rules (CRITICAL HR DIRECTIVE)
> [!IMPORTANT]
> **Strict Area Ceiling Cap Rule:**  
> Even if a personnel member earns a high volume of accomplishments resulting in total points exceeding an area ceiling, **ONLY the maximum allowed points for that area will be accepted and credited towards their final ranking score**.

#### Area-Level Maximum Ceilings:
- **Area A (Professional Development):** Maximum **70 Points**.  
  *Example:* If personnel earns 85 points across degrees, organizations, and seminars, the system records `Raw Score: 85 pts`, but **only 70 points are accepted**.
- **Area B (Productivity & Creative Work):** Maximum **50 Points**.  
  *Example:* If personnel earns 65 points across guest lectures, publications, and awards, the system records `Raw Score: 65 pts`, but **only 50 points are accepted**.
- **Area C (Service & Leadership):** Maximum **40 Points**.  
  *Example:* If personnel earns 55 points across extra-curriculars, community service, and service years, the system records `Raw Score: 55 pts`, but **only 40 points are accepted**.

#### Sub-Category Ceiling Caps:
- **A.1 Degree/s:** Max 40 pts | **A.2 Membership:** Max 10 pts | **A.3 Seminars:** Max 20 pts
- **B.1 Guest Lecturer:** Max 40 pts | **B.2 Publications:** Max 40 pts | **B.3 Research:** Max 40 pts | **B.4 Awards:** Max 40 pts | **B.5 Instructional Mat.:** Max 40 pts | **B.6 Creative Work:** Max 20 pts
- **C.1 Activities:** Max 40 pts | **C.2 Community:** Max 30 pts | **C.3 Service Years:** Max 10 pts

#### Dual-Score Transparency in System UI & Controllers:
Every portfolio section displays both:
1. **Raw Earned Score ($\sum \text{Verified Points}$):** Total points accumulated from valid entries.
2. **Accepted Capped Score ($\min(\text{Max Ceiling}, \sum \text{Verified Points})$):** The official points counted towards university ranking.

$$\text{Final Ranking Score} = \min\left(70, \sum A_{\text{verified}}\right) + \min\left(50, \sum B_{\text{verified}}\right) + \min\left(40, \sum C_{\text{verified}}\right)$$

### 3. Proof Attachment Guard
* Personnel cannot submit a portfolio line item without attaching at least one valid supporting proof file (PDF, PNG, JPG).
* Department Secretaries have a visual indicator ("Proof Verified" toggle) for every item before endorsement is unlocked.

### 4. Audit Trail & Revision History
* All status transitions, point adjustments, and evaluator remarks are logged in an immutable `audit_trail` array within the portfolio record containing: `timestamp`, `actor_id`, `actor_role`, `action`, `previous_status`, `new_status`, `remarks`.

---

## 5. Architectural Implementation Plan (OOP & MVC Standard)

Following the project's strict OOP & MVC guidelines in `SYSTEM_ARCHITECTURE_ANALYSIS.md`, the implementation will be structured across dedicated models, controllers, bridge hooks, and lightweight views.

```
src/
├── models/
│   ├── PersonnelPortfolioModel.js       # Encapsulates Portfolio Schema, Point Calculation, Ceiling Caps
│   └── RankingCriteriaModel.js          # Encapsulates NDMU Point Schedule Matrices & Formulas
├── controllers/
│   ├── PersonnelPortfolioController.js  # Business Logic for Creation, Submissions, & Calculations
│   ├── DepSecVerificationController.js  # Department Secretary Filtering, Verification, & Endorsement
│   └── HRRankingController.js           # HR Global Audit, Secretary Assignments, & Ranking Lock
├── hooks/
│   ├── usePersonnelPortfolio.js         # React Bridge Hook for Personnel UI
│   ├── useDepSecVerification.js        # React Bridge Hook for Department Secretary Workbench
│   └── useHRRanking.js                  # React Bridge Hook for HR Dashboard
└── components/
    ├── personnel/
    │   ├── PersonnelPortfolioForm.jsx   # Tabbed NDMU Rating Sheet Entry View
    │   └── PortfolioSummaryCard.jsx     # Live Point Breakdown & Status Card
    ├── depsec/
    │   ├── DepSecPortfolioRoster.jsx    # Department Personnel Table with Status Badges
    │   └── DepSecEvaluatorWorkbench.jsx # Split-screen Proof Viewer & Point Verification
    └── hr/
        ├── HRRankingMasterboard.jsx     # University-wide Endorsed Portfolios Table
        └── HRScoreAuditModal.jsx        # HR Final Audit & Ranking Lock Dialog
```

---

## 6. Summary of Key Implementation Deliverables

| Module / Component | Primary Function |
| :--- | :--- |
| **`RankingCriteriaModel.js`** | Enforces NDMU scoring formulas, scope multipliers, and area ceiling caps (A: 70, B: 50, C: 40). |
| **`PersonnelPortfolioModel.js`** | Encapsulates single portfolio document schema, line items, proof URLs, dual points (claimed vs verified), and state machine. |
| **`DepSecVerificationController.js`** | Manages department-level personnel filtering, item point verification, remarks, and HR endorsement. |
| **`HRRankingController.js`** | Manages university-wide ranking masterboard, department secretary assignments, score overrides, and ranking lock. |

---

## 7. Comprehensive Phased Implementation Roadmap & Progress Plan

To ensure modular execution, quality assurance, and zero disruption to existing UI components, the system implementation is broken down into **5 Detailed Execution Phases**.

```
[ PHASE 1: Domain Models & NDMU Scoring Engine ]
                      │
                      ▼
[ PHASE 2: Personnel Portfolio Template & Entry Form ]
                      │
                      ▼
[ PHASE 3: Department Secretary Evaluator Workbench ]
                      │
                      ▼
[ PHASE 4: HR Global Ranking Masterboard & Score Lock ]
                      │
                      ▼
[ PHASE 5: Integration, Role Switching & UI Parity Audit ]
```

---

### Phase 1: Core OOP Domain Models & NDMU Scoring Engine [x] COMPLETED
**Primary Objective:** Build the foundational ES6 model classes encapsulating the NDMU ranking rules, area ceiling caps, and data schemas.

* **[x] Task 1.1: Implement `src/models/RankingCriteriaModel.js`**
  - Define static NDMU point schedule lookup tables for Section A (Degree/Units, Memberships, Seminars by scope), Section B (Guest Lecturer matrices, Publication types x scope, Research, Awards, Instructional materials), and Section C (Activities, Community, Service Years formula).
  - Implement static validation methods for area maximum ceilings ($A \le 70$, $B \le 50$, $C \le 40$, Total $\le 160$).
* **[x] Task 1.2: Implement `src/models/PersonnelPortfolioModel.js`**
  - Define encapsulated class with private fields (`#id`, `#personnelId`, `#departmentId`, `#status`, `#auditTrail`).
  - Implement getter/setter methods for claimed points vs verified points per line item.
  - Implement prototype methods: `calculateRawTotals()`, `calculateAcceptedCappedTotals()`, `transitionStatus(newStatus, actor, remarks)`.

---

### Phase 2: Personnel Portfolio Template & Entry Form [x] COMPLETED
**Primary Objective:** Build the Personnel UI for constructing, saving, auto-calculating, and submitting the complete portfolio matching the NDMU Rating Sheet.

* **[x] Task 2.1: Implement `src/controllers/PersonnelPortfolioController.js` & `src/hooks/usePersonnelPortfolio.js`**
  - Write controller logic for loading/saving draft portfolios to LocalStorage/API.
  - Integrate dynamic recalculation on item addition/deletion.
  - Enforce proof file attachment guards before allowing submission (`SUBMITTED_TO_DEP_SEC`).
* **[x] Task 2.2: Build `src/components/personnel/PersonnelPortfolioForm.jsx`**
  - Create modern, tabbed/accordion rating sheet layout:
    - **Tab 1: Area A - Professional Development** (Degrees, Orgs, Seminars with venue/scope select).
    - **Tab 2: Area B - Productivity & Creative Work** (Lectures, Publications, Research, Awards, Materials).
    - **Tab 3: Area C - Service & Leadership** (Extra-Curricular, Community, NDMU Service Years input).
* **[x] Task 2.3: Build `src/components/personnel/PortfolioSummaryCard.jsx`**
  - Live floating/header summary showing:
    - Raw Earned Points vs Accepted Capped Points.
    - Area Progress Bars with max ceiling badges (70, 50, 40).
    - Submission Status Indicator (`DRAFT`, `SUBMITTED_TO_DEP_SEC`, `ENDORSED_TO_HR`, `HR_APPROVED`).

---

### Phase 3: Department Secretary Evaluator Workbench [x] COMPLETED
**Primary Objective:** Build the department-scoped review workspace for Department Secretaries to inspect proofs, adjust verified points, write notes, and endorse to HR.

* **[x] Task 3.1: Implement `src/controllers/DepSecVerificationController.js` & `src/hooks/useDepSecVerification.js`**
  - Implement department-scoped filtering (`WHERE department_id = assigned_department_id`).
  - Provide controller actions for updating verified line-item points, toggling proof verification checkboxes, appending section remarks, and endorsing to HR.
* **[x] Task 3.2: Build `src/components/depsec/DepSecPortfolioRoster.jsx`**
  - Department personnel portfolio table with search, status filters (`Submitted`, `Under Review`, `Endorsed`, `Returned`), and quick summary scores.
* **[x] Task 3.3: Build `src/components/depsec/DepSecEvaluatorWorkbench.jsx`**
  - Split-screen workspace:
    - **Left Panel:** Portfolio entries with line-item verification controls (Claimed vs Verified points input, Proof Verified toggle).
    - **Right Panel:** Interactive Document/PDF Viewer for attached certificates and transcripts.
    - **Action Toolbar:** "Endorse to HR" button & "Return to Personnel for Revision" modal with required remark fields.

---

### Phase 4: HR Global Ranking Masterboard & Score Lock [x] COMPLETED
**Primary Objective:** Build the university-wide HR dashboard for auditing Department Secretary endorsements, executing final overrides, and locking official ranking scores.

* **[x] Task 4.1: Implement `src/controllers/HRRankingController.js` & `src/hooks/useHRRanking.js`**
  - Global query engine across all university colleges/departments.
  - Controller actions for Department Secretary assignment management, HR audit score overrides, and final ranking score locking (`HR_APPROVED`).
* **[x] Task 4.2: Build `src/components/hr/HRRankingMasterboard.jsx`**
  - Institution-wide masterboard with department filters, score summary cards, and rank distribution charts.
* **[x] Task 4.3: Build `src/components/hr/HRScoreAuditModal.jsx`**
  - Detailed audit modal presenting Department Secretary verified points, attached proof links, audit trail logs, and the "Approve & Lock Official Ranking Score" trigger.

---

### Phase 5: System Integration, Role Toolbar & UI Parity Audit [x] COMPLETED
**Primary Objective:** Connect all components, add testing role-switchers, verify state transitions, and run build checks.

* **[x] Task 5.1: Session Role Integration (`src/controllers/AuthController.js` / `authService.js`)**
  - Add demo session support for `Personnel`, `dep_sec` (Department Secretary), and `hr` (HR Admin) with department context (`DEP-CEAC`, `DEP-CABM`, `DEP-CAS`).
  - Add a persistent testing role-switching toolbar for instant workflow switching.
* **[x] Task 5.2: Verification & Build Audit**
  - Execute build check (`npx vite build`) to confirm zero compilation errors.
  - Verify complete end-to-end workflow: Personnel Submit -> Dep Sec Endorse -> HR Lock.
  - Confirm 100% visual layout parity and zero disruption to student/coordinator workflows.
