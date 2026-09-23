# Part-Time Title Resolver Audit — Plan D2 Phase D2-0

### Resolver Location & Behavior
- **Backend Service**: `PartTimeFacultyTitleService.php`
- **Frontend Service**: `partTimeFacultyTitleService.js` (`resolvePartTimeTitleSync`, `getPartTimeTitleByCodeSync`)
- **Mapping Logic**:
  - `Ph.D. / Ed.D. / Doctorate` → `PT_PROFESSORIAL_LECTURER` (*Professorial Lecturer*)
  - `Master's / MA / MS / MAT / MD / LL.B.` → `PT_ASSISTANT_PROFESSORIAL_LECTURER` (*Assistant Professorial Lecturer*)
  - `Board Licensed / Licensure / CPA / ENGR / MEDTECH / RN` → `PT_SENIOR_LECTURER` (*Senior Lecturer*)
  - `Baccalaureate / Bachelor / AB / BSE / BS` → `PT_LECTURER` (*Lecturer*)

### Status in Current HR Modal
- **Current State**: The active modal does not query or invoke `partTimeFacultyTitleService.js` or `GET /api/v1/faculty-titles/part-time`.
- **Target D2 Reuse**: Phase D2-2 can directly wire `partTimeFacultyTitleService.js` to recommend and populate the Part-Time title dropdown when `facultyEngagement === 'part_time_faculty'`.
