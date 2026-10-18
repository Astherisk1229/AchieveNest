import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../../../../../')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

describe('Non-Teaching Faculty annual reviews are retired', () => {
  it('does not expose NTF workbook pages, services, or endpoints', () => {
    expect(fs.existsSync(path.join(root, 'frontend/src/pages/dean/NtfAnnualReviewWorkbook.jsx'))).toBe(false)
    expect(fs.existsSync(path.join(root, 'frontend/src/services/ntfAnnualReviewService.js'))).toBe(false)
    expect(fs.existsSync(path.join(root, 'backend/app/Controllers/Api/NtfAnnualReviewTemplateController.php'))).toBe(false)
    const routes = read('backend/app/Config/Routes.php')
    expect(routes).not.toContain('hr/ntf-annual-review')
    const retirement = read('backend/app/Phase2/Database/Migrations/2026-10-18-000031_RetireNtfAnnualReviewWorkflow.php')
    expect(retirement).toContain("dropTable('personnel_annual_review_settings'")
    expect(retirement).toContain('area_a_payload IS NOT NULL')
  })

  it('rejects annual review imports for NTF ranking tracks', () => {
    const importer = read('backend/app/Services/AnnualReviewImportService.php')
    expect(importer).toContain('ANNUAL_REVIEW_NOT_APPLICABLE')
    expect(importer).toContain('Annual reviews are only used for Teaching Faculty.')
  })

  it('excludes NTF personnel from the annual review roster and redirects their HR tab', () => {
    const page = read('frontend/src/pages/dean/DeanAnnualReviewEligibilityPage.jsx')
    expect(page).toContain("!== 'NON_TEACHING_FACULTY'")
    const cycles = read('frontend/src/pages/hr-admin/HRRankingCyclesPage.jsx')
    expect(cycles).toContain("stage === 'annual-reviews' && track.personnel_group === 'NON_TEACHING_FACULTY'")
    expect(cycles).toContain("to={`/hr/ranking-cycles?tab=portfolio-evaluation&period=")
  })
})
