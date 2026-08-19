# AchieveNest System Architecture: Users, Workflow Logic, & Areas for Improvement

> **Source**: [AchieveNest Revision 2 Google Doc](https://docs.google.com/document/d/1-5xUbhkF7o-iCr2UBT49HaA6aYyRcjxKrsPXMY2PQEA/edit?usp=sharing)

---

## 1. System Users & Role Classification

### Primary User Categories
1. **Students** — Enrolled university students logging and managing extracurricular and academic achievements.
2. **Personnel** — Faculty, instructors, and university administrative staff logging professional accomplishments.

### Specialized Administrative & Verification Roles
- **Program Coordinator** *(Assigned from Personnel list)*: Evaluates and verifies student achievement claims for their respective degree program.
- **Organization Moderator** *(Assigned from Personnel list)*: Faculty advisor assigned to oversee student organizations and clubs.
- **Department Secretary** *(Assigned from Personnel list)*: Evaluates and verifies accomplishment claims submitted by personnel/faculty within their assigned college/department.
- **HR Admin**: Manages personnel accounts, institutional leadership designations, and verifies submissions from Deans and Department Secretaries.
- **OSAD Admin**: Manages student accounts, academic hierarchy (Colleges & Programs), student organizations, and assigns faculty coordinators/moderators.

> [!IMPORTANT]
> **College Dean Designation Note**:
> The **College Dean** is **NOT a separate account type** in the system. It is an administrative marker / role attribute assigned to an existing **Personnel** account. This designation instructs the system to route the Dean's submitted accomplishments directly to the **HR Admin** for review and verification, completely bypassing the Department Secretary in the college to eliminate conflict of interest and bias.

---

## 2. Recommended Setup Flow: 3-Stage Foundational Flow

To ensure 100% operational efficiency with **zero back-and-forth interruptions** and **no empty dropdown selectors**, institutional onboarding follows a structured **3-Stage Foundational Pipeline**.

```
STAGE 1: Academic Backbone (OSAD / Superadmin)
Colleges ➔ Degree Programs

STAGE 2: Personnel & College Leadership (HR Admin)
Categorize / Onboard Faculty ➔ Assign / Mark Deans to Colleges ➔ Assign Department Secretaries to Colleges

STAGE 3: Students, Linked Organizations, & Verifiers (OSAD Admin)
Import / Enroll Students ➔ Assign Program Coordinators ➔ Create Organizations & Clubs (Linked to Programs/Colleges) ➔ Assign Organization Moderators
```

---

### Detailed Stage Breakdown

#### 🏛️ **Stage 1: Academic Structure Setup (OSAD / Superadmin)**
1. **Colleges**: Create institutional academic colleges *(e.g., CEAC, CBA, CAS, CHS)*.
2. **Degree Programs**: Create degree programs under each college *(e.g., BS Computer Science, BS Information Technology, BS Accountancy)*.
*Outcome*: Academic taxonomy containers are established in the database for HR and student operations.

#### 👥 **Stage 2: Personnel & College Leadership Setup (HR Admin)**
1. **Categorize & Onboard Faculty**: Import/create all Personnel accounts with employee IDs, academic ranks, and department affiliations.
2. **Assign / Mark Deans to Colleges**: Designate the Dean for each college from the faculty roster. *(Marks the account so that accomplishment verification routes directly to HR Admin, bypassing the Department Secretary).*
3. **Assign Department Secretaries to Colleges**: Appoint Department Secretaries to verify accomplishment claims of regular faculty peers in that college.
*Outcome*: The faculty pool is populated, and college-level evaluator routing is fully configured.

#### 🎓 **Stage 3: Students, Program-Linked Orgs, & Verifiers (OSAD Admin)**
1. **Import & Enroll Students**: Bulk-import student records and link them directly to their enrolled Degree Programs.
2. **Assign Program Coordinators**: Select faculty members from the HR Faculty Pool to verify student achievement submissions per degree program.
3. **Create Organizations & Clubs (Linked to Programs & Colleges)**:
   - **Academic Organizations**: Linked directly to specific degree programs *(e.g., Junior Philippine Computer Society [JPCS] linked to BSCS / BSIT; Junior Philippine Institute of Accountants [JPIA] linked to BSA)*.
   - **College Student Councils**: Linked to the parent College *(e.g., CEAC Student Council)*.
   - **Co-Curricular / Interest Clubs**: Linked to colleges or university-wide umbrellas *(e.g., Performing Arts Guild, Red Cross Youth)*.
4. **Assign Organization Moderators**: Assign faculty advisors from the HR Faculty Pool to oversee each organization and club.
*Outcome*: All verification pipelines, student memberships, and organizational leadership are fully operational.

---

### Why the 3-Stage Foundational Flow Is the Institutional Standard

| Advantage | Operational Value |
| :--- | :--- |
| **Zero Empty Dropdowns** | When HR assigns Deans/Secretaries, Colleges already exist. When OSAD assigns Coordinators/Moderators, Faculty already exist. |
| **No Real-Time Bottlenecks** | HR completes their entire portal setup in one sitting; OSAD completes student and club setup in one sitting. |
| **Program-to-Org Linkage** | Automatically maps student achievement submissions from academic organizations *(e.g. JPCS)* to the appropriate Degree Program Coordinator and College portfolio evaluator. |

---

## 3. Workflow Logic & Operational Rules

### A. HR Admin Workflow
- **Account & Personnel Governance**:
  - Handles and manages all **Personnel accounts**.
  - Assigns **Department Secretaries** to verify achievement inputs of personnel within their respective academic departments before they officially appear or are accepted into portfolios.
- **Conflict of Interest & Bias Prevention**:
  - To prevent biases, the **HR Admin** directly verifies achievement inputs submitted by **Department Secretaries** and institutional administrators / higher-ups (e.g., marked **College Deans**).
- **Portfolio Access Boundaries**:
  - Can view the portfolios of all **Personnel**, but **cannot** view Student portfolios.

### B. OSAD Admin Workflow
- **Account & Student Governance**:
  - Handles and manages all **Student accounts**.
- **Department & Program Coordinator Setup**:
  - Creates academic departments/programs and assigns **Program Coordinators** from the Personnel list to verify student achievement submissions before official acceptance into student portfolios.
- **Organization & Moderator Setup**:
  - Creates student organizations/clubs and assigns **Organization Moderators** from the Personnel list to manage and advise organization accounts.
- **Portfolio Access Boundaries**:
  - Can view all **Student portfolios**, but **cannot** view Personnel portfolios.
- **Personnel Selection Utility**:
  - Personnel lists appear in OSAD dropdowns/search utilities when assigning Program Coordinators or Organization Moderators to eliminate tedious scrolling.

### C. Department Secretary Workflow
- **Dashboard Monitoring**:
  - Enhanced dashboard layout allowing Department Secretaries to quickly monitor critical activities, pending verification requests, and recent updates.
- **Search & Filtering**:
  - Search and filtering options to help Department Secretaries locate specific achievement records quickly.
- **Functional Integrity**:
  - Ensures 100% operational functionality across all Department Secretary verification tools.

---

## 4. Key Areas for Improvement

- **Section Finalization**:
  - **HR Admin**: Finalize dedicated administrative portal sections.
  - **OSAD Admin**: Finalize dedicated administrative portal sections.
  - **Department Secretary**: Finalize dedicated verification sections *(Personnel equivalent of Program Coordinators)*.

> *Note*: Items marked in red text in source revisions indicate pending finalization.
