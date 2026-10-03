# Hash Index Implementation

## 1. Database Index Structure
- **Table**: `personnel_accomplishment_evidence`
- **Index**: `idx_personnel_evidence_sha256`
- **Column**: `sha256 VARCHAR(64)`
- **Uniqueness**: **NON-UNIQUE (Standard Index)**

## 2. Rationale for Non-Unique Index
1. Personnel may legitimately upload the same certificate or evidence document to support multiple accomplishments (e.g. teaching award and community extension proof).
2. Global uniqueness would cause false-positive collision errors on valid re-submissions or related achievements.
3. Standard indexing guarantees $O(\log N)$ fast advisory lookups without constraining valid academic workflows.
