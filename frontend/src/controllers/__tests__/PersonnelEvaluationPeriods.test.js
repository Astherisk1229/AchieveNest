import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

describe('Personnel evaluation period architecture', () => {
  it('keeps criteria governance routable without a separate Ranking Setup navigation item', () => {
    expect(read('frontend/src/App.jsx')).toContain('/hr/personnel-evaluation-setup')
    expect(read('frontend/src/config/navigationCatalog.js')).not.toContain("label: 'Ranking Setup'")
    expect(read('frontend/src/config/navigationCatalog.js')).toContain("label: 'Ranking & Evaluation'")
  })

  it('uses server-managed period identity for Faculty submission', () => {
    const controller = read('frontend/src/controllers/PersonnelPortfolioController.js')
    expect(controller).toContain('evaluation_period_id: evaluationPeriodId')
    expect(controller).not.toContain('An authoritative portfolio evaluation period is required before submission.')
    const backend = read('backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php')
    expect(backend).toContain("$json['evaluation_period_id']")
    expect(backend).toContain('resolveForSubmission')
  })

  it('shows HR-scheduled periods to Personnel without enabling submission before HR opens them', () => {
    const periods = read('backend/app/Services/PersonnelEvaluationPeriodService.php')
    expect(periods).toContain("($row['status'] ?? '') === 'DRAFT'")
    expect(periods).toContain("$closeAt >= $now")
    const portfolioPage = read('frontend/src/pages/personnel/PersonnelPortfolioPage.jsx')
    expect(portfolioPage).toContain("evaluationPeriod.can_submit ? 'Open for submission' : 'Upcoming'")
    expect(portfolioPage).toContain('disabled={!evaluationPeriod.can_submit')
  })

  it('automatically applies scheduled opening through the normal period lifecycle on HR and Personnel reads', () => {
    const periods = read('backend/app/Services/PersonnelEvaluationPeriodService.php')
    expect(periods).toContain("$this->transition((string) $period['id'], 'open-submissions'")
    expect(periods).toContain("$evaluationType === 'RANKING_PROMOTION') $this->openDueScheduledSubmissions($personnelGroup)")
    const cycles = read('backend/app/Services/RankingCycleService.php')
    expect(cycles).toContain('$this->periods->openDueScheduledSubmissions();')
    expect(read('frontend/src/pages/hr-admin/HRDashboardPage.jsx')).toContain('window.setInterval(() => { void load() }, 60_000)')
    expect(read('frontend/src/pages/personnel/PersonnelPortfolioPage.jsx')).toContain('window.setInterval(() => { void refreshScheduledPeriod() }, 60_000)')
  })

  it('removes hardcoded active-period labels from active Faculty and HR dashboards', () => {
    expect(read('frontend/src/pages/personnel/PersonnelDashboardPage.jsx')).not.toContain('AY 2025–2026')
    expect(read('frontend/src/pages/hr-admin/HRDashboardPage.jsx')).not.toContain('AY 2025–2026')
  })

  it('persists period snapshots and semester on submission', () => {
    const backend = read('backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php')
    for (const field of ['evaluation_period_id', 'semester', 'period_name_snapshot', 'evaluation_type_snapshot', 'coverage_label_snapshot', 'evaluation_scale_version_id', 'personnel_group_snapshot', 'criteria_snapshot', 'position_title_snapshot']) expect(backend).toContain(`'${field}'`)
  })

  it('keeps personnel periods isolated from student and OSAD routes', () => {
    const routes = read('backend/app/Config/Routes.php')
    expect(routes).toContain("'personnel/evaluation-period/current'")
    expect(routes).toContain("'hr/personnel-evaluation-periods'")
    expect(routes).not.toMatch(/osad\/personnel-evaluation-periods|student\/personnel-evaluation-periods/)
  })
})
