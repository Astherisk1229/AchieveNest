import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../../../../..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

describe('Phase 5 item 2: scoring visibility', () => {
  it('registers the unscored route and controller method', () => {
    expect(read('backend/app/Config/Routes.php')).toContain("osad/scoring/unscored")
    expect(read('backend/app/Controllers/Api/ApprovedAchievementScoringController.php')).toContain('public function unscored')
  })
  it('does not expose the scoring recovery panel in the OSAD awards interface', () => {
    const page = read('frontend/src/pages/osad-admin/OSADAwardsAndCriteriaPage.jsx')
    expect(page).not.toContain('ScoringHealthPanel')
    expect(page).not.toContain('Scoring health')
  })
  it('coordinator queue no longer drops unenrolled students', () => {
    const s = read('backend/app/Controllers/Api/StudentPortfolioController.php')
    expect(s).toMatch(/spe\.is_active = 1', 'left'\)/)
    expect(s).toContain("'ap.id = spe.academic_program_id', 'left'")
  })
  it('coordinator is told when scoring is deferred', () => {
    const page = read('frontend/src/pages/personnel/program-coordinator/CoordinatorDashboardPage.jsx')
    expect(page).toContain("scoring_status === 'DEFERRED'")
    expect(page).not.toContain('OSAD can rescore this record from Awards & Criteria')
  })
})
