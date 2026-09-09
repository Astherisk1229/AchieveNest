# Workspace Projection Consistency — Plan D2 Phase D2-4

## Consistency Architecture
All downstream evaluation surfaces reuse the canonical projection helper `resolveEvaluationDepartmentLabel`:
1. HR Evaluation Submission Queue & Workspace ([PortfolioSummaryCard.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PortfolioSummaryCard.jsx))
2. Dean Review Workspace & Candidate Summary Cards
3. Deliberation Printable Rating Sheet ([PersonnelEvaluationPrintService.js](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/PersonnelEvaluationPrintService.js))
4. Official PDF Export / Backend Deliberation Engine ([PersonnelEvaluationPrintService.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/PersonnelEvaluationPrintService.php))

## Verification
- No divergence across views: Academic records consistently show College name, Non-Academic records consistently show Department name.
- Verified in Tests 11–14 of [PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelInstitutionalProjectionAndModalDesignD2Phase4.test.jsx).
