import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CompletedEvaluationSummary from '../../../components/evaluation/CompletedEvaluationSummary'
import ResultsStage from '../ranking-cycle-stages/ResultsStage'

vi.mock('../ranking-cycle-stages/useRankingWorkspaceStage', () => ({
  default: () => ({
    phase: 'ready', error: '', reload: vi.fn(),
    data: { rows: [{
      personnel: { full_name: 'Ada Faculty', institutional_id: 'EMP-1', position_title: 'Professor' },
      evaluation: { id: 'evaluation-1' }, result_status: 'completed', report_score: 143.25,
      result: { evaluation: { completed_at: '2026-09-28T08:00:00Z' } }, allowed_actions: ['view_report'],
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
    expect(html).toContain('verified-paper.pdf')
    expect(html).not.toContain('pending-file.pdf')
  })

  it('renders the non-teaching result in the Appendix N ranking-scale structure', () => {
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
    expect(html).toContain('Appendix N')
    expect(html).toContain('Non-Teaching Personnel Ranking Scale')
    expect(html).toContain('Performance and Personal Indicators')
    expect(html).toContain('Service and Leadership')
    expect(html).toContain('Job Performance')
    expect(html).toContain('50 pts')
    expect(html).toContain('.50')
    expect(html).toContain('Passing Score: 75.00 points')
    expect(html).toContain('Recommended for Approval')
  })

  it('renders exact Results action copy and preserves workspace query state in navigation', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/hr/ranking-cycles/cycle-1/faculty/results?personnelType=faculty&filters=completed&search=Ada&stage=results']}><ResultsStage cycleId="cycle-1" trackKey="faculty"/></MemoryRouter>)
    expect(html).toContain('Evaluation Summary')
    expect(html).toContain('143.25')
    expect(html).toContain('personnelType=faculty')
    expect(html).toContain('filters=completed')
    expect(html).toContain('search=Ada')
    expect(html).toContain('stage=results')
    expect(html).not.toContain('View report')
  })
})
