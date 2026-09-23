import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const service = read('backend/app/Services/PersonnelEvaluationPeriodService.php')
const controller = read('backend/app/Controllers/Api/PersonnelEvaluationPeriodController.php')
const migration = read('backend/app/Database/Migrations/2026-09-15-000003_ScopePersonnelPeriodConcurrencyByTrack.php')

describe('ranking track lifecycle concurrency', () => {
  it('permits Faculty and Non-Teaching Faculty tracks to be open concurrently', () => {
    const up = migration.slice(migration.indexOf('public function up'), migration.indexOf('public function down'))
    expect(up).toContain("CONCAT(evaluation_type, ':', personnel_group)")
    expect(up).toContain('uq_personnel_period_open_track')
    expect(up).not.toContain('ADD UNIQUE KEY uq_personnel_period_open_type')
  })

  it('scopes submission, evaluation, and coverage overlap checks to the same track classification', () => {
    const operational = service.slice(service.indexOf('private function validateOperational'), service.indexOf('private function validateScale'))
    expect((operational.match(/where\('personnel_group'/g) || [])).toHaveLength(4)
    for (const code of ['OPEN_PERIOD_CONFLICT', 'SUBMISSION_WINDOW_OVERLAP', 'EVALUATION_WINDOW_OVERLAP', 'COVERAGE_OVERLAP']) expect(operational).toContain(code)
  })

  it('keeps each track schedule independent and lifecycle transitions manual', () => {
    for (const field of ['submission_open_at', 'submission_close_at', 'evaluation_start_at', 'evaluation_end_at']) expect(service).toContain(field)
    expect(service).toContain("'open-submissions' => ['from' => 'DRAFT', 'to' => 'OPEN_FOR_SUBMISSION']")
    expect(service).not.toMatch(/cron|automaticStatus|dateDrivenTransition/i)
  })

  it('resolves zero or one current track for the caller classification', () => {
    expect(service).toContain("'personnel_group' => $personnelGroup")
    expect(controller).toContain("=== 'non_academic' ? 'NON_TEACHING_FACULTY' : 'FACULTY'")
    expect(service).toContain('return $rows[0] ?? null')
  })
})
