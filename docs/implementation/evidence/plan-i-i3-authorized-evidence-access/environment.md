# Phase I3 Environment & Runtime Specification

## 1. System Environment
- **Project**: AchieveNest — Notre Dame of Marbel University (NDMU)
- **Subsystem**: Personnel Evaluation Track — Plan I (Phase I3)
- **Runtime Stack**: PHP 8.2+ (CodeIgniter 4) / React 18 (Vite & Vitest v3.2.7)
- **Protected Evidence Location**: `writable/uploads/personnel_evidence/`
- **Streaming Handlers**:
  - `GET /api/v1/evidence/personnel/{id}/preview` (Inline streaming)
  - `GET /api/v1/evidence/personnel/{id}/download` (Attachment streaming)
  - `GET /api/v1/evidence/personnel/{id}` (Metadata retrieval)

## 2. Test Baseline
- **Phase I3 Focused Suite**: `PersonnelAuthorizedEvidenceAccessI3.test.jsx` (30/30 tests passed)
- **Combined I0–I3 Suite**: 128/128 tests passed
- **Full Master Suite**: 143 test files / 1306 tests passed / 0 failures

## 3. Storage & Streaming Invariants
- Protected root directory is outside webroot (`writable/uploads/personnel_evidence/`).
- No direct static file URLs (`/uploads/...`) exist in production routes.
- Access strictly requires server-side identity verification via `evidence_id` UUID.
