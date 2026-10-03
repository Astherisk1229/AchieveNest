# Wrong-Scale Rejection & Cross-Scale Contamination Prevention

## Architectural Boundary
The portfolio workspace strictly enforces scale boundaries when `evaluation_scale_code === 'NON_TEACHING_PERSONNEL_RANKING_SCALE'`.

---

## 1. Rejection of Administrators-Scale Categories
Attempts to persist the following criteria under the Non-Teaching scale are rejected with HTTP 422:
- Administrators Area A (`A.1 Degrees`, `A.2 Professional Organizations`, `A.3 Seminars`)
- Administrators Area B (`B.1 4-Factor Speaker/Consultant`, `B.2 Publication`, `B.4 Awards Matrix`, `B.5 Instructional Materials`, `B.6 Creative Work`)
- Administrators Area C (`C.1 Extra-Curricular`, `C.2 Community`, `C.3 Service Years`)

---

## 2. Rejection of Area A Mutation
- Any attempt to submit an accomplishment under Non-Teaching Area A (`AREA_A_PERFORMANCE_PERSONAL_INDICATORS`) is rejected with HTTP 409:
- `"Portfolio Area [A: Performance and Personal Indicators] is an evaluation-only section and does not permit personnel accomplishment mutations."`

---

## 3. UI Layer Isolation
- `RankingCriteriaModel.getAreasForScale('NON_TEACHING_PERSONNEL_RANKING_SCALE')` provides only Area A (marked read-only) and Area B.
- Area C is completely absent from the UI tab list.
- Dropdown selectors dynamically restrict categories to B.1–B.5 only.
