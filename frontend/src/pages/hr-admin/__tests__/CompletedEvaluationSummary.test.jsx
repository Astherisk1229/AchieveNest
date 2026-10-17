import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CompletedEvaluationSummary from '../../../components/evaluation/CompletedEvaluationSummary'
import EvaluationSummaryPage from '../EvaluationSummaryPage'
import ResultsStage from '../ranking-cycle-stages/ResultsStage'

vi.mock('../ranking-cycle-stages/useRankingWorkspaceStage', () => ({
  default: () => ({
    phase: 'ready', error: '', reload: vi.fn(),
    data: { rows: [{
      personnel: { full_name: 'Ada Faculty', institutional_id: 'EMP-1', position_title: 'Professor' },
      evaluation: { id: 'evaluation-1' }, result_status: 'completed', report_score: 143.25,
      result: { evaluation: { completed_at: '2026-09-28T08:00:00Z' } }, allowed_actions: ['view_report'],
    }, {
      personnel: { id: 'mark-1', full_name: 'Mark James', institutional_id: 'EMP-2', personnel_group: 'NON_TEACHING_FACULTY', department_id: 'registrar', department_name: 'Registrar', position_title: 'Staff' },
      evaluation: { id: 'evaluation-2' }, result_status: 'awaiting_finalization', report_score: 45,
      endorsement: { by: 'HR Reviewer', at: '2026-10-18T08:00:00Z' }, allowed_actions: ['view_evaluation', 'finalize_evaluation'],
    }] },
  }),
}))

const result = formatKey => ({
  personnel: { name: 'Ada Faculty', institutional_id: 'EMP-1', group: formatKey.startsWith('FACULTY') ? 'FACULTY' : 'NON_TEACHING_FACULTY', position: 'Professor' },
  evaluation: { version_number: 2, completed_at: '2026-09-28T08:00:00Z' },
  evaluation_period: { name: 'AY 2026–2027' }, scale_version_id: 'criteria-v4',
  summary: { format_key: formatKey }, scores: { total: 143.25, maximum: 160, passing: 120 },
  result_snapshot: { report_id: 'report-1', generated_at: '2026-09-28T08:00:00Z' },
  items: [
    { id: 'verified', verification_status: 'verified', achievement: 'Research', criterion_code: 'B.3', criterion_snapshot: { title: 'Conduct of research' }, awarded_points: 12, evidence_snapshot: [{ id: 'e1', original_filename: 'verified-paper.pdf' }] },
    { id: 'pending', verification_status: 'pending', achievement: 'Seminar', criterion_code: 'A.3', criterion_snapshot: { title: 'Training' }, awarded_points: 0, evidence_snapshot: [{ id: 'e2', original_filename: 'pending-file.pdf' }] },
  ],
})

describe('completed evaluation summary', () => {
  it.each([
    ['FACULTY_EVALUATION_SUMMARY', 'Faculty Evaluation Summary'],
    ['NON_TEACHING_FACULTY_EVALUATION_RESULT', 'Non-Teaching Faculty Evaluation Result'],
  ])('renders the %s immutable contract', (formatKey, title) => {
    const html = renderToStaticMarkup(<CompletedEvaluationSummary result={result(formatKey)}/>)
    expect(html).toContain(title)
    expect(html).toContain('143.25')
    expect(html).toContain('criteria-v4')
    if (formatKey === 'FACULTY_EVALUATION_SUMMARY') expect(html).toContain('verified-paper.pdf')
    else expect(html).not.toContain('verified-paper.pdf')
    expect(html).not.toContain('pending-file.pdf')
  })

  it('renders the non-teaching result in the ranking-scale structure', () => {
    const ntf = result('NON_TEACHING_FACULTY_EVALUATION_RESULT')
    ntf.scores = { total: 122.50, maximum: 150, passing: 75, areas: { A: 68.50, B: 54 } }
    ntf.summary = {
      ...ntf.summary,
      period_covered: 'AY 2026–2027',
      result: 'Passed',
      performance_personal_indicators: {
        points_earned: 68.50,
        items: [{ criterion_code: 'A.1', indicator: 'Job Performance', weight: 50, percentage: 0.50, ds: 79, points_earned: 39.50 }],
      },
      service_leadership: {
        points_earned: 54,
        items: [{ criterion_code: 'B.1', document: 'Involvement in School Activities', weight: 30, points_earned: 20 }],
      },
    }

    const html = renderToStaticMarkup(<CompletedEvaluationSummary result={ntf}/>)
    expect(html).not.toContain('Appendix N')
    expect(html).toContain('Non-Teaching Personnel Ranking Scale')
    expect(html).toContain('Performance and Personal Indicators')
    expect(html).toContain('Service and Leadership')
    expect(html).toContain('Job Performance')
    expect(html).toContain('50 pts')
    expect(html).toContain('.50')
    expect(html).toContain('Passing Score: 75.00 points')
    expect(html).toContain('Recommended for Approval')
    expect(html).not.toContain('Verified supporting records')
    expect(html).not.toContain('verified-paper.pdf')
  })

  it('labels a saved non-teaching review without asking HR to finalize it again', () => {
    const html = renderToStaticMarkup(<CompletedEvaluationSummary result={result('NON_TEACHING_FACULTY_EVALUATION_RESULT')} preview/>)
    expect(html).toContain('Non-Teaching Evaluation Summary')
    expect(html).toContain('Saved review summary')
    expect(html).not.toContain('awaiting HR finalization')
    expect(html).not.toContain('Employee ID')
    expect(html).not.toContain('Official completed personnel ranking scale')
    expect(html).not.toContain('Immutable report')
  })

  it('shows review context and an assigned HR comments action without inventing a rank', () => {
    const html = renderToStaticMarkup(<CompletedEvaluationSummary
      result={result('NON_TEACHING_FACULTY_EVALUATION_RESULT')}
      preview
      context={{ review_completed_at: '2026-10-18', effectivity_status: 'pending_approval', recommended_rank_status: 'pending_decision', present_rank: 'Staff II', employee_progress_last_ranking: 'Staff I', comments: 'Verified by HR', comments_editable: true }}
      onSaveComments={vi.fn()}
    />)
    expect(html).toContain('Effectivity:')
    expect(html).toContain('2026-10-18')
    expect(html).not.toContain('Review completed:')
    expect(html).toContain('Pending evaluation completion')
    expect(html).toContain('Verified by HR')
    expect(html).toContain('Edit comments')
    expect(html).toContain('Staff II')
    expect(html).toContain('Staff I')
    expect(html).toContain('No confirmed rank application')
  })

  it('keeps frozen rank fields unchanged when the live personnel record changes', () => {
    const ntf = result('NON_TEACHING_FACULTY_EVALUATION_RESULT')
    ntf.summary.present_rank = null
    ntf.summary.rank_applied_for = null
    const html = renderToStaticMarkup(<CompletedEvaluationSummary result={ntf} context={{ present_rank: 'Later Rank', rank_applied_for: 'Later Application' }}/>)
    expect(html).toContain('No present rank recorded')
    expect(html).toContain('No confirmed rank application')
    expect(html).not.toContain('Later Rank')
    expect(html).not.toContain('Later Application')
  })

  it('explains when the shared active rank rules have no next rank', () => {
    const ntf = result('NON_TEACHING_FACULTY_EVALUATION_RESULT')
    ntf.summary.rank_applied_for = null
    const html = renderToStaticMarkup(<CompletedEvaluationSummary result={ntf} context={{ rank_applied_for_status: 'TERMINAL' }}/>)
    expect(html).toContain('No next rank under current rules')
    expect(html).not.toContain('Non-teaching rank sequence not configured')
  })

  it('shows the Master’s qualification condition for an Instructor rank', () => {
    const ntf = result('NON_TEACHING_FACULTY_EVALUATION_RESULT')
    ntf.summary.present_rank = 'Assistant Instructor'
    ntf.summary.rank_applied_for = null
    ntf.summary.rank_applied_for_status = 'MASTERS_REQUIRED'
    ntf.summary.recommended_rank = 'Assistant Instructor'
    ntf.summary.recommended_rank_status = 'retained_masters_required'
    const html = renderToStaticMarkup(<CompletedEvaluationSummary result={ntf}/>)
    expect(html).toContain('Verified Master’s required for advancement')
    expect(html).toContain('Assistant Instructor')
  })

  it('renders exact Results action copy and preserves workspace query state in navigation', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/hr/ranking-cycles/cycle-1/faculty/results?personnelType=faculty&filters=completed&search=Ada&stage=results']}><ResultsStage cycleId="cycle-1" trackKey="faculty"/></MemoryRouter>)
    expect(html).toContain('Evaluation Summaries')
    expect(html).toContain('143.25')
    expect(html).toContain('personnelType=faculty')
    expect(html).toContain('filters=completed')
    expect(html).toContain('search=Ada')
    expect(html).toContain('stage=results')
    expect(html).toContain('return_to=')
    expect(html).not.toContain('View report')
  })

  it('returns from a summary to the workspace and filters that opened it', () => {
    const origin = '/hr/ranking-cycles?tab=portfolio-evaluation&period=cycle-1&track=non-teaching-faculty&search=Mark'
    const url = `/hr/ranking-cycles/cycle-1/non-teaching-faculty/results/evaluation-2/summary?from=portfolio-evaluation&return_to=${encodeURIComponent(origin)}`
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={[url]}><Routes><Route path="/hr/ranking-cycles/:cycleId/:trackKey/results/:evaluationId/summary" element={<EvaluationSummaryPage/>}/></Routes></MemoryRouter>)
    expect(html).toContain('Back to Portfolio Evaluation')
    expect(html).toContain('search=Mark')
    expect(html).toContain('track=non-teaching-faculty')
  })

  it('shows a non-teaching evaluation awaiting finalization and its standalone department', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/hr/ranking-cycles?tab=evaluation-summaries&period=cycle-1&track=non-teaching-faculty&summary_college=department:registrar']}><ResultsStage cycleId="cycle-1" trackKey="non-teaching-faculty"/></MemoryRouter>)
    expect(html).toContain('Mark James')
    expect(html).not.toContain('Ada Faculty')
    expect(html).toContain('Registrar')
    expect(html).toContain('All colleges and departments')
    expect(html).toContain('Awaiting finalization')
    expect(html).toContain('View summary')
    expect(html).toContain('/non-teaching-faculty/results/evaluation-2/summary')
  })
})
