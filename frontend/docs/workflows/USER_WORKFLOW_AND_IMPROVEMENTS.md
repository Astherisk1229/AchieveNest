# AchieveNest System Architecture: Users, Workflow Logic, & Areas for Improvement

> **Source**: [AchieveNest Revision 2 Google Doc](https://docs.google.com/document/d/1-5xUbhkF7o-iCr2UBT49HaA6aYyRcjxKrsPXMY2PQEA/edit?usp=sharing)

---

## 1. System Users & Role Classification

### Primary User Categories
1. **Students**
2. **Personnel**

### Specialized Administrative & Verification Roles
- **Program Coordinator** *(Assigned from Personnel list)*
- **Organization Moderator** *(Assigned from Personnel list)*
- **Department Secretary** *(Assigned from Personnel list)*
- **HR Admin**
- **OSAD Admin**

---

## 2. Workflow Logic & Operational Rules

### A. HR Admin Workflow
- **Account & Personnel Governance**:
  - Handles and manages all **Personnel accounts**.
  - Assigns **Department Secretaries** to verify achievement inputs of personnel within their respective academic departments before they officially appear or are accepted into portfolios.
- **Conflict of Interest & Bias Prevention**:
  - To prevent biases, the **HR Admin** directly verifies achievement inputs submitted by **Department Secretaries** and institutional administrators / higher-ups (e.g., College Deans).
- **Portfolio Access Boundaries**:
  - Can view the portfolios of all **Personnel**, but **cannot** view Student portfolios.

### B. OSAD Admin Workflow
- **Account & Student Governance**:
  - Handles and manages all **Student accounts**.
- **Department & Program Coordinator Setup**:
  - Creates academic departments and assigns **Program Coordinators** from the Personnel list to verify student achievement submissions before official acceptance into student portfolios.
- **Organization & Moderator Setup**:
  - Creates student organizations and assigns **Organization Moderators** from the Personnel list to manage organization accounts.
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

## 3. Key Areas for Improvement

- **Section Finalization**:
  - **HR Admin**: Finalize dedicated administrative portal sections.
  - **OSAD Admin**: Finalize dedicated administrative portal sections.
  - **Department Secretary**: Finalize dedicated verification sections *(Personnel equivalent of Program Coordinators)*.

> *Note*: Items marked in red text in source revisions indicate pending finalization.
