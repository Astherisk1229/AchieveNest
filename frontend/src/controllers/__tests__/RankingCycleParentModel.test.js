import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('Ranking Cycle parent model', () => {
  it('preserves period IDs and attaches tracks through a parent foreign key', () => {
    const migration = read('backend/app/Database/Migrations/2026-09-15-000002_CreateRankingCycles.php')
    expect(migration).toContain('ranking_cycle_id VARCHAR(36) NULL')
    expect(migration).toContain('uq_ranking_cycle_group_track (ranking_cycle_id, personnel_group)')
    expect(migration).not.toMatch(/UPDATE personnel_evaluations|UPDATE personnel_evaluation_roots|UPDATE personnel_annual_review_imports/)
  })

  it('creates one compatibility cycle per historical period without pairing by name', () => {
    const migration = read('backend/app/Database/Migrations/2026-09-15-000002_CreateRankingCycles.php')
    expect(migration).toContain('one cycle per period')
    expect(migration).toContain('legacy_source_period_id')
    expect(migration).not.toContain('GROUP BY period_name')
  })

  it('returns nested group-specific tracks from cycle APIs', () => {
    const service = read('backend/app/Services/RankingCycleService.php')
    expect(service).toContain("'tracks'=>$tracks")
    expect(service).toContain('personnel_group')
    const routes = read('backend/app/Config/Routes.php')
    expect(routes).toContain("'hr/ranking-cycles'")
  })

  it('requires an explicit cycle in the track creation form', () => {
    const page = read('frontend/src/pages/hr-admin/PersonnelEvaluationSetupPage.jsx')
    expect(page).toContain('Select a ranking cycle for this track.')
    expect(page).toContain('value={form.ranking_cycle_id}')
  })
})
