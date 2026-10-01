import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const frontendRoot = path.resolve(import.meta.dirname, '../../..')
const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8')

describe('Ranking Cycle UX restructure', () => {
  it('exposes one cycle-centric HR navigation entry', () => {
    const navigation = read('config/navigationCatalog.js')
    expect(navigation).toContain("label: 'Ranking Cycles'")
    expect(navigation).toContain("path: '/hr/ranking-cycles'")
    expect(navigation).not.toContain("label: 'Portfolio Evaluations'")
    expect(navigation).not.toContain("label: 'Rank Assignment Logs'")
  })

  it('routes cycle, track, and stage context through the cycle workspace', () => {
    const app = read('App.jsx')
    expect(app).toContain('path="/hr/ranking-cycles/:cycleId/:trackKey/:stage"')
    const context = read('components/ranking/RankingCycleContext.jsx')
    for (const stage of ['Annual Reviews', 'Submissions', 'Evaluation', 'Results']) {
      expect(context).toContain(stage)
    }
    expect(context).not.toContain("['overview','Overview']")
    expect(context).not.toContain("['evaluations','Evaluations']")
  })

  it('opens a cycle directly in the four-stage workspace and preserves legacy links', () => {
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
    expect(evaluation).toContain('<FacultyPhaseOWorkspace')
    expect(evaluation).toContain('mayOpenFacultyPhaseO')
    expect(evaluation).toContain('mayUseGenericFinalizer')
    expect(evaluation).toContain('workflow_state')
  })

  it('does not fabricate production submission data', () => {
    const row = read('pages/hr-admin/evaluation-submissions/queue/PortfolioSubmissionRow.jsx')
    expect(row).not.toContain('images.unsplash.com')
    expect(row).not.toContain('?? 6')
    expect(row).not.toContain('Aug 14, 2026')
  })

  it('keeps the landing page focused on cycle selection', () => {
    const workspace = read('pages/hr-admin/HRRankingCyclesPage.jsx')
    for (const label of ['Academic Year', 'Status', 'Open Cycle', 'View Cycle']) expect(workspace).toContain(label)
    expect(workspace).not.toContain('<th className="px-4 py-3">Faculty</th>')
    expect(workspace).not.toContain('<th className="px-4 py-3">Non-Teaching Faculty</th>')
  })
})
