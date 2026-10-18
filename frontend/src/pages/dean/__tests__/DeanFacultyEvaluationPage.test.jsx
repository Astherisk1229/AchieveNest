import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('unified Dean Faculty Evaluation workspace', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../DeanFacultyEvaluationPage.jsx'), 'utf8')
  const queue = fs.readFileSync(path.resolve(__dirname, '../DeanPortfolioEvaluationTab.jsx'), 'utf8')

  it('defaults to Annual Review and keeps all three tab states in the URL', () => {
    expect(source).toContain("requestedTab === 'portfolio' || params.has('evaluation') ? 'portfolio' : 'annual'")
    expect(source).toContain('>Annual Reviews</button>')
    expect(source).toContain('Portfolio Evaluation')
    expect(source).toContain('Evaluation Summaries')
    expect(source).toContain("updateParams({ tab: nextTab")
    expect(source).toContain('hidden={tab !== \'annual\'}')
    expect(source).toContain('hidden={tab !== \'portfolio\'}')
    expect(source).toContain('hidden={tab !== \'summaries\'}')
    expect(source).toContain('summaryMode overviewData={overview.data}')
    expect(source).toContain('visitedTabs')
  })

  it('uses the scoped workflow API for cycle metadata, portfolio counts, and cross-links', () => {
    expect(source).toContain("getDeanReviews({ status: 'all',")
    expect(source).toContain('overview.data.counts.needs_review')
    expect(source).toContain('portfolioByPersonnel')
    expect(source).toContain('onViewPortfolio={openPortfolio}')
    expect(source).toContain('onViewAnnualReview={openAnnualReview}')
    expect(queue).toContain('View Annual Review &amp; Eligibility')
  })

  it('renders HR-managed period schedules and provides a no-cycle state', () => {
    expect(source).toContain('ranking_cycle')
    expect(source).toContain('cycle?.display_name || period.name')
    expect(source).toContain('cycle?.academic_year || period.academic_year')
    expect(source).toContain('cycle?.lifecycle_status?.label')
    expect(source).toContain('submission_open_at')
    expect(source).toContain('evaluation_start_at')
    expect(source).toContain('No active faculty ranking period')
  })

  it('binds both tabs to the selected period in the URL', () => {
    expect(source).toContain('cycleId={cycle?.id || undefined}')
    expect(source).toContain("trackKey={cycle?.id ? 'faculty' : undefined}")
    expect(source).not.toContain("params.get('cycleId')")
    expect(source).toContain("params.get('period')")
    expect(source).toContain('evaluation_period_id: selectedPeriodId')
    expect(source).toContain('View previous periods')
    expect(source).toContain('period: value === \'current\' ? \'\' : value')
  })

  it('loads HR history through the Dean-authorized period endpoint', () => {
    expect(source).toContain('listDeanEvaluationPeriods()')
    expect(source).toContain('const previousPeriods = history.periods')
  })
})
