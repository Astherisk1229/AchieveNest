# HR Personnel Directory and Organizational Structure Implementation Report

## Design guidance

The project-local Impeccable skill at `C:/Users/Admin/.codex/skills/impeccable/SKILL.md` guided the interface work. Its launcher could not initialize because its engine cache was unavailable and the task prohibited downloading the skill again. The local skill instructions and craft floor were therefore read directly.

## Authoritative classification decision

The project owner confirmed that the existing two-group model remains authoritative:

- Personnel Group: `faculty` or `non_teaching_faculty`
- Organizational Side: `academic` or `non_academic`

No `non_teaching_personnel` classification was introduced. The interface displays Faculty or Non-Teaching Faculty together with Academic or Non-Academic side.

## Implementation

- Added the HR-only `GET /api/v1/hr/organizational-structure` aggregate endpoint and OPTIONS route.
- Added `/hr/organizational-structure` as a lazy-loaded HR route.
- Added Organizational Structure to HR navigation and renamed Evaluation Submissions to Portfolio Evaluations.
- Reordered HR navigation to Dashboard, Personnel Directory, Organizational Structure, Portfolio Evaluations, Rank Assignment Logs, Password Resets, and HR Audit Trail.
- Added Colleges, Departments, and Unassigned / Data Issues tabs.
- Grouped Personnel using authoritative College/Department affiliations without inferring classification from location.
- Resolved each College's Dean from the same active `dean_assignments` records used by reviewer routing.
- Reused the existing Dean assignment endpoint and modal; selected College UUIDs remain authoritative.
- Hardened the Dean modal for `selectedCollege = null` and limited candidates to active academic Personnel affiliated with that College.
- Replaced hardcoded College and administrative-unit filter options in Personnel Directory with options derived from live directory data. The UI calls legacy MySQL `administrative_units` records Departments without creating a parallel type.
- Added structure-shaped loading rows and recoverable error states without demo records.
- Repaired Create Personnel's Department contract. The frontend now submits `department_id`; the backend validates that ID against active Department master data and maps it to the existing `administrative_units` persistence layer. Legacy `administrative_unit_id` requests remain accepted only at this compatibility boundary, and conflicting dual values are rejected.
- Replaced the misleading `MISSING_ADMINISTRATIVE_UNIT` / `INVALID_ADMINISTRATIVE_UNIT` response for new requests with field-addressable `MISSING_DEPARTMENT` / `INVALID_DEPARTMENT` responses.
- Hardened Personnel Institutional ID validation to digits only while preserving leading zeroes and enforcing the configured 50-digit ceiling on both client and server.
- Hardened Personnel name validation on both client and server to Unicode letters and approved name punctuation, rejecting digits, markup, emoji, control characters, and invisible formatting characters.
- Added accessible field error associations to the reusable onboarding inputs and retained safe generic handling for unexpected server errors.

## Query and authorization design

The aggregate endpoint requires an authenticated actor with `hr_staff`. It uses bounded queries for Colleges, Departments, Dean assignments, and Personnel instead of one request/query per group. It returns existing UUIDs without copying records.

## Verification

- PHP syntax: PASS for the new controller and Routes configuration.
- Route registration: PASS for GET and OPTIONS organizational-structure routes with CORS and secure-header filters.
- Frontend production build: PASS (2,100 modules).
- Targeted frontend regression suite: PASS, 6 files and 67 tests.
- Static contract tests cover navigation, the two-group classification rule, required tabs, absence of fake E2E records, and Dean modal null safety.
- Backend provisioning validation: PASS, 12 tests and 40 assertions.
- Backend provisioning/lifecycle feature regression: PASS, 7 tests and 21 assertions.
- Frontend lint (`oxlint --quiet`): PASS.
- Frontend production build after the Department/validation repair: PASS (2,100 modules).

## Remaining limitations

- A real OSAD-created College → HR view → Dean assignment → refreshed Dean role session was not executed in this turn. The module must not be called fully E2E-connected until that real UUID scenario passes.
- Desktop/mobile screenshot inspection could not run because the bundled in-app browser runtime was rejected by the environment's trusted-code-path policy.
- The MySQL table name `administrative_units` remains for migration compatibility; the new API/UI exposes those authoritative records only as Departments.
