# OSAD Awards & Scoring Criteria — Phase F Potential Candidate Generation Report

> **Executive Scope:** Award eligibility evaluation, version-sourced candidate threshold ($\ge 80.00\%$), dual-pathway convergence (Automated Portfolio vs. Dean Direct Nomination), dense deterministic ranking within Award + Award Cycle scope, zero synthetic score injection, and verification evidence for **Phase F: Eligibility, Candidate Generation & Ranking**.

---

## 1. Executive Summary

Phase F implements the candidate generation and ranking layer of AchieveNest's Awards & Scoring Criteria subsystem:
1. **Separation of Eligibility and Scoring**: Implemented `AwardCandidateGenerationService.php` with `evaluateEligibility()` to evaluate student active account status, graduating-only restrictions, gender restrictions, and cycle validity separately from point calculation.
2. **Version-Sourced Threshold Enforcement**: Evaluates automated candidates strictly against `award_scoring_model_versions.candidate_threshold_percent` (80.00% default). Students below threshold are classified as *Not Qualified* and excluded from the automated candidate queue.
3. **Dean Nomination Pathway Preservation**: Active College Deans can nominate students across their college jurisdiction. Nominations bypass the automated 80% threshold without synthetic score injection (`potential_score` remains `null` or reflects actual unboosted portfolio points).
4. **Transparent Review Queue Convergence**: Both automated and Dean nomination pathways converge seamlessly into the OSAD Candidate Review Queue (`award_interview_eligibilities`) while retaining explicit intake provenance.
5. **Deterministic Dense Ranking**: Employs deterministic `DENSE_RANK` scoring within Award + Award Cycle scope. Ties are ranked equally with stable secondary ordering without imposing an artificial Top-N truncation.
6. **Zero Scoring Engine Disruption**: Consumes existing `AwardEvaluationService` and `AwardScoringRuleEngine` outputs with 100% backward compatibility.
7. **Full Replay Parity**: All 16 MySQL defense migrations replayed cleanly from zero (`16/16 PASS`), `verify:awards-phase-f` passed (`9/9 PASS`), and master backend regressions passed (`8/8 suites PASS`).

---

## 2. Authoritative Repository Freeze State (F1)

```text
Branch:                  audit/project-architecture-linkage
HEAD SHA:                ea987bf32c208cc99ebe1a60b989c0c09ca83e98
Latest Commit:           ea987bf docs(audit): close osad refinement regression and replay
Remote Origin:          https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Working Tree:            Clean baseline with Phase F candidate services, tests & verification
```

---

## 3. Pre-Migration WAMP Backup & Disposable Clone (F2–F3)

```text
Backup Path:             backend/database/mysql-defense/achievenest_local_pre_osad_awards_phase_f_backup.sql
Backup Engine:           mysqldump (MySQL 8.4.7)
Backup Status:           Verified, non-empty, successfully restored to disposable clone
Disposable Clone DB:     achievenest_awards_phase_f_test
Validation:              All tables and records restored and verified
```

---

## 4. Governance & Eligibility Contracts (F8–F14)

### 4.1 Automated Candidate Pathway Contract
$$\text{Automatic Potential Candidate} \iff \begin{cases} \text{Student Account Status} = \text{'active'} \\ \text{Award Active \& Published Version Available} \\ \text{Graduating/Gender Eligibility} = \text{PASS} \\ \text{Portfolio Potential Score} \ge \text{candidate\_threshold\_percent (80.00\%)} \end{cases}$$

### 4.2 Dean Direct Nomination Contract
- **Authorization**: Active College Dean only.
- **Scope**: Students enrolled in Academic Programs under the Dean's College.
- **Threshold Bypass**: Permitted to advance students for OSAD review regardless of portfolio threshold.
- **Zero Synthetic Score Invariant**: Nominee's `potential_score` is strictly preserved as `null` or their actual earned portfolio score. No fake 80.00% score is ever injected.

### 4.3 Ranking & Scope Invariant
- **Scope**: Partitioned strictly by $\langle \text{award\_definition\_id}, \text{cycle\_id} \rangle$. Cross-award leaderboards are strictly prohibited.
- **Algorithm**: Deterministic dense ranking on `potential_score DESC`, secondary ordering by `full_name ASC`.

---

## 5. Candidate Generation Service Implementation (`AwardCandidateGenerationService.php`)

Implemented at [AwardCandidateGenerationService.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardCandidateGenerationService.php):
- `evaluateEligibility(array $student, array $award, ?array $version)`: Validates status, graduation status, and gender criteria.
- `generatePotentialCandidates(string $cycleId, string $awardId, ?string $evaluatorProfileId)`: Iterates eligible students, triggers `AwardEvaluationService`, and updates candidate records.
- `getCandidatesReviewQueue(string $cycleId, string $awardId)`: Fetches converged review queue with `DENSE_RANK` rank positions.

---

## 6. Phase F Verification Results (`spark verify:awards-phase-f`)

```text
========================================================================
AchieveNest — Phase F Eligibility, Candidate Generation & Ranking
========================================================================
  ELIG-001     Active student passes basic account eligibility check [PASS]
  ELIG-002     Inactive / suspended student rejected by eligibility check [PASS]
  THRESH-001   Candidate threshold sourced from version model (80.00%) [PASS]
  AUTO-001     Student with >=80.00% potential score qualifies as Potential Candidate [PASS]
  AUTO-002     Below threshold student outcome classified Not Qualified [PASS]
  DEAN-001     Dean nomination creates eligibility record with zero synthetic points [PASS]
  CONV-001     Review queue converges both automated and nomination pathways [PASS]
  RANK-001     Candidates are ranked deterministically with dense ranking [PASS]
  ISOL-001     Cross-award ranking queues strictly isolated per award definition [PASS]
========================================================================
Phase F Verification Summary: 9 Passed, 0 Failed
========================================================================
```

---

## 7. Full Replay & Multi-Suite Regression Evidence

- **MySQL Defense Replay**: Applied all 16 migrations from zero (`000001` $\rightarrow$ `000016`) into `achievenest_awards_phase_f_mysql_replay` with **100% exit code 0** (15 awards, 40 criteria, 15 versions, 56 mapping rules, 40 scoring rules).
- **Phase C Suite**: `spark verify:awards-phase-c` $\rightarrow$ **`13 / 13 PASSED`**.
- **Phase D Suite**: `spark verify:awards-phase-d` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase E Suite**: `spark verify:awards-phase-e` $\rightarrow$ **`8 / 8 PASSED`**.
- **Phase F Suite**: `spark verify:awards-phase-f` $\rightarrow$ **`9 / 9 PASSED`**.
- **Phase G Academic Structure Closure**: `spark verify:phase-g-closure` $\rightarrow$ **`24 / 24 PASSED`**.
- **Master Backend Regression**: `spark test:phase15-backend` $\rightarrow$ **`8 / 8 Suites PASSED`** (`46/46 Phase 14A`, `30/30 Phase 14B`).
- **Frontend Vitest Suite**: `npm test -- --run` $\rightarrow$ **`38 / 38 Test Files, 236 / 236 Tests PASSED`**.
- **Frontend Quality**: `0 lint errors`, production build completed in `6.06s`.

---

## 8. Final Phase F Gate Status

```text
PHASE F: PASS — POTENTIAL CANDIDATE GENERATION VERIFIED
```
