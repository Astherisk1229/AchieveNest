# Missing Evidence State Handling

## Controlled Degradation for Unavailable Evidence

When an evidence reference is missing, corrupt, or unlinked:

### 1. Controlled Status
- The workspace marks the evidence state as `evidence_unavailable`:
  - `status`: `evidence_unavailable`
  - `file_name`: `Evidence not attached or unavailable`
  - `warning`: `"Submitted item does not have an active accessible evidence file."`

### 2. Preservation of Evaluation Item
- The parent evaluation item remains intact and reviewable.
- The system does NOT crash with null pointer or unhandled exception.
- The system does NOT fabricate mock evidence.
- The system does NOT prematurely zero out points in Phase G2.
