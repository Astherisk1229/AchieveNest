# Print Service Projection — Plan D2 Phase D2-4

## Implementation
Both frontend and backend printable evaluation engines implement canonical projection logic:
- Frontend: `PersonnelEvaluationPrintService.buildPrintableEvaluation()` in [PersonnelEvaluationPrintService.js](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/PersonnelEvaluationPrintService.js)
- Backend: `PersonnelEvaluationPrintService::buildPrintableEvaluation()` in [PersonnelEvaluationPrintService.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/PersonnelEvaluationPrintService.php)

## Verification
- Academic records project College name into `personnel_identity.department`.
- Non-Academic records project Administrative Unit name into `personnel_identity.department`.
- Verified in Test 10 and Test 12 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx) and master regression suite.
