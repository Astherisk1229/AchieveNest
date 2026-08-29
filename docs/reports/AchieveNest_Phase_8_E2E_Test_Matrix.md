# AchieveNest — Phase 8 E2E Test & Role Authorization Matrix

## 1. Executive Summary
This document establishes the authoritative test matrix, test identity specifications, positive/negative authorization boundaries, execution results, and cleanup protocols for Phase 8 End-to-End (E2E) validation across all supported application workflows.

---

## 2. E2E Actor & Identity Manifest

| Actor Alias | Account Type | Assigned Role(s) | Scope / Affiliation | Purpose |
|---|---|---|---|---|
| `e2e.student.01` | `student` | `student` | Student A (Program BSCS) | Primary student portfolio submission & evidence |
| `e2e.student.02` | `student` | `student` | Student B (Program BSIT) | Cross-user isolation & peer boundary check |
| `e2e.personnel.academic.01` | `personnel` | `personnel` | College of Engineering & Tech (BSCS) | Academic personnel accomplishment & evaluation |
| `e2e.personnel.nonacademic.01`| `personnel` | `personnel` | Human Resources Office (`HR`) | Non-academic unit personnel workflow |
| `e2e.hr.01` | `hr_admin` | `personnel`, `hr_staff` | University-wide | HR administrative authority & directory management |
| `e2e.osad.01` | `osad_admin` | `personnel`, `osad_staff`| University-wide | OSAD administrative authority & student management |
| `e2e.dean.01` | `personnel` | `personnel`, `dean` | College of Engineering & Technology | Dean college review, nominations & oversight |
| `e2e.programcoordinator.01` | `personnel` | `personnel`, `program_coordinator` | BS Computer Science (`BSCS`) | Verification queue review & approval for program |
| `e2e.orgmoderator.01` | `personnel` | `personnel`, `organization_moderator` | Computer Science Society (`CSS`) | Organization moderation & event endorsement |
| `e2e.personnel.multirole.01` | `personnel` | `personnel`, `program_coordinator`, `organization_moderator` | BSCS / CSS | Dynamic role switching & context isolation |

---

## 3. Structural & Institutional Fixture References

- **Academic College 1**: College of Engineering and Technology (`CET`)
- **Academic Program 1**: Bachelor of Science in Computer Science (`BSCS`)
- **Academic College 2**: College of Business and Accountancy (`CBA`)
- **Academic Program 2**: Bachelor of Science in Information Technology (`BSIT`)
- **Administrative Unit Fixture**: Human Resources Office (`HR`, ID: `8cb1b662-a405-4e3a-ae6b-5fa1cc4603b2`) / Guidance and Testing Center (`GTC`, ID: `db80fc1b-0eec-49d4-ad83-2113ee84ef1f`)
- **Student Placement Fixture**: `e2e.student.01` enrolled in `BSCS`; `e2e.student.02` enrolled in `BSIT`
- **Organization Fixture**: Computer Science Society (`CSS`)

---

## 4. Master E2E Scenario Matrix

### 4.1 Authentication & Session Management (`AUTH` / `SESS` / `ACCT`)
| Scenario ID | Scenario Name | Actor | Action / Operation | Expected HTTP | Expected Outcome | Execution Status |
|---|---|---|---|:---:|---|:---:|
| `AUTH-001` | Valid Student Authentication | `e2e.student.01` | Supabase login + `/auth/me` | 200 | Returns student profile & active role | **PASS** |
| `AUTH-002` | Invalid Password Rejection | `e2e.student.01` | Invalid token / credential attempt | 401 | Auth rejected; no token issued | **PASS** |
| `AUTH-003` | Nonexistent User Rejection | Anonymous | Unknown subject / profile | 401 / 403 | Auth rejected; `PROFILE_NOT_FOUND` | **PASS** |
| `AUTH-004` | Anonymous Protected Route Rejection | Anonymous | Call protected `/api/v1/*` | 401 | Forbidden: `MISSING_BEARER_TOKEN` | **PASS** |
| `AUTH-005` | Temporary Password First Login | `e2e.student.temp` | First login + password change | 200 | Enforces password change before full access | **PASS** |
| `AUTH-006` | Old Temporary Credential Rejection | `e2e.student.temp` | Attempt login with old password | 401 | Denied: old password invalidated | **PASS** |
| `AUTH-007` | Password Complexity Validation | `e2e.student.01` | Validate min length (8 chars) & match | 422 | Short / mismatched passwords rejected | **PASS** |
| `AUTH-008` | User Password Reset Request | `e2e.student.01` | `POST /api/v1/password-reset-requests` | 200 | Reset request & event created | **PASS** |
| `AUTH-009` | Password Reset Completion | `e2e.student.01` | Admin reset execution + password update | 200 | Temporary password generated; event logged | **PASS** |
| `AUTH-010` | Invalid / Expired / Reused Reset Request | `e2e.student.01` | Invalid ID / completed request reuse | 404 / 422 | Invalid rejected (404); Reuse rejected (422); Self-service token expiry not implemented | **PARTIAL** |
| `AUTH-011` | Rate Limiting / Brute-Force | Any | App 24h reset limit & provider auth boundary | 200 / 401 | 24h reset deduplication verified; Provider auth limit not reached in safe ceiling | **PARTIAL** |
| `AUTH-012` | Institutional Email Restriction | Any | Submit non-`@ndmu.edu.ph` email | 422 | Hardened DB check & controller rejection | **PASS** |
| `AUTH-013` | Password Reset Exposure Guard | Anonymous | Submit reset for arbitrary emails | 200 | Generic UX avoids identity enumeration | **PASS** |
| `AUTH-014` | Direct Protected Account Mutation | `e2e.student.01` | Attempt client mutation of profile | 403 | RLS & backend mediation enforced | **PASS** |
| `SESS-001` | Session Persistence & Hydration | `e2e.student.01` | Multi-route API navigation | 200 | Context remains bound to actor | **PASS** |
| `SESS-002` | Explicit Logout Termination | `e2e.student.01` | Token clearance & invalidation | 200 | Protected routes immediately 401 | **PASS** |
| `SESS-003` | Old Token After Logout | `e2e.student.01` | Expired / revoked bearer request | 401 | Rejection verified | **PASS** |
| `SESS-004` | Concurrent Session Isolation | Student A & B | Parallel multi-session calls | 200 | Zero cross-session contamination | **PASS** |
| `SESS-005` | Cross-User Session Leakage | Student A & B | Alternate actor execution | 200 | Zero identity leakage | **PASS** |
| `SESS-006` | Session After Password Change | `e2e.student.01` | Invalidate previous session tokens | 401 | Password change prompts re-auth | **PASS** |
| `SESS-007` | Multi-Role Context Hydration | `e2e.personnel.multirole.01`| Hydrate active role assignments | 200 | Discovers all 3 assigned roles | **PASS** |
| `SESS-008` | Role Switch Without Manual Reload | `e2e.personnel.multirole.01`| Switch between Coordinator & Moderator | 200 | Clean dynamic hydration | **PASS** |
| `SESS-009` | Wrong-Role Route Access | `e2e.student.01` | Student attempts HR / OSAD routes | 401 / 403 | Backend authorization denial | **PASS** |
| `SESS-010` | Role-Context Persistence | `e2e.personnel.multirole.01`| Page reload & navigation | 200 | Context maintained consistently | **PASS** |
| `ACCT-001` | Suspended Account Enforcement | `e2e.student.01` (suspended)| Call `/api/v1/auth/me` | 403 | `ACCOUNT_SUSPENDED` returned | **PASS** |
| `ACCT-002` | Account Reactivation Flow | `e2e.student.01` (restored) | Call `/api/v1/auth/me` | 200 | Access restored seamlessly | **PASS** |
| `ACCT-003` | Account Lifecycle Events Logged | `e2e.student.01` | Profile status / password changes | 200 | Audit rows in `password_reset_events` | **PASS** |
| `ACCT-004` | Security Audit Trail Verification | `e2e.hr.01` | Role & credential operations | 200 | Auditable trace confirmed | **PASS** |

---

### 4.2 Role & Context Switching (`ROLE`)
| Scenario ID | Scenario Name | Actor | Action / Operation | Expected HTTP | Expected Outcome | Execution Status |
|---|---|---|---|:---:|---|:---:|
| `ROLE-001` | Multi-Role Context Switch | `e2e.personnel.multirole.01` | Switch context between Coordinator & Moderator | 200 | UI updates immediately without browser reload | **PASS** |
| `ROLE-002` | Unauthorized Context Elevation Attempt | `e2e.student.01` | Send fake `hr_staff` context header | 403 | Backend enforces database role authorization | **PASS** |
| `ROLE-003` | Revoked Role Immediate Invalidation | `e2e.dean.01` | Inactivate Dean assignment + call dean API | 403 | Immediate loss of Dean review permission | **PASS** |

---

### 4.3 Governance, Scoping & Affiliation Authorizations (Step 3 `GOV` / `AFF` / `DEAN` / `PC` / `OM` / `STU` / `MULTI` / `RLS`)
| Scenario ID | Scenario Name | Actor | Action / Operation | Expected HTTP | Expected Outcome | Execution Status |
|---|---|---|---|:---:|---|:---:|
| `GOV-001` | HR Login & Context Hydration | `e2e.hr.01` | Verify HR admin role & route authorization | 200 | Discovers HR context; HR routes allowed | **PASS** |
| `GOV-002` | OSAD Login & Context Hydration | `e2e.osad.01` | Verify OSAD admin role & route authorization | 200 | Discovers OSAD context; OSAD routes allowed | **PASS** |
| `GOV-003` | HR Non-Academic Personnel Management | `e2e.hr.01` | Inspect non-academic personnel affiliation | 200 | Bounded to administrative unit scope | **PASS** |
| `GOV-004` | HR OSAD-Only Assignment Denial | `e2e.hr.01` | Attempt assign Program Coordinator / Moderator | 403 | Denied: `FORBIDDEN_ROLE_ASSIGNMENT` | **PASS** |
| `GOV-005` | OSAD Program Coordinator Assignment | `e2e.osad.01` | Assign Coordinator to Program | 201 | Created `program_coordinator_assignments` | **PASS** |
| `GOV-006` | OSAD Organization Moderator Assignment | `e2e.osad.01` | Assign Moderator to Organization | 201 | Created `organization_moderator_assignments` | **PASS** |
| `GOV-007` | OSAD HR-Only Action Denial | `e2e.osad.01` | Attempt assign Dean / HR mutation | 403 | Denied: `FORBIDDEN_ROLE_ASSIGNMENT` | **PASS** |
| `GOV-008` | Dean Assignment Authority | `e2e.hr.01` | Assign Dean to College | 201 | Created active `dean_assignments` | **PASS** |
| `GOV-009` | Unauthorized Dean Assignment Attempt | `e2e.personnel.academic.01` | Attempt Dean assignment | 403 | Forbidden: non-admin actor rejected | **PASS** |
| `GOV-010` | Program Placement Mutation Authority | `e2e.student.01` / `e2e.osad.01` | Mutate student academic placement | 403 / 200 | Students denied; OSAD admin authorized | **PASS** |
| `GOV-011` | Inactive Assignment Behavior | `e2e.dean.01` | Deactivate assignment + verify context | 200 / 403 | Inactive assignment ceases granting role | **PASS** |
| `GOV-012` | Governance Assignment Audit Trail | `e2e.osad.01` / `e2e.hr.01` | Verify lifecycle assignment records | 200 | Authoritative audit rows verified | **PASS** |
| `GOV-013` | Unauthorized Assignment Audit / Denial | `e2e.student.01` | Verify error structure on denied mutation | 403 | Standard `FORBIDDEN` error contract | **PASS** |
| `AFF-001` | Academic Personnel Affiliation | `e2e.personnel.academic.01` | Resolve college and program affiliation | 200 | Exact `CET` and `BSCS` affiliations | **PASS** |
| `AFF-002` | Non-Academic Personnel Affiliation | `e2e.personnel.nonacademic.01` | Resolve administrative unit affiliation | 200 | Exact `HR` unit; no program affiliations | **PASS** |
| `AFF-003` | Academic Cannot Inherit Non-Academic Scope | `e2e.personnel.academic.01` | Query admin unit affiliation | 200 / 403 | Empty / denied: non-academic isolated | **PASS** |
| `AFF-004` | Non-Academic Cannot Inherit Academic Scope | `e2e.personnel.nonacademic.01` | Query college/program affiliation | 200 / 403 | Empty / denied: academic isolated | **PASS** |
| `DEAN-001` | Dean Context Hydration | `e2e.dean.01` | Discover college scope | 200 | Discovers `CET` college scope | **PASS** |
| `DEAN-002` | Dean Assigned College Scope Access | `e2e.dean.01` | Access `CET` college resources | 200 | Allowed within assigned college scope | **PASS** |
| `DEAN-003` | Dean Cross-College Access Denial | `e2e.dean.01` | Attempt access `CBA` college scope | 403 / Filtered | Denied: out-of-scope college protected | **PASS** |
| `PC-001` | Program Coordinator Context Hydration | `e2e.programcoordinator.01` | Discover academic program scope | 200 | Discovers `BSCS` program scope | **PASS** |
| `PC-002` | Program Coordinator Program Scope Access | `e2e.programcoordinator.01` | Access `BSCS` submissions | 200 | Allowed for assigned program | **PASS** |
| `PC-003` | Coordinator Cross-Program Denial | `e2e.programcoordinator.01` | Attempt access `BSIT` submissions | 403 / Filtered | Denied: out-of-scope program protected | **PASS** |
| `OM-001` | Organization Moderator Context Hydration | `e2e.orgmoderator.01` | Discover organization scope | 200 | Discovers `CSS` organization scope | **PASS** |
| `OM-002` | Moderator Assigned Organization Access | `e2e.orgmoderator.01` | Access `CSS` organization resources | 200 | Allowed for assigned organization | **PASS** |
| `OM-003` | Moderator Cross-Organization Denial | `e2e.orgmoderator.01` | Attempt access `JPIA` organization | 403 / Filtered | Denied: out-of-scope org protected | **PASS** |
| `STU-001` | Student A Placement Resolution | `e2e.student.01` | Resolve academic program placement | 200 | Resolves `BSCS` under `CET` | **PASS** |
| `STU-002` | Student B Placement Resolution | `e2e.student.02` | Resolve academic program placement | 200 | Resolves `BSIT` under `CBA` | **PASS** |
| `STU-003` | Student Self-Placement Mutation Denial | `e2e.student.01` | Direct mutation on program placement | 403 | Denied: backend-mediated placement | **PASS** |
| `STU-004` | Student Cross-User Placement Denial | `e2e.student.01` | Attempt mutate Student B placement | 403 | Denied: peer boundary enforced | **PASS** |
| `MULTI-001` | Multi-Role Context Hydration | `e2e.personnel.multirole.01` | Discover all 3 assigned roles | 200 | Discovers Personnel, Coordinator, Moderator | **PASS** |
| `MULTI-002` | Multi-Role Dynamic Switching | `e2e.personnel.multirole.01` | Switch between Coordinator & Moderator | 200 | Dynamic context resolution without reload | **PASS** |
| `MULTI-003` | Multi-Role Permission Union Guard | `e2e.personnel.multirole.01` | Validate contextual role scopes | 200 | Scopes strictly bounded to active context | **PASS** |
| `MULTI-004` | Multi-Role Cross-Scope Restriction | `e2e.personnel.multirole.01` | Verify unassigned program/college access | 403 / Filtered | Multi-role does not confer global access | **PASS** |
| `RLS-001` | Student Cross-User Isolation | `e2e.student.01` | Peer data access check on Student B | 403 / Filtered | Direct cross-user reads blocked | **PASS** |
| `RLS-002` | Program Coordinator Isolation | `e2e.programcoordinator.01` | Query non-assigned program data | 403 / Filtered | Unassigned program records filtered | **PASS** |
| `RLS-003` | Dean Cross-College Isolation | `e2e.dean.01` | Query non-assigned college data | 403 / Filtered | Unassigned college records filtered | **PASS** |
| `RLS-004` | Organization Moderator Isolation | `e2e.orgmoderator.01` | Query non-assigned org data | 403 / Filtered | Unassigned org records filtered | **PASS** |
| `RLS-005` | HR vs OSAD Boundary | `e2e.hr.01` / `e2e.osad.01` | Cross-admin API call attempt | 403 | Bidirectional administrative boundary | **PASS** |
| `RLS-006` | Anonymous Governance Denial | Anonymous | Call governance endpoints anonymously | 401 | Missing Bearer token rejection | **PASS** |

---

### 4.4 Student Portfolio, Evidence & Verification Workflows (`PORT` / `ACH` / `EVID` / `VER` / `RLS-PORT` / `AUD-PORT`)
| Scenario ID | Scenario Name | Actor | Action / Operation | Expected HTTP | Expected Outcome | Execution Status |
|---|---|---|---|:---:|---|:---:|
| `PORT-001` | Student Portfolio Access & Identity | `e2e.student.01` | `GET /api/v1/portfolio` | 200 | Returns own profile portfolio identity | **PASS** |
| `PORT-002` | Taxonomy Load & Subcategory Distribution | Any / Student | `GET /api/v1/portfolio/categories` | 200 | Exactly 9 categories & 57 subcategories | **PASS** |
| `PORT-003` | Description Model Invariant | DB Verification | Query subcategories descriptions | 200 | 40 described, 17 NULL disciplines (10 sports, 7 socio) | **PASS** |
| `ACH-001` | Valid Achievement Submission | `e2e.student.01` | `POST /api/v1/portfolio` (Leadership) | 201 | Record created in `submitted` status | **PASS** |
| `ACH-002` | Invalid Taxonomy Pairing Denial | `e2e.student.01` | `POST /api/v1/portfolio` (mismatched cat/subcat) | 422 | Denied: `INVALID_TAXONOMY_COMBINATION` | **PASS** |
| `ACH-003` | Sports Metadata Rule Enforcement | `e2e.student.01` | `POST /api/v1/portfolio` (Sports rule) | 422 / 201 | Missing date/AY rejected; valid AY accepted | **PASS** |
| `ACH-004` | Student Cannot Self-Verify | `e2e.student.01` | `POST /api/v1/portfolio` with `status: verified` | 201 | Forced to `submitted`; `verified_at` remains NULL | **PASS** |
| `ACH-005` | Student Cannot Set Award Outcome | `e2e.student.01` | `POST /api/v1/portfolio` with award scores | 201 | Award tables untouched; zero score rows injected | **PASS** |
| `EVID-001` | Valid PDF Evidence Upload | `e2e.student.01` | `POST /api/v1/portfolio/{id}/evidence` (PDF) | 201 | Stored with clean security status & checksum | **PASS** |
| `EVID-002` | Valid Image Evidence Upload | `e2e.student.01` | `POST /api/v1/portfolio/{id}/evidence` (PNG) | 201 | Stored with clean security status & checksum | **PASS** |
| `EVID-003` | Invalid MIME / Extension Rejection | `e2e.student.01` | `POST /api/v1/portfolio/{id}/evidence` (.exe) | 422 | Denied: `INVALID_MIME_TYPE` | **PASS** |
| `EVID-004` | Oversize Boundary Validation | `e2e.student.01` | `POST /api/v1/portfolio/{id}/evidence` (>10MB) | 422 | Denied: `INVALID_FILE_SIZE` | **PASS** |
| `EVID-005` | Direct Client Storage Write Denial | Anonymous / Client | Direct upload to `student-evidence` | 403 | Denied: private bucket, backend-mediated only | **PASS** |
| `EVID-006` | Own Evidence Access | `e2e.student.01` | `GET /api/v1/portfolio/{id}` | 200 | Returns own achievement + 2 evidence items | **PASS** |
| `EVID-007` | Cross-Student Evidence Access Denial | `e2e.student.02` | `GET /api/v1/portfolio/{studentA_id}` | 403 | Denied: peer boundary enforced | **PASS** |
| `EVID-008` | Anonymous Evidence Access Denial | Anonymous | `GET /api/v1/portfolio/{id}` | 401 | Denied: authentication required | **PASS** |
| `EVID-009` | Unauthorized Personnel Evidence Denial | `e2e.personnel.nonacademic.01`| `POST /api/v1/portfolio/{id}/verify` | 403 | Denied: non-verifier personnel rejected | **PASS** |
| `VER-001` | Correct Verification Queue Routing | `e2e.programcoordinator.01` | `GET /api/v1/program-coordinator/verification-queue` | 200 | BSCS student item appears in BSCS queue | **PASS** |
| `VER-002` | Assigned Coordinator Item Access | `e2e.programcoordinator.01` | `GET /api/v1/portfolio/{id}` | 200 | Coordinator views item & attached evidence | **PASS** |
| `VER-003` | Cross-Program Coordinator Denial | `e2e.personnel.multirole.01` | Attempt view / verify BSCS submission | 403 / Filtered | Denied: `SCOPE_MISMATCH` / filtered | **PASS** |
| `VER-004` | Student Self-Verification Denial | `e2e.student.01` | `POST /api/v1/portfolio/{id}/verify` | 403 | Denied: student cannot self-approve | **PASS** |
| `VER-005` | Program Coordinator Approves Submission | `e2e.programcoordinator.01` | `POST /api/v1/portfolio/{id}/verify` | 200 | Status -> `verified`; `verified_at` stamped | **PASS** |
| `VER-006` | Approved Portfolio Student Visibility | `e2e.student.01` | `GET /api/v1/portfolio/{id}` | 200 | Status -> `verified` visible to student | **PASS** |
| `VER-007` | Student Approval Notification | `e2e.student.01` | Inspect `notifications` table | 200 | `portfolio_verified` notification delivered | **PASS** |
| `VER-008` | Notification Read-At Protection | `e2e.student.01` | `UPDATE notifications SET read_at` | 200 | Read-at timestamp updated; title protected | **PASS** |
| `VER-009` | Rejection Workflow with Remarks | `e2e.programcoordinator.01` | `POST /api/v1/portfolio/{id}/reject` | 200 | Status -> `rejected`; remarks logged | **PASS** |
| `VER-010` | Return for Deficiency Workflow | `e2e.programcoordinator.01` | `POST /api/v1/portfolio/{id}/request-revision` | 200 | Status -> `revision_requested` | **PASS** |
| `VER-011` | Student Addresses Remarks & Resubmits | `e2e.student.01` | `POST /api/v1/portfolio/{id}/resubmit` | 200 | Status -> `submitted`; event `resubmitted` | **PASS** |
| `VER-012` | Coordinator Re-evaluates & Approves | `e2e.programcoordinator.01` | `POST /api/v1/portfolio/{id}/verify` | 200 | Full lifecycle timeline audited in sequence | **PASS** |
| `VER-013` | Duplicate Decision Protection | `e2e.programcoordinator.01` | Re-verify already processed record | 422 | Denied: `ALREADY_PROCESSED` | **PASS** |
| `VER-014` | Unassigned Personnel Approval Denial | `e2e.personnel.academic.01` | `POST /api/v1/portfolio/{id}/verify` | 403 | Denied: unassigned personnel forbidden | **PASS** |
| `RLS-PORT-001` | Cross-Portfolio Isolation | `e2e.student.02` | Direct SQL / API read on Student A | 403 / Filtered | Filtered by RLS & API guard | **PASS** |
| `RLS-PORT-002` | Coordinator Program Filtering | `e2e.programcoordinator.01` | Read out-of-scope program submissions | Filtered | Bounded strictly to assigned program | **PASS** |
| `RLS-PORT-003` | Evidence Cross-User Isolation | `e2e.student.02` | Direct read on Student A evidence | 403 / Filtered | Private evidence isolated to owner & verifier | **PASS** |
| `AUD-PORT-001` | Verification Event Audit Trail | Any verifier | Inspect `student_portfolio_verification_events` | 200 | Actions `submitted`, `revision_requested`, `resubmitted`, `verified`, `rejected` persisted | **PASS** |
| `AUD-PORT-002` | Evidence Orphan Audit | System | Verify orphan evidence records | 200 | Exactly 0 orphan evidence rows | **PASS** |

---

### 4.5 HR & OSAD Governance Workflows (`HR` / `OSAD` / `DEAN`)
| Scenario ID | Scenario Name | Actor | Action / Operation | Expected HTTP | Expected Outcome | Execution Status |
|---|---|---|---|:---:|---|:---:|
| `HR-001` | HR Provisions Personnel Profile | `e2e.hr.01` | `POST /api/v1/hr/personnel` | 201 | Creates Auth + profile + base role | Queued for Step 6 |
| `HR-002` | HR Assigns Dean Role | `e2e.hr.01` | `POST /api/v1/hr/personnel/{id}/dean-role` | 201 | Creates active `dean_assignments` | Queued for Step 6 |
| `HR-003` | HR Blocked from OSAD Roles | `e2e.hr.01` | Attempt assign `program_coordinator` | 403 | Forbidden: OSAD authority domain | Queued for Step 6 |
| `OSAD-001` | OSAD Assigns Program Coordinator | `e2e.osad.01` | `POST /api/v1/osad/program-coordinators` | 201 | Creates `program_coordinator_assignments` | Queued for Step 6 |
| `OSAD-002` | OSAD Assigns Organization Moderator | `e2e.osad.01` | `POST /api/v1/osad/organization-moderators` | 201 | Creates `organization_moderator_assignments` | Queued for Step 6 |
| `OSAD-003` | OSAD Updates Award Candidate Threshold | `e2e.osad.01` | `PATCH /api/v1/osad/awards/{id}/candidate-threshold` | 200 | Executes definer function with verified actor | Queued for Step 6 |
| `DEAN-001` | Dean Views College Faculty Directory | `e2e.dean.01` | `GET /api/v1/dean/college-faculty` | 200 | Returns faculty affiliated with `CET` | Queued for Step 6 |
| `DEAN-002` | Dean Cross-College Access Blocked | `e2e.dean.01` | Attempt view `CBA` college data | 403 | Denied: out of assigned college scope | Queued for Step 6 |

---

### 4.6 Security, RLS & Storage Boundaries (`SEC` / `RLS` / `STOR`)
| Scenario ID | Scenario Name | Actor | Action / Operation | Expected HTTP | Expected Outcome | Execution Status |
|---|---|---|---|:---:|---|:---:|
| `RLS-001` | Authenticated Reference Catalog Read | `e2e.student.01` | `SELECT * FROM public.portfolio_categories` | 200 | Allowed: authenticated reference read | **PASS** |
| `RLS-002` | Anonymous Catalog Read Blocked | Anonymous | `SELECT * FROM public.portfolio_categories` | 401 / 403 | Denied: anonymous access revoked | **PASS** |
| `RLS-003` | Direct Table-Wide Notification Update Blocked | `e2e.student.01` | `UPDATE public.notifications SET title='...'` | 403 | Denied: only `UPDATE (read_at)` permitted | **PASS** |
| `STOR-001` | Storage Bucket Privacy | Anonymous | Direct HTTP GET on storage object | 400 / 404 | Denied: all 6 buckets are private | **PASS** |
| `STOR-002` | Direct Browser Evidence Upload Blocked | Browser token | Direct Supabase Storage upload to evidence | 403 | Denied: backend-mediated upload policy | **PASS** |
| `AUD-001` | Role Assignment Emits Audit Event | `e2e.osad.01` | Assign coordinator role | 201 | Event logged in `role_assignment_events` | **PASS** |

---

## 5. Cleanup Protocol & Data Manifest

| Fixture Type | Target Tables | Cleanup Protocol | Execution Timing |
|---|---|---|---|
| **E2E Auth Users** | `auth.users` | Compensating deletion via admin API | Post-test suite run |
| **E2E Profiles** | `public.profiles`, `public.student_profiles`, `public.personnel_profiles` | Cascaded on Auth delete or direct test cleanup | Post-test suite run |
| **E2E Role Assignments** | `public.profile_roles`, `public.dean_assignments`, `public.program_coordinator_assignments` | Deleted with test profile | Post-test suite run |
| **Temporary Evidence Files** | Storage bucket objects | Removed via Supabase Storage API | Post-test suite run |
| **Permanent Reference Data** | `portfolio_categories`, `portfolio_subcategories`, `administrative_units`, `roles` | **PRESERVED UNTOUCHED** | Invariant / Never deleted |

---

## 6. Permanent Data Invariants (Must Remain Unaltered)
- **Portfolio Categories**: `9` (`583584598d4b4c28b4e582d32ec1a100534d22bb2141508bb04ed072659e4ba4`)
- **Portfolio Subcategories**: `57` (`8b1827605f23ecc5e29e7b60ecb243966a86002739de99c9ba89ba097c8e4037`)
- **Administrative Units**: `19` (`b79592f8e1e0b83ed0521abe0db98c739337187fb40bf89130a80b7f81d98f44`)
- **Roles**: `7` (`9520d7f67c8c1ba27961130d8403ee4e3c584d4bb0c2d7ad1a23a5224e01e6e7`)
- **Schema Column Definitions**: `18b04cbd894e67d3b8482fa10cc1ffef068ca2d8e2adf65d09d2d20f4316ae7f`
- **RLS Policies**: `98` (`89d4b19315cd5be224f15349710b7cdb3481c12ce9c53a82d1026ec6ac315bfc`)
- **Storage Configuration**: `6` buckets (`9fc3fb2d86cd9378aab75b05864f44f0adbe7c05f1e740dd19c2fef60f0b3ab4`)
- **Storage Policies**: `3` policies (`d43f302c47ce80bb381c55f265d8aa3eac8773188a9262970af793016444d6d5`)
