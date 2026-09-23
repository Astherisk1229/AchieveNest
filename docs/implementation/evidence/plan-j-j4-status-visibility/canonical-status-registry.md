# Canonical Status Registry Evidence

### 5 Canonical Lifecycle Statuses
1. `submitted` -> Display Label: `"Submitted"`, Variant: `"default"` / `"info"`
2. `in_evaluation` -> Display Label: `"Under Review"`, Variant: `"warning"`
3. `returned_for_revision` -> Display Label: `"Returned for Revision"`, Variant: `"destructive"`
4. `ready_for_finalization` -> Display Label: `"Ready for Finalization"`, Variant: `"secondary"`
5. `completed` -> Display Label: `"Completed"`, Variant: `"success"`

### Strict Separation Registries

#### Evaluation Results (Independent of Lifecycle)
- `Passed` -> Display Label: `"Passed"`, Variant: `"success"`
- `Retained` -> Display Label: `"Retained"`, Variant: `"warning"`

#### Promotion Decisions (Independent of Lifecycle and Evaluation Result)
- `Approved` -> Display Label: `"Approved"`, Variant: `"success"`
- `Not Approved` -> Display Label: `"Not Approved"`, Variant: `"destructive"`

### Key Mappings in `PersonnelWorkflowStatusService.js`
- `LIFECYCLE_STATUS_BADGES`
- `EVALUATION_RESULT_BADGES`
- `PROMOTION_DECISION_BADGES`
- `STATUS_DISPLAY_LABELS`
- `EVENT_DISPLAY_LABELS` (via `PersonnelWorkflowEventRegistry.js`)
