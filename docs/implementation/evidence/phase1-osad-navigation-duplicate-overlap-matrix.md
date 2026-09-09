# Plan 06 Phase 1 — OSAD Navigation Duplicate & Overlap Matrix
## Identification of Overlapping Workflows, Route Aliases, and Redundancies

### 1. Workflow Overlaps
| Item A | Item B | Overlapping Workflow Area | Classification | Notes |
|---|---|---|---|---|
| `Student Accounts` (`?tab=accounts`) | `Award Candidate Review` (`?tab=candidate-review`) | Student Portfolio Review & Dossier Inspection | **OVERLAPPING WORKFLOW** | Both pages provide entry points into reviewing student achievement portfolios and potential candidate standings. |
| `Student Accounts` (`?tab=accounts`) | `Password Resets` (`?tab=password-resets`) | Student Credential & Account Management | **PARTIAL OVERLAP** | Student password resets exist both as row actions inside Student Accounts and as a dedicated management queue. |

### 2. Route Aliases & Query Tab Normalization
| Query Parameter Inbound | Internal Resolved Tab | Target Component | Status |
|---|---|---|---|
| `?tab=academic-structure` | `academic-programs` | `OSADAcademicProgramsPage.jsx` | **ROUTE ALIAS (Active)** |
| `?tab=awardees` | `candidate-review` | `OSADAwardCandidateReviewPage.jsx` | **LEGACY ALIAS (Active)** |

### 3. Sidebar vs Header Duplicate Destinations
| Destination | Sidebar Presence | Topbar / Header Profile Menu | Classification |
|---|---|---|---|
| Account (`/osad/account`) | Omitted from sidebar | Present in user profile dropdown | **INTENTIONAL SEPARATION (Standard)** |
| Settings (`/osad/settings`)| Omitted from sidebar | Present in user profile dropdown | **INTENTIONAL SEPARATION (Standard)** |
| Notifications (`/osad/notifications`) | Omitted from sidebar | Present in header bell icon | **INTENTIONAL SEPARATION (Standard)** |
