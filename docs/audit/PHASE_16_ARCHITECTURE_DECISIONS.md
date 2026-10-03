# AchieveNest — Phase 16: Architecture Decision Records (ADR)

> **Scope:** Authoritative record of key structural, security, data, and boundary architecture decisions established and ratified throughout Phases 0–16.  
> **Status:** `RATIFIED / ACTIVE`  
> **Target Branch:** `audit/project-architecture-linkage`  
> **Starting HEAD:** `f97453d`

---

# 1. ADR-001: Local-Defense Auth as Primary Identity Engine
- **Context:** Previous iterations relied on remote Supabase cloud authentication which created offline failure modes and external network dependencies.
- **Decision:** Establish native CodeIgniter 4 session registry (`local_auth_sessions`), bcrypt password hashing, and local bearer token authentication as the sole authoritative auth engine for all 10 demo personas.
- **Consequences:** 100% offline functionality, 0 cloud dependencies, zero external tokens.

---

# 2. ADR-002: Preservation of Dormant Supabase Compatibility Stubs
- **Context:** Removing all Supabase source imports immediately risked cascading syntax breaks in legacy test fixtures.
- **Decision:** Retain `SupabaseAuthService.php`, `SupabaseAdminAuthService.php`, and `frontend/src/config/supabase.js` as dormant local stubs with zero outbound network calls until a dedicated SDK sunset phase.
- **Consequences:** Clean backwards compatibility with zero cloud network traffic.

---

# 3. ADR-003: Academic Hierarchy Structure (College → Academic Program)
- **Context:** Legacy models mixed unstructured "departments" with degree programs and non-academic offices.
- **Decision:** Structure academic units strictly as `College` → `Academic Program`, with administrative units managed independently.
- **Consequences:** Clean scoping for Deans (College level) and Program Coordinators (Academic Program level).

---

# 4. ADR-004: Elimination of Department Secretary Business Role
- **Context:** The "Department Secretary" role was identified as a superseded institutional concept that conflicted with canonical Dean oversight and Coordinator verification queues.
- **Decision:** Retire all active "Department Secretary" business logic and UI; modernize portfolio submission to "Submit to Dean"; retain `normalizeRoleContext('department_secretary') -> 'dean'` and `/depsec` redirect strictly for backward compatibility.
- **Consequences:** Clear governance boundaries; zero active `submitToDepSec` symbols in codebase.

---

# 5. ADR-005: Potential Award Candidates vs Final Awardees
- **Context:** Early UI models incorrectly labeled automated 80% scoring outputs as "Final Awardees".
- **Decision:** Enforce the term **Potential Award Candidates** (or Award Candidates eligible for interview) across backend and frontend models. Automated scoring never finalizes awards.
- **Consequences:** Precise domain semantics; preserves institutional OSAD interview and evaluation integrity.

---

# 6. ADR-006: Intentional Scope Removal of Digital Barcode ID Card
- **Context:** Digital Barcode ID Card modal was an experimental prototype feature outside the core portfolio, verification, and awards mission.
- **Decision:** Permanently delete `DigitalBarcodeIDCardModal.jsx` and strip trigger buttons and state from Student and Personnel dashboards in Phase 14 Batch 2.
- **Consequences:** Streamlined codebase, zero unused modal bundles, reduced attack surface.

---

# 7. ADR-007: Deferred Malware Scanning Posture
- **Context:** Production virus/malware scanning requires external daemon binaries (e.g. ClamAV) which are not universally packaged in local development environments.
- **Decision:** Standardize `security_status: pending` and `malware_scanner: none_deferred` across evidence file ingestion, while enforcing strict MIME type validation and protected filesystem storage.
- **Consequences:** Transparent, honest security status without claiming inactive capabilities.

---

# 8. ADR-008: Untracking Generated Dependencies & Archiving Database Dumps
- **Context:** Large `.dump` files and generated `node_modules` / `.vite` caches were bloating Git tracking.
- **Decision:** Untrack all generated dependencies and caches; move pre-audit database dump to `archive/database/`, verify SHA-256 (`7EBF9B8CA823C504AA5CED2293AF65970A14841DF9AC669984B9BB79375EA95A`), and add comprehensive `.gitignore` rules.
- **Consequences:** Clean VCS tree, fast clones, preserved historical data.
