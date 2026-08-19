# AchieveNest User Roles, Setup Flow, and Workflow Rules

> **Source:** [AchieveNest Revision 2 Google Doc](https://docs.google.com/document/d/1-5xUbhkF7o-iCr2UBT49HaA6aYyRcjxKrsPXMY2PQEA/edit?usp=sharing)
>
> This document defines the current approved scope. Proposed functions such as organization achievement portfolios, verifier pools, and backup verifiers are outside the present implementation unless stakeholders approve them later.

---

## 1. System Scope

AchieveNest records and verifies achievements belonging to two user categories:

1. **Students** — Enrolled university students who submit and manage academic and extracurricular achievements.
2. **Personnel** — Faculty members, instructors, and university administrative personnel who submit and manage professional accomplishments.

Student organizations do not own achievement portfolios and do not submit achievement claims in the current scope. Organization Moderators manage events, attendance, and certificate generation only.

---

## 2. Roles and Responsibilities

### Administrative Roles

- **OSAD Admin** — Owns student accounts, colleges, departments, degree programs, student organizations, and student-facing personnel assignments.
- **HR Admin** — Owns personnel accounts, personnel-to-college assignments, and personnel leadership designations.

### Assigned Personnel Roles

- **Program Coordinator** — A Personnel account selected by OSAD to verify student achievement submissions for one degree program.
- **Organization Moderator** — A Personnel account selected by OSAD to manage an organization's events, attendance, and certificate generation. This role does not verify achievement submissions.
- **Department Secretary** — A Personnel account designated by HR to verify accomplishment submissions from regular personnel within the assigned college.
- **College Dean** — A leadership designation applied by HR to an existing Personnel account. It is not a separate account type.

> [!NOTE]
> The stakeholder term **Department Secretary** is retained, but its current verification scope is **by college**. All system labels, filters, and routing rules must apply this meaning consistently.

### Dean and Secretary Conflict-of-Interest Rule

The Department Secretary must not verify their own submission or the College Dean's submission. The system routes accomplishments submitted by either role directly to HR Admin.

---

## 3. Administrative Ownership

| Function | OSAD Admin | HR Admin |
| :--- | :---: | :---: |
| Create and maintain colleges | Owner | View and use |
| Create and maintain departments | Owner | View and use |
| Create and maintain degree programs | Owner | View and use |
| Create and manage student accounts | Owner | No access |
| Assign students to degree programs | Owner | No access |
| Create and manage personnel accounts | View for assignment | Owner |
| Assign personnel to colleges | View | Owner |
| Designate College Deans | View | Owner |
| Designate Department Secretaries | View | Owner |
| Assign Program Coordinators | Owner | Provides personnel records |
| Create student organizations | Owner | No ownership |
| Assign Organization Moderators | Owner | Provides personnel records |
| View student portfolios | Yes | No |
| View personnel portfolios | No | Yes |

This division prevents duplicate ownership: OSAD owns the academic and student structure, while HR owns personnel records and personnel leadership designations.

---

## 4. Required Setup Flow

The system uses a dependency-aware setup flow so that administrators only select records that already exist.

```text
PHASE 1 — OSAD: Academic Structure
Create Colleges → Create Departments → Create Degree Programs

PHASE 2 — HR: Personnel and College Leadership
Onboard Personnel → Assign Personnel to Colleges
→ Designate College Deans → Designate Department Secretaries

PHASE 3 — OSAD: Students and Student-Facing Assignments
Import Students → Assign Students to Programs
→ Assign Program Coordinators
→ Create Organizations → Assign Organization Moderators

PHASE 4 — System Readiness
Validate Required Assignments → Enable Operational Workflows
```

### Phase 1: OSAD Creates the Academic Structure

1. Create the university's colleges.
2. Create departments under their parent colleges.
3. Create degree programs under their parent departments.

The academic hierarchy is:

```text
College → Department → Degree Program
```

**Dependency created:** HR can now assign personnel to valid colleges, while OSAD can later enroll students in programs connected to valid departments and colleges.

### Phase 2: HR Configures Personnel and College Leadership

1. Import or create Personnel accounts.
2. Record employee identifiers and relevant personnel information.
3. Assign each Personnel account to a college.
4. Designate the College Dean from personnel assigned to that college.
5. Designate the Department Secretary responsible for personnel verification in that college.

HR—not OSAD—assigns the Dean and Department Secretary because both are personnel leadership designations. OSAD creates the college container but does not control personnel positions.

**Dependency created:** OSAD can now select existing Personnel accounts when assigning Program Coordinators and Organization Moderators.

### Phase 3: OSAD Configures Students, Coordinators, and Organizations

1. Import or create Student accounts.
2. Assign each Student to a degree program.
3. Assign one Program Coordinator to each degree program from the HR-managed Personnel list.
4. Create student organizations and classify each as program-based, college-based, or university-wide.
5. Assign one Organization Moderator to each organization from the HR-managed Personnel list.

Student import may begin after Phase 1 while HR is completing Phase 2. However, coordinator and moderator assignments require the relevant Personnel accounts to exist first.

### Phase 4: System Readiness Check

Before enabling the related workflows, the system must confirm that:

- every active student belongs to an existing degree program;
- every active degree program belongs to an existing department;
- every active department belongs to an existing college;
- every active Personnel account belongs to an existing college;
- every active degree program has one Program Coordinator;
- every college receiving personnel submissions has a Department Secretary;
- every active organization has one Organization Moderator; and
- the designated Dean and Department Secretary are valid Personnel accounts assigned to the applicable college.

The current stakeholder process uses one named assignee for each responsibility. Backup verifiers, verifier pools, and automatic load distribution are not part of the current scope.

---

## 5. Operational Workflows

### 5.1 Student Achievement Verification

```text
Student creates achievement
→ Student submits achievement and evidence
→ System routes submission by the student's degree program
→ Program Coordinator reviews submission
→ Approved, Changes Requested, or Rejected
```

- The Program Coordinator is the only achievement verifier in this workflow.
- Organization membership does not determine the verifier.
- An achievement associated with an organization event is still routed to the student's Program Coordinator.
- Approved achievements appear in the student's portfolio.

### 5.2 Personnel Accomplishment Verification

```text
Regular Personnel submission
→ Department Secretary assigned to the Personnel member's college

College Dean submission
→ HR Admin

Department Secretary submission
→ HR Admin
```

- Routing is based on the Personnel member's assigned college.
- The Dean and Department Secretary bypass college-level verification to prevent self-review and conflicts of interest.
- Approved accomplishments appear in the Personnel member's portfolio.

### 5.3 Organization Event and Certificate Workflow

```text
Organization Moderator creates event
→ Moderator manages participant attendance
→ System records validated attendance
→ Moderator generates certificates
```

- Organization Moderators manage events, attendance, and certificates.
- Organization Moderators do not approve student achievement submissions.
- If a student records an event-related certificate as achievement evidence, the submission goes to the student's Program Coordinator.
- Organization-owned achievements and organization portfolios are reserved for possible future scope.

---

## 6. Access Boundaries

### HR Admin

- Can create, edit, and manage Personnel accounts.
- Can assign Personnel to colleges.
- Can designate College Deans and Department Secretaries.
- Can verify submissions from Deans and Department Secretaries.
- Can view Personnel portfolios.
- Cannot view Student portfolios.

### OSAD Admin

- Can create, edit, and manage Student accounts.
- Can manage colleges, departments, degree programs, and student organizations.
- Can assign Program Coordinators and Organization Moderators from the Personnel list.
- Can view Student portfolios.
- Cannot view Personnel portfolios.

### Department Secretary

- Can view the verification queue for Personnel in the assigned college.
- Can search and filter accomplishment submissions.
- Can approve, request changes to, or reject eligible submissions.
- Cannot review their own submission or the College Dean's submission.

### Program Coordinator

- Can view the verification queue for Students in the assigned degree program.
- Can search and filter achievement submissions.
- Can approve, request changes to, or reject eligible submissions.

### Organization Moderator

- Can manage assigned organizations.
- Can create and manage events.
- Can record or validate attendance.
- Can generate event certificates.
- Cannot verify student or personnel achievements.

---

## 7. Submission Statuses

Both student and personnel submissions should use consistent statuses:

```text
Draft → Submitted → Under Review → Approved
                            ├──────→ Changes Requested → Resubmitted
                            └──────→ Rejected
```

Each review action should record the reviewer, timestamp, decision, and remarks. An approved record becomes visible in the appropriate portfolio.

---

## 8. Current Limitations and Future Considerations

### Current Approved Limitations

- One named Program Coordinator is assigned per degree program.
- One named Department Secretary is assigned per college.
- One named Organization Moderator is assigned per organization.
- The system has no backup-verifier or verifier-pool workflow.
- Organizations do not submit achievements and do not own achievement portfolios.

### Possible Future Enhancements

The following should only be added after stakeholder approval:

- temporary role delegation during staff absence;
- backup verifiers or verifier pools;
- workload-based assignment and escalation;
- organization achievement submissions and portfolios; and
- configurable multi-level approval workflows.

---

## 9. Sections Requiring Implementation Finalization

- **HR Admin portal:** Personnel onboarding, college assignment, leadership designation, and HR verification queue.
- **OSAD Admin portal:** Academic structure, student management, coordinator assignment, and organization management.
- **Department Secretary portal:** College-based personnel verification dashboard, search, filters, and review actions.
- **Program Coordinator portal:** Program-based student verification dashboard, search, filters, and review actions.
- **Organization Moderator portal:** Event creation, attendance management, and certificate generation.

These sections must follow the ownership, routing, access, and scope rules defined in this document.
