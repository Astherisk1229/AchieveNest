# AchieveNest — HR Admin Portal Features & System Specification (`HR_ADMIN_FEATURES_SPEC.md`)

**Document Version:** 2.0.0 (Comprehensive HR Portal & Faculty Evaluation & Ranking Architecture)  
**System:** AchieveNest Student & Personnel Achievement Management Platform  
**Target Role**: Human Resources Administrator / HR Staff (`role_context: 'hr_staff'`, e.g., *Director Evelyn Tan — Director, Human Resources Development Office*)  
**Reference Specifications:** NDMU Rating Sheet for Ranking, [`OSAD_ADMIN_FEATURES_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/OSAD_ADMIN_FEATURES_SPEC.md), [`PERSONNEL_FEATURES_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/PERSONNEL_FEATURES_SPEC.md)

---

## 1. Role Scope & Architectural Overview

### A. Role Definition & Core Mandate
- **User Role**: HR Administrator / HR Staff (`role_context: 'hr_staff'`).
- **Primary Mandate**: Central governance and administration of all **Personnel (Faculty and Staff)** across Notre Dame of Marbel University (NDMU). This includes maintaining the Personnel Directory, recording academic rank changes, processing personnel evaluation submissions, reviewing proof evidence, calculating official **NDMU Rating Sheet** scores (Area A: 70 pts max, Area B: 50 pts max, Area C: 40 pts max; Total Max: 160 pts), finalizing evaluations, reviewing promotion candidate rankings, and maintaining a human-readable audit trail.
- **Workflow Governance Rules & Privacy Boundaries**:
  - **Account Scope**: Governs all **Personnel & Faculty accounts** across all university colleges (*College of Information Technology*, *College of Engineering, Architecture & Computing*, *College of Business & Accountancy*, *College of Arts & Sciences*, *College of Education*).
  - **Portfolio Access Boundaries**: Can view all **Personnel dossiers**, but **cannot** view Student portfolios (strictly preserving privacy boundaries between HR Admin and OSAD Admin).
  - **Multi-Stage Evaluation Pipeline**: Processes submissions progressing through department review and HR evaluation (`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Department Review` $\rightarrow$ `Forwarded to HR` $\rightarrow$ `Under HR Review` $\rightarrow$ `Ready for Finalization` $\rightarrow$ `Completed`).

---

### B. Dual Administrative Governance Parallelism (OSAD vs. HR)

AchieveNest implements a balanced dual-admin governance model:

| Domain Aspect | **OSAD Admin Portal** (Student Governance) | **HR Admin Portal** (Personnel Directory & Evaluation) |
| :--- | :--- | :--- |
| **Target Scope** | Students, Student Orgs, Student Clubs | Academic Faculty, Department Secretaries, Deans, Staff |
| **Command Banner** | `OSAD Admin Portal` | `Human Resources (HR) Portal` |
| **Readiness / Overview Badge** | `PACUCOA & CHEd Readiness` | `Evaluation Overview` |
| **Primary Metric** | Student Honor Roll & Leadership Awards | Faculty Evaluation Scores & Academic Ranks |
| **Hierarchy Governance** | 3-Tier Student Hierarchy (Deans, Coordinators, Moderators) | Academic Personnel Ranks (Instructor $\rightarrow$ Full Professor) |
| **Audit Focus** | Student Governance & Event Scans | Personnel Actions, Evaluation Finalization & Rank Changes |

---

### C. Sidebar Navigation & Tab Routing Structure

The HR Admin Portal utilizes clean top-level routes and URL search parameters (`/hr/dashboard?tab=<tab_name>` or `/hr/<route_name>`):

| Sidebar Navigation Label | Route / Tab Query Parameter | Administrative Purpose |
| :--- | :--- | :--- |
| **Dashboard** | `/hr/dashboard` (`tab=overview`) | Executive overview, key operational metrics, pending HR action hub |
| **Personnel Directory** | `/hr/personnel-governance` (`tab=personnel`) | Personnel roster, academic rank history, record rank changes, onboarding |
| **Evaluation Submissions** | `/hr/verification-queue` (`tab=verification`) | Vetting forwarded submissions, split-screen proof evaluation, return for revision |
| **Faculty Evaluation & Ranking** | `/hr/faculty-ranking-and-matrix` (`tab=masterboard`) | Faculty evaluation scores, Area A/B/C breakdown, finalization, promotion ranking |
| **Audit Trail** | `/hr/accreditation-and-audit-logs` (`tab=audit`) | System-wide audit log stream of HR actions, score finalizations, and rank changes |

---

## 2. Section 1: Dashboard (`tab=overview`)

### Overview & Purpose
The **Dashboard** provides HR administrators with a high-level overview of active personnel records, pending evaluation submissions, completed evaluations, and recent administrative activities.

```
+-----------------------------------------------------------------------------------------------------------------------+
| Human Resources (HR) Portal Banner                                                                                   |
| Director Evelyn Tan (HR-2010-001) | University Personnel Directory & Evaluation Suite | Evaluation Overview               |
+-----------------------------------------------------------------------------------------------------------------------+
| KPI Summary Cards: Total Personnel | Completed Evaluations | Pending Submissions | Password Reset Requests                 |
+-----------------------------------------------------------------------------------------------------------------------+
| HR Administrative Action Hub: 1. Personnel Directory | 2. Evaluation Submissions | 3. Faculty Evaluation & Ranking | 4. Audit Trail|
+-----------------------------------------------------------------------------------------------------------------------+
```

### Detailed HR Capabilities:
1. **Monitor Operational Metrics**:
   - **Total Personnel**: Track total registered faculty and administrative staff count across NDMU colleges.
   - **Completed Evaluations**: View total number of finalized HR evaluations.
   - **Pending Submissions**: Monitor submissions forwarded from departments awaiting HR review.
   - **Password Reset Requests**: Track pending faculty credential reset requests.
2. **Execute Quick Workflow Shortcuts**:
   - **Personnel Directory**: Direct shortcut to manage faculty roster and record rank changes.
   - **Evaluation Submissions**: Direct shortcut to open the submission evaluation queue.
   - **Faculty Evaluation & Ranking**: Direct shortcut to inspect evaluation scores and ranking masterboard.
   - **Audit Trail**: Direct shortcut to review system audit logs.

---

## 3. Section 2: Personnel Directory (`tab=personnel`)

### Overview & Purpose
The **Personnel Directory** serves as the central directory for viewing, managing, and maintaining all university faculty and personnel records, employment details, department assignments, academic ranks, and rank histories.

### Detailed HR Capabilities:
1. **Search & Multi-Filter Roster**:
   - Search personnel by full name, employee ID (`EMP-2026-XXXX`), email, or department.
   - Filter roster by **College** (*CEAC*, *CBA*, *CAS*), **Department** (*Computer Studies*, *Engineering*, *Business Management*, etc.), **Employment Status** (*Full-Time Permanent*, *Full-Time Probationary*, *Part-Time Lecturer*), and **Academic Rank**.
2. **View Personnel Dossier & Profile**:
   - View detailed personnel profiles, contact details, employment history, tenure years, and accomplishment portfolios.
3. **Record Rank Change (`openRankModal`)**:
   - Open the **Record Rank Change** modal to officially record approved changes to a faculty member's academic rank (e.g., *Instructor III* $\rightarrow$ *Assistant Professor I* $\rightarrow$ *Associate Professor I* $\rightarrow$ *Full Professor*).
   - Select new **Academic Rank Designation** and **Employment Status**.
   - Record effective date, basis/reference (e.g., *Promotion Memo 2026-014*), and optional remarks.
   - Automatically generates an immutable audit trail entry (`Academic Rank Updated`).
4. **Onboard Personnel (`onOpenOnboarding`)**:
   - Create and register new faculty or administrative staff accounts with designated employee ID, college, department, initial rank, and status.
5. **Manage Department Assignments (`onEditAssignment`)**:
   - Edit department secretary, program coordinator, or department assignment roles for personnel members.

---

## 4. Section 3: Evaluation Submissions (`tab=verification`)

### Overview & Purpose
**Evaluation Submissions** is the dedicated workspace for reviewing, assessing, confirming supporting evidence, and processing faculty accomplishment submissions forwarded through the department review pipeline.

### Detailed HR Capabilities:
1. **Filter & Track Workload Submissions**:
   - View submissions categorized by workflow status (**Submitted**, **Department Review**, **Forwarded to HR**, **Under HR Review**, **Returned for Revision**, **Ready for Finalization**, **Completed**).
   - Filter submissions by Evaluation Period (e.g., `AY 2026–2027`), College, Department, and Submission Type (*Ranking & Promotion*, *Tenure Evaluation*, *Accreditation Audit*).
2. **Launch Portfolio Evaluation Studio (`openProofModal`)**:
   - Opens a specialized split-screen evaluation studio for in-depth document examination:
     - **Left Pane (Supporting Evidence)**: Inspect uploaded evidence items, PDF certificates, image proofs, and portfolio files.
     - **Right Pane (Accomplishment Details & Criterion Evaluation)**: View extracted title, category, date, NDMU criterion classification (e.g., *A.1 Educational Degrees*, *B.2 Publications*), and suggested point allocation.
3. **Item-Level Evidence Confirmation**:
   - Click **Confirm Item** or **Confirm Item & Next** to confirm evidence validity and award calculated NDMU evaluation points.
   - Add optional item-level verification remarks for institutional records.
4. **Return Submission for Revision**:
   - If evidence is blurry, incomplete, or incorrectly documented, HR clicks **Return for Revision**.
   - Input mandatory return reason and remarks instructing the faculty member on required resubmission details.
   - Reverts submission status to `Returned for Revision` and logs audit record (`Evaluation Returned for Revision`).
5. **Finalize Evaluation**:
   - When all portfolio items are reviewed, HR clicks **Finalize Evaluation**.
   - Displays final confirmation dialog showing total calculated score and Area A/B/C point breakdown.
   - Seals evaluation, locks scores against further modification, records timestamp, creates audit entry (`Faculty Evaluation Finalized`), and updates status to `Completed`.

---

## 5. Section 4: Faculty Evaluation & Ranking (`tab=masterboard`)

### Overview & Purpose
**Faculty Evaluation & Ranking** consolidates all completed and active faculty evaluation results, Area A/B/C score breakdowns, evaluation completion statuses, and ranking statistics into a unified masterboard.

### NDMU Rating Sheet Point Structure:
- **Area A — Professional Development**: Max 70 pts (Degrees, Board Licenses, Seminars & Workshops).
- **Area B — Productivity & Creative Work**: Max 50 pts (Published Books/Papers, Patents, Research Grants, Keynote Lectures).
- **Area C — Service & Leadership**: Max 40 pts (Community Extension Services, Club Moderation, Administrative Roles).
- **Total Combined Ceiling**: 160 Points Max.

### Detailed HR Capabilities:
1. **Inspect Evaluation Scores & Area Breakdowns**:
   - View **Evaluation Score** (e.g., `124 / 160 pts`) and compact area point badges (`A: 65`, `B: 40`, `C: 19`) with hover tooltips detailing area descriptions.
   - View assigned **Department Reviewer** and current **Evaluation Status** (**Completed**, **Forwarded to HR**, **Department Review**, **Returned for Revision**, **Under Evaluation**).
2. **Execute Contextual Evaluation Actions**:
   - Click **Review Evaluation** to launch the evaluation studio for submissions in progress.
   - Click **Finalize Evaluation** for submissions ready for final score locking.
   - Click **View Evaluation** for completed evaluations to inspect locked score sheets.
3. **Ranking & Promotion Analysis**:
   - Filter by completed evaluations to sort faculty in descending order by total NDMU evaluation points.
   - Evaluate faculty points against official NDMU promotion benchmarks ($\ge 140$ pts Full Professor, $110-139$ pts Associate Professor, $80-109$ pts Assistant Professor).
   - Track promotion review statuses (*Not for Promotion*, *For Review*, *Recommended*, *Approved*, *Recorded*).
4. **Export Official Reports**:
   - Download university-wide faculty matrix reports in CSV format (*CHEd & PACUCOA Faculty Qualification Matrix*, *Faculty Promotion Board Dossier Summary*).

---

## 6. Section 5: Audit Trail (`tab=audit`)

### Overview & Purpose
The **Audit Trail** provides complete system accountability and security by logging every sensitive HR administrative action, rank update, score finalization, credential issuance, and status change in a tamper-evident audit log stream.

### Detailed HR Capabilities:
1. **Inspect Administrative Audit Log Stream**:
   - View detailed audit entries featuring human-readable action types:
     - **Academic Rank Updated**: Logged when HR records a faculty rank change or employment status update.
     - **Faculty Evaluation Finalized**: Logged when an evaluation is finalized and score locked.
     - **Evaluation Returned for Revision**: Logged when a submission is returned to a faculty member with remarks.
     - **Personnel Record Updated**: Logged when personnel profiles, onboarding data, or department assignments change.
     - **Credential Reset Issued**: Logged when temporary password tokens are issued.
2. **Audit Search & Verification**:
   - Track exact Date & Time timestamp, HR Administrator (`admin_name`), Target Personnel (`target_personnel`), and detailed transaction description.
   - Search audit logs by keyword, employee ID, or action type.
3. **Export Audit History**:
   - Export official audit log data into CSV format for university accreditation or Board of Trustees review.

---

## 7. Data Model & Architecture Component Summary

| Layer | Component Name | Primary Responsibility |
| :--- | :--- | :--- |
| **Model** | [`HRModel.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/models/HRModel.js) | Defines HR data schemas, academic ranks, employment statuses, and point ceiling caps. |
| **Controller** | `HRController.js` | Manages personnel directory state, ranking algorithms, finalization logic, and audit log generation. |
| **Hook** | [`useHR.js`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/hooks/useHR.js) | React custom hook providing HR data and action methods to views. |
| **View (Dashboard)** | [`HRDashboardPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRDashboardPage.jsx) | Renders main HR portal shell, header banner, overview cards, and tab routing. |
| **View (Directory)** | [`HRPersonnelGovernancePage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRPersonnelGovernancePage.jsx) | Renders Personnel Directory, roster table, filters, and Record Rank Change trigger. |
| **View (Submissions)** | [`HRVerificationQueuePage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRVerificationQueuePage.jsx) | Renders Evaluation Submissions queue and connects to split-screen Evaluation Studio. |
| **View (Masterboard)** | [`HRRankingMasterboardPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRRankingMasterboardPage.jsx) | Renders Faculty Evaluation & Ranking table, Area A/B/C breakdown badges, and contextual buttons. |
| **View (Audit Trail)** | [`HRAccreditationAndAuditLogsPage.jsx`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRAccreditationAndAuditLogsPage.jsx) | Renders Audit Trail table, human-readable action labels, and CSV export tools. |
