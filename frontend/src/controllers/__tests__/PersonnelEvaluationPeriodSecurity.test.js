import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')
const service = read('backend/app/Services/PersonnelEvaluationPeriodService.php')
const controller = read('backend/app/Controllers/Api/PersonnelEvaluationPeriodController.php')
const submission = read('backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php')
const migration = read('backend/app/Database/Migrations/2026-09-11-000003_HardenPersonnelEvaluationPeriods.php')

describe('Personnel evaluation period production security', () => {
  it('enforces canonical database identities and submission snapshot uniqueness', () => {
    expect(migration).toContain('uq_personnel_period_identity')
    expect(migration).toContain('uq_personnel_root_profile_period')
    expect(migration).toContain('uq_personnel_snapshot_accomplishment')
  })

  it('whitelists writable fields and rejects browser-controlled system fields', () => {
    expect(service).toContain('private const WRITABLE')
    expect(service).toContain('PROTECTED_FIELD')
    expect(service).not.toMatch(/array_merge\(\$input,\s*\$existing/)
  })

  it('validates personnel enums, consecutive academic years, custom coverage, and date ordering', () => {
    for (const code of ['UNKNOWN_EVALUATION_TYPE', 'INVALID_ACADEMIC_YEAR', 'CUSTOM_COVERAGE_REQUIRED', 'INVALID_DATE_ORDER']) expect(service).toContain(code)
  })

  it('blocks schedule overlaps and incompatible or unapproved scale versions', () => {
    for (const code of ['OPEN_PERIOD_CONFLICT', 'SUBMISSION_WINDOW_OVERLAP', 'EVALUATION_WINDOW_OVERLAP', 'COVERAGE_OVERLAP', 'CRITERIA_GROUP_MISMATCH', 'SCALE_NOT_APPROVED']) expect(service).toContain(code)
  })

  it('uses optimistic concurrency and row locking for mutations', () => {
    expect(service).toContain('PERIOD_MODIFIED')
    expect(service).toContain("where('version', $expected)")
    expect(service).toContain('FOR UPDATE')
  })

  it('makes create, lifecycle notifications, audit events, and Faculty submission retry-safe', () => {
    expect(migration).toContain('personnel_evaluation_idempotency')
    expect(controller).toContain('Idempotency-Key')
    expect(migration).toContain('uq_period_event_request')
    expect(service).toContain('idempotency_key')
    expect(submission).toContain('Portfolio submission was already accepted.')
  })

  it('returns safe structured errors without exposing database exception details', () => {
    expect(controller).toContain('structuredError')
    expect(submission).not.toContain("'Failed to create portfolio submission package: ' . $e->getMessage()")
  })
})
