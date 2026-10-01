# Student Achievement Submission Audit — 2026-09-29

## Outcome

Implementation is intentionally paused before code changes because the repository contains two incompatible achievement persistence architectures, and the authoritative tracker does not choose between them:

1. The **live student workflow** writes `student_portfolio_records` plus `student_portfolio_evidence`. Existing verification, resubmission, revision, and student portfolio screens consume this model.
2. The **tracker-aligned Phase 2 workflow** defines the 9 categories, 57 subcategories, contracts, versions, category-specific detail tables, evidence, review, and duplicate domains. Its canonical service is not connected to the live student submission, verification, or portfolio routes.

Building the redesigned form against only one side would either preserve the legacy persistence model while duplicating and weakening the tracker contract, or store tracker-correct records that are invisible to the current verification and portfolio flows. That is a material product and data-model decision, not a safe UI-only refactor.

No application code was changed by this audit.

## Authoritative requirements reviewed

The exact master tracker reviewed was [AchieveNest — Student & Personnel Category Input Field Master Tracker](https://docs.google.com/document/d/18X-oumI-n9uNlcURiDxcKZAyJUESW6KWwx9MjOypJUI/edit?usp=drivesdk).

The tracker states that it is the navigation/progress authority and that detailed input requirements live in the linked category specifications. The nine finalized student specifications reviewed were:

| Category | Subcategories | Detailed source |
|---|---:|---|
| Leadership Position | 4 | [Student 01 specification](https://docs.google.com/document/d/1UJn12yq8oq2oeCEZvargeBF5QMYlk5IfDlr28nVn_M8/edit) |
| Organization Membership / Participation | 5 | [Student 02 specification](https://docs.google.com/document/d/1EpQXlLJ3Uk--62COGohVxiBQpiajTe3nDpYMEj0asF4/edit) |
| Community Service / Volunteerism | 5 | [Student 03 specification](https://docs.google.com/document/d/1P68qsdwXWsDrHI4qxhNhk9H_aOZBrx43HPWyPIyxls8/edit) |
| Church / Ministry Involvement | 4 | [Student 04 specification](https://docs.google.com/document/d/1V7-LSf6Z_WhAA2oz9XytRSPnGv-BzUJ4g-OVkhGa-pY/edit) |
| Seminar / Training | 8 | [Student 05 specification](https://docs.google.com/document/d/1jH--91i8WV-Ht1YXnxbPOV-RAQkMaGu_MMtHgfgAiaQ/edit) |
| Citation / Recognition | 8 | [Student 06 specification](https://docs.google.com/document/d/1QJv0fYomjVqqV9q-K7ccddlEsV--kT_DczcscL25q1k/edit) |
| Sports | 10 | [Student 07 specification](https://docs.google.com/document/d/1HFt2HoOY1sQI07aDD-sUKY9nm_anESY8UWtcfLJcR8Q/edit) |
| Socio-Cultural / Performing Arts | 7 | [Student 08 specification](https://docs.google.com/document/d/1x_plkNVnQlt86EbGLSaFVJJ43iPU-K-Cztw4-XRQEqI/edit) |
| Campus Journalism | 6 | [Student 09 specification](https://docs.google.com/document/d/1ASe4axLV2wU6PyD2NwqVSYL_ijv-Z-beCzkJMEXqgJI/edit) |

Total: **9 categories and 57 student subcategories**.

## Tracker-derived field architecture

The detailed specifications do not support one universal title/organizer/date form. They define subtype-specific records and repeatedly prohibit extra student-entered award, scoring, verification, identity, submission, and derived academic-year fields.

| Category | Authoritative field architecture |
|---|---|
| Leadership Position | Governing body/council, official position, one academic year, evidence, notes; Year-Level Leadership additionally uses year level. The tracker explicitly removes semester and position-tier inputs. |
| Organization Membership / Participation | Organization and one academic year for ongoing membership; committee/activity/project variants add only their applicable activity, committee, contribution, responsibility, date, and evidence fields. Controlled activity types and roles are subtype-specific. |
| Community Service / Volunteerism | Service title, applicable institution/organizer/context, conditional partner/location/beneficiary, controlled activity role, date/period, conditional verifiable hours, evidence, notes. Civic Scope belongs only to Community-Based Service. Environmental and People Development use the same settled service fact family without inventing award metadata. |
| Church / Ministry Involvement | Campus, parish/church, and church-organization records support either an ongoing academic-year mode or a distinct-activity date/period mode, with subtype-specific ministry/organization, involvement, role, committee, and activity fields. Initiated Church-Related Activity instead uses initiative title, initiation role, conditional official responsibility, church/ministry context, date/period, evidence, and notes. |
| Seminar / Training | Six-field architecture: Activity Type, Activity / Program Title, Organizer / Issuing Organization, Activity Date / Period, Supporting Evidence, and optional Additional Notes. Academic year is derived after verification, not entered. |
| Citation / Recognition | Shared recognition family: Recognition / Citation Type, subtype-specific conditional Scope / Level, Granting Body, Recognition Date, Recognition Title / Name, Supporting Evidence, and optional Additional Notes. Organization recognition additionally identifies the organization/club. Required and conditional rules remain subtype-specific. |
| Sports | Discipline, conditional custom discipline, event/competition type, conditional custom competition, conditional competition level, participation type, placement/result, event title, organizer, date/period, evidence, notes. |
| Socio-Cultural / Performing Arts | Discipline, conditional custom discipline, event/competition type, conditional custom event, conditional competition level, participation type, placement/result, event title, organizer, date/period, evidence, notes. |
| Campus Journalism | Always: record subtype, publication/outlet, student publication role, evidence. Output records additionally require work title and publication date. Role records require role date/period. Notes are optional. The specification explicitly forbids a student-facing Published/Unpublished toggle. |

The exact option sets, conditional visibility, requiredness, evidence rules, duplicate boundaries, and OCR permissions must remain contract data. They should not be re-invented in the view.

## Current student submission flow

The active route opens `AchievementSubmissionModal.jsx` from `StudentAchievementsPage.jsx` and persists through `useStudentAchievements.js`.

Current create/submit sequence:

1. Create a legacy draft record.
2. Upload one or more evidence files to that record.
3. Resubmit the draft to move it into verification.
4. Reviewers act on the legacy record.
5. Verified legacy records appear in the student portfolio.

This sequence preserves evidence and verification, but the form is taxonomy-first and uses universal `title`, `organizer_or_body`, `start_date`, `end_date`, and `description` inputs before a hardcoded structured-details registry. It is not upload-first and performs no OCR.

Draft behavior is only partially aligned: the UI treats drafts as incomplete work, but the live create endpoint still requires a title and category. A true upload-first draft therefore cannot be represented without changing the live contract.

## OCR audit

OCR exists, but it is not the requested student PaddleOCR flow:

- The frontend OCR service calls the existing OCR endpoints and performs deterministic field post-processing and category classification.
- The backend OCR controller authorizes personnel accounts only. Student accounts cannot use it.
- Persisted OCR reads personnel evidence, not student portfolio evidence.
- The extraction service uses Poppler and Tesseract (`pdftotext`, `pdftoppm`, and Tesseract), not PaddleOCR.
- The current classifier guesses a category from keywords. That behavior is expressly disallowed for the redesigned student flow.
- Current common extraction candidates are title, issuer/organizer, and date. The repository has no authoritative recipient-name extraction or student-field mapping contract.

The safe OCR boundary is: extract document text and evidence-supported candidate facts; show them to the student for correction; never select category/subcategory; and map a confirmed candidate only after manual subtype selection to a field that the selected authoritative contract explicitly permits as OCR-suggested.

## Major discrepancies

| Area | Current implementation | Authoritative requirement / impact |
|---|---|---|
| Flow order | Category and generic fields first; evidence last | Evidence upload and OCR review must precede manual classification. |
| OCR engine | Tesseract/Poppler | Request calls for PaddleOCR; no PaddleOCR dependency or adapter exists. |
| OCR authorization | Personnel only | Student upload cannot invoke OCR. |
| OCR classification | Keyword category guessing exists | Category and subcategory must always be manual. |
| Form schema | Large hardcoded frontend registry | Exact definitions and validation must come from authoritative contracts. |
| Shared fields | Universal title/organizer/date/description | Many subtypes have different facts and modes; this flattens requiredness and invents fields. |
| Academic year | Hardcoded years/default and semester in several flows | Dynamic one-year rule where applicable; many categories derive academic year and forbid manual entry. |
| Leadership | Extra position level, tenure dates, semester | Tracker limits the student-facing field set and explicitly removes those additions. |
| Sports | Generic competition vocabulary | Tracker specifies PRISAA, NDEA, Intramurals / University Meet, and Other Approved Competition boundaries. |
| Journalism | Published/draft toggle | Explicitly forbidden as student-facing. |
| Backend validation | Legacy JSON allowlist and broadly shared requiredness | Does not enforce all 57 subtype contracts or their exact conditional rules. |
| Category naming | Database includes `University-Based Service` | Tracker uses `School / University-Based Service`; stable identifiers and display labels need an explicit migration/crosswalk. |
| Draft creation | Requires title and category | Blocks evidence-first drafts. |
| Canonical Phase 2 | Tracker-aligned model exists but is dormant | New correct records would not reach existing verification/portfolio without a bridge. |

## Persistence architecture conflict

### Live legacy path

`StudentPortfolioController.php`, `PortfolioStructuredMetadataValidator.php`, the student achievements hook, verification actions, and the student portfolio currently operate on `student_portfolio_records`. Structured data is stored as legacy metadata and validated with a global allowlist rather than a complete per-contract schema.

### Dormant tracker-aligned path

The Phase 2 migrations and `Phase2AchievementContractSeeder.php` define the 57 tracker-aligned contracts and category-specific detail tables. `CanonicalStudentAchievementService.php` is not called by the live submission routes. It also needs completion for Socio-Cultural and Campus Journalism validation before it can be the production write path.

The compatibility achievement controller is not a safe bridge: it writes through the legacy portfolio model, can fall back to the first category, and does not implement the required evidence-first draft lifecycle.

## Recommended implementation decision

Use the Phase 2 canonical model as the source of truth and complete its production integration. This avoids copying the tracker into another frontend/backend registry and gives each versioned contract one enforceable schema.

The recommended delivery sequence is:

1. Complete canonical validation for all nine categories and expose a read-only contract endpoint containing exact labels, field types, options, requiredness, conditional rules, OCR permission, and current version.
2. Add an evidence-first canonical draft endpoint that can exist before classification, then attach student evidence securely.
3. Add a PaddleOCR adapter with PDF/image handling. Return raw text plus field candidates and confidence/provenance; do not return a category or subcategory suggestion.
4. Add the explicit bridge/crosswalk from canonical records and versions into the existing verification queue and verified student portfolio read model. Prefer one authoritative record with adapted reads; use dual-write only if a migration plan and reconciliation rules are approved.
5. Replace the modal with a focused staged workspace: upload, OCR review/correction, manual category, manual subcategory, contract-driven details, lightweight review, submit.
6. Preserve autosaved draft state, evidence, contract version, OCR candidate provenance, student corrections, and verification events across refresh and resume.
7. Add contract tests for all 57 subcategories, OCR non-classification tests, draft/resume tests, evidence security tests, verification transition tests, and portfolio visibility tests.

## Decision required before implementation

Choose one persistence direction:

- **Recommended:** activate and finish the canonical Phase 2 path, then bridge it to the current verification and portfolio experience.
- **Higher-risk alternative:** keep `student_portfolio_records` as canonical and reimplement all 57 tracker contracts in legacy JSON validation, accepting duplication with the existing Phase 2 contracts and detail tables.

Until that decision is explicit, editing the form or OCR pipeline would create a polished workflow on an unresolved data foundation and could break the required end-to-end verification/portfolio lifecycle.
