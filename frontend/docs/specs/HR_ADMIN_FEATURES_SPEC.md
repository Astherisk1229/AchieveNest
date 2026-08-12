# AchieveNest — HR Admin Portal Features & System Specification (`HR_ADMIN_FEATURES_SPEC.md`)

**Document Version:** 1.0.0 (Comprehensive HR Executive Portal & NDMU Faculty Ranking Architecture)  
**System:** AchieveNest Student & Personnel Achievement Management Platform  
**Target Role**: Human Resources Administrator / HR Staff (`role_context: 'hr_staff'`, e.g., *Director Evelyn Tan — Director, Human Resources Development Office*)  
**Reference Specifications:** NDMU Rating Sheet for Ranking, [`OSAD_ADMIN_FEATURES_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/OSAD_ADMIN_FEATURES_SPEC.md), [`PERSONNEL_FEATURES_SPEC.md`](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/docs/specs/PERSONNEL_FEATURES_SPEC.md)

---

## 1. Role Scope & Architectural Overview

### A. Role Definition & Core Mandate
- **User Role**: HR Administrator / HR Staff (`role_context: 'hr_staff'`).
- **Primary Mandate**: Central oversight and governance of all **Personnel (Faculty and Staff)** across Notre Dame of Marbel University (NDMU). This includes managing academic ranks, employment status (Full-Time Permanent, Probationary, Part-Time), verifying department-endorsed accomplishment dossiers, enforcing the **NDMU Rating Sheet for Academic Ranking** point ceilings (Area A: 70 pts max, Area B: 50 pts max, Area C: 40 pts max; Total Max: 160 pts), applying official HR digital verification seals (`HR-SEAL-2026-XXXX`), executing automated faculty promotion ranking algorithms, issuing temporary security credentials, and maintaining tamper-evident audit logs.
- **Workflow Governance Rules & Privacy Boundaries**:
  - **Account Scope**: Governs all **Personnel & Faculty accounts** across all university colleges (*College of Information Technology*, *College of Engineering, Architecture & Computing*, *College of Business & Accountancy*, *College of Arts & Sciences*, *College of Education*).
  - **Portfolio Access Boundaries**: Can view all **Personnel dossiers**, but **cannot** view Student portfolios (strictly preserving privacy boundaries between HR Admin and OSAD Admin).
  - **Multi-Stage Endorsement Pipeline**: Receives portfolios that have been vetted and endorsed by Department Secretaries (`SUBMITTED_TO_DEP_SEC` $\rightarrow$ `ENDORSED_TO_HR` $\rightarrow$ `HR_APPROVED`).

---

### B. Dual Administrative Governance Parallelism (OSAD vs. HR)

AchieveNest implements a balanced dual-admin governance model:

| Domain Aspect | **OSAD Admin Portal** (Student Governance) | **HR Admin Portal** (Personnel & Ranking Governance) |
| :--- | :--- | :--- |
| **Target Scope** | Students, Student Orgs, Student Clubs | Academic Faculty, Department Secretaries, Deans, Staff |
| **Command Center Header** | `OSAD Executive Command Center` | `HR Executive Command Center` |
| **Top-Right Readiness Badge** | `97.8% PACUCOA & CHEd Ready` | `98.4% NDMU Evaluation Ready` |
| **Primary Metric** | Student Honor Roll & Leadership Awards | NDMU Faculty Academic Ranking & Promotions |
| **Hierarchy Governance** | 3-Tier Student Hierarchy (Deans, Coordinators, Moderators) | Academic Personnel Ranks (Instructor $\rightarrow$ Full Professor) |
| **Audit Focus** | Student Governance & Event Scans | Faculty Proof Verification & Score Seals |

---

### C. Sidebar Navigation & Tab Routing Structure

The HR Admin Portal utilizes URL search parameters (`/hr/dashboard?tab=<tab_name>`) for direct linkable tab routing:

| Sidebar Navigation Label | Tab Query Parameter | Primary Purpose |
| :--- | :--- | :--- |
| **HR Command Center** | `tab=overview` | Executive metrics, 4-workflow quick action hub, promotion readiness breakdown |
| **Personnel & Faculty Directory** | `tab=personnel` | Roster management, academic rank promotion modal, employment status filters |
| **Faculty Verification Queue** | `tab=verification` | Vetting department-endorsed dossiers, document proof viewer, seal approvals |
| **NDMU Rating Sheet Criteria** | `tab=rating_sheet` | Master evaluation criteria reference (Area A: 70, Area B: 50, Area C: 40) |
| **Faculty Ranking Masterboard** | `tab=masterboard` | Automated faculty candidate promotion ranking algorithm & official report generation |
| **Credential Security & Resets** | `tab=password_resets` | Resetting faculty passwords & issuing secure temporary access tokens |
| **HR System Audit Logs** | `tab=audit` | Real-time security trail tracking rank modifications, score seals, and logins |

---

## 2. Section 1: HR Executive Command Center (`tab=overview`)

The **HR Executive Command Center** serves as the primary governance dashboard, delivering high-level faculty statistics, quick-action navigation workflows, and live promotion readiness metrics.

```
+-----------------------------------------------------------------------------------------------------------------------+
| HR Executive Command Center Banner                                                                                    |
| Central Governance | Director Evelyn Tan | 98.4% NDMU Evaluation Ready                                                 |
+-----------------------------------------------------------------------------------------------------------------------+
| Quick Action Hub: 1. Personnel & Rank Governance | 2. NDMU Rating Sheet | 3. Ranking Masterboard | 4. HR Security Logs  |
+-----------------------------------------------------------------------------------------------------------------------+
| Metrics Summary Cards: Total Faculty | Dept Endorsed | HR Approved | Sealed Proofs | Active AY Cycle                  |
+-----------------------------------------------------------------------------------------------------------------------+
| Main Grid: Faculty Rank Distribution by Department (Bar Chart) | Recent HR Verification Seals (Audit Stream)          |
+-----------------------------------------------------------------------------------------------------------------------+
```

### Banner & Quick Action Cards:
1. **Personnel & Rank Governance**: Jump to `tab=personnel` to view faculty directory and update academic ranks.
2. **NDMU Rating Sheet Engine**: Jump to `tab=rating_sheet` to inspect official evaluation criteria and point ceilings.
3. **Faculty Ranking Masterboard**: Jump to `tab=masterboard` to run the automated promotion ranking algorithm.
4. **HR Security Audit Logs**: Jump to `tab=audit` to inspect tamper logs, digital score seals, and rank modification histories.

---

## 3. Section 2: Personnel & Faculty Directory (`tab=personnel`)

### Functional Capabilities:
- **Search & Filter**: Real-time filtering by Personnel Name, Employee ID (`EMP-2021-0842`), Department (*CIT*, *CEAC*, *CBA*, *CAS*, *CED*), and Employment Status (*Full-Time Permanent*, *Probationary*, *Part-Time*).
- **Academic Rank Promotion Modal (`openRankModal`)**:
  - Modal overlay allowing HR Director to promote faculty academic ranks (e.g. *Instructor I* $\rightarrow$ *Assistant Professor I* $\rightarrow$ *Associate Professor III* $\rightarrow$ *Full Professor*).
  - Updates employment status and automatically logs an audit trail transaction (`RANK_PROMOTION_UPDATE`).
- **View Full Faculty Dossier**: Clickable trigger navigating to `/personnel/portfolio` (Canva presentation deck view).

---

## 4. Section 3: Faculty Verification Queue (`tab=verification`)

### Department Endorsement & HR Sealing Pipeline:
1. **Queue Inspection**: Displays all accomplishment dossiers endorsed by Department Secretaries (`status: 'ENDORSED_TO_HR'`).
2. **Split-Screen Proof Verification Modal (`openProofModal`)**:
   - **Left Pane**: Attached PDF/Image proof file viewer.
   - **Right Pane**: Extracted accomplishment metadata, NDMU category classification, and point allocation.
3. **Verification Approval & Digital Sealing**:
   - HR Officer reviews proof and clicks **Approve & Apply HR Seal**.
   - System generates a unique verification hash code (`HR-SEAL-2026-XXXX`).
   - Updates status to `HR_APPROVED` and locks the record against further edits.
4. **Return for Revision**:
   - If proof is blurry, invalid, or misclassified, HR clicks **Return to Personnel**.
   - Requires entering explicit return remarks (e.g., *"Proof image lacks official university seal. Please upload original PDF certificate."*).
   - Reverts status to `RETURNED_FOR_REVISION`.

---

## 5. Section 4: NDMU Rating Sheet Criteria (`tab=rating_sheet`)

Defines the official Notre Dame of Marbel University evaluation matrix:

```
+-------------------------------------------------------------------------------------------------------+
| NDMU FACULTY ACADEMIC RATING MATRIX                                                                   |
+-------------------------------------------------------------------------------------------------------+
| AREA A: PROFESSIONAL DEVELOPMENT (POINT CEILING: 70 PTS MAX)                                         |
|  - A.1 Higher Educational Attainment (Ph.D.: 30 pts, M.S.: 20 pts)                                    |
|  - A.2 Professional Licenses & Board Certifications (PRC/IEEE: 10 pts per license)                     |
|  - A.3 Seminars, Conferences & Faculty Workshops (0.5 pts per 8-hour training)                         |
|                                                                                                       |
| AREA B: PRODUCTIVITY & CREATIVE WORK (POINT CEILING: 50 PTS MAX)                                      |
|  - B.1 Published Research & Books (Scopus/WoS: 25 pts, CHED-Accredited: 15 pts)                       |
|  - B.2 Professional Lectures & Keynote Presentations (5 pts per national lecture)                     |
|  - B.3 Inventions, Patents & Software Copyright Registrations (15 pts per registered patent)           |
|                                                                                                       |
| AREA C: SERVICE & LEADERSHIP (POINT CEILING: 40 PTS MAX)                                              |
|  - C.1 Extension Services & Community Outreach (5 pts per major project)                               |
|  - C.2 Institutional Governance & Administrative Roles (Coordinator/Moderator: 10 pts per AY)         |
+-------------------------------------------------------------------------------------------------------+
| OVERALL MAXIMUM COMBINED RATING: 160 POINTS                                                           |
+-------------------------------------------------------------------------------------------------------+
```

---

## 6. Section 5: Faculty Ranking Masterboard (`tab=masterboard`)

### Automated Faculty Promotion Ranking Algorithm:
1. **Data Aggregation**: Aggregates all `HR_APPROVED` point scores across Area A, Area B, and Area C for all active faculty members.
2. **Point Ceiling Normalization**: Applies official point caps (Area A capped at 70, Area B capped at 50, Area C capped at 40).
3. **Rank Sorting & Candidate List Generation**: Sorts faculty in descending order by Total NDMU Points.
4. **Promotion Eligibility Classification**:
   - $\ge 140$ pts: Eligible for *Full Professor Promotion*.
   - $110 - 139$ pts: Eligible for *Associate Professor Promotion*.
   - $80 - 109$ pts: Eligible for *Assistant Professor Promotion*.
5. **Export Official Audit Report**: Generates downloadable CSV / PDF masterboards for Board of Trustees review.

---

## 7. Section 6: Credential Security & Password Resets (`tab=password_resets`)

- Displays pending password reset requests submitted by faculty members who forgot credentials.
- HR Staff clicks **Approve Password Reset**, issuing a temporary secure passkey (e.g. `NDMU-Faculty2026!`).
- System automatically logs the credential issuance transaction in audit history.

---

## 8. Section 7: HR System Audit Logs (`tab=audit`)

- Real-time audit log stream tracking:
  - `RANK_PROMOTION_UPDATE`: Timestamp, Target Faculty, Old Rank $\rightarrow$ New Rank, Executor HR ID.
  - `HR_SCORE_SEAL_APPLIED`: Timestamp, Accomplishment ID, Seal Hash, Approved Points.
  - `CREDENTIAL_RESET_ISSUED`: Timestamp, Faculty Email, Issued Token ID.
- Filterable by Transaction Type and Search Term with single-click CSV log export.

---

## 9. Data Model & Architecture Component Summary

| Layer | Component Name | Responsibility |
| :--- | :--- | :--- |
| **Model** | [HRModel.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/models/HRModel.js) | Defines HR data schema, point ceiling caps, and score seal hash generators. |
| **Controller** | `HRController.js` | Manages faculty directory, ranking masterboard algorithms, seal verification, and password reset workflows. |
| **Hook** | [useHR.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/hooks/useHR.js) | React bridge hook binding View state to `HRController.js`. |
| **View (Dashboard)** | [HRDashboardView.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRDashboardView.jsx) | Main Executive Portal component rendering command center, verification queue, masterboard, and audit logs. |
| **View (Masterboard)** | [HRRankingMasterboard.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRRankingMasterboard.jsx) | Dedicated sub-component rendering automated faculty promotion ranking matrix. |
| **View (Modal)** | [HRScoreAuditModal.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/achievenest/frontend/src/pages/hr-admin/HRScoreAuditModal.jsx) | Modal dialog for applying digital score seals and returning proof for revision. |
