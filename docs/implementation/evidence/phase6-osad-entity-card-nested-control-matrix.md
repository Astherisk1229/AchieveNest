# Plan 06 Phase 6 — OSAD Entity Card Nested Control Matrix
## Event Isolation and Nested Action Independence

| Card Type | Nested Action Control | Target Handler / Action | Parent Navigation Suppressed? | Method | Result |
|---|---|---|:---:|---|:---:|
| `Organization Card` | Assign / Reassign Moderator Button | `setPersonnelSelectorTarget({...})` | **YES** | `e.stopPropagation()` | **PASS** |
| `Organization Card` | "View Details →" Text Cue | `onSelectOrganization(org.id)` | N/A (Triggers Same Destination) | Semantic visual cue | **PASS** |
| `Candidate Card` | Batch Confirmation Checkbox | `onToggleCandidateSelection(id)` | **YES** | `e.stopPropagation()` | **PASS** |
| `Candidate Card` | Review Dossier Button | `onOpenReviewWorkspace(id)` | N/A (Triggers Same Destination) | Explicit button trigger | **PASS** |
| `Certificate Template Card`| Edit Template Button | `onEditTemplate(id)` | **YES** | `e.stopPropagation()` | **PASS** |

- **Nested Controls Triggering Parent Navigation Inadvertently**: **0 (Zero)**.
- **Duplicate Mutation Submissions**: **0 (Zero)**.
