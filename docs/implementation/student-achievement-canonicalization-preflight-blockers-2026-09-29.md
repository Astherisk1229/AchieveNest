# Student Achievement Canonicalization + PaddleOCR Preflight — 2026-09-29

## FINAL_STATUS: PARTIAL — EVIDENCE-DEPENDENT OCR WORK REMAINS BLOCKED

The initial preflight stopped on three independent conditions. The user then
approved the smallest safe recovery path on 2026-09-29. The evidence-independent
backend work described in the implementation update at the end of this report
has now started. OCR extraction policy and frontend rendering remain paused
until representative Student evidence is available.

## CURRENT_ARCHITECTURE_FOUND

### Legacy production path

The active student workflow writes `student_portfolio_records`, stores files in `student_portfolio_evidence`, records decisions in `student_portfolio_verification_events`, and is served by `StudentPortfolioController` plus `VerificationQueueController`.

The current verification queue reads only `student_portfolio_records`. Approval, rejection, and return-for-revision update that legacy record. The student portfolio also reads the legacy shape.

### Phase 2 canonical path

The local database has all Phase 2 migrations through `2026-09-23-000019` applied. The installed domain includes:

- `achievement_contracts`;
- `achievement_records` and `achievement_record_versions`;
- nine student category detail tables;
- canonical evidence tables;
- document-processing and machine-proposal tables;
- canonical verification-event tables;
- duplicate-resolution tables.

However, no live student controller currently creates, updates, submits, or reads these canonical records. `CanonicalStudentAchievementService` resolves contracts and validates categories Student 01 through Student 07 only. Its normalization dispatcher has no Student 08 Socio-Cultural or Student 09 Campus Journalism validation branch.

## CANONICAL_PATH_IMPLEMENTED

Not implemented in this pass. Phase 2 is installed but not activated as the new student write path.

## LEGACY_COMPONENTS_RETAINED

All legacy components remain unchanged. Existing historical records, evidence, verification behavior, and portfolio reads were not disturbed.

## BRIDGE_ARCHITECTURE

No bridge was added. The current verifier controller queries and mutates `student_portfolio_records` directly. Connecting it to Phase 2 without an independently editable legacy duplicate requires a canonical read/decision adapter that does not yet exist.

## DUAL_WRITE_STATUS

No dual write was introduced.

## TRACKER_AUDIT

The authoritative tracker and all nine linked student specifications define 9 categories and 57 subcategories. Phase 2 seeds the same count, but material gaps remain:

1. `achievement_contracts` stores taxonomy identity, display name, version, active state, and legacy taxonomy references only. It does not store field order, grouping, field type, requiredness, options, conditional visibility, help text, or validation metadata.
2. The service contains imperative validators for Student 01–07 but no canonical validator for Student 08 or Student 09.
3. The service exposes physical detail-table columns through `allowedDetailFields()`. Database columns are not a sufficient or safe UI contract because they do not express subtype-specific ordering, requiredness, help, OCR eligibility, or conditional display.
4. The seeded Student 03 display name is `University-Based Service`; the authoritative tracker uses `School / University-Based Service`.

These are material tracker/Phase 2 discrepancies. Creating a frontend schema from table columns would violate the requirement that exact canonical contracts remain authoritative.

## CATEGORY_SOURCE

The intended stable runtime taxonomy source is `achievement_contracts` using its canonical `contract_code`, `category_code`, and `subcategory_code`. It is currently suitable for Category → Subcategory identity and filtering, but not for form rendering.

## FIELD_RENDERING_STRATEGY

Blocked until the backend canonical contract gains an authoritative field-definition projection. The smallest safe missing contract is a read-only Phase 2 schema endpoint that returns, for every active student contract:

- stable field key;
- exact label and order;
- group/section where authoritative;
- input/value type;
- requiredness;
- exact controlled values;
- conditional visibility/requiredness;
- date precision/range rules;
- text/number constraints;
- authoritative help text;
- OCR-suggestion eligibility.

That projection must be derived from one backend-owned contract definition and validated against the domain validator; it must not be another hardcoded frontend registry.

## PREVIOUS_OCR_ARCHITECTURE

The existing OCR pipeline is personnel-only. It uses Poppler for PDF handling and Tesseract for recognition, then frontend deterministic parsing plus prohibited category classification. Student accounts are not authorized to use the existing endpoints.

This path was not changed, so personnel OCR is not regressed.

## PADDLEOCR_ARCHITECTURE

### Proven runtime state

- WAMP/PHP CLI: PHP 8.5.5.
- No system `python` command exists.
- The Windows `py` launcher exists but reports no installed Python runtimes.
- No system `pip` or `pip3` command exists.
- Codex has a private bundled Python 3.12.14, but that is an agent runtime and is not an AchieveNest deployment dependency.
- `paddleocr` is not installed in the available bundled runtime.
- `paddle` / PaddlePaddle is not installed.
- The repository contains no Python dependency manifest or deployment/startup contract for a student OCR worker.

Selecting and installing a supported Python version, PaddlePaddle/PaddleOCR versions, CPU build, dependency location, WAMP service identity, startup model, permissions, and deployment/update procedure is therefore a significant infrastructure decision. The brief explicitly requires stopping in this condition.

No GPU assumption was made.

## PDF_PROCESSING

Poppler's `pdftoppm` is available only inside Codex's private dependency runtime. The repository's configured Poppler paths target a separate `C:\Tools` installation that was not found on `PATH` during the preflight. No deployment-safe PDF rasterization dependency was therefore proven.

No page policy was selected because the representative Student evidence folder contains no files from which single-page/multi-page behavior can be audited.

## SUPPORTED_FORMATS

Not verified for the new student PaddleOCR path. The required JPG/JPEG/PNG/PDF runtime tests cannot be executed until PaddleOCR and representative samples are available.

## LANGUAGE_SUPPORT

Not claimed. The supplied representative Student evidence folder is empty, so actual evidence languages cannot be established or matched to a real PaddleOCR model configuration.

## OCR_SAMPLE_VALIDATION

The supplied Drive root contains `Personnel` and `Student` folders. Listing the supplied `Student` folder returned zero files. Consequently, the required real/sanitized certificate audit, layout analysis, multilingual audit, quality/orientation audit, PDF-page policy, recurring-label audit, and measured OCR performance tests cannot be performed.

This is a direct blocker because the brief forbids designing the extraction architecture only from fabricated certificates and requires real representative-flow verification.

## COMMON_OCR_FIELDS

Not selected. The tracker permits different OCR-suggested fields in different contracts, but there is no proven field that is universal across all 57 subcategories. Without representative Student documents, promoting title, recipient, organizer, date, venue, or any other candidate into a shared Basic Information section would be a guess.

## DETERMINISTIC_EXTRACTION

Not implemented. Exact label, regular-expression, layout-proximity, and rule-based candidate-ranking rules must be derived and tested against representative documents after the sample set is populated.

## OCR_CONFIDENCE_FALLBACK

The required target remains: uncertain or unresolved values stay blank; student-entered corrections are authoritative; OCR cannot choose Category or Subcategory; technical OCR failure falls back to manual entry. No runtime path was added in this pass.

## RAW_OCR_PERSISTENCE

No new raw OCR storage was introduced. The existing Phase 2 document-processing schema is capable of referencing runs and machine proposals, but using it for permanent transcriptions would require an explicit retention/access decision. The preferred implementation remains temporary raw OCR output with only student-reviewed canonical values persisted.

## SAVE_DRAFT

The legacy draft path remains unchanged. Canonical Phase 2 draft creation/reload is not wired to an API. No legacy record was made authoritative for new canonical drafts.

## PROGRAM_COORDINATOR_ROUTING_SOURCE

The existing authoritative relationship is proven:

1. Student → current program: `student_program_enrollments.student_profile_id`, filtered by `is_active = 1`, yielding `academic_program_id`.
2. Program → coordinator: `program_coordinator_assignments.academic_program_id`, filtered by `is_active = 1`, yielding `personnel_profile_id`.
3. Coordinator actor scopes are built server-side by `AuthenticatedActorService` from `program_coordinator_assignments` as `role_key = program_coordinator`, `scope_type = academic_program`, and `scope_id = academic_program_id`.
4. `StudentPortfolioPolicy` compares the student's active program with the authenticated coordinator's active program scopes for queue filtering and authorization.

The database has a unique active-coordinator-per-program rule. Frontend selection is not part of the routing source.

## SUBMISSION_ROUTING_RESULT

Not tested for canonical records because no canonical submission endpoint or verification projection exists.

The legacy path does not resolve a specific coordinator at submit time. It changes the record to `submitted`; queue visibility is later derived from active student enrollment and coordinator assignment. The Phase 2 bridge must preserve this server-side relationship while adding explicit recoverable handling for a missing coordinator.

## AUTHORIZATION_RESULT

Current legacy authorization is server-side and program-scoped. The canonical equivalent is not implemented or tested.

## MISSING_COORDINATOR_BEHAVIOR

The current legacy submit path does not reject or specially mark a submission when no active coordinator is assigned. The record can enter `submitted` while no Program Coordinator can see it; OSAD can still see all submitted items. This does not satisfy the requested explicit recoverable routing behavior and must be designed in the canonical lifecycle rather than silently copied.

## VERIFICATION_INTEGRATION

Blocked pending a canonical queue/read projection and canonical decision service. The live controller cannot be pointed at canonical data without defining how category names, subtype fields, evidence, version lineage, return/revision, and current verification events are projected.

## PORTFOLIO_INTEGRATION

Blocked pending a canonical verified-record read projection. Existing historical legacy achievements should remain unchanged and be unioned/read compatibly; they should not be destructively backfilled as part of this task.

## HISTORICAL_DATA_STRATEGY

Leave historical legacy records intact. Future implementation should use a compatibility read that combines historical legacy verified records with new canonical verified records, clearly tagged by source internally. No legacy row should be created as an independently editable copy of a canonical achievement.

## TEST_RESULTS

Read-only checks completed:

- Exact audit report read in full.
- Repository and relevant Phase 2 migrations/services/controllers inspected.
- Drive root and Student representative-evidence folder listed.
- Python/PaddleOCR/PaddlePaddle availability checked.
- Poppler/Tesseract configuration and existing process boundary inspected.
- CodeIgniter migration status checked; Phase 2 migrations are applied.
- Existing coordinator relationship and authorization policy traced.
- Worktree status checked to preserve extensive pre-existing user changes.

No backend, frontend, OCR, persistence, or browser tests were run because implementation correctly stopped during preflight.

## BUILD_RESULT

Not run; no application code changed.

## BROWSER_VERIFICATION

Not run; the required PaddleOCR runtime, representative evidence, canonical field schema, and canonical verification bridge are unresolved.

## END_TO_END_RESULT

Not proven. Student submission → coordinator verification → approved portfolio visibility remains blocked before implementation.

## SMALLEST SAFE UNBLOCKING ACTIONS

1. Populate or share access to the supplied Drive `Student` folder with representative sanitized JPG/JPEG/PNG/PDF evidence, including any real multilingual and multi-page cases that must be supported.
2. Approve a deployment-owned CPU Python runtime for WAMP and supported PaddlePaddle/PaddleOCR versions, including where the environment lives and how PHP invokes it. A backend-controlled CLI adapter is the smallest likely fit because the repository already uses safe `proc_open(..., ['bypass_shell' => true])`; this remains a proposal until the runtime is approved and measured.
3. Approve completing the backend canonical field-definition contract for all 57 subcategories and adding missing Student 08/09 validators before frontend rendering.
4. Define the canonical missing-coordinator lifecycle state or recoverable submission response. It must not falsely report successful routing or fall back to another verifier role.
5. After those inputs are available, implement and prove one canonical vertical slice before broad UI work.

## REMAINING_LIMITATIONS / RISKS

- PaddleOCR version compatibility and CPU performance are unknown without a real deployment runtime.
- Actual evidence languages, quality, orientation, and PDF page patterns are unknown because the Student sample folder is empty.
- The exact common OCR-assisted field set cannot be selected without guessing.
- Canonical field-schema metadata and two category validators are incomplete.
- The current verification/portfolio controllers are legacy-table-specific.
- Missing-coordinator behavior currently allows a submitted record with no coordinator-visible task.
- The worktree contains many unrelated modified and untracked files; future implementation must continue to isolate its diff.

## RECOVERY IMPLEMENTATION UPDATE — 2026-09-29

This section supersedes earlier statements that no implementation or tests were
performed.

### Canonical form contract

- Added a backend-owned `StudentAchievementFormSchemaRegistry` covering all 9
  Student categories and all 57 canonical contracts.
- Exposed authenticated read-only endpoints at
  `GET /api/v1/student/achievement-schema` and
  `GET /api/v1/student/achievement-schema/{contractCode}`.
- The registry owns field order, renderer control type, requiredness,
  controlled values, conditional rules, composite payload keys, and date/range
  rules. OCR eligibility is explicitly marked
  `pending_representative_evidence_audit`; no common OCR field list was guessed.
- Added the missing Student 08 and Student 09 canonical validators.
- Corrected `S03-UNIVERSITY_BASED_SERVICE` to the tracker-authoritative display
  name `School / University-Based Service` in both the seed and Phase 2
  migration `000020`.

### PaddleOCR runtime boundary

- Provisioned an application-owned, CPU-only runtime under
  `backend/.runtime/python` using Python 3.12.10, PaddlePaddle 3.3.0, and
  PaddleOCR 3.7.0.
- Added reproducible setup and locked dependencies under `backend/ocr/`.
- Added a deterministic JSON health boundary. Extraction remains deliberately
  disabled with blocker code
  `REPRESENTATIVE_STUDENT_EVIDENCE_AUDIT_PENDING`.
- No Codex-private Python or GPU dependency is used.

### `routing_pending`

- Phase 2 migration `000021` adds `routing_pending` to the canonical version
  lifecycle.
- A single `student_achievement_verification_routes` row per record version is
  the idempotent queue identity; it cannot duplicate on retry.
- `student_achievement_routing_events` preserves append-only routing history.
- `StudentAchievementRoutingService` resolves only the authoritative active
  Student enrollment, active academic program, active coordinator assignment,
  and active coordinator profile. Missing or ambiguous relationships persist
  the canonical version as `routing_pending` without a coordinator.
- Coordinator assignment now explicitly reconciles pending canonical routes for
  that program. A successfully reconciled version becomes `submitted`; repeated
  reconciliation is idempotent.

### Verification performed

- Phase 2 migrations `000020` and `000021` applied successfully.
- PaddleOCR health contract verified: Python 3.12.10, PaddlePaddle 3.3.0,
  PaddleOCR 3.7.0, CPU, CUDA disabled, extraction disabled.
- Canonical schema and Student 08/09/routing focused suite: 149 tests,
  575 assertions, all passing.
- The routing integration test proves pending persistence, later authorized
  routing, one route identity, preserved audit transitions, and idempotent retry.
- A broad unnamespaced `php spark migrate --all` remains unsafe in this MySQL
  environment because an unrelated legacy/default migration contains
  PostgreSQL-only `CREATE EXTENSION pgcrypto`. Phase 2 namespace migration is
  the established working path and succeeded.

### Deliberately not started

- OCR field mappings, language/model selection, PDF page policy, confidence
  thresholds, and performance limits.
- PaddleOCR extraction execution and frontend automatic OCR wiring.
- The dynamic frontend renderer and redesigned submission UI.
- Final canonical verification/portfolio read adapters and end-to-end browser
  proof.

Those items remain gated by the representative Student evidence set and, for
the UI, by completion of the canonical submission/read adapters. No parallel
frontend schema or guessed OCR behavior was introduced.
