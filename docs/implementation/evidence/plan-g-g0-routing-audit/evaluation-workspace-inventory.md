# Personnel Evaluation Track — Plan G — Phase G0: Evaluation Workspace Inventory

## Current Evaluator-Facing Pages & Workspaces

| Workspace / Component | Route | Target User Role | Primary Functionality | Plan F Alignment Status |
| :--- | :--- | :--- | :--- | :--- |
| `HREvaluationSubmissionsPage.jsx` | `/hr-admin/evaluation-submissions` | HR Staff / HR Admin | Queue listing (`submitted`, `in_evaluation`, `ready_for_finalization`, `completed`), filtering by college & status | **Aligned** (State machine queue) |
| `HRFacultyEvaluationOversightPage.jsx` | `/hr-admin/faculty-evaluations` | HR Admin | High-level university-wide faculty ranking oversight and reporting | **Legacy Advisory Badges** to be aligned |
| `PortfolioEvaluationStudio.jsx` | Modal / Sub-view within Evaluation Queue | HR Staff / Dean | Detail evaluation view, evidence viewer, item verification, and scoring input | **To consume Plan F scoring engine in G2/G3** |
| `DeanAnnualReviewWorkspace.jsx` | `/personnel/dean/annual-reviews` | College Dean | Annual qualitative review workspace (Plan D1 companion) | **Aligned** |
| `ReturnForRevisionModal.jsx` | Modal within Studio | Evaluator | Returning evaluation to personnel with required deficiency notes | **Aligned** |
| `FinalizeEvaluationModal.jsx` | Modal within Studio | Evaluator | Reviewing final summary and applying formal completion lock | **Aligned** |
