# Internal Key vs User-Facing Label Matrix

| Internal Key | DB Stored Value | Backend Label | Frontend Display Label | Inconsistency / Harmonization Note |
|---|---|---|---|---|
| `submitted` | `'submitted'` | Submitted | "Submitted for Review" | Consistent |
| `in_evaluation` | `'in_evaluation'` | In Evaluation | "Under Review" / "In Evaluation" | Minor label variance across Dean and Personnel views |
| `returned_for_revision` | `'returned_for_revision'` | Returned for Revision | "Needs Revision" / "Returned" | Harmonize display label in J4 |
| `ready_for_finalization` | `'ready_for_finalization'` | Ready for Finalization | "Ready for Finalization" | Consistent |
| `completed` | `'completed'` | Completed | "Completed" / "Finalized" | Consistent |
| `Passed` | `'Passed'` | Passed | "Passed" | Strictly separate from "Approved" |
| `Retained` | `'Retained'` | Retained | "Retained" | Strictly separate from "Not Approved" |
| `Approved` | `'Approved'` | Approved | "Approved" | Promotion decision only |
| `Not Approved` | `'Not Approved'` | Not Approved | "Not Approved" | Promotion decision only |
