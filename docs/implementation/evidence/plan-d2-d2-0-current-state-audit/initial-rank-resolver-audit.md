# Plan E Initial Rank Resolver Audit — Plan D2 Phase D2-0

### Backend Service: `FacultyInitialRankService.php` / `facultyInitialRankService.js`
- **Initial Resolution Endpoint**: `POST /api/v1/faculty-ranks/resolve-initial`
- **Reconciliation Endpoint**: `POST /api/v1/faculty-ranks/reconcile-current`
- **Personnel Reconciliation Route**: `GET /api/v1/faculty-ranks/reconcile/{personnelId}`

### Core Operational Rules & Invariants
1. **Advisory Nature**: Rank recommendation is **strictly advisory for initial placement and onboarding reconciliation**. It is not an automated overwrite.
2. **Existing Official Rank Wins**: When an official rank is already recorded on an existing personnel member, reconciliation preserves the official rank (`reason_code: existing_rank_preserved`).
3. **Non-Demotion Guarantee**: Qualification resolution cannot demote a faculty member below their established rank.
4. **Non-Promotion Guarantee**: Qualification resolution cannot artificially promote a faculty member without official evaluation / promotion workflow.
5. **Base Starting Ranks per Qualification Tier**:
   - `doctoral` → `PROFESSOR_I` (Professor I)
   - `masters` → `ASSISTANT_PROFESSOR` (Assistant Professor)
   - `board_licensure` → `SENIOR_INSTRUCTOR` (Senior Instructor)
   - `baccalaureate` → `ASSISTANT_INSTRUCTOR` (Assistant Instructor)
6. **Part-Time & Non-Teaching Exclusion**: Resolvers return `PART_TIME_NOT_APPLICABLE` and `NON_TEACHING_NOT_APPLICABLE` when invoked for non-Full-Time-Faculty records.
