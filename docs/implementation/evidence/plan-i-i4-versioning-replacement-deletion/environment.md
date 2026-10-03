# Phase I4 Environment & Configuration

## 1. System Environment
- **Project**: AchieveNest — Notre Dame of Marbel University (NDMU)
- **Subsystem**: Personnel Evaluation Track — Plan I (Phase I4)
- **Runtime Stack**: PHP 8.2+ (CodeIgniter 4) / React 18 (Vite & Vitest v3.2.7)
- **Protected Storage Root**: `writable/uploads/personnel_evidence/`

## 2. Test Execution Baseline
- **Phase I4 Focused Test Suite**: `PersonnelEvidenceVersioningI4.test.jsx` (17/17 tests passed)
- **Combined I0–I4 Suite**: 133/133 tests passed
- **Full Master Test Suite**: 144 test files / 1323 tests passed / 0 failures

## 3. Governance Boundaries Frozen in I4
- Evidence replacement is strictly limited to editable working portfolios (drafts, reopened revisions).
- Replacing evidence mints a new canonical UUID (`evidence_id`) and distinct physical storage key.
- Previously submitted snapshots (e.g. Version 1) preserve immutable linkage to original evidence files.
- Owner-authorized complete deletion unlinks physical files from protected storage and cleans DB references.
