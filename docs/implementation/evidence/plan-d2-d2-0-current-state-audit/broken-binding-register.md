# Broken Binding & Risk Register — Plan D2 Phase D2-0

| Risk Code | Risk Description | Status | Evidence & Impact |
|---|---|---|---|
| `D2-RISK-01` | **Current Academic Rank disconnected from Plan E catalog** | **CONFIRMED** | `OnboardPersonnelModal.jsx` and `EditMasterDataModal.jsx` use unconstrained `<input type="text" />` rather than the 26-rank Plan E catalog. |
| `D2-RISK-02` | **College dropdown disconnected / empty** | **CONFIRMED** | `collectPersonnelPlacementOptions` derives colleges by scraping loaded employee records instead of fetching institutional master data from `GET /api/v1/colleges`. Empty on fresh/clean databases. |
| `D2-RISK-03` | **Administrative Unit terminology / projection mismatch** | **CONFIRMED** | Evaluation print report falls back to generic label `"Department"` rather than projecting `colleges.college_name` (for Academic) or `administrative_units.unit_name` (for Non-Academic). |
| `D2-RISK-04` | **Qualification resolver not connected to modal** | **CONFIRMED** | `FacultyInitialRankService` / `POST /api/v1/faculty-ranks/resolve-initial` is not invoked in `OnboardPersonnelModal.jsx` when qualifications are entered. |
| `D2-RISK-05` | **Existing current rank may be overwritten/reset** | **NOT PRESENT** | `EditMasterDataModal.jsx` preserves loaded `current_rank_title` and does not automatically mutate rank upon qualification modification. |
| `D2-RISK-06` | **Full-Time / Part-Time catalog crossover** | **CONFIRMED** | Free-text inputs allow entering Part-Time titles for Full-Time faculty and vice-versa without frontend or backend validation guards. |
| `D2-RISK-07` | **Provisioning payload whitelist disconnect** | **CONFIRMED** | `TargetProvisioningController::$allowedFields` omits `faculty_engagement`, `employment_status`, `current_rank_title`, `position_title`, and `qualification_summary`. |
| `D2-RISK-08` | **Position / Job Title source unresolved** | **CONFIRMED** | Zero institutional catalog exists for Position/Job Title. Form remains free-text. Marked explicitly as `POSITION / JOB TITLE SOURCE — UNRESOLVED`. |
