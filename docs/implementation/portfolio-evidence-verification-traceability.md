# AchieveNest — Student Portfolio & OSAD Portfolio Review Format Alignment
## Plan 05 — Evidence & Verification Traceability Specification

---

### 1. Evidence Architecture & Integrity
- **Single Canonical Evidence Authority**: `student_portfolio_evidence`.
- **Single Storage Engine**: `LocalEvidenceStorageService.php`.
- **Review Evidence Duplication**: **0 (Zero)**.
- **Evidence Orphan Records**: **0 (Zero)**.
- **Raw Storage Path Exposure**: **NONE (Zero)**.

---

### 2. Verification State Machine & Traceability
- **Primary Status Authority**: `student_portfolio_records.status`.
- **Audit History Authority**: `student_portfolio_verification_events`.
- **Lifecycle Statuses**: `draft`, `submitted`, `under_review`, `revisions_requested`, `verified`, `rejected`.
- **Re-Verification Lifecycle**: Resubmitted records retain the exact same `portfolio_record_id` (0 duplicate rows).
- **Public Remarks vs Deliberation Notes**: Coordinator feedback is stored in verification events; evaluator deliberation notes are isolated in evaluation controllers.
