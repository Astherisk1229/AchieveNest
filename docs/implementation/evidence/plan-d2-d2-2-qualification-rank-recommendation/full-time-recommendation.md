# Phase D2-2: Full-Time Recommendation Behavior

## Policy & Mapping Rules
Full-time faculty recommendations strictly invoke the Plan E 26-rank hierarchy resolver:

| Qualification Category | Example Input | Plan E Resolved Rank | Canonical Code |
| :--- | :--- | :--- | :--- |
| Doctoral Degree | `Doctor of Philosophy (PhD)` | Professor I | `PROFI_1` / `PROF_1` |
| Master's Degree / Graduate | `Master of Science (MS)` | Assistant Professor I | `ASST_1` |
| Professional Licensed Path | `BS Accountancy (CPA / Licensure)` | Assistant Professor I | `ASST_1` |
| Baccalaureate / Non-Board | `BS Information Technology` | Instructor I | `INST_1` |

## Enforcement Boundaries
- Ranks resolved for Full-Time faculty must strictly exist in the 26-rank Plan E Full-Time catalog (`personnelMasterDataService.getFullTimeFacultyRanks()`).
- Full-Time resolution will never recommend a Part-Time title (such as `Lecturer` or `Professorial Lecturer`).
- The returned rank is strictly advisory until accepted or confirmed during onboarding.
