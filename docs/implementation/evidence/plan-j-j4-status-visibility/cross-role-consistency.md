# Cross-Role Status Consistency Evidence

### Core Consistency Principle
> **All authorized views must display the same persisted lifecycle state.**

### Cross-Role Alignment Matrix
For any given evaluation dossier at a specific timestamp:

| Dimension | Personnel View | Dean View | HR View | Cross-Role Agreement |
|---|---|---|---|---|
| **Lifecycle Status** | `in_evaluation` | `in_evaluation` | `in_evaluation` | **100% Consistent** |
| **Portfolio Version** | `Version 2` | `Version 2` | `Version 2` | **100% Consistent** |
| **Last Meaningful Event** | `Portfolio Resubmitted` | `Portfolio Resubmitted` | `Portfolio Resubmitted` | **100% Consistent** |
| **Active Controls** | View / Respond | Review / Score | Manage / Finalize | Role-appropriate |

Validated in test suite: `PersonnelWorkflowStatusService.validateCrossRoleAgreement(models)` passes without discrepancies.
