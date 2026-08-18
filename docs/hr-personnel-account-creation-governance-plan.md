# HR Personnel Account Creation and Governance Assignment Implementation Plan

## 1. Objective

Implement a clear personnel lifecycle in the AchieveNest HR Portal where:

1. **HR creates the personnel master record and user account.**
2. **The system automatically initializes the linked profile and portfolio.**
3. **Authorized offices assign governance positions through separate workflows.**
4. **OSAD—not HR—appoints or removes college deans.**
5. Directory, profile, portfolio, employment, and appointment views share one stable `personnel_id`.

This prevents account creation from being confused with appointment authority and prevents official information from becoming inconsistent across modules.

---

## 2. Authoritative Flow

```text
HR creates personnel account
        │
        ├── Create personnel master record
        ├── Create employment assignment
        ├── Create base user account
        ├── Initialize personnel profile
        ├── Initialize empty portfolio
        └── Send secure activation invitation
                    │
                    ▼
          Personnel activates account
                    │
                    ├── Completes editable profile fields
                    └── Adds portfolio content

Separate governance workflow:

OSAD selects an existing eligible personnel member
        │
        └── Creates a dean appointment for a college
                    │
                    ├── Directory/profile show Dean designation
                    └── System derives college-level authority
```

HR onboarding must succeed without selecting a Dean, Department Secretary, or Program Coordinator designation.

---

## 3. Responsibility and Data Ownership

| Information or action | HR | OSAD | Personnel | System |
|---|---:|---:|---:|---:|
| Create personnel record | Owns | View | No | Validates |
| Create base login account | Initiates | No | Activates | Provisions |
| Official name and employee ID | Owns | View | Request correction | Synchronizes |
| Institutional email | Owns | View | View | Validates uniqueness |
| College and department employment placement | Owns | View | View | Synchronizes |
| Position, rank, and employment status | Owns | View | View | Synchronizes |
| Appoint or remove a dean | No | Owns | No | Enforces |
| Determine dean evaluation scope | No | Selects college through appointment | No | Derives scope |
| Biography, education, and portfolio content | View as permitted | View as permitted | Owns | Stores |
| Profile and portfolio initialization | No | No | No | Owns |

The authoritative office for Department Secretary and Program Coordinator appointments must be confirmed before those controls are implemented. Until confirmed, HR onboarding must not grant either designation or its permissions.

---

## 4. Record Model and Relationships

Use a stable `personnel_id` as the parent identity for all related records.

```text
Personnel
├── UserAccount
├── EmploymentAssignment
├── PersonnelProfile
├── Portfolio
└── GovernanceAppointments
    ├── DeanAppointment
    ├── DepartmentSecretaryAppointment (future, authority TBD)
    └── ProgramCoordinatorAppointment (future, authority TBD)
```

Recommended relationship rules:

- One personnel master record may have one active base user account.
- One personnel record may have employment-assignment history.
- One personnel record has one profile.
- One personnel record has one portfolio containing multiple portfolio entries.
- One personnel record may have zero or more dated governance appointments.
- Governance authority must be derived from active appointments, not copied into a manually editable `evaluation_scope` field.
- Names and email addresses must never be used as relational keys.

---

## 5. HR Onboarding Wizard

Refactor `OnboardPersonnelModal.jsx` into four focused stages.

### Stage 1: Identity

Collect the official identity required to establish a personnel record.

Required:

- Given name
- Surname
- Employee ID
- Institutional email

Optional:

- Honorific or title
- Middle name or initial
- Suffix
- Preferred display name
- Initial profile photo

Behavior:

- Prefer structured name fields over a single Full Name input.
- Generate or reserve the Employee ID through the backend.
- Keep a generated Employee ID read-only unless HR has explicit editing permission.
- Offer an editable institutional-email suggestion based on the name.
- Validate the institutional domain and email uniqueness through the backend.
- Handle duplicate addresses, compound names, suffixes, punctuation, and accented characters.
- Preserve all entered information when HR moves between stages.

### Stage 2: Employment and Organizational Placement

Collect official employment information managed by HR.

Required:

- Personnel category
- Position or job title
- College
- Department
- Employment classification
- Employment status
- Hire or appointment date

Conditional:

- Academic rank
- Rank level
- Program affiliation
- Immediate supervisor or reporting unit

Behavior:

- Filter departments using the selected college.
- Reset or flag the department if the college changes and the selection becomes invalid.
- Require academic rank only for applicable personnel categories.
- Keep academic rank separate from administrative or governance appointments.
- Use approved, centrally configured status and rank values where possible.

Stage 2 records where the person works. It does **not** appoint the person as dean.

### Stage 3: Account Access

Create only the person's base account access.

Required:

- Base account role
- Initial account status
- Activation-invitation option

Rules:

- Do not include Dean in this stage.
- Do not accept a manual dean `evaluation_scope`.
- Do not grant governance permissions as a side effect of personnel creation.
- Show a note: `Governance appointments are managed separately by the authorized office.`
- Prefer a secure, expiring activation or password-setup link.
- Do not email plaintext passwords or expose credentials in toast messages.

If the application distinguishes Faculty, Staff, and Administrator base roles, these roles must control general application access only. They must not imply a Dean appointment.

### Stage 4: Review and Create

Display a grouped summary:

- Identity
- Employment and organizational placement
- Base account access
- Invitation destination

Provide an Edit action for each group that returns HR to the relevant stage without losing data.

Explicitly state what will be created:

- Personnel master record
- Employment assignment
- Base user account
- Personnel profile
- Empty portfolio
- Secure activation invitation

Also state what will **not** be created:

- Dean appointment
- Dean evaluation authority
- Other governance appointments not owned by HR

Use the final action label:

**Create personnel account and send invitation**

---

## 6. HR Submission Orchestration

Update `HRPersonnelDirectoryPage.jsx` and the onboarding service to submit only HR-owned data.

Suggested request shape:

```json
{
  "identity": {
    "given_name": "Ana",
    "middle_name": null,
    "surname": "Reyes",
    "suffix": null,
    "employee_id": "EMP-2026-0001",
    "institutional_email": "areyes@ndmu.edu.ph"
  },
  "employment": {
    "personnel_category": "faculty",
    "position_title": "Faculty Member",
    "college_id": "college-id",
    "department_id": "department-id",
    "academic_rank": "associate_professor_i",
    "employment_classification": "full_time",
    "employment_status": "permanent",
    "appointment_date": "2026-08-18"
  },
  "account": {
    "base_role": "faculty",
    "initial_status": "invited",
    "send_activation_invitation": true
  }
}
```

Do not include these fields in the HR onboarding request:

```text
administrative_role: dean
evaluation_scope
dean_college
governance_permissions
```

### Transaction boundary

The backend should perform the data-creation portion as one transaction:

1. Validate identity and employment values.
2. Create the personnel master record.
3. Create the employment assignment.
4. Create the linked base user account.
5. Initialize the profile.
6. Initialize the portfolio.
7. Commit all required records.

If a required record fails, roll back the transaction so no incomplete personnel account remains.

Send the invitation after the records are committed. If invitation delivery fails:

- Keep the valid personnel and account records.
- Mark the invitation as failed.
- Inform HR without claiming complete delivery.
- Provide a permitted Resend invitation action.

Prevent duplicate submissions while creation is in progress.

---

## 7. Immediate Post-Creation Behavior

After successful creation:

1. Close the onboarding wizard.
2. Add or refetch the new personnel record in the Personnel Directory.
3. Show a success message that distinguishes record creation from invitation delivery.
4. Allow HR to open the newly created personnel profile.
5. Confirm that the portfolio exists and is linked to the same `personnel_id`.

Suggested messages:

- Full success: `Personnel account created and activation invitation sent.`
- Delivery failure: `Personnel account created, but the invitation could not be delivered. You can resend it from the account panel.`

Do not display passwords or temporary passkeys in these messages.

---

## 8. Profile Initialization and Synchronization

The new profile should immediately show HR-owned information from the personnel master record and employment assignment:

- Official name
- Employee ID
- Institutional email
- College
- Department
- Position
- Academic rank, when applicable
- Employment classification
- Employment status
- Hire or appointment date

Personnel-facing screens must treat these fields as read-only. Provide a Request correction workflow if needed.

Personnel members may maintain:

- Profile photo
- Personal contact details
- Biography
- Areas of expertise
- Professional links

The profile must reference authoritative fields rather than store disconnected editable copies.

---

## 9. Portfolio Initialization

Create an empty portfolio during onboarding and link it through `personnel_id`.

The portfolio header should reference shared personnel information:

- Display name
- Institutional email
- College and department
- Position
- Academic rank

Initialize empty personnel-managed sections:

- Education
- Research and publications
- Teaching portfolio
- Certifications and training
- Awards and recognition
- Professional activities
- Community extension or service, if applicable

After account activation, show a completion checklist encouraging the personnel member to populate these sections.

Do not require HR to enter portfolio content during onboarding.

---

## 10. Separate OSAD Dean Appointment Workflow

Implement dean assignment outside the HR onboarding wizard in an OSAD-authorized module.

### Required appointment information

- Existing personnel member
- College
- Appointment start date
- Appointment end date, if applicable
- Appointment status
- Appointment reference or order number
- Supporting document, if required
- Notes, if required

### Appointment validation

- The personnel member exists and is active.
- The OSAD user has appointment authority.
- The personnel member satisfies approved eligibility rules.
- The selected college exists.
- Appointment dates are valid.
- The appointment does not conflict with another active dean appointment for the same college.

Suggested appointment record:

```json
{
  "appointment_type": "dean",
  "personnel_id": "personnel-id",
  "college_id": "college-id",
  "starts_at": "2026-08-18",
  "ends_at": null,
  "status": "active",
  "appointed_by": "osad-user-id",
  "appointment_reference": "OSAD-2026-001"
}
```

### Derived dean authority

The system must determine dean authority from the active appointment:

```text
Active dean appointment for College A
        ↓
May access permitted dean functions for College A
        ↓
May evaluate eligible portfolios belonging to College A
```

Do not maintain a second manually editable college evaluation scope. Appointment dates, status, and college must be the source of truth.

When OSAD ends, revokes, or replaces the appointment:

- Dean-specific authority ends automatically according to the effective date.
- The person's base user account remains active unless separately deactivated.
- The personnel profile and portfolio remain intact.
- Appointment history remains available for audit purposes.

---

## 11. Directory and Assignment UI Behavior

### Personnel Directory

- Show the new person immediately after HR onboarding succeeds.
- Display HR-owned employment data from the personnel record.
- Show Dean only when an active OSAD appointment exists.
- Treat governance labels as derived badges, not HR-editable fields.
- Provide separate actions based on permission:
  - HR: Edit employment assignment
  - OSAD: Manage dean appointment

### `DepartmentAssignments.jsx`

- HR may view current governance appointments.
- Dean cards must identify OSAD as the appointing authority.
- Show appointment dates and status when appropriate.
- Render appointment-management controls only for authorized OSAD users.

### `EditAssignmentModal.jsx`

- Allow HR to edit employment placement within HR authority.
- Remove Dean from HR-editable role options.
- Do not silently change or delete a governance appointment when employment placement changes.
- If an HR change conflicts with an active appointment, warn HR and flag the record for OSAD review.

---

## 12. Authorization and Audit Requirements

- Enforce permissions on the server, not only in the UI.
- HR permissions cover personnel identity, employment data, and base account creation.
- OSAD permissions cover dean appointment, replacement, revocation, and history.
- Personnel permissions cover approved self-service profile and portfolio fields.
- Record the actor, timestamp, previous value, and new value for official changes.
- Record account creation and invitation delivery events.
- Record every dean appointment, update, termination, and replacement.
- Do not grant governance authority from a client-submitted role label without verifying an active appointment.

---

## 13. Error and Edge-Case Handling

Handle these cases explicitly:

- Duplicate Employee ID
- Duplicate institutional email
- Invalid college and department combination
- Missing rank for a category that requires it
- Account record succeeds but profile initialization fails
- Invitation delivery fails after account creation
- HR accidentally submits twice
- Personnel is onboarded before an OSAD appointment
- OSAD searches for a person who has not yet been onboarded
- A college already has an active dean
- A dean appointment expires
- HR transfers a dean to another college while the old appointment remains active
- A base account is deactivated while an appointment is still active

Conflicting employment and appointment state must be surfaced for authorized review instead of silently changing authority.

---

## 14. Recommended Delivery Sequence

### Phase 1: Confirm authority and data contracts

- Confirm HR-owned fields.
- Confirm OSAD ownership of dean appointments.
- Identify the authoritative offices for Department Secretary and Program Coordinator appointments.
- Define personnel, employment, account, profile, portfolio, and appointment relationships.
- Define transactional and authorization requirements.

### Phase 2: Implement HR onboarding

- Refactor the four-stage onboarding wizard.
- Remove governance assignments from account creation.
- Add server-side Employee ID and email validation.
- Implement transactional linked-record creation.
- Add secure activation invitations and resend handling.

### Phase 3: Synchronize directory, profile, and portfolio

- Refresh the directory after creation.
- Initialize and open the linked profile.
- Initialize the empty portfolio.
- Verify shared HR fields across all views.

### Phase 4: Implement OSAD dean appointments

- Create the OSAD appointment interface.
- Add eligibility and conflict validation.
- Derive permissions from active appointments.
- Add effective dates, replacement, termination, and history.

### Phase 5: Add remaining governance appointments

- Implement Department Secretary and Program Coordinator appointments only after their appointing authorities and rules are confirmed.

---

## 15. Verification Plan

### Automated checks

Run the existing frontend commands:

```powershell
npm run lint
npm run build
```

Add tests for:

- Required fields in every onboarding stage
- Employee ID and email uniqueness errors
- College and department dependencies
- Conditional academic-rank validation
- Back navigation without data loss
- Dirty-form close confirmation
- Duplicate-submit prevention
- Transaction rollback when linked-record creation fails
- Invitation failure and resend behavior
- Immediate directory refresh
- Profile initialization through `personnel_id`
- Portfolio initialization through `personnel_id`
- Rejection of Dean fields in the HR onboarding API
- Rejection of unauthorized OSAD appointment requests
- Conflicting active dean appointments
- Appointment activation and expiration
- Automatic permission removal after appointment termination
- Preservation of profile and portfolio after account deactivation

### Manual scenarios

#### Scenario A: Standard HR onboarding

1. HR creates an ordinary faculty account.
2. Confirm the account is created without a governance role.
3. Confirm the person appears in the directory.
4. Confirm the profile contains HR-owned fields.
5. Confirm the empty portfolio exists.
6. Confirm the invitation is sent or a recoverable delivery error is shown.

#### Scenario B: Later dean appointment

1. HR creates the personnel account.
2. Confirm the person has no Dean authority.
3. OSAD appoints the person as dean of a college.
4. Confirm the Dean designation appears in authorized views.
5. Confirm college-scoped authority becomes active.
6. Confirm the original profile and portfolio remain linked and unchanged.

#### Scenario C: Dean appointment termination

1. OSAD ends an active dean appointment.
2. Confirm Dean authority ends according to the effective date.
3. Confirm the base account remains available.
4. Confirm the profile and portfolio remain intact.
5. Confirm the appointment remains in history.

#### Scenario D: Employment transfer conflict

1. HR changes the college of a person with an active dean appointment.
2. Confirm the system does not silently transfer Dean authority.
3. Confirm a conflict warning is recorded for OSAD review.

---

## 16. Acceptance Criteria

The implementation is complete when:

- HR can create personnel without assigning governance positions.
- A successful HR submission creates the personnel record, employment assignment, account, profile, and portfolio.
- All linked records use the same stable `personnel_id`.
- The new personnel member appears in the directory immediately.
- HR-owned information is consistent across the directory, profile, and portfolio header.
- Personnel can complete permitted profile and portfolio fields after activation.
- HR cannot appoint, remove, or manually scope a Dean.
- OSAD can appoint a previously onboarded eligible personnel member as Dean.
- Dean authority is derived from the active OSAD appointment and selected college.
- Ending a Dean appointment removes only appointment-derived authority.
- The base account, profile, portfolio, and employment history remain intact after appointment changes.
- Invalid, conflicting, and unauthorized operations are rejected by the backend.
- Account creation and appointment changes are auditable.
- Invitation failures are visible and recoverable.
- Frontend lint and build checks pass.

---

## 17. Open Governance Decisions

The following must be confirmed before implementation of their assignment workflows:

1. Which office appoints a Department Secretary?
2. Which office assigns a Program Coordinator?
3. Are these appointments time-bound?
4. What portfolio evaluation authority does each appointment grant?
5. Can one person hold multiple appointments simultaneously?
6. Who may end, replace, or temporarily suspend each appointment?

Until these decisions are approved, these roles should not be assignable during HR onboarding.
