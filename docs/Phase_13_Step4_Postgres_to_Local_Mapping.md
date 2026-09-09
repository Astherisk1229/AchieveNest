# Phase 13 — Step 4 PostgreSQL/Supabase to Local WAMP MySQL Mapping

This document maps all original Phase 8 Step 4 feature tests and hosted PostgreSQL/Supabase mechanisms to their local CodeIgniter application-layer, MySQL, and filesystem implementations.

| Original Test ID | Original Hosted Mechanism | Local Mechanism | Expected Outcome | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PORT-001** | `public.profiles` query via PDO pgsql | MySQL `profiles` query + `student_program_enrollments` | Active student identity in BSA program | **PASS** | Validates Student A identity invariants |
| **PORT-002** | `public.portfolio_categories` and `public.portfolio_subcategories` | MySQL `portfolio_categories` and `portfolio_subcategories` | 9 categories, 57 subcategories, exact distribution | **PASS** | Matches authoritative permanent taxonomy |
| **PORT-003** | Subcategories description `IS NOT NULL` / `IS NULL` | MySQL subcategories description query | 40 described, 17 NULL discipline rows | **PASS** | 10 Sports & 7 Socio-Cultural discipline rows |
| **ACH-001** | Direct `INSERT` with `::jsonb` | CodeIgniter query builder + lifecycle event insert | Submitted record with server ownership | **PASS** | Verifies submission lifecycle creation |
| **ACH-002** | Cross-category check in `public.portfolio_subcategories` | MySQL category/subcategory join validation | Zero cross-category match (rejection) | **PASS** | Enforces valid taxonomy hierarchy |
| **ACH-003** | Structured metadata JSON check | PHP/MySQL structured_metadata attribute validation | Mandatory event/AY attribute required | **PASS** | Validates Sports subcategory rule |
| **ACH-004** | PostgreSQL RLS policy check | `StudentPortfolioPolicy::canVerify()` | Self-verification rejected with 403 Forbidden | **PASS** | Student cannot verify own record |
| **ACH-005** | `public.student_award_score_evidence` check | `student_award_score_evidence` MySQL query | Zero student-injected evaluation rows | **PASS** | Protected internal scoring tables |
| **EVID-001** | Insert fake metadata with `clean` & `clamav` | `LocalEvidenceStorageService::storeFile` with real PDF | Protected PDF stored, SHA-256 computed, status pending | **PASS** | Phase 10 truthful pending/none_deferred posture |
| **EVID-002** | Insert fake metadata with `clean` & `clamav` | `LocalEvidenceStorageService::storeFile` with real PNG | Protected PNG stored, MIME validated, status pending | **PASS** | Phase 10 truthful pending/none_deferred posture |
| **EVID-003** | Client extension trust | `LocalEvidenceStorageService::validateFile` | Spoofed extension rejected (415/422) | **PASS** | Fails fast on MIME mismatch |
| **EVID-004** | Client size trust | `LocalEvidenceStorageService::validateFile` | File exceeding max limit rejected (413/422) | **PASS** | 10MB default size constraint enforced |
| **EVID-005** | Supabase Storage bucket `public = false` | Files stored under `writable/uploads/evidence/` | Stored outside public document root (`public/`) | **PASS** | Prevents direct HTTP web server bypass |
| **EVID-006** | Student ID match on metadata | `EvidencePolicy::canReadStudentEvidence()` | Owner authorized to access own evidence stream | **PASS** | Authenticated streaming with nosniff |
| **EVID-007** | Supabase Storage RLS | `EvidencePolicy::canReadStudentEvidence()` | Student B denied Student A evidence (403) | **PASS** | Enforces cross-student object isolation |
| **EVID-008** | Supabase Auth session requirement | `EvidencePolicy::canReadStudentEvidence()` | Anonymous request denied (401 Unauthorized) | **PASS** | Valid JWT session strictly required |
| **EVID-009** | Supabase Storage RLS | `EvidencePolicy::canReadStudentEvidence()` | Unauthorized Faculty denied Student A evidence (403) | **PASS** | Restricts access to assigned coordinator |
| **VER-001** | SQL Join over coordinator assignments | Program Coordinator assignment routing query | Student A routes to Coordinator A (BSA) | **PASS** | Deterministic program-scoped reviewer |
| **VER-002** | BSCS Coordinator queue query | `StudentPortfolioPolicy::canView()` & `canVerify()` | In-scope submission visible in verification queue | **PASS** | Coordinator A possesses queue access |
| **VER-003** | BSIT Coordinator query denial | `StudentPortfolioPolicy::canVerify()` | Out-of-scope Coordinator B denied (403 Forbidden) | **PASS** | Cross-program review strictly prevented |
| **VER-004** | Student absence in coordinator assignments | `StudentPortfolioPolicy::canVerify()` | Student denied verifier capabilities (403) | **PASS** | Non-coordinator accounts blocked |
| **VER-005** | Direct SQL `UPDATE status = 'verified'` | MySQL record update + verification event + notification | `status = 'verified'`, `verified_at` set | **PASS** | Coherent approval state transition |
| **VER-006** | Query verified status | `StudentPortfolioPolicy::canView()` for OSAD & Student | Verified record visible to Student & OSAD | **PASS** | Ready for award evaluation |
| **VER-007** | `public.notifications` insert & query | MySQL `notifications` query | Persistent verification notification dispatched | **PASS** | Target notification delivered to owner |
| **VER-008** | `UPDATE notifications SET read_at` | MySQL `notifications` read state isolation | Owner marks notification as read (`read_at`) | **PASS** | Notification read state isolated |
| **VER-009** | Direct SQL `UPDATE status = 'rejected'` | MySQL record update + rejection event | `status = 'rejected'`, remarks in audit event | **PASS** | Rejection workflow persisted |
| **VER-010** | Direct SQL `UPDATE status = 'revision_requested'` | MySQL record update + deficiency event | `status = 'revision_requested'`, remarks logged | **PASS** | Revision requested workflow persisted |
| **VER-011** | Direct SQL `UPDATE status = 'submitted'` | MySQL record update + resubmission event | `status = 'submitted'`, resubmission appended | **PASS** | Preserves prior audit history |
| **VER-012** | Direct SQL `UPDATE status = 'verified'` | MySQL record update + second verified event | `status = 'verified'` reached after revision | **PASS** | Multi-cycle verification complete |
| **VER-013** | Status check | `StudentPortfolioPolicy::canVerify()` | Re-verification of verified record blocked | **PASS** | Duplicate verification prevented |
| **VER-014** | Assignment check | `StudentPortfolioPolicy::canVerify()` | Unassigned personnel denied decision action (403) | **PASS** | Only active coordinators decide |
| **RLS-PORT-001** | PostgreSQL Table RLS on `student_portfolio_records` | `StudentPortfolioPolicy::canView()` & `scopeListQuery()` | Draft records visible ONLY to student owner | **PASS** | Renamed `AUTHZ-PORT-001` |
| **RLS-PORT-002** | PostgreSQL Table RLS on coordinator queue | `StudentPortfolioPolicy::scopeListQuery()` | Coordinator query strictly filtered to assigned program | **PASS** | Renamed `AUTHZ-PORT-002` |
| **RLS-PORT-003** | Supabase Storage RLS | `EvidencePolicy::canReadStudentEvidence()` | Evidence access isolated to owner/coordinator | **PASS** | Renamed `AUTHZ-PORT-003` |
| **AUD-PORT-001** | `public.student_portfolio_verification_events` query | MySQL `student_portfolio_verification_events` query | Full lifecycle actions logged in timeline | **PASS** | Complete audit trail maintained |
| **AUD-PORT-002** | Actor ID check in events | MySQL event query on `actor_profile_id` | Accurate student and coordinator actor attribution | **PASS** | Authoritative user ID logging |
| **AUD-PORT-003** | Timestamp ordering check | Chronological timestamp sorting validation | Ascending event timestamp coherence | **PASS** | Zero timestamp inversions |
| **ORPH-001** | Orphan evidence query | `student_portfolio_evidence` LEFT JOIN check | Zero orphan DB evidence rows | **PASS** | All evidence rows link to valid records |
| **ORPH-002** | Filesystem storage check | Filesystem scan vs `student_portfolio_evidence` | Zero missing physical evidence files on disk | **PASS** | Real protected storage validated |
| **REF-001** | 26 migrations, 56 tables, 98 policies check | Deterministic SHA-256 reference fingerprint check | Reference fingerprint `a7cb...` 100% unchanged | **PASS** | Permanent reference data intact |
