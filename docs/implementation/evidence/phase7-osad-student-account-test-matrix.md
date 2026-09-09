# AchieveNest — Plan 03 Phase 7 Test Matrix
## OSAD Student Account Management & Student Data Completeness

| ID | Scenario | Layer | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|---|
| REG-01 | Student Accounts page load & render | Frontend UI | Table & toolbar mount without errors | Renders smoothly | PASS | [OSADStudentAccountsPage.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADStudentAccountsPage.jsx) |
| REG-02 | 10-column table projection | Frontend UI | All 10 Phase 2 columns visible | 10 normalized columns rendered | PASS | `OSADStudentAccountPhase6.test.jsx` |
| REG-03 | Sex authoritative source | Backend / DB | `profiles.sex` is sole authority | Verified `profiles.sex` | PASS | `spark audit:plan03-phase7` |
| REG-04 | Legacy null Sex display | Frontend UI | Displays neutral `—` fallback | `—` displayed safely | PASS | `OSADStudentAccountsPage.jsx` |
| REG-05 | Current Year Level display | Frontend / DB | Derived from `student_profiles.year_level` | Zero cache drift | PASS | `spark audit:plan03-phase7` |
| REG-06 | Program source resolution | Backend / DB | Active enrollment -> `academic_programs.name` | 100% resolved | PASS | `spark audit:plan03-phase7` |
| REG-07 | Add Student modal open/close | Frontend UI | Opens on click, closes on ESC/discard | Clean open/close behavior | PASS | `OSADStudentAccountPhase3.test.jsx` |
| REG-08 | Modal dirty-state protection | Frontend UI | Prompts discard confirm dialog if dirty | Confirmed discard dialog | PASS | `OSADStudentAccountPhase3.test.jsx` |
| REG-09 | Valid student provisioning | Full Stack | Creates profile, subtype, enrollment, auth | Full transaction committed | PASS | `spark audit:plan03-phase7` |
| REG-10 | Duplicate institutional ID | Backend API | Rejects with HTTP 409 DUPLICATE_ACCOUNT | 409 response mapped to form | PASS | `TargetProvisioningController.php` |
| REG-11 | Duplicate email | Backend API | Rejects with HTTP 409 DUPLICATE_ACCOUNT | 409 response mapped to form | PASS | `TargetProvisioningController.php` |
| REG-12 | Invalid Sex domain value | Backend API | Rejects with HTTP 422 INVALID_SEX | 422 rejected | PASS | `TargetProvisioningController.php` |
| REG-13 | Invalid Program UUID | Backend API | Rejects with HTTP 422 | 422 rejected | PASS | `TargetProvisioningController.php` |
| REG-14 | Invalid Year Level | Backend API | Rejects with HTTP 422 | 422 rejected | PASS | `TargetProvisioningController.php` |
| REG-15 | Transaction rollback on failure | Backend DB | 0 partial persistence on DB exception | 0 records persisted | PASS | `spark audit:plan03-phase7` |
| REG-16 | External auth compensation | Backend Service | Delete auth user if DB transaction fails | deleteUser invoked | PASS | `TargetProvisioningController.php` |
| REG-17 | Multi-attribute search | Full Stack | Matches Name, ID, Email, Program, College | Substring search verified | PASS | `OSADStudentAccountPhase6.test.jsx` |
| REG-18 | Combined AND filtering | Full Stack | College + Program + Year Level + Sex + Status | Logical AND verified | PASS | `OSADStudentAccountPhase6.test.jsx` |
| REG-19 | Clear all filters | Frontend UI | Resets all dropdowns & search term | Resets cleanly | PASS | `OSADStudentAccountsPage.jsx` |
| REG-20 | Portfolio inspector modal | Frontend UI | Displays student verified records | Modal renders records | PASS | `OSADStudentAccountsPage.jsx` |
| REG-21 | Password reset modal | Frontend UI | Generates temporary password with copy | Modal works & copies | PASS | `OSADStudentAccountsPage.jsx` |
| REG-22 | Duplicate action paths | Frontend UI | 0 redundant or conflicting row paths | 0 duplicates | PASS | `OSADStudentAccountsPage.jsx` |
| REG-23 | Mobile responsive layout | Frontend UI | Responsive card stack under 768px | Cards with full data | PASS | `OSADStudentAccountsPage.jsx` |
| REG-24 | Eager query performance | Backend DB | Single query, 0 N+1, < 50ms execution | 19.22ms for 74 rows | PASS | `spark audit:plan03-phase7` |
| REG-25 | Zero Supabase dependencies | Full Stack | 100% local CodeIgniter/MySQL endpoints | 0 remote calls | PASS | `liveE2EIntegration.test.js` |
