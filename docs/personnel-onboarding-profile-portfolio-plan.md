# Personnel Onboarding, Profile, and Portfolio Integration Plan

## Objective

Upgrade personnel onboarding in the AchieveNest HR Portal so that HR creates one authoritative personnel record that is consistently reflected in the:

- Personnel Directory
- Personnel Profile
- Personnel Portfolio
- User account and access controls
- Employment and organizational assignments

HR should enter official identity and employment information once. The system should then create and link the account, profile, and portfolio automatically. Personnel members can complete their personal and academic portfolio information after activating their accounts.

---

## Core Design Principle

> HR creates the personnel identity and official employment record. The system creates the linked account, profile, and portfolio. The personnel member completes their portfolio afterward.

The directory, profile, and portfolio must not maintain separate copies of the same official information. They should read shared fields from a single personnel master record.

All related records must use a stable `personnel_id`. Records must never be associated using a person's name or email address alone.

```text
Personnel master record
├── User account
├── Personnel profile
├── Employment assignment
├── Academic appointment
└── Portfolio
```

---

## Information Ownership

| Information | HR responsibility | Personnel responsibility |
|---|---:|---:|
| Employee ID | Create and manage | View only |
| Official name | Create and manage | Request corrections |
| Institutional email | Create and manage | View only |
| College and department | Create and manage | View only |
| Position or job title | Create and manage | View only |
| Employment classification and status | Create and manage | View only |
| Academic rank | Create and manage | View only |
| Hire or appointment date | Create and manage | View only |
| System access and administrative roles | Create and manage | View only |
| Profile photo | Optional initial entry | Add or update |
| Personal contact details | Optional initial entry | Add or update |
| Professional biography | No | Add or update |
| Education | Verify when required | Add or update |
| Certifications | Verify when required | Add or update |
| Research and publications | No | Add or update |
| Teaching portfolio | No | Add or update |
| Awards and professional activities | No | Add or update |

HR should not be required to complete publications, education, biography, certifications, skills, or other portfolio sections during account creation.

---

## Onboarding Wizard Structure

Use a four-stage wizard with controlled scrolling inside each stage on small or short screens.

1. Identity
2. Employment and Assignment
3. Account Access
4. Review and Create

On desktop, each stage should normally fit without scrolling. On smaller screens, keep the modal header, stepper, and footer visible while only the stage content scrolls.

Completed stages may be revisited. Users must resolve validation errors before moving forward.

---

## Stage 1: Identity

### Required fields

- Given name
- Surname
- Employee ID
- Institutional email

### Optional fields

- Title or honorific
- Middle name or initial
- Suffix
- Preferred display name
- Initial profile photo

Use structured name fields instead of one unrestricted Full Name field whenever the data model permits. Structured names improve sorting, email generation, official documents, and profile consistency.

### Employee ID behavior

- Employee IDs must be unique.
- Prefer server-side generation or reservation.
- Display a generated ID as read-only unless HR has explicit permission to edit it.
- Do not generate final IDs only in the browser.
- If generation fails or conflicts, show a clear error and preserve the form.

### Institutional email behavior

- Provide an editable email suggestion based on the structured name.
- Validate the approved institutional domain.
- Check availability through the backend before submission.
- Handle compound surnames, suffixes, punctuation, accented characters, and multiple given names.
- If an address already exists, suggest approved alternatives.
- Treat automatic generation as a suggestion, not an irreversible value.

---

## Stage 2: Employment and Assignment

### Required fields

- College
- Department
- Position or job title
- Employment classification
- Employment status
- Hire or appointment date

### Conditional fields

- Academic rank
- Rank level
- Program assignment
- Administrative designation
- Immediate supervisor or reporting unit

Academic rank should only be required for personnel categories where it applies.

### Field relationships

- Department options must be filtered by the selected college.
- Changing the college must reset or flag an incompatible department.
- Academic rank must use the institution's approved rank vocabulary and hierarchy.
- Employment classification and employment status must be separate fields.
- Administrative assignments must not overwrite the person's academic position or base account role.

Example classifications and statuses should come from approved system configuration rather than being hard-coded when possible.

---

## Stage 3: Account Access

### Required fields

- Base system role
- Initial account status
- Invitation delivery option

### Optional administrative assignments

- Program Coordinator
- Department Secretary
- Moderator
- Other authorized administrative roles

Administrative assignments should normally be additional permissions or assignments, not mutually exclusive replacements for the base Faculty or Personnel role.

### Secure account activation

Prefer sending a one-time account-activation or password-setup link. Do not send plaintext passwords or permanent credentials by email.

If policy requires a temporary passkey:

- Generate it securely on the server.
- Give it a short expiration period.
- Require a password change at first login.
- Do not store or log it in plaintext.
- Do not expose it in generic toast messages.
- Provide reveal, hide, and copy controls only to authorized HR users.
- Record the credential issuance in the audit log without recording the secret.

The interface must clearly state which address will receive the invitation and what information will be sent.

---

## Stage 4: Review and Create

Show a grouped summary before submission:

### Identity

- Official name
- Employee ID
- Institutional email

### Employment and assignment

- College
- Department
- Position
- Academic rank, when applicable
- Employment classification
- Employment status
- Hire or appointment date
- Administrative designations

### Account access

- Base role
- Additional permissions or assignments
- Account status
- Invitation destination and delivery choice

Provide an Edit action for each group that returns HR to the corresponding stage without losing data.

The final action should use a concrete label:

**Create personnel account and send invitation**

Before submission, explain that the operation will create:

- The personnel master record
- The linked user account
- The initial personnel profile
- The initial empty portfolio
- Employment and academic assignments
- Authorized roles and permissions
- The account-activation invitation

---

## Account-Creation Workflow

```text
HR submits the onboarding form
        ↓
Validate identity, employment, and access data
        ↓
Create the personnel master record
        ↓
Create the linked user account
        ↓
Create employment and academic assignments
        ↓
Initialize the personnel profile
        ↓
Initialize the empty portfolio
        ↓
Assign roles and permissions
        ↓
Send the secure activation invitation
        ↓
Return the created personnel record to the directory
```

The data-creation portion should be transactional. If a required record cannot be created, the system should roll back the operation instead of leaving a partial personnel account.

Invitation delivery may be handled after the transaction. If delivery fails, the account should remain valid, HR should see the delivery failure, and an authorized user should be able to resend the invitation.

Prevent duplicate submissions while account creation is in progress.

---

## Profile Initialization

The new profile should immediately display the authoritative personnel information:

- Official name
- Employee ID
- Institutional email
- College
- Department
- Position or job title
- Academic rank, when applicable
- Employment classification
- Employment status
- Hire or appointment date
- Administrative assignments, where appropriate

These values should be referenced from the personnel master record rather than copied into separately editable profile fields.

Personnel members may later add or update permitted profile information such as:

- Profile photo
- Personal contact information
- Professional biography
- Interests and areas of expertise
- Public professional links

Official HR-controlled fields should be read-only in the personnel-facing profile. The interface may provide a Request correction action when needed.

---

## Portfolio Initialization

Create an empty portfolio linked to the same `personnel_id` during onboarding.

The portfolio header should reference shared personnel information, including:

- Display name
- Institutional email
- College and department
- Position
- Academic rank

Initialize empty sections for:

- Education
- Research and publications
- Teaching portfolio
- Certifications and training
- Awards and recognition
- Professional activities
- Community extension or service, if applicable

Portfolio sections should not duplicate official HR fields as independently editable text.

After activation, show the personnel member a profile and portfolio completion checklist.

---

## Data Synchronization Rules

- The Personnel Directory, Profile, and Portfolio header must read official fields from the same personnel record.
- Updates to department, position, academic rank, employment status, or institutional email must appear consistently wherever those fields are displayed.
- A login account may be deactivated without deleting the historical personnel record, profile, or portfolio.
- Portfolio content must remain linked to the personnel record even if the account status changes.
- Personnel members must not directly edit HR-controlled fields.
- Authorized HR updates must be recorded with the previous value, new value, editor, and timestamp.
- Renaming a person or changing their email must not break relationships because all records use `personnel_id`.

---

## Validation and Error Handling

### Client-side validation

- Show inline errors beside invalid fields.
- Focus the first invalid field when Next or Create is selected.
- Preserve form values when moving between stages.
- Preserve the form after server or network errors.
- Disable the submission button while processing.

### Server-side validation

- Employee ID uniqueness
- Institutional email uniqueness and allowed domain
- Valid college and department relationship
- Valid rank for the personnel category
- Valid employment classification and status
- Authorized role assignments
- Required dates and valid date ranges
- Duplicate-person detection according to approved policy

Backend validation errors should be displayed beside the related field where possible.

### Closing the modal

- Cancel or Close may exit immediately when no information has been entered.
- If the form is dirty, show a discard-confirmation dialog.
- Escape should open the discard confirmation instead of immediately losing data.
- Escape from the confirmation should return focus to the onboarding form.

### Keyboard behavior

- Enter may advance only when focus is in a suitable text field.
- Enter must not unexpectedly advance from a select, generator button, checkbox, or other interactive control.
- Final submission must remain a deliberate action.

---

## Security and Authorization

- Only authorized HR users may create personnel accounts.
- Elevated administrative roles require permission checks on the server.
- The client interface must not be treated as the authorization boundary.
- Do not include passwords or temporary secrets in URLs, logs, analytics, or toast messages.
- Record account creation, employment assignment, role assignment, and invitation delivery in the audit log.
- Avoid placing sensitive personal information in the portfolio unless explicitly required and authorized.

---

## Recommended Implementation Sequence

### Phase 1: Data model and contracts

- Define the personnel master record and stable `personnel_id`.
- Confirm relationships among accounts, profiles, assignments, and portfolios.
- Define which fields are authoritative and who may edit them.
- Define the onboarding API request and response contracts.
- Define transactional behavior and invitation-failure handling.

### Phase 2: Onboarding wizard

- Implement the four-stage form.
- Add field validation and dependent selections.
- Add email suggestion and availability checks.
- Add dirty-form protection and submission states.
- Add the review summary and explicit final action.

### Phase 3: Automatic initialization

- Create the account, profile, assignments, and portfolio from one onboarding operation.
- Return the created personnel record to the directory.
- Ensure the new profile and portfolio are immediately accessible.

### Phase 4: Personnel self-service

- Add the profile and portfolio completion checklist.
- Allow personnel to edit only self-service fields.
- Add correction requests for HR-controlled fields.

### Phase 5: Auditing and resilience

- Add audit events.
- Add invitation resend handling.
- Test rollback and partial-failure scenarios.
- Verify deactivation and historical-record retention.

---

## Verification Plan

### Automated checks

Run the existing frontend checks:

```powershell
npm run lint
npm run build
```

Add automated coverage for:

- Required-field validation in each stage
- Structured-name handling
- Email suggestion and collision handling
- Employee ID uniqueness errors
- College and department dependencies
- Conditional academic-rank requirements
- Authorized and unauthorized role assignments
- Back navigation without data loss
- Dirty-form close confirmation
- Duplicate-submit prevention
- Backend and network failures
- Transaction rollback when a required record fails
- Invitation failure and resend behavior
- Directory refresh after successful creation
- Profile initialization from shared personnel data
- Portfolio initialization and `personnel_id` linkage
- Propagation of HR field updates across directory, profile, and portfolio

### Manual verification

- Complete onboarding using keyboard only.
- Verify the wizard at desktop, tablet, mobile, and short viewport heights.
- Test compound names, suffixes, punctuation, and accented characters.
- Test duplicate employee IDs and institutional emails.
- Change a selected college and confirm incompatible departments are reset.
- Verify the final review summary and Edit actions.
- Confirm submission cannot be triggered twice.
- Confirm a successful submission immediately adds the person to the directory.
- Open the new profile and verify official information.
- Open the new portfolio and verify its initialized sections.
- Update a department or rank through HR and verify all relevant screens reflect it.
- Deactivate the user account and verify the historical profile and portfolio remain intact.
- Confirm no password or temporary secret appears in a toast, log, or URL.

---

## Acceptance Criteria

The feature is complete when:

- HR can create a personnel account using the approved minimum information.
- One onboarding submission creates a linked personnel record, account, profile, assignments, and portfolio.
- Every related record uses the same stable `personnel_id`.
- The new person appears in the Personnel Directory immediately after successful creation.
- The Profile and Portfolio show the same authoritative identity and employment information as the directory.
- Personnel can complete self-service profile and portfolio fields without editing HR-controlled information.
- Employee IDs and institutional emails are unique.
- College, department, rank, employment, and role combinations are validated.
- Account activation uses a secure invitation workflow.
- Submission is transactional and does not leave partial required records.
- Invitation failures are visible and recoverable.
- HR-controlled updates propagate consistently across the directory, profile, and portfolio.
- Sensitive operations are authorized and audited.
- Frontend lint and build checks pass.
