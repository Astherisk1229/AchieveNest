# Phase 6 Evidence: Full Regression Test Matrix

## Execution Timestamp
2026-09-01T11:27:30+08:00
Database: `achievenest_local`

---

## Comprehensive Regression Test Matrix

| ID | Scenario | Layer | Expected Result | Actual Result | Status | Evidence / Test Reference |
|---|---|---|---|---|---|---|
| REG-01 | Create Program without coordinator | Frontend & API | Program created; starts Unassigned | Program created with status Active; coverage = Unassigned | PASS | `PROG-001`, `CreateProgramModal.test.jsx` |
| REG-02 | Edit Program master data | Frontend & API | Master data updated; coordinator fields decoupled | Name/level/status updated; 0 coverage rows mutated | PASS | `PROG-002`, `ISOL-001`, `EditProgramModal` |
| REG-03 | Assign one coordinator to one program | API & Service | Program assigned; active row inserted | 1 active assignment row created with `effective_from` | PASS | `DIFF-001`, `BATCH-001` |
| REG-04 | Assign one coordinator to multiple programs | API & Service | Multiple programs assigned to single personnel | Relational rows created; 1:N coordinator coverage supported | PASS | `BATCH-001`, `DIFF-001` |
| REG-05 | Add another program later | API & Service | Existing assignments preserved; new program added | Diff transaction preserves existing tenure, inserts new row | PASS | `DIFF-002`, `BATCH-002` |
| REG-06 | Remove one program without affecting others | API & Service | Selected program soft-deactivated; other programs remain active | Target program deactivated (`is_active = 0`); others stay `is_active = 1` | PASS | `REM-001`, `DIFF-002` |
| REG-07 | Reassign a program | API & Service | Old coordinator deactivated; new coordinator active | Previous tenure closed with `effective_until`; new active row created | PASS | `REAS-001`, `HIST-003` |
| REG-08 | Duplicate assignment attempt | API & DB | Idempotent / rejected safely; no duplicate active row | Zero duplicate rows created; unique constraint enforced | PASS | `BATCH-002`, `CARD-002` |
| REG-09 | Assign program owned by another coordinator | API & Service | Rejection with conflict message; no silent overwrite | HTTP 422 Conflict returned; database unchanged | PASS | `CONF-001`, `GovernancePolicy` |
| REG-10 | Unauthorized mutation | API & Security | HTTP 403 Forbidden; zero DB changes | Non-OSAD actors blocked by `GovernancePolicy` | PASS | `AUTH-001` |
| REG-11 | Coordinator search & filtering | Frontend | Instant search by name, email, or program code | Matching personnel filtered accurately | PASS | `OSADCoordinatorManagerView` |
| REG-12 | State refresh & persistence | Full Stack | DB state matches UI upon reload | 100% agreement between API and DB | PASS | `AGREE-001`, Live verification |
| REG-13 | Batch rollback on conflict | API & DB | All-or-nothing rollback on invalid item | Transation rolled back; zero partial commits | PASS | `CollegeService::updatePersonnelCoordinatorAssignments` |
| REG-14 | Inactive program assignment | API & Service | Rejected safely | Validation error returned; DB unchanged | PASS | `CollegeService::reassignCoordinator` |
| REG-15 | Invalid coordinator ID | API & Service | Rejected safely | Validation error returned; DB unchanged | PASS | `GOV-002` |
| REG-16 | Invalid program ID | API & Service | Rejected safely | Validation error returned; DB unchanged | PASS | `GOV-001` |
| REG-17 | Loading & Empty states | Frontend | Clear visual loaders & descriptive empty notices | Rendered correctly with no blank screens | PASS | `OSADCollegeDetails.test.jsx` |
| REG-18 | API Error & Retry | Frontend | Error banner with Retry action button | Error caught gracefully; retry button refreshes context | PASS | `OSADCollegeDetailsView.jsx` |
| REG-19 | Input validation & discard dialog | Frontend | Required field checks and dirty close confirmation | `useConfirmableClose` prompts confirmation on dirty form | PASS | `OSADConfirmableClose.test.js` |
| REG-20 | Deprecated route usage | Network / Frontend | 0 calls to deprecated routes in new UI | All calls route through Phase 3 canonical endpoints | PASS | `collegeAdminService.js` audit |
| REG-21 | Accessibility standards | Frontend | WCAG AA contrast, keyboard navigation, focus trap | High-contrast badges, keyboard focusable cards and modals | PASS | `colorContrast.test.js`, JSX audit |
| REG-22 | Responsive behavior | Frontend | Usable layout on desktop, tablet, and mobile | Flex/grid responsive layouts with mobile tap targets | PASS | Tailwind responsive classes audit |
| REG-23 | Production build | Build Tooling | Vite production bundle builds successfully | Built in 4.92s with zero bundle errors | PASS | `npm run build` |
| REG-24 | Automated test suites | CI / CLI | 100% passing across backend and frontend | Backend: 41/41 PASS, Frontend: 20/20 PASS | PASS | `spark verify:*`, `vitest run` |
