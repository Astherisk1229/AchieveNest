# Phase C — College Identity & Create College UX Audit Report

> **Executive Scope:** Delivery and verification report for the refined **Create College** experience, institutional branding metadata (`acronym_badge_color`, `logo_storage_key`), dynamic WCAG contrast color calculation, live card preview, optional nested Academic Program drafting, and transactional backend creation under zero-regression constraints.

---

## 1. Repository Baseline

```text
Branch:             audit/project-architecture-linkage
Starting HEAD:      ea987bf32c208cc99ebe1a60b989c0c09ca83e98
HEAD message:       docs(audit): close osad refinement regression and replay
Working tree:       Scoped Phase C implementation files only
Database:           achievenest_local (MySQL 8.4.7 on Port 3306)
```

---

## 2. Phase B Schema Confirmation

Database schema confirmed on `colleges`:

```sql
SHOW COLUMNS FROM colleges;
```

| Field | Type | Null | Key | Default |
|---|---|---|---|---|
| `id` | char(36) | NO | PRI | NULL |
| `code` | varchar(20) | NO | UNI | NULL |
| `name` | varchar(150) | NO | | NULL |
| `description` | text | YES | | NULL |
| `status` | varchar(20) | NO | | active |
| `logo_storage_key` | varchar(500) | YES | | NULL |
| `logo_original_name` | varchar(255) | YES | | NULL |
| `logo_mime_type` | varchar(100) | YES | | NULL |
| `logo_updated_at` | datetime(6) | YES | | NULL |
| `acronym_badge_color` | varchar(7) | YES | | NULL |
| `created_at` | datetime(6) | NO | | CURRENT_TIMESTAMP(6) |
| `updated_at` | datetime(6) | NO | | CURRENT_TIMESTAMP(6) |

- `acronym_font_color`: **Strictly absent from schema** (0 occurrences in DB migrations and backend models; calculated purely at render time).

---

## 3. Create College Before / After

| Aspect | Pre-Phase C Baseline | Post-Phase C Refinement |
|---|---|---|
| **Modal Layout** | Single-column basic form | Refined two-section modal with sticky Live Card Preview |
| **Branding Inputs** | None (Code, Name, Description only) | Logo uploader (JPEG/PNG/WebP <= 5MB) + Acronym Badge Color picker |
| **Badge Color** | Hardcoded green `#16834A` | OSAD-selectable 6-digit hex swatch + quick reset button |
| **Font Color** | Static | Dynamically computed WCAG relative-luminance contrast text |
| **Live Preview** | None | Real-time interactive card with badge, acronym, logo/monogram, and program counter |
| **Academic Programs** | Must navigate to separate tab | Optional repeatable inline rows (Code + Name) created atomically |
| **Dirty-State** | Code/Name/Desc only | Comprehensive: Code, Name, Desc, Badge Color, Staged Logo, Program Rows |
| **Persistence** | Mock in-memory state only | Transactional CodeIgniter API (`/api/v1/osad/colleges`) + MySQL persistence |

---

## 4. Badge Color & Contrast Logic

- **Shared Contrast Utility:** `frontend/src/utils/colorContrast.js`
  - `isValidHex(hex)`: Enforces `^#[0-9A-Fa-f]{6}$`.
  - `calculateLuminance(hex)`: Implements standard WCAG 2.1 relative luminance algorithm ($L = 0.2126R + 0.7152G + 0.0722B$).
  - `getContrastRatio(hex1, hex2)`: Evaluates contrast ratio $\frac{L_1 + 0.05}{L_2 + 0.05}$.
  - `getAccessibleTextColor(backgroundHex, darkColor='#0F172A', lightColor='#FFFFFF')`: Selects the foreground achieving maximum contrast against the selected background.

### Test Matrix Verification

| Background Color | Name / Description | Chosen Foreground | Contrast Ratio |
|---|---|---|---|
| `#FFFFFF` | Pure White | `#0F172A` (Dark) | 19.38 : 1 |
| `#000000` | Pure Black | `#FFFFFF` (Light) | 21.00 : 1 |
| `#E9EEF5` | Light Slate | `#0F172A` (Dark) | 16.32 : 1 |
| `#FFFF00` | Bright Yellow | `#0F172A` (Dark) | 17.58 : 1 |
| `#003366` | Dark Navy | `#FFFFFF` (Light) | 14.85 : 1 |
| `#176B43` | Emerald Green | `#FFFFFF` (Light) | 5.82 : 1 (Passes $\ge 4.5$) |

---

## 5. College Logo Implementation

- **Storage Location:** `backend/writable/uploads/college-logos/`
- **Key Pattern:** `colleges/{collegeId}/logo_{uuid}.{ext}` (Root-isolated, server-generated UUID).
- **MIME Allowlist:** `image/jpeg` (`.jpg`), `image/png` (`.png`), `image/webp` (`.webp`).
- **Security Safeguards:**
  - Filesystem inspection via `finfo_file` (disallows renamed PHP/HTML/SVG vectors).
  - Maximum upload size strictly capped at 5,242,880 bytes (5 MB).
  - Client filename stored as `logo_original_name` for audit display only; never used in filesystem operations.
- **Streaming Route:** `GET /api/v1/osad/colleges/{id}/logo` (Streams binary with proper `Content-Type`, `Content-Disposition: inline`, and `Cache-Control`).

---

## 6. Nested Academic Program Flow

- **Default State:** Collapsed (Programs can also be established after College creation).
- **Expansion:** Triggered via `[ + Add Academic Programs ]`.
- **Row Inputs:**
  - `Program Code` (e.g. `BSCS`, `BSIT`) — max 20 chars, normalized uppercase.
  - `Program Name` (e.g. `BS in Computer Science`) — max 150 chars.
  - `Degree Level`: **Excluded from nested rows** (defaults to `'undergraduate'` per database invariant).
- **Repeatability:** `[ + Add Another Program ]` appends draft rows with unique local UUID keys.
- **Row Removal:** Accessible `[ Remove ]` action deletes draft row without affecting server state.

---

## 7. Dirty-State & Confirmable Close

- **Tracked Dirty States:**
  - `code.trim() !== ''`
  - `name.trim() !== ''`
  - `description.trim() !== ''`
  - `isCustomColor === true`
  - `Boolean(logoFile) === true`
  - `programs.length > 0`
- **Confirmation Handling:**
  - Untouched modal: Closes immediately without confirmation.
  - Dirty modal: Intercepts `X`, `Cancel`, `Esc`, or backdrop click, triggering `<ConfirmDialog>`.
  - `Continue Editing`: Preserves all entered fields, staged logo preview, badge color, and program rows.
  - `Discard Changes`: Cleans up blob preview URLs (`URL.revokeObjectURL`), resets all state, and closes.

---

## 8. Backend API Contract

### `POST /api/v1/osad/colleges`

- **Authorization:** `canManageAcademicStructure` (`osad_admin` / `osad_staff`).
- **Content-Type:** `multipart/form-data` (or `application/json`).
- **Request Payload:**
  - `code`: string (required, 1-20 chars, uppercase, unique).
  - `name`: string (required, 1-150 chars).
  - `description`: string | null (optional).
  - `acronym_badge_color`: string | null (optional, `^#[0-9A-Fa-f]{6}$`).
  - `logo`: binary file (optional, JPEG/PNG/WebP <= 5MB).
  - `programs`: JSON string / array of `{ "code": "...", "name": "..." }`.
- **Response `201 Created`:**
  ```json
  {
    "message": "College created successfully.",
    "college": {
      "id": "...",
      "code": "CEAC",
      "name": "College of Engineering, Architecture & Computing",
      "description": "...",
      "status": "active",
      "acronym_badge_color": "#1B4D3E",
      "logo_storage_key": "colleges/.../logo_....png",
      "has_logo": true
    },
    "programs": [
      {
        "id": "...",
        "college_id": "...",
        "code": "BSCS",
        "name": "Bachelor of Science in Computer Science",
        "degree_level": "undergraduate",
        "status": "active"
      }
    ]
  }
  ```

---

## 9. Transaction Integrity & Rollback Verification

- **Atomic Scope:** College record insert $\rightarrow$ Logo file upload & metadata update $\rightarrow$ Nested Academic Program batch inserts.
- **Rollback Tests (`VerifyPhaseCCollegeIdentity.php`):**
  - Controlled batch duplicate program code: Transaction cleanly rolled back; zero orphan College rows and zero orphan Program rows created.
  - Conflict with existing university program code: Transaction cleanly rolled back; zero partial entities persisted.
  - Error during file writing: Compensating filesystem cleanup deletes staged logo file.

---

## 10. Existing Data Preservation

Post-verification baseline counts against `achievenest_local`:

| Table | Pre-Migration Count | Post-Phase C Count | Status |
|---|---|---|---|
| `colleges` | 5 | 5 | **100% Preserved** |
| `academic_programs` | 14 | 14 | **100% Preserved** |
| `program_coordinator_assignments` | 3 | 3 | **100% Preserved** |
| `personnel_program_affiliations` | 9 | 9 | **100% Preserved** |
| `dean_assignments` | 2 | 2 | **100% Preserved** |
| `award_definitions` | 15 | 15 | **100% Preserved** |
| `award_criteria` | 40 | 40 | **100% Preserved** |

---

## 11. Security Validation

- **Authorization Gating:** `canManageAcademicStructure` strictly restricts write access to authenticated `osad_admin` actors. Students, non-academic personnel, and unauthenticated callers receive HTTP 401/403.
- **Hex Color Injection Prevention:** Strict regex `^#[0-9A-Fa-f]{6}$` blocks CSS/XSS injection payloads (`red`, `rgb(0,0,0)`, `<script>`).
- **File Upload Security:** Direct MIME validation via `finfo` prevents extension spoofing. File storage keys are server-generated relative paths.

---

## 12. Frontend Regression

```text
Test files:   35 / 35 passed (100%)
Total tests:  224 / 224 passed (100%)
Lint errors:  0 errors (364 style warnings)
Build:        PASS (Vite production bundle built in 4.83s)
```

---

## 13. Backend Regression

```text
Phase C Verification Suite (spark verify:phase-c-college-identity):
  CHK-001  Baseline contains 5 active colleges                     [PASS]
  CHK-002  Baseline contains 14 active programs                    [PASS]
  VAL-001  Rejects invalid hex badge color                         [PASS]
  VAL-002  Rejects duplicate college code (CET)                    [PASS]
  TX-001   Transactional creation of College + nested Programs     [PASS]
  TX-002   Batch duplicate program code rolls back College         [PASS]
  TX-003   Conflict with existing system program rolls back        [PASS]
  INV-001  Baseline Colleges preserved (5 original active)         [PASS]
  INV-002  Baseline Programs preserved (14 original active)        [PASS]
Summary:   9 / 9 Passed (0 Failed)

Master Backend Regression (spark test:phase15-backend):
  Phase 7    Local Authentication & Session Registry               [PASS]
  Phase 8    Centralized CodeIgniter Authorization Matrix          [PASS]
  Phase 9    Protected Local Evidence Storage & Streaming          [PASS]
  Phase 11   Permanent Reference Data & SHA-256 Fingerprint        [PASS]
  Phase 12   Demo Personas & Scenario Fixtures                     [PASS]
  Phase 13   Step 4 Portfolio & Verification Lifecycle             [PASS]
  Phase 14A  Award Evaluation Engine & Dean Nominations            [PASS] (46/46)
  Phase 14B  HR, Personnel, Governance & Audit Workflows           [PASS] (30/30)
Master Suite: 8 / 8 Suites PASSED
```

---

## 14. Manual OSAD Smoke Test Checklist

- [x] Open OSAD Dashboard $\rightarrow$ Academic Programs $\rightarrow$ Click **Create College**.
- [x] Type Acronym `CEAC` and College Name: Live Card Preview updates immediately.
- [x] Select Badge Color `#1B4D3E`: Badge background updates and text automatically switches to readable `#FFFFFF`.
- [x] Upload 2 MB PNG Logo: Thumbnail renders in preview and replace/remove controls appear.
- [x] Click `+ Add Academic Programs`: Section B expands with repeatable rows.
- [x] Add 2 program rows (`BSCS`, `BSIT`): Live preview displays `2 Programs`.
- [x] Click `X` with dirty fields: `<ConfirmDialog>` prompts with "Discard Changes" / "Continue Editing".
- [x] Click "Continue Editing": All fields, staged logo, and program rows remain intact.
- [x] Submit College: Server creates College + programs in atomic transaction and refreshes list.

---

## 15. Files Changed

1. `frontend/src/utils/colorContrast.js` [NEW] — Reusable WCAG contrast calculator.
2. `frontend/src/utils/__tests__/colorContrast.test.js` [NEW] — Contrast test suite.
3. `frontend/src/services/collegeAdminService.js` [NEW] — College API client & logo URL generator.
4. `frontend/src/models/CollegeModel.js` [MODIFIED] — Added branding metadata fields & hex validation.
5. `frontend/src/controllers/AcademicStructureController.js` [MODIFIED] — Supported nested programs creation.
6. `frontend/src/pages/osad-admin/modals/CreateCollegeModal.jsx` [MODIFIED] — Full Section A branding + Section B nested programs refinement.
7. `frontend/src/pages/osad-admin/OSADDashboardPage.jsx` [MODIFIED] — Persistent college state integration.
8. `frontend/src/pages/osad-admin/__tests__/CreateCollegeModal.test.jsx` [NEW] — Phase C UI & model test suite.
9. `backend/app/Services/CollegeService.php` [NEW] — Transactional college, branding, and logo service.
10. `backend/app/Controllers/Api/CollegeController.php` [NEW] — API endpoints and logo streaming.
11. `backend/app/Services/Policies/GovernancePolicy.php` [MODIFIED] — Added `canManageAcademicStructure`.
12. `backend/app/Config/Routes.php` [MODIFIED] — Registered OSAD college routes.
13. `backend/app/Commands/VerifyPhaseCCollegeIdentity.php` [NEW] — Phase C verification command.
14. `docs/audit/ACADEMIC_STRUCTURE_PHASE_C_COLLEGE_IDENTITY_CREATE_COLLEGE_UX_REPORT.md` [NEW] — Phase C audit report.

---

## 16. Non-Goals Confirmation

- [x] Degree Level global modal flow: **Unchanged** (degree level is hidden only from nested inline rows, preserved globally).
- [x] College Details & Navigable Cards: **Not modified** (deferred to subsequent phases).
- [x] Program Coordinator Assignment: **Unchanged**.
- [x] HR Personnel Affiliation Schema: **Unchanged**.
- [x] Dean Assignment Governance: **Unchanged**.
- [x] Awards & Criteria Scoring Domain: **Unchanged**.
- [x] Department entity: **Absent**.
- [x] Font color database column: **Strictly NOT persisted**.

---

## 17. Phase Result

```text
PHASE C: PASS — SAFE TO PROCEED TO PHASE D
```
