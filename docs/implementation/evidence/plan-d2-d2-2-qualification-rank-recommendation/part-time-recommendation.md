# Phase D2-2: Part-Time Recommendation Behavior

## Policy & Mapping Rules
Part-time faculty recommendations strictly invoke the Plan E 4-title catalog resolver (`PartTimeFacultyTitleService.php`):

| Qualification Category | Example Input | Plan E Resolved Title | Canonical Code |
| :--- | :--- | :--- | :--- |
| Doctoral Degree | `PhD in Educational Management` | Professorial Lecturer | `PROF_LECTURER` |
| Master's / Graduate Studies | `MA in English Language` | Senior Lecturer | `SR_LECTURER` |
| Professional Licensed / Board | `BS Nursing (RN / Board Passer)` | Senior Lecturer | `SR_LECTURER` |
| Baccalaureate / Non-Board | `BS Business Administration` | Lecturer | `LECTURER` |

## Enforcement Boundaries
- Ranks resolved for Part-Time faculty must strictly exist in the 4-title Plan E Part-Time catalog (`personnelMasterDataService.getPartTimeFacultyTitles()`).
- Part-Time resolution will never recommend a Full-Time rank (e.g., `Assistant Professor I`, `Instructor I`).
- Crossover between Part-Time and Full-Time catalogs is blocked by frontend and backend validation checks.
