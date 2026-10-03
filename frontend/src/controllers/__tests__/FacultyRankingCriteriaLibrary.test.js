import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('Faculty Ranking criteria library integration', () => {
  const page = read('frontend/src/pages/hr-admin/PersonnelEvaluationSetupPage.jsx')
  const periodService = read('backend/app/Services/PersonnelEvaluationPeriodService.php')
  const submission = read('backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php')
  const rubric = read('backend/app/Services/RubricAdministrationService.php')
  const migration = read('backend/app/Database/Migrations/2026-09-11-000004_AddRankingCriteriaClassification.php')
  const routes = read('backend/app/Config/Routes.php')
  const controller = read('backend/app/Controllers/Api/EvaluationScaleController.php')
  const renderer = read('frontend/src/pages/hr-admin/ranking-criteria/CriteriaSheetRenderer.jsx')
  const sourceSeed = read('backend/app/Database/Migrations/2026-09-12-000006_SeedSourceDrivenRankingCriteria.php')

  it('renders both personnel groups and auto-binds group-compatible criteria', () => {
    expect(page).toContain('Personnel Group')
    expect(page).toContain('NON_TEACHING_FACULTY')
    expect(page).toContain('fetchActiveRankingCriteria(personnel_group)')
    expect(periodService).toContain('CRITERIA_GROUP_MISMATCH')
    expect(routes).toContain('admin/ranking-criteria/active')
    for (const code of ['CRITERIA_NOT_CONFIGURED', 'MULTIPLE_ACTIVE_CRITERIA', 'CRITERIA_LOOKUP_FAILED']) expect(controller).toContain(code)
  })

  it('provides an authenticated structured criteria hierarchy', () => {
    expect(rubric).toContain('getScaleVersionHierarchy')
    for (const key of ['areas', 'categories', 'subcategories', 'criteria', 'options']) expect(rubric).toContain(key)
    expect(renderer).toContain('Scoring Mode: MANUAL')
    expect(renderer).toContain("option.option_group_code === group).length}")
    expect(sourceSeed).toContain('GUEST_LECTURER_MATRIX')
    expect(sourceSeed).toContain('PUBLICATION_MATRIX')
  })

  it('snapshots criteria and personnel context at first submission', () => {
    for (const field of ['criteria_snapshot', 'personnel_group_snapshot', 'position_title_snapshot', 'college_name_snapshot', 'department_name_snapshot']) expect(submission).toContain(`'${field}'`)
    expect(submission).toContain("? 'Dean'")
  })

  it('uses only additive MySQL schema changes', () => {
    expect(migration).toContain("'type'=>'JSON'")
    expect(migration).not.toMatch(/public\.|::uuid|::text|gen_random_uuid/i)
  })
})
