# Phase I2 Environment & Configuration

## 1. System Environment
- **Project**: AchieveNest — Notre Dame of Marbel University (NDMU)
- **Subsystem**: Personnel Evaluation Track — Plan I (Phase I2)
- **Operating System**: Windows
- **Backend Architecture**: CodeIgniter 4 / PHP 8.2+ with local MySQL
- **Frontend Architecture**: React 18 / Vite / Vitest v3.2.7
- **Evidence Storage Location**: Protected local filesystem root (`writable/uploads/personnel_evidence/`)

## 2. Phase I2 Test Execution Baseline
- **Focused Test Suite**: `PersonnelEvidenceIdentityI2.test.jsx`, `PersonnelSecureUploadPipelineI1.test.jsx`, `PersonnelEvidenceStorageAuditI0.test.jsx` (86/86 passed)
- **Master Regression Suite**: 142 test files, 1276 passed, 0 failures, 0 regressions.
- **Database Migrations**: Additive migration `2026-09-09-000067_AddEvidenceIdToPersonnelEvaluationItems.php` applied.

## 3. Storage & Integrity Invariants
- Storage keys follow UUID partitioned paths: `personnel/{personnel_id}/evidence/{evidence_id}.{ext}`.
- Database primary key for evidence: `evidence_id` (UUIDv4).
- Hash Algorithm: SHA-256 (64 hex characters) calculated server-side upon upload.
- Duplicate Content Signal: Advisory only; non-blocking; preserves multi-submission workflows.
