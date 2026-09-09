# Plan D Phase D4 — RBAC Authority & Audit Trail Verification

## 1. Role-Based Access Control (RBAC) Matrix

| Actor / Role | Master Data Mutation (`POST/PUT /hr/personnel`) | Dean Annual Review (`POST /dean/annual-reviews`) | Read Eligibility (`GET /personnel/eligibility`) | Plan C Evaluation Mutation |
| --- | --- | --- | --- | --- |
| **HR Administrator** | **ALLOWED** (Authoritative owner) | **PROHIBITED** (`403 FORBIDDEN`) | **ALLOWED** (Diagnostic view) | Prohibited under Plan D |
| **Assigned College Dean** | **PROHIBITED** (`403 FORBIDDEN`) | **ALLOWED** (Only for academic personnel assigned to Dean's college) | **ALLOWED** (College queue) | Prohibited under Plan D |
| **Unassigned Dean (Other College)** | **PROHIBITED** (`403 FORBIDDEN`) | **PROHIBITED** (`403 FORBIDDEN` / `ANNUAL_REVIEW_NOT_APPLICABLE`) | **PROHIBITED** (`403 FORBIDDEN`) | Prohibited under Plan D |
| **Personnel Member** | **PROHIBITED** (`403 FORBIDDEN`) | **PROHIBITED** (`403 FORBIDDEN`) | **ALLOWED** (Own eligibility status and reason codes) | Cannot create evaluation via Plan D |
| **Evaluator / Reviewer** | **PROHIBITED** (`403 FORBIDDEN`) | **PROHIBITED** (`403 FORBIDDEN`) | Prohibited unless authorized | Evaluation workflow governed by Plan C |

---

## 2. Server-Side Identity Authority (No Client Trust)

- Dean ID, Unit/College ID, and Personnel ID are resolved server-side from authenticated JWT claims and session contexts.
- Client-supplied Dean IDs or College IDs in payload bodies are strictly ignored or validated against authenticated identity.
- Client attempts to supply synthetic `cleared` or `ranking_ready` states return errors, as eligibility is a purely server-computed DTO.

---

## 3. Append-Only Audit Trail & Supersession Chain

- All Annual Review records create immutable entries in `personnel_annual_reviews`.
- Review corrections use append-only successor records referencing `supersedes_review_id`, updating `superseded_at` and `superseded_by_dean_id` on the prior record.
- Audit events are emitted for:
  - `annual_review_recorded`
  - `annual_review_superseded`
  - `portfolio_validation_cleared`
  - `portfolio_validation_not_cleared`
- Audit records capture: `actor_id`, `actor_role`, `target_personnel_id`, `evaluation_cycle_id`, `decision`, `decision_reason`, `evidence_reference`, and server timestamp (`created_at`).
