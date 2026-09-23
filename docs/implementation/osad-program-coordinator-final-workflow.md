# AchieveNest — Academic Program & Program Coordinator Coverage
## Final Workflow Specification

---

### 1. Workflow Architecture Overview

The finalized workflow consolidates all Academic Program and Coordinator Coverage interactions into two distinct, harmonized workspaces within the OSAD portal:

```text
                                [ OSAD Dashboard ]
                                        │
                   ┌────────────────────┴────────────────────┐
                   ▼                                         ▼
       [ Academic Programs Tab ]                 [ Coordinator Coverage Workspace ]
       (Curriculum Master Data)                  (Personnel-to-Program Assignments)
                   │                                         │
        ┌──────────┴──────────┐                   ┌──────────┴──────────┐
        ▼                     ▼                   ▼                     ▼
 [Create Program]      [Edit Program]     [Search Personnel]    [Manage Programs Modal]
  (Master Data)         (Master Data)     (HR Affiliated)       (Multi-Select Diff)
                                                  │                     │
                                                  ▼                     ▼
                                          [Atomic Updates]      [Audit/History Logs]
```

---

### 2. Academic Program Management Workflows

#### 2.1 Program Creation
1. OSAD Administrator navigates to `/osad/dashboard?tab=academic-programs`.
2. Clicks `Create Academic Program` or `Add Program` under a specific College.
3. Form fields: Parent College, Program Code (acronym), Degree Title, Degree Level.
4. Submits payload to `POST /api/v1/osad/academic-programs`.
5. **Outcome**: Program is stored in `academic_programs` with status `active`. It immediately appears in the programs list with coverage status `Needs Coordinator`. No coordinator is required or assigned during creation.

#### 2.2 Program Master Data Editing
1. Administrator clicks `Edit` on any academic program row in `OSADCollegeDetailsView`.
2. Form fields: Program Code, Degree Title, Degree Level, Status (`active`, `inactive`, `archived`).
3. Submits payload to `PUT /api/v1/osad/academic-programs/{id}`.
4. Includes `useConfirmableClose` discard confirmation dialog.
5. **Outcome**: Master data is updated. Coordinator coverage, active assignments, and tenure history remain 100% untouched.

---

### 3. Canonical Coordinator Coverage Workflows

#### 3.1 Coordinator Directory & Live Search
1. In `OSADCollegeDetailsView`, administrator clicks `Manage Program Coordinators`.
2. Navigates to `OSADCoordinatorManagerView`, scoped to the parent College.
3. System lists all active personnel who have HR affiliations (`personnel_program_affiliations`) to programs in this college.
4. Search bar provides real-time filtering by personnel name, institutional email, or coordinating program acronym (e.g. `BSCS`).

#### 3.2 Multi-Program Assignment & Diff Updates
1. Administrator clicks `Manage Programs` on a personnel row.
2. `ManagePersonnelProgramsModal` opens, querying eligible programs via `GET /api/v1/osad/colleges/{id}/coordinator-personnel/{profileId}`.
3. Administrator checks/unchecks eligible programs:
   - Newly checked programs are scheduled for activation.
   - Unchecked programs are scheduled for soft-deactivation.
   - Unchanged programs remain active.
4. Administrator clicks `Save Assignments`.
5. Client sends `{ program_ids: [...] }` to `PUT /api/v1/osad/colleges/{id}/coordinator-personnel/{profileId}`.
6. Backend computes relational diff inside a database transaction:
   - Inserts new active rows for additions.
   - Updates removed rows with `is_active = 0` and `effective_until = CURRENT_DATE`.
7. UI updates immediately upon completion.

#### 3.3 Reassignment
1. If an administrator checks a program currently assigned to another coordinator:
   - System prompts confirmation or executes atomic reassignment.
   - Dedicated endpoint `POST /api/v1/osad/colleges/{id}/reassign-coordinator` accepts `{ program_id, new_coordinator_profile_id }`.
   - Previous coordinator's tenure is soft-closed (`is_active = 0`, `effective_until = CURRENT_DATE`).
   - New coordinator's tenure is activated (`is_active = 1`, `effective_from = CURRENT_DATE`).
   - Historical records are preserved; program coverage updates to the new coordinator.

#### 3.4 Removal / Unassignment
1. Administrator unchecks the program in `ManagePersonnelProgramsModal` and saves.
2. Target row is soft-deactivated (`is_active = 0`, `effective_until = CURRENT_DATE`).
3. Program coverage status reverts to `Needs Coordinator`.
4. Prior tenure row remains queryable in the database.

---

### 4. Contextual Shortcuts from Program Rows

- In `OSADCollegeDetailsView`, each program row features an `Assign` / `Reassign` action button.
- Clicking this button serves as a direct contextual shortcut into `OSADCoordinatorManagerView`.
- Duplicate, separate inline mutation hooks have been eliminated. All coverage updates flow through the single canonical coordinator management workflow.
