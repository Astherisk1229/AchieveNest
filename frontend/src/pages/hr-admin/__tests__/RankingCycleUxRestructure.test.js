import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const frontendRoot = path.resolve(import.meta.dirname, '../../..')
const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8')

describe('Ranking Period UX restructure', () => {
  it('provides the five top-level tabs and preserves selected period and category in URL state', () => {
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    const navigation = read('utils/hrRankingNavigation.js')
    for (const label of ['Ranking Periods', 'Annual Reviews', 'Portfolio Evaluation', 'Evaluation Summaries', 'Evaluation Criteria']) expect(navigation).toContain(`label: '${label}'`)
    expect(workspace).toContain("next.set('period', period)")
    expect(workspace).toContain("next.set('track', group)")
    expect(workspace).toContain('setSearchParams(next)')
    expect(workspace).toContain('SubmissionsStage')
  })

  it('counts HR portfolio work from server-authorized evaluation actions only', () => {
    const page = read('pages/hr-admin/ranking-cycle-stages/EvaluationStage.jsx')
    expect(page).toContain('needsHrAction')
    expect(page).toContain("['start_evaluation', 'evaluate_items']")
    expect(page).toContain('No portfolios need HR action.')
  })

  it('enables HR-only annual-review selection, category filtering, and eligibility visibility', () => {
    const page = read('pages/dean/DeanAnnualReviewEligibilityPage.jsx')
    expect(page).toContain("else if (embedded) setEmbeddedPersonnelId(String(id))")
    for (const category of ['All HR-assigned personnel', 'Dean-role Faculty', 'Non-Teaching Personnel']) expect(page).toContain(category)
    expect(page).toContain('const submissionReadiness = eligibility.submission_readiness_status || eligibility.eligibility_status')
    expect(page).toContain('label={submissionReadiness === \'eligible\' ? \'Ready to submit\' : null}')
  })

  it('provides evaluation summaries with a college filter backed by returned result records', () => {
    const stage = read('pages/hr-admin/ranking-cycle-stages/ResultsStage.jsx')
    expect(stage).toContain('Evaluation Summaries')
    expect(stage).toContain('Filter by college')
    expect(stage).toContain("searchParams.get('summary_college')")
    expect(stage).toContain('person.college_name')
  })

  it('exposes one cycle-centric HR navigation entry', () => {
    const navigation = read('config/navigationCatalog.js')
    expect(navigation).toContain("label: 'Ranking & Evaluation'")
    expect(navigation).toContain("path: '/hr/ranking-cycles'")
    expect(navigation).not.toContain("label: 'Portfolio Evaluations'")
    expect(navigation).not.toContain("label: 'Rank Assignment Logs'")
  })

  it('routes cycle, track, and stage context through the period workspace', () => {
    const app = read('App.jsx')
    expect(app).toContain('path="/hr/ranking-cycles/:cycleId/:trackKey/:stage"')
    const context = read('components/ranking/RankingCycleContext.jsx')
    for (const stage of ['Annual Reviews', 'Submissions', 'Evaluation', 'Results']) {
      expect(context).toContain(stage)
    }
    expect(context).not.toContain("['overview','Overview']")
    expect(context).not.toContain("['evaluations','Evaluations']")
  })

  it('opens a cycle in the unified workspace and preserves legacy links', () => {
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    expect(workspace).toContain("'annual-reviews'")
    expect(workspace).toContain("overview: 'annual-reviews'")
    expect(workspace).toContain("evaluations: 'evaluation'")
    expect(workspace).not.toContain('Open track')
  })

  it('keeps Annual Review outside the evaluation queue', () => {
    const queue = read('pages/hr-admin/HREvaluationSubmissionsPage.jsx')
    expect(queue).not.toContain('ImportWorkspace')
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    expect(workspace).toContain('AnnualReviewsStage')
  })

  it('uses one stage-owned component for each workspace job', () => {
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    for (const component of ['AnnualReviewsStage', 'SubmissionsStage', 'EvaluationStage', 'ResultsStage']) expect(workspace).toContain(component)
    expect(workspace).not.toContain('HREvaluationSubmissionsPage')
    expect(read('pages/hr-admin/ranking-cycle-stages/SubmissionsStage.jsx')).toContain("'submissions'")
    expect(read('pages/hr-admin/ranking-cycle-stages/EvaluationStage.jsx')).toContain("'evaluation'")
    expect(read('pages/hr-admin/ranking-cycle-stages/ResultsStage.jsx')).toContain("'results'")
  })

  it('renders workspace actions only from server-derived permissions', () => {
    for (const file of ['SubmissionsStage.jsx', 'EvaluationStage.jsx', 'ResultsStage.jsx']) {
      expect(read(`pages/hr-admin/ranking-cycle-stages/${file}`)).toContain('allowed_actions')
    }
  })

  it('preserves existing evaluation transitions and classification-aware finalization', () => {
    const evaluation = read('pages/hr-admin/ranking-cycle-stages/EvaluationStage.jsx')
    for (const call of ['hrEvaluationService.start', 'hrEvaluationService.returnForRevision', 'hrEvaluationService.markReady', 'hrEvaluationService.finalize']) {
      expect(evaluation).toContain(call)
    }
    expect(evaluation).toContain('PortfolioEvaluationStudio')
    expect(evaluation).toContain('allowed_actions')
    expect(evaluation).toContain('workflow_state')
  })

  it('does not fabricate production submission data', () => {
    const row = read('pages/hr-admin/evaluation-submissions/queue/PortfolioSubmissionRow.jsx')
    expect(row).not.toContain('images.unsplash.com')
    expect(row).not.toContain('?? 6')
    expect(row).not.toContain('Aug 14, 2026')
  })

  it('keeps the periods tab focused on cycle selection', () => {
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    for (const label of ['Academic year', 'Status', 'Open Period', 'View Period']) expect(workspace).toContain(label)
    expect(workspace).not.toContain('<th className="px-4 py-3">Faculty</th>')
    expect(workspace).not.toContain('<th className="px-4 py-3">Non-Teaching Faculty</th>')
  })

  it('omits the redundant ranking-period tab and keeps contextual navigation inside a selected period', () => {
    const layout = read('components/layout/MainLayout.jsx')
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    expect(layout).toMatch(/isHrRankingWorkspace\s+\?\s+null/)
    expect(layout).not.toContain("label: 'Ranking Periods', path: '/hr/ranking-cycles?tab=periods'")
    expect(layout).toContain('isHrRankingWorkspace')
    expect(workspace).toContain('HR_PERIOD_WORKSPACE_TABS.filter')
    expect(workspace).toContain('.map(item =>')
    expect(workspace).toContain('Back to Ranking Periods')
  })

  it('keeps legacy queue URLs in the canonical portfolio tab and removes the obsolete guesser', () => {
    const app = read('App.jsx')
    const navigation = read('utils/hrRankingNavigation.js')
    expect(app).toContain('HRRankingTabRedirect tab="portfolio-evaluation"')
    expect(navigation).toContain("submissions: 'portfolio-evaluation'")
    expect(navigation).toContain("params.set('view', 'submissions')")
    expect(app).not.toContain('HREvaluationQueueLanding')
  })
})
