# OSAD Administration Section — Refined Implementation Plan

## Status

**Status:** Proposed  
**Module:** OSAD Administration  
**Primary route:** /osad/dashboard  
**Design system:** Premium Utilitarian Minimalism

## 1. Objective

Refine the OSAD Administration dashboard into a clear operational workspace that prioritizes OSAD’s approved responsibilities:

- create and maintain Colleges;
- create Departments under Colleges;
- create Degree Programs under Departments;
- manage Student accounts and Program enrollment;
- assign one Program Coordinator to a Department;
- create and manage Student Organizations;
- assign one Organization Moderator to an Organization;
- manage supported Student awards and reports; and
- review OSAD-scoped activity logs.

The dashboard should summarize current operational state and provide direct access to these workflows without claiming unsupported institutional readiness, automated intelligence, or security capabilities.

## 2. Correct Ownership Model

| Function | Owner | OSAD dashboard behavior |
| :--- | :--- | :--- |
| Create College | OSAD | Create and manage. |
| Create Department under College | OSAD | Create and manage. |
| Create Degree Program under Department | OSAD | Create and manage. |
| Create and place Student account | OSAD | Create, import, assign to Program. |
| Assign Program Coordinator | OSAD | Assign eligible Personnel to a Department. |
| Create Student Organization | OSAD | Create and link to Program, Department, College, or University scope as approved. |
| Assign Organization Moderator | OSAD | Assign eligible Personnel to an Organization. |
| Designate College Dean | HR | View only if needed; remove OSAD assignment action. |
| Assign Department Secretary | HR | View only if needed; remove OSAD assignment action. |
| Manage Personnel account | HR | OSAD consumes an eligible read-only Personnel list for assignments. |

Organization Moderators manage events, attendance, and certificate generation. They do not verify Student achievements.

Program Coordinators are assigned to Departments and verify Student achievements from Degree Programs under those Departments.

## 3. Current-State Findings

The current implementation needs both workflow and presentation corrections:

1. OSADDashboardPage includes a Dean assignment branch even though Dean designation belongs to HR.
2. Program Coordinator wording implies Program-level assignment, while the approved scope is Department-level.
3. The command center prioritizes Account Governance, Awards, Reports, and Security Logs but does not expose Academic Structure or Organizations as primary quick actions.
4. The hero describes an executive command center rather than the concrete OSAD operational workspace.
5. Director name, KPI values, award data, achievement distribution, and 97.8% accreditation readiness are hard-coded.
6. The accreditation score has no defined formula, source, freshness timestamp, or owner.
7. Account and Role Governance is too broad because OSAD does not control Personnel leadership roles.
8. System Security Logs and binary magic-byte auditing may overstate OSAD authority and existing implementation.
9. Create Department currently accepts comma-separated Programs in one field, which weakens the College → Department → Program hierarchy.
10. Existing modal state and creation logic live inside OSADDashboardPage rather than dedicated models, controllers, hooks, and modal components.
11. rounded-2xl, rounded-3xl, rounded-full, saturated hero surfaces, and strong shadows conflict with the referenced design system.

## 4. User Review Required

> [!IMPORTANT]
> Confirm these product decisions before implementation:
>
> 1. **Dashboard priority:** Academic Structure, Students, Organizations, and Assignments are the four primary operational areas.
> 2. **Coordinator scope:** One Program Coordinator is assigned to one Department, covering its Programs.
> 3. **Dean and Secretary:** OSAD cannot assign either role.
> 4. **Accreditation readiness:** Remove the percentage until a documented calculation and trusted data source exist, or label it Demo data.
> 5. **Awards:** Confirm whether OSAD owns award-category configuration and candidate confirmation.
> 6. **Reports:** Confirm which PACUCOA, CHED, and OSAD reports are actually generated rather than mocked.
> 7. **Logs:** Limit OSAD logs to OSAD actions unless a broader security permission is explicitly approved.
> 8. **Organization linkage:** Confirm allowed scopes: Program, Department, College, and University-wide.

## 5. Recommended Dashboard Information Architecture

### 5.1 Header

Use a restrained operational header:

- title: OSAD Administration;
- authenticated OSAD user name and role;
- academic year or data period when available;
- short description of Student and academic-structure governance;
- optional setup-readiness summary derived from actual configuration.

Do not hard-code Director Marcus Vance as every OSAD user.

Replace broad executive language with plain operational language.

### 5.2 Readiness Summary

Recommended derived measures:

- Colleges configured;
- Departments configured;
- Degree Programs configured;
- active Students;
- Departments with assigned Program Coordinator;
- active Organizations;
- Organizations with assigned Moderator;
- incomplete configuration count.

A useful readiness measure is:

    configured required assignments / total required assignments

Only show a percentage when:

- numerator and denominator are defined;
- data is current;
- scope is visible;
- zero-denominator behavior is handled; and
- the label does not imply formal accreditation certification.

Recommended label:

    Operational Setup Coverage

Do not label this PACUCOA or CHED Ready without an approved accreditation formula.

### 5.3 Primary Quick Actions

Use four primary cards:

1. Academic Structure
   - Colleges, Departments, and Degree Programs
   - tab: departments or structure

2. Student Accounts and Enrollment
   - Student account management and Program placement
   - tab: accounts

3. Organizations and Moderators
   - Organization structure, membership scope, and Moderator assignment
   - tab: organizations

4. Department Coordinators
   - assign eligible Personnel as Department Program Coordinator
   - tab: departments or assignments

Secondary links:

- Award Categories;
- Identify Awardees;
- Reports;
- OSAD Activity Logs.

This hierarchy prevents optional reporting features from outranking foundational setup.

## 6. Academic Structure Workflow

Replace comma-separated Program creation with separate entities and controlled dependencies:

    Create College
      → Create Department under College
      → Create Degree Program under Department

Required rules:

- stable IDs for College, Department, and Program;
- unique code within the relevant scope;
- parent selection from existing records;
- normalized names and codes;
- no Program without a Department;
- no Department without a College;
- archive rather than delete when referenced;
- prevent parent reassignment without impact confirmation;
- preserve historical references.

Recommended UI:

- hierarchical tree or grouped table;
- separate Create College, Create Department, and Create Program modals;
- readiness indicators for missing coordinator assignments;
- search and filtering for larger structures.

## 7. Personnel Assignment Workflows

### Program Coordinator

Assignment target:

    Department

Selection source:

- read-only eligible Personnel list managed by HR.

Validation:

- Personnel account exists and is active;
- Department exists;
- Personnel is eligible under stakeholder policy;
- only one active Coordinator per Department in current scope;
- effective date is stored if supported;
- reassignment requires confirmation.

UI wording:

    Assign Program Coordinator to Department

Do not use wording that suggests one Coordinator is assigned independently to every Program.

### Organization Moderator

Assignment target:

    Organization

Validation:

- Organization exists and is active;
- Personnel account exists and is active;
- only one active Moderator per Organization in current scope;
- Organization scope and parent linkage are valid.

### Remove Dean Assignment

Remove or disable the roleType = dean branch from OSADDashboardPage and any OSAD selector triggers.

If OSAD needs visibility:

- show the HR-designated Dean as read-only;
- identify HR as the owner; and
- provide no OSAD mutation control.

## 8. Metrics and Analytics

All dashboard values must be derived from useOSAD/controller data or explicitly labeled as demonstration data.

### Student and Organization KPIs

Recommended:

- active Students;
- Students with valid Program placement;
- active Organizations;
- assignments requiring attention.

Avoid mixing operational counts with rankings and accreditation claims in one KPI strip.

### Achievement Distribution

If retained:

- derive counts from verified Student achievements;
- specify reporting period;
- calculate percentages from the same filtered total;
- handle no-data state;
- display exact count and percentage;
- use a simple bar or compact table;
- keep 4px indicators;
- do not hard-code College values.

### Awardees

If retained:

- display only confirmed awardees;
- show confirmation date;
- show award category;
- show Student Program and Department;
- calculate rank from the approved award method;
- do not label the process automated unless the algorithm is implemented and reviewed;
- provide an empty state.

## 9. Reports and Logs

### Accreditation Reports

For each export, define:

- report name;
- data source;
- reporting period;
- included fields;
- format;
- authorization;
- generation status;
- failure behavior.

Do not claim PDF or CSV generation unless the file is actually produced and verified.

### OSAD Activity Logs

Recommended scope:

- College, Department, and Program creation or update;
- Student account creation and placement;
- Program Coordinator assignment;
- Organization creation;
- Moderator assignment;
- award-category changes;
- awardee confirmation;
- report export.

System-wide security monitoring, file binary inspection, and Personnel security events require separate permission and should not be implied by a general OSAD log page.

## 10. Architecture and Change Manifest

| Change | File | Purpose |
| :--- | :--- | :--- |
| MODIFY | src/pages/osad-admin/OSADCommandCenterPage.jsx | Replace hard-coded executive claims with operational summary and corrected quick actions. |
| MODIFY | src/pages/osad-admin/OSADDashboardPage.jsx | Remove Dean mutation, simplify orchestration, and route modal actions. |
| MODIFY | src/pages/osad-admin/OSADDepartmentsProgramsPage.jsx | Render College → Department → Program hierarchy and Department Coordinator assignment. |
| MODIFY | src/pages/osad-admin/OSADStudentOrganizationsPage.jsx | Validate Organization scope and Moderator assignment. |
| MODIFY | src/pages/osad-admin/OSADStudentGovernancePage.jsx | Show Student account and Program-placement readiness. |
| VERIFY | src/pages/osad-admin/OSADAwardCategoriesPage.jsx | Confirm award ownership and supported configuration. |
| VERIFY | src/pages/osad-admin/OSADIdentifyAwardeesPage.jsx | Confirm ranking and confirmation behavior. |
| VERIFY | src/pages/osad-admin/OSADAccreditationReportsPage.jsx | Confirm real report generation and terminology. |
| MODIFY | src/pages/osad-admin/OSADSystemAuditLogsPage.jsx | Limit labels and data to approved OSAD event scope. |
| MODIFY | src/pages/osad-admin/modals/PersonnelSelectorModal.jsx | Limit role types to coordinator and moderator for OSAD. |
| MODIFY | src/hooks/useOSAD.js | Expose derived operational metrics and corrected assignment APIs. |
| VERIFY | src/controllers/OSADController.js | Enforce hierarchy and ownership rules. |
| NEW | src/models/AcademicStructureModel.js | Validate College, Department, and Program relationships if no equivalent exists. |
| NEW | src/models/OSADDashboardMetricsModel.js | Derive readiness and KPI values from current records. |
| NEW | src/components/osad/OSADOperationalSummary.jsx | Render derived KPIs and setup coverage. |
| NEW | src/components/osad/OSADQuickActions.jsx | Render corrected primary and secondary actions. |
| NEW | src/pages/osad-admin/modals/CreateCollegeModal.jsx | Create a College. |
| NEW | src/pages/osad-admin/modals/CreateDepartmentModal.jsx | Create a Department under a College. |
| NEW | src/pages/osad-admin/modals/CreateProgramModal.jsx | Create a Program under a Department. |

Before adding new models, inspect existing OSAD model classes and extend them when appropriate.

## 11. UI Design Rules

### Surfaces

- white or warm off-white page canvas;
- flat cards with one-pixel borders;
- 8px or 12px radius;
- no heavy shadow;
- no gradient;
- avoid large saturated green hero panels.

### Color

Use pastel accents only for meaning:

- pale blue: academic structure;
- pale green: valid or complete assignment;
- pale yellow: incomplete configuration;
- pale red: invalid or blocked state.

Do not introduce a purple category if it is not part of the approved palette.

### Typography

- text-xl or text-2xl for the page title;
- text-sm for card titles and values;
- text-xs for secondary details;
- avoid text smaller than 11px for operational content;
- use plain, specific labels.

### Controls

- cards that navigate must be buttons or links with accessible names;
- visible focus states;
- no large rounded-full containers;
- progress indicators may use rounded ends because they are small status tracks;
- do not add new Lucide icons during this refinement;
- retain existing icons only where they improve scanning.

## 12. Modal Refactoring

Move large inline modal markup out of OSADDashboardPage.

Each modal must provide:

- semantic dialog structure;
- title and description;
- labeled fields;
- validation;
- loading and failure states;
- Cancel and confirmed Submit;
- focus trap;
- Escape handling;
- focus restoration;
- no close-on-backdrop while submitting.

Creation handlers must:

- await controller success;
- close only after confirmed success;
- retain input after failure;
- show a success message only after persistence succeeds.

Do not use raw comma-separated Programs.

## 13. Accessibility

- use semantic headings;
- expose KPI labels and values together;
- avoid color-only status;
- label progress with actual values;
- use role=progressbar where appropriate;
- use aria-current for active tab;
- preserve keyboard access to quick actions;
- announce mutations through aria-live;
- focus the first invalid modal field;
- provide clear no-data and error states;
- ensure text and controls meet contrast requirements.

## 14. Implementation Phases

### Phase 0 — Confirm Scope

- [ ] Confirm the eight user-review decisions.
- [ ] Inventory existing College, Department, Program, Organization, and assignment schemas.
- [ ] Confirm awards, reports, and logs ownership.
- [ ] Identify trusted sources for all displayed metrics.
- [ ] Remove or label unsupported claims.

### Phase 1 — Ownership Corrections

- [ ] Remove OSAD Dean mutation.
- [ ] Confirm no OSAD Department Secretary mutation exists.
- [ ] Change Coordinator assignment target to Department.
- [ ] Keep Moderator assignment target as Organization.
- [ ] Add controller validation and tests.

### Phase 2 — Academic Hierarchy

- [ ] Define or extend AcademicStructureModel.
- [ ] Add College creation.
- [ ] Refactor Department creation to require College.
- [ ] Add Program creation under Department.
- [ ] Replace comma-separated Programs.
- [ ] Add hierarchy and reference-integrity tests.

### Phase 3 — Dashboard Metrics and Actions

- [ ] Create OSADDashboardMetricsModel.
- [ ] Replace hard-coded KPIs.
- [ ] Replace accreditation claim with defined setup coverage or remove it.
- [ ] Prioritize Structure, Students, Organizations, and Coordinators.
- [ ] Move Awards, Reports, and Logs to secondary navigation.

### Phase 4 — Page and Modal Refactoring

- [ ] Extract inline modals.
- [ ] Simplify OSADDashboardPage orchestration.
- [ ] Add async success and failure handling.
- [ ] Add accessibility behavior.
- [ ] Apply 12px radius and flat surfaces.

### Phase 5 — Analytics, Awards, Reports, and Logs

- [ ] Derive achievement distribution.
- [ ] Verify award scoring and confirmation.
- [ ] Verify report generation.
- [ ] Scope logs to approved OSAD events.
- [ ] Add no-data, loading, and failure states.

### Phase 6 — Verification

- [ ] Run production build.
- [ ] Run targeted lint.
- [ ] Test responsive and dark-mode layouts.
- [ ] Complete ownership, hierarchy, assignment, and accessibility tests.

## 15. Automated Verification

Add tests for:

- College → Department → Program relationships;
- invalid or missing parents;
- duplicate codes;
- referenced-record archival;
- Coordinator assignment to Department;
- Moderator assignment to Organization;
- rejection of Dean and Secretary mutation in OSAD;
- eligible Personnel validation;
- derived KPI calculations;
- zero-data readiness;
- achievement percentages;
- tab query handling;
- modal success and failure;
- OSAD log scope.

Run separately:

    npm run build
    npm run lint

The Vite build command does not run linting.

## 16. Manual Acceptance Tests

1. Create a College.
2. Create a Department under that College.
3. Create a Program under that Department.
4. Verify invalid parent relationships are blocked.
5. Assign a Program Coordinator to a Department.
6. Create an Organization and assign its Moderator.
7. Confirm no Dean or Department Secretary assignment action appears.
8. Confirm Student placement uses Program records from the hierarchy.
9. Confirm dashboard metrics match current records.
10. Confirm zero-data and incomplete-setup states.
11. Open all primary and secondary quick actions.
12. Verify awards and reports do not claim unsupported processing.
13. Confirm OSAD logs contain only approved OSAD events.
14. Test dark mode, narrow widths, keyboard access, modal focus, and error recovery.

## 17. Acceptance Criteria

- OSAD creates and manages Colleges, Departments, and Programs as separate linked entities.
- Program Coordinators are assigned by OSAD to Departments.
- Organization Moderators are assigned by OSAD to Organizations.
- OSAD cannot designate College Deans or Department Secretaries.
- Student Program placement follows the academic hierarchy.
- Primary quick actions reflect foundational OSAD responsibilities.
- Dashboard metrics are derived or explicitly labeled as demo data.
- No unsupported accreditation or enterprise-security claim is presented as fact.
- Modal operations close only after confirmed success.
- UI follows 12px radius, flat-border, low-shadow constraints.
- Existing supported awards, reports, and logs remain functional.
- The production build succeeds and modified files introduce no new lint errors.

## 18. Future Backend Phase

Move institutional structure and assignments to authenticated backend services with:

- stable database IDs;
- referential integrity;
- effective dates;
- archive and restore;
- assignment history;
- authorization;
- audit events;
- server-side metrics;
- conflict handling;
- bulk import validation.
