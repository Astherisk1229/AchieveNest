# Student Achievement Verification and Portfolio Remediation Report

Date: 2026-09-10
Runtime baseline: local WAMP/MySQL-compatible CodeIgniter API at `http://localhost:8080/api/v1`

## Submit-path trace

| Layer | File | Function | Real backend | Finding / resolution |
|---|---|---|---:|---|
| Modal | `frontend/src/pages/student/modals/AchievementSubmissionModal.jsx` | `handleSave` | Yes, through page callback | Rebuilt as Category → Subcategory → Details → Evidence → Review. It now awaits persistence, stays open on failure, and focuses the first invalid field. |
| Page | `frontend/src/pages/student/StudentAchievementsPage.jsx` | `handleSubmitAchievement` | Yes | Awaits the hook before closing and uses backend-provided taxonomy for filters and entry. |
| Hook | `frontend/src/hooks/useStudentAchievements.js` | `addAchievement`, `updateAchievement`, `resubmitAchievement` | Yes | Root defect fixed: the hook previously inferred submission from evidence count. It now preserves `submit_now`, creates a draft, uploads real evidence, then submits the same UUID. |
| API client | `frontend/src/services/portfolioService.js` | `createRecord`, `addEvidence`, `resubmitRecord` | Yes | Uses authenticated `/portfolio` and protected multipart evidence endpoints. |
| Backend | `backend/app/Controllers/Api/StudentPortfolioController.php` | `create`, `addEvidence`, `resubmitRecord`, `coordinatorQueue`, `decideRecord` | Yes | Validates ownership, taxonomy, metadata, persisted evidence, duplicates, active coordinator routing, protected fields, and state transitions. |
| Database | `student_portfolio_records`, `student_portfolio_evidence`, `student_portfolio_verification_events` | transactional writes | Yes | One UUID is retained through draft, submission, coordinator review, verification, and portfolio display. |
| Coordinator queue | `StudentPortfolioController::coordinatorQueue` and `StudentPortfolioPolicy` | scoped query and `canVerify` | Yes | Queue derives from submitted records and active program assignments; self-verification and cross-program verification are denied. |
| Portfolio | `frontend/src/pages/student/StudentPortfolioPage.jsx` | verified record fetch | Yes | Removed hard-coded achievement/evidence cards. Only backend records with `status=verified` are reflected, using the same UUID and evidence rows. |

## Taxonomy evidence

The live MySQL audit reports 9 active categories and 57 active subcategories. The modal obtains category/subcategory choices from `GET /portfolio/categories`; the local schema registry remains the centralized field resolver for those canonical IDs. No category or subcategory was invented during this remediation.

## Notification independence

The repeated notification 500 was caused by querying a nonexistent MySQL `is_read` column. Read state is stored as `read_at`; the notification controller now uses that column. Submission/decision mutations commit before best-effort notification insertion, so notification failure cannot invalidate the workflow record or queue state.

## Hidden scoring boundary

Student create/update requests reject workflow, verification, ownership, and scoring fields. Student portfolio API results are stripped of score-, point-, ranking-, threshold-, award-, candidate-, and weight-named fields. Verified records remain available to the separate OSAD award engine; pending records score zero in the existing award validation suite.

## Verification results

- Frontend production build: PASS.
- Focused Student frontend tests: 19/19 PASS.
- Phase 13 Step 4 portfolio/evidence/verification E2E suite: 40/40 PASS.
- SA-01 award-routing/scoring gate suite: 15/15 PASS.
- Live taxonomy audit: 9 categories / 57 subcategories.
- Live `GET /notifications` with an authenticated Student: HTTP 200.
- Live Student verified-portfolio response: zero scoring keys.
- PHP syntax checks for both changed controllers: PASS.

## Modal UX refinement

The adaptive Student modal was refined using the local Impeccable skill at `C:\Users\Admin\.codex\skills\impeccable\SKILL.md`. The five-screen wizard was removed in favor of one continuous form: classification appears first, the backend-authoritative subcategory list updates immediately, tailored fields reveal inline, evidence remains in the same scroll surface, and the persistent footer keeps Cancel, Save Draft, and Submit for Verification available. Mobile uses a full-height single-column sheet with safe-area footer padding and 44px interaction targets; desktop uses an 896px working surface with two-column classification and existing responsive field grids.
