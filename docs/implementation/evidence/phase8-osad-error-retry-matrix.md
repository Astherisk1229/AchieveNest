# Phase 8 Evidence: OSAD Error & Retry Matrix

| View / Context | Failure Scenario | User Message Exposure | Safe Retry Action | Mutation Protection |
| :--- | :--- | :--- | :--- | :--- |
| **Password Reset Queue** | Fetch requests failed (500/timeout) | "Unable to Load Reset Requests: {clean message}" | `loadRequests()` trigger button | Safe read GET |
| **Awards Catalog** | Fetch awards failed | "Unable to Load Award Definitions: {clean message}" | `loadAwards()` trigger button | Safe read GET |
| **Coordinator Manager** | Fetch affiliated personnel failed | "Unable to Load Personnel Data: {clean message}" | `loadData()` trigger button | Safe read GET |
| **College Details** | Fetch college details failed | "Unable to Load College Details: {clean message}" | `loadDetails()` trigger button | Safe read GET |
| **Organization Details** | Fetch organization details failed | "Unable to Load Organization Details: {clean message}" | `loadDetails()` trigger button | Safe read GET |
| **Students for Evaluation** | Fetch evaluation pool failed | "Unable to Load Evaluation Pool: {clean message}" | `loadStudents()` trigger button | Safe read GET |
| **Potential Candidates** | Calculation/fetch candidates failed | "Unable to Load Potential Candidates: {clean message}" | `loadData()` trigger button | Safe read GET |
| **Award Review Workspace** | Workspace payload fetch failed | "Unable to Load Review Workspace: {clean message}" | `loadWorkspaceData()` trigger button | Safe read GET |
| **Password Reset Approval** | Mutation POST failure | Toast/Modal alert with validation guidance | Modal remains open with input intact | Idempotent token / status check |
| **Coordinator Assignment** | Mutation POST failure | In-modal alert banner | Form values preserved, button re-enabled | Safe duplicate assignment guard |
| **Organization Scope Add** | Mutation POST failure | In-modal alert banner | Selected items preserved | Database unique constraint guard |
| **Certificate Template Publish**| Schema validation failure | Inline field error indicator | Draft retained in editor modal | Version increment check |
