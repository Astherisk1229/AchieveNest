import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('Ranking Setup version governance', () => {
  it('renders the active route as a two-workspace ranking setup', () => {
    const page = read('frontend/src/pages/hr-admin/PersonnelEvaluationSetupPage.jsx')
    expect(page).toContain("['periods','Ranking Periods']")
    expect(page).toContain("['criteria','Criteria Sheets']")
    expect(page).toContain('Create New Criteria Version')
    expect(page).toContain('Version History')
    expect(page).toContain('CriteriaSheetRenderer')
    expect(page).toContain('Preview Scoring')
    const renderer = read('frontend/src/pages/hr-admin/ranking-criteria/CriteriaSheetRenderer.jsx')
    expect(renderer).toContain('SeminarLevelTable')
    expect(renderer).toContain('SharedCapTable')
    expect(renderer).toContain('YearsOfServiceTable')
  })

  it('uses the established evaluation-scale API for cloning and publication', () => {
    const service = read('frontend/src/services/portfolioConfigurationService.js')
    expect(service).toContain('/admin/evaluation-scales/versions/${encodeURIComponent(sourceVersionId)}/clone')
    const backend = read('backend/app/Services/RubricAdministrationService.php')
    expect(backend).toContain('FOR UPDATE')
    expect(backend).toContain("'version_superseded'")
    expect(backend).toContain("'version_published'")
    expect(backend).toContain('saveDraft')
    expect(backend).toContain('compareVersions')
  })
})
