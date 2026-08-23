# AchieveNest — Detailed Implementation Plan
## Authentication, Administrative Governance, Account Management, and Core Portfolio Development

**Environment:** AchieveNest-Test first  
**Production:** Must remain untouched until test acceptance is complete  
**Architecture:** React + Vite → Supabase Auth → CodeIgniter API → Supabase PostgreSQL  
**Primary rule:** No frontend-only authorization. CodeIgniter remains the authoritative application API.

---

# 1. Purpose

This implementation plan defines the next development phases of AchieveNest after the successful implementation of:

- Supabase authentication;
- CodeIgniter JWT validation;
- `/api/v1/auth/me`;
- Student and Personnel demo account provisioning;
- base role assignments;
- academic structure foundation;
- account lifecycle foundation.

The plan intentionally separates:

1. authentication and session completion;
2. top-level administrative bootstrap;
3. delegated role management;
4. real account provisioning;
5. account lifecycle and recovery;
6. achievement and portfolio domain development;
7. end-to-end module integration.

The goal is to avoid building frontend modules on top of incomplete authorization or mock data.

---

# 2. Confirmed System Rules

## 2.1 Account Types

Application account types are limited to:

```text
student
personnel
```

Special responsibilities are not separate account types.

Examples:

```text
Personnel + hr_staff
Personnel + osad_staff
Personnel + department_secretary
Personnel + program_coordinator
Personnel + organization_moderator
```

## 2.2 Administrative Ownership

### HR Admin

The HR administrator is the current HR Director.

The account belongs to the actual person.

```text
Person
  ↓
Personnel profile
  ↓
Designation: HR Director
  ↓
Role: hr_staff
```

HR Admin responsibilities:

- create Personnel accounts;
- import Personnel accounts through XLSX;
- validate Personnel information;
- manage Personnel account lifecycle;
- support Personnel account recovery;
- assign and revoke Department Secretary appointments.

### OSAD Admin

The OSAD administrator is the current authorized OSAD office holder.

The account belongs to the actual person.

```text
Person
  ↓
Personnel profile
  ↓
OSAD designation
  ↓
Role: osad_staff
```

OSAD Admin responsibilities:

- create Student accounts;
- import Student accounts through XLSX;
- validate Student information;
- manage Student account lifecycle;
- support Student account recovery;
- assign and revoke Program Coordinator appointments;
- assign and revoke Organization Moderator appointments.

## 2.3 No Permanent Shared Admin Credentials

Do not create permanent shared accounts such as:

```text
hradmin@...
osadadmin@...
```

Do not reuse the outgoing office holder's credentials.

Do not rename an old person's account to the incoming office holder.

Each person keeps an individual account.

Administrative authority is transferred through role assignment.

## 2.4 Top-Level Administrative Succession

The system must support:

```text
Outgoing HR Director
→ revoke hr_staff

Incoming HR Director
→ assign hr_staff
```

and:

```text
Outgoing OSAD office holder
→ revoke osad_staff

Incoming OSAD office holder
→ assign osad_staff
```

However, the permanent institutional authority responsible for performing this transfer is **not yet confirmed**.

Therefore:

- do not hardcode the developer as permanent authority;
- do not create a permanent `system_admin` role without institutional justification;
- do not allow HR or OSAD to self-appoint successors unless formally approved later;
- development may use a controlled bootstrap/maintenance procedure in the test environment.

This remains an **open governance decision**.

---

# 3. Current Verified Foundation

The current identity and academic structure foundation already supports:

- `roles`
- `colleges`
- `departments`
- `degree_programs`
- `profiles`
- `profile_roles`
- `account_lifecycle_events`

The current test environment contains:

```text
5 Student application profiles
5 Personnel application profiles
```

Current active base role assignments:

```text
student   = 5
personnel = 5
```

The specialized roles already exist in the role catalog but have not yet been assigned to demo office holders.

The backend currently has a minimal API foundation and should be expanded gradually instead of exposing application tables directly to the browser.

---

# 4. Phase 1 — Complete Authentication and Session Management

## 4.1 Objective

Finish migration from demo/mock authentication behavior to real Supabase authentication and backend-authoritative identity resolution.

## 4.2 Required Work

### Frontend Authentication

Review the existing authentication service and remove obsolete mock behavior.

Remove or stop depending on:

- hardcoded `DEMO_USERS`;
- fake institutional users;
- local-only role assumptions;
- local password-reset simulation;
- fallback identities that are not returned by the backend.

Real authentication flow:

```text
Login Form
   ↓
Supabase Auth signInWithPassword
   ↓
Supabase access token
   ↓
GET /api/v1/auth/me
   ↓
CodeIgniter validates token
   ↓
CodeIgniter resolves profile + roles
   ↓
Frontend receives authorized identity
```

## 4.3 Logout

Logout must perform:

```text
supabase.auth.signOut()
```

and then clear any AchieveNest UI/session cache.

Do not rely only on:

```text
localStorage.removeItem(...)
```

because clearing browser state does not invalidate the Supabase client session correctly.

## 4.4 Session Restoration

On page refresh:

1. ask Supabase for the current session;
2. if no valid session exists, show login;
3. if a valid session exists, obtain the access token;
4. call `/api/v1/auth/me`;
5. rebuild application identity from backend data;
6. restore allowed navigation.

Do not restore authorization solely from previously stored localStorage role information.

## 4.5 Expired Session Handling

When the Supabase token expires or becomes invalid:

1. attempt normal Supabase session refresh;
2. if refresh succeeds, continue;
3. if refresh fails, clear local state;
4. redirect to login;
5. show a controlled session-expired message.

## 4.6 Account Status Enforcement

A valid Supabase token does not automatically mean application access.

CodeIgniter must reject protected access when:

```text
profile.status = suspended
```

or:

```text
profile.status = archived
```

Expected result:

```text
Valid JWT
+
Suspended/Archived application profile
=
403 Forbidden
```

## 4.7 Password Reset and Recovery

### Self-Service

If the user can still access their account:

```text
Account Page
→ Reset Password
→ Supabase password reset/update flow
```

### Recovery Support

If normal recovery cannot be completed:

```text
Student
→ OSAD

Personnel
→ HR
```

The user must complete in-person verification according to the approved workflow.

No administrative staff member should be able to view the user's password.

## 4.8 Phase 1 Acceptance Criteria

Phase 1 is complete only when all of the following pass:

- Student login works;
- Personnel login works;
- incorrect password is rejected;
- nonexistent user is rejected;
- `/auth/me` returns the correct profile;
- logout signs out from Supabase;
- page refresh restores a valid session;
- expired session is handled correctly;
- suspended account cannot enter protected modules;
- archived account cannot enter protected modules;
- password reset uses real Supabase behavior;
- mock authentication data is no longer required.

---

# 5. Phase 2 — Bootstrap HR and OSAD Administrative Authority

## 5.1 Objective

Create controlled initial administrative authority for HR and OSAD without introducing shared admin accounts.

## 5.2 Bootstrap Model

During initial deployment or controlled test setup:

```text
Authorized bootstrap process
        │
        ├── assign hr_staff
        │      ↓
        │   HR Director
        │
        └── assign osad_staff
               ↓
            OSAD office holder
```

The test environment may use fictional people.

## 5.3 Demo Administrative Profiles

Create two additional test Personnel profiles:

```text
1 HR office holder
1 OSAD office holder
```

They remain:

```text
account_type = personnel
```

Their additional administrative authority comes from `profile_roles`.

Expected role composition:

```text
HR office holder:
- personnel
- hr_staff

OSAD office holder:
- personnel
- osad_staff
```

## 5.4 Bootstrap Safety Requirements

The bootstrap process must:

- run only against `AchieveNest-Test` during development;
- verify the target Supabase project reference before writing;
- never include plaintext passwords in Git;
- never place service-role keys in frontend code;
- create lifecycle history;
- avoid duplicate profile or role assignment creation;
- be idempotent where practical;
- stop if the intended Personnel profile cannot be uniquely identified.

## 5.5 Top-Level Role Exclusivity

The intended governance model is:

```text
1 active hr_staff office holder
1 active osad_staff office holder
```

Do not implement an irreversible database rule until the succession mechanism is finalized.

Instead, initially enforce this in the application/service layer with validation and explicit error reporting.

Reason:

The permanent authority responsible for top-level role transfer is still unresolved.

## 5.6 Phase 2 Acceptance Criteria

- HR demo office holder can authenticate;
- OSAD demo office holder can authenticate;
- `/auth/me` returns `personnel` plus the correct admin role;
- ordinary Personnel accounts do not receive admin access;
- only the intended test office holders have `hr_staff` and `osad_staff`;
- production Supabase remains untouched.

---

# 6. Phase 3 — Real Role and Scope Management

## 6.1 Objective

Implement controlled assignment and revocation of specialized Personnel roles.

## 6.2 HR Role Authority

HR may manage:

```text
department_secretary
```

HR must not automatically gain authority to assign:

```text
osad_staff
program_coordinator
organization_moderator
```

unless a future governance rule explicitly permits it.

## 6.3 OSAD Role Authority

OSAD may manage:

```text
program_coordinator
organization_moderator
```

OSAD must not automatically gain authority to assign:

```text
hr_staff
department_secretary
```

unless future governance changes approve it.

## 6.4 Role Scope

Assignments must use the existing scope model where applicable.

Available scope types:

```text
university
college
department
degree_program
organization
```

Examples:

```text
Department Secretary
→ scope_type = department
→ scope_id = assigned department
```

```text
Program Coordinator
→ scope_type = degree_program
→ scope_id = assigned program
```

```text
Organization Moderator
→ scope_type = organization
→ scope_id = assigned organization
```

Do not fabricate organization scope records until the organization domain is designed.

## 6.5 Required Backend Endpoints

Exact route names should be reviewed before implementation, but the backend must support operations equivalent to:

- list eligible Personnel;
- view current active specialized roles;
- assign a specialized role;
- revoke a specialized role;
- validate assignment authority;
- validate scope;
- prevent unauthorized role assignment.

Potential API structure:

```text
GET    /api/v1/personnel/{id}/roles
POST   /api/v1/personnel/{id}/roles
DELETE /api/v1/personnel/{id}/roles/{assignmentId}
```

These names are proposed and may be refined during API design.

## 6.6 Assignment Validation

Before creating a role assignment, CodeIgniter must verify:

1. authenticated actor exists;
2. actor account is active;
3. actor has the controlling role;
4. target profile exists;
5. target account type is `personnel`;
6. requested role is allowed for the actor;
7. requested scope exists;
8. requested scope is compatible with the role;
9. equivalent active assignment does not already exist.

## 6.7 Revocation

Do not delete historical assignments if history is needed.

Preferred behavior:

```text
is_active = false
revoked_at = current timestamp
```

Maintain:

```text
assigned_by
assigned_at
revoked_at
```

A future enhancement may add:

```text
revoked_by
revocation_reason
```

but this should be introduced only through a proper migration.

## 6.8 Frontend Role Context

Personnel may have multiple roles.

The frontend may provide a role-context switcher.

Example:

```text
Personnel
+ Program Coordinator
+ Organization Moderator
```

The user may switch the visible interface context.

However:

```text
active_role_context
```

must never become the backend permission source.

Backend authorization always comes from active database role assignments.

## 6.9 Phase 3 Acceptance Criteria

- HR can assign Department Secretary;
- HR can revoke Department Secretary;
- OSAD can assign Program Coordinator;
- OSAD can revoke Program Coordinator;
- OSAD can assign Organization Moderator;
- OSAD can revoke Organization Moderator;
- unauthorized cross-office assignment attempts return 403;
- invalid scope returns controlled validation error;
- role switching changes UI context only;
- revoked role immediately loses backend permission.

---

# 7. Phase 4 — Real Account Provisioning

## 7.1 Objective

Move Student and Personnel account creation from developer scripts into authorized system workflows.

## 7.2 Ownership

### HR Admin

Responsible for:

```text
Personnel account provisioning
```

Supports:

- manual creation;
- XLSX bulk import.

### OSAD Admin

Responsible for:

```text
Student account provisioning
```

Supports:

- manual creation;
- XLSX bulk import.

## 7.3 Manual Personnel Creation

Workflow:

```text
HR Admin
   ↓
Create Personnel
   ↓
Enter profile information
   ↓
Server validation
   ↓
Confirmation
   ↓
Create Supabase Auth user
   ↓
Create public.profiles record
   ↓
Assign personnel role
   ↓
Record provisioned lifecycle event
```

Required data should follow the current profile schema and approved roster rules.

## 7.4 Manual Student Creation

Workflow:

```text
OSAD Admin
   ↓
Create Student
   ↓
Enter identity + academic information
   ↓
Server validation
   ↓
Confirmation
   ↓
Create Supabase Auth user
   ↓
Create public.profiles record
   ↓
Assign student role
   ↓
Record provisioned lifecycle event
```

## 7.5 XLSX Bulk Import

Both HR and OSAD use:

```text
Upload
  ↓
Parse
  ↓
Validate
  ↓
Preview
  ↓
Correct errors if necessary
  ↓
Confirm
  ↓
Provision
  ↓
Summary
```

Uploading the workbook must never immediately create accounts.

## 7.6 Validation Preview

For every row, display:

```text
Row number
Institutional ID
Institutional email
Name
Validation result
Error reason
```

Example:

```text
Row 4
INVALID
Reason: degree program does not belong to selected department
```

The administrator must be able to cancel before provisioning.

## 7.7 Student XLSX Validation

Validate at minimum:

- institutional ID format;
- institutional email;
- first name;
- last name;
- optional middle name;
- optional suffix;
- college;
- department;
- degree program;
- year level;
- duplicate institutional ID;
- duplicate institutional email;
- program belongs to department;
- department belongs to college.

## 7.8 Personnel XLSX Validation

Validate at minimum:

- institutional ID;
- institutional email;
- first name;
- last name;
- optional middle name;
- optional suffix;
- college;
- department;
- designation;
- department belongs to college;
- duplicate institutional ID;
- duplicate institutional email.

Personnel roster import does not automatically assign specialized roles.

Example:

```text
Designation: Department Secretary
```

does not itself authorize:

```text
department_secretary
```

Role assignment must still occur through the approved HR role-management workflow.

## 7.9 Transaction and Failure Handling

Provisioning should avoid partially-created application accounts.

For each account, handle:

```text
Auth user creation
Profile creation
Base role assignment
Lifecycle event
```

If a later step fails, use a safe compensating action or reconciliation strategy.

The implementation plan for this should be reviewed before coding because Supabase Auth and PostgreSQL application tables are separate operations.

## 7.10 Temporary Password Security

Requirements:

- unique temporary password per account;
- strong password policy;
- never stored in workbook;
- never committed to Git;
- never logged in application logs;
- never returned through public APIs after initial controlled delivery;
- support password change/reset.

The exact institutional credential-delivery method remains a deployment workflow decision.

## 7.11 Phase 4 Acceptance Criteria

- HR can manually create Personnel;
- OSAD can manually create Students;
- HR can preview Personnel XLSX;
- OSAD can preview Student XLSX;
- invalid rows are blocked;
- no accounts are created before confirmation;
- successful rows create Auth + profile + base role + lifecycle event;
- duplicate imports do not silently create duplicate users;
- unauthorized users cannot access provisioning APIs.

---

# 8. Phase 5 — Account Lifecycle and Recovery Management

## 8.1 Objective

Expose the existing lifecycle foundation through authorized backend and frontend workflows.

## 8.2 Ownership

### OSAD

Controls Student:

- activation;
- suspension;
- archive;
- restore.

### HR

Controls Personnel:

- activation;
- suspension;
- archive;
- restore.

## 8.3 Suspension

Required fields:

```text
target account
performed_by
reason
occurred_at
```

Profile effects should include:

```text
status = suspended
suspended_at
suspended_by
suspension_reason
```

Lifecycle event:

```text
event_type = suspended
```

## 8.4 Archive

Archive should be used for accounts that should no longer operate normally but whose historical records must remain.

Profile effects:

```text
status = archived
archived_at
archived_by
archive_reason
```

Do not delete achievement history merely because the profile is archived.

## 8.5 Restore

Restore changes the account back to an allowed application state according to policy.

Record:

```text
restored_at
restored_by
```

and lifecycle event:

```text
event_type = restored
```

## 8.6 Recovery Workflow

### Student

```text
Student cannot recover account
→ visit OSAD
→ identity/account verification
→ authorized recovery action
```

### Personnel

```text
Personnel cannot recover account
→ visit HR
→ identity/account verification
→ authorized recovery action
```

Do not expose existing passwords.

Recovery should use password reset or administrative recovery mechanisms supported by Supabase Auth.

## 8.7 Phase 5 Acceptance Criteria

- OSAD can suspend Student;
- OSAD can archive Student;
- OSAD can restore Student;
- HR can suspend Personnel;
- HR can archive Personnel;
- HR can restore Personnel;
- every lifecycle action creates history;
- suspended/archived accounts receive 403 from protected application APIs;
- restored accounts regain access only when appropriate;
- cross-office lifecycle actions are rejected.

---

# 9. Phase 6 — Design and Implement the Core Achievement and Portfolio Domain

## 9.1 Objective

Build the actual AchieveNest achievement and portfolio data model only after account governance is stable.

Do not create arbitrary tables merely to match existing UI screens.

The schema must come from confirmed workflows.

## 9.2 External Achievement Workflow

Confirmed conceptual flow:

```text
Student
   ↓
Submit achievement
   ↓
Provide achievement details
   ↓
Upload supporting evidence
   ↓
Verification queue
   ↓
Authorized verifier
   ↓
Approve / Reject / Return
   ↓
Approved record
   ↓
Student portfolio
```

## 9.3 Official Event Workflow

Confirmed conceptual flow:

```text
Authorized organizer
   ↓
Create official event
   ↓
Manage/import participants
   ↓
Record participation/result/placement
   ↓
Generate verified achievement
   ↓
Generate certificate when applicable
   ↓
Attach to Student portfolio
```

## 9.4 Institutional Evaluation Workflow

```text
Verified achievements
        ↓
Filtering / evaluation
        ↓
Institutional report
        ↓
Award / scholarship / promotion support
```

Point-based ranking remains secondary and should not be implemented until the scoring criteria are formally confirmed.

## 9.5 Domain Design Session Before Migration

Before writing migrations, explicitly define:

- achievement types;
- achievement categories;
- official vs external source;
- verification states;
- verifier authority;
- evidence requirements;
- event ownership;
- participant model;
- placement/result model;
- certificate rules;
- portfolio visibility;
- audit requirements;
- deletion/archive behavior.

## 9.6 Candidate Entities

The following are conceptual entities, not yet final table names:

```text
achievements
achievement_categories
achievement_evidence
verification_requests
verification_decisions
portfolio_entries
events
event_participants
event_results
certificates
audit/history
organizations
```

Exact table names and columns must be reviewed before migrations are created.

## 9.7 Verification State Model

A likely workflow may require states such as:

```text
draft
submitted
under_review
returned
approved
rejected
```

These are not final until the verification workflow is formally reviewed.

Do not hardcode them before that design step.

## 9.8 Storage

Achievement evidence and generated certificates will require file storage.

Before implementation decide:

- Supabase Storage bucket structure;
- private vs public objects;
- signed URLs;
- maximum file size;
- allowed MIME types;
- evidence retention;
- certificate retention;
- replacement/versioning rules.

Frontend must not receive unrestricted storage administration credentials.

## 9.9 Phase 6 Acceptance Criteria

Phase 6 is complete only after:

- domain model is reviewed;
- migrations are version-controlled;
- foreign keys are correct;
- required indexes exist;
- authorization rules are defined;
- upload/storage rules are defined;
- one complete external achievement workflow can be represented without mock data.

---

# 10. Phase 7 — End-to-End Module Integration

## 10.1 Objective

Connect the frontend to real backend functionality one complete workflow at a time.

Do not attempt to convert every dashboard and module simultaneously.

## 10.2 First Vertical Slice

Recommended first production-style workflow:

```text
Student Login
    ↓
Student submits external achievement
    ↓
Evidence is stored
    ↓
Submission enters verification queue
    ↓
Authorized verifier reviews submission
    ↓
Verifier approves
    ↓
Achievement becomes verified
    ↓
Student portfolio updates
```

This validates:

- authentication;
- role authorization;
- backend API;
- database relationships;
- file handling;
- verification;
- audit history;
- frontend state;
- portfolio presentation.

## 10.3 Second Vertical Slice

Official events:

```text
Authorized organizer
    ↓
Create event
    ↓
Add/import participants
    ↓
Record attendance/result
    ↓
Generate achievement
    ↓
Generate certificate
    ↓
Portfolio automatically updates
```

## 10.4 Later Integration

After the first two vertical slices are stable:

- institutional reporting;
- advanced search/filter;
- verified portfolio presentation;
- certificate viewing;
- exports;
- audit trail;
- award evaluation;
- optional ranking/points;
- dashboard analytics.

---

# 11. Security Requirements Across All Phases

## 11.1 Secrets

Never expose:

- Supabase service-role key;
- database password;
- JWT signing private material;
- administrative credentials.

Frontend may only use frontend-safe Supabase credentials.

## 11.2 Authorization

Never authorize using:

```text
localStorage role
frontend route
hidden button
user_metadata alone
```

Authorization source:

```text
Validated authenticated user
+
active application profile
+
active database role assignments
+
valid scope
```

## 11.3 RLS

Current application architecture uses CodeIgniter as the authoritative application API.

Do not create broad browser-access RLS policies merely to make development easier.

Any future Supabase Data API usage must be explicitly designed and reviewed.

## 11.4 Auditability

Important administrative actions should be attributable to an actual person.

Avoid:

```text
"HR Admin changed account"
```

Prefer:

```text
Specific authenticated profile
performed action
while holding hr_staff authority
at timestamp
```

---

# 12. Testing Strategy

Each phase must be tested before beginning the next major dependency.

## 12.1 Authentication Tests

Test:

- valid Student login;
- valid Personnel login;
- invalid password;
- unknown email;
- malformed institutional email;
- valid token;
- expired token;
- profile not found;
- suspended account;
- archived account;
- logout;
- refresh;
- password reset.

## 12.2 Authorization Tests

For every protected endpoint test:

```text
authorized actor
unauthorized actor
missing token
invalid token
revoked role
wrong scope
inactive account
```

Expected failures must be controlled `401`, `403`, `404`, or validation responses as appropriate.

## 12.3 Provisioning Tests

Test:

- valid manual Student;
- valid manual Personnel;
- duplicate ID;
- duplicate email;
- invalid college;
- invalid department;
- invalid program;
- wrong department-program relationship;
- missing required name;
- malformed XLSX;
- partially invalid workbook;
- cancelled preview;
- confirmed import.

## 12.4 Lifecycle Tests

Test:

```text
active → suspended
suspended → restored
active → archived
archived → restored
```

Verify backend access after every state change.

---

# 13. Git and Deployment Workflow

All new work should use controlled branches and pull requests.

Recommended approach:

```text
main
  ↓
feature branch
  ↓
implementation
  ↓
local tests
  ↓
GitHub Actions
  ↓
PR review
  ↓
merge
```

Do not perform large unrelated changes in the same PR.

Suggested future branches:

```text
feature/auth-session-cleanup
feature/admin-bootstrap
feature/role-management
feature/account-provisioning
feature/account-lifecycle
feature/achievement-domain
feature/external-achievement-flow
```

Names may be adjusted to the repository's branch convention.

---

# 14. Environment Strategy

## AchieveNest-Test

Use for:

- migrations;
- demo accounts;
- role bootstrap;
- API development;
- destructive testing;
- account lifecycle testing;
- achievement workflow testing.

## Production Achievenest

Do not modify until:

1. migration reviewed;
2. test migration succeeds;
3. rollback or recovery method is understood;
4. API tests pass;
5. GitHub checks pass;
6. user approves production deployment.

---

# 15. Implementation Order

The development order is:

```text
PHASE 1
Authentication + Session Cleanup
        ↓
PHASE 2
Bootstrap HR + OSAD Authority
        ↓
PHASE 3
Specialized Role + Scope Management
        ↓
PHASE 4
Manual + XLSX Account Provisioning
        ↓
PHASE 5
Account Lifecycle + Recovery
        ↓
PHASE 6
Achievement + Portfolio Domain
        ↓
PHASE 7
End-to-End Module Integration
```

Do not skip directly to later modules when an earlier authorization dependency is incomplete.

---

# 16. Immediate Next Work

The immediate next implementation should be **Phase 1: Authentication and Session Cleanup**.

Before changing code:

1. inspect current `main`;
2. identify all remaining mock authentication dependencies;
3. inspect current logout implementation;
4. inspect session restoration;
5. inspect password-reset implementation;
6. inspect frontend route protection;
7. inspect backend auth filter and `/auth/me`;
8. produce a change list;
9. implement only after the current behavior is understood.

After Phase 1 passes, proceed to Phase 2.

---

# 17. Open Governance Decision

The following remains intentionally unresolved:

> **Who has institutional authority to transfer the top-level `hr_staff` and `osad_staff` roles when the HR Director or OSAD office holder changes?**

Until formally decided:

- support technical role revocation/assignment;
- keep the operation restricted to controlled bootstrap/maintenance procedures;
- do not introduce an unjustified permanent `system_admin`;
- do not allow self-appointment;
- document every test-environment top-level role change.

---

# 18. Definition of Success

This implementation plan is successful when AchieveNest reaches a state where:

```text
A real person authenticates
        ↓
CodeIgniter resolves identity
        ↓
Database roles define authority
        ↓
Office responsibilities are scoped
        ↓
Accounts are provisioned through the system
        ↓
Lifecycle actions are auditable
        ↓
Achievements are submitted/generated
        ↓
Verification produces trusted records
        ↓
Portfolio reflects verified achievements
        ↓
Institutional reports use verified data
```

At no stage should the frontend be the authoritative source of identity, role, permission, or verification status.
