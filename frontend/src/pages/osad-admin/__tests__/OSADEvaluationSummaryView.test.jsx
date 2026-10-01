import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import EvaluationSummaryAwardSection from '../../../components/osad/EvaluationSummaryAwardSection'
import EvaluationSummaryModel from '../../../models/EvaluationSummaryModel'
import OSADAwardDetailPage from '../OSADAwardDetailPage'
import { PortfolioEntry } from '../OSADEvaluationSummaryView'

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8')
const visibleText = (markup) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const payload = {
  award: { id: 'award-1', name: 'Leadership Award', authority_status: 'OFFICIAL' },
  student: { student_id: 's-1', student_name: 'Juan Dela Cruz', student_id_number: '2023-00001', program: null },
  cycle: { id: 'c-1', name: 'Award Cycle 2026', academic_year: '2025-2026' },
  generated_at: '2026-09-30 14:05:00',
  items: [
    { id: 'r1', record_id: 'rec-1', achievement_title: 'SSG President', criterion_name: 'Leadership Involvement', component_name: 'Executive Officer', points: 10, activity_date: '2025-08-01', evidence: [] },
    { id: 'r2', record_id: 'rec-2', achievement_title: 'Leadership Seminar', criterion_name: 'Leadership Awards, Citations, and Seminars', component_name: null, points: 5, activity_date: '2025-09-12', evidence: [] }
  ],
  criteria: [
    { criterion_id: 'k1', criterion_name: 'Leadership Involvement', max_points: 10, earned_points: 10 },
    { criterion_id: 'k2', criterion_name: 'Civic Involvement', max_points: 10, earned_points: 0 }
  ],
  human_only_criteria: [],
  student_eligible: true,
  raw_portfolio_score: 15,
  computable_max_score: 50,
  portfolio_potential_score: 30,
  candidate_threshold_percent: 80,
  candidate_status: 'BELOW_THRESHOLD'
}

describe('Real Student Evaluation Summary', () => {
  it('uses only server values and says "Not available" instead of filling gaps', () => {
    const model = new EvaluationSummaryModel(payload)
    const fields = Object.fromEntries(model.fields.map((field) => [field.label, field.value]))
    expect(fields['Student Name']).toBe('Juan Dela Cruz')
    expect(fields.Program).toBe('Not available')
    expect(fields['Award Cycle / Academic Year']).toBe('Award Cycle 2026 · 2025-2026')
    expect(fields['Generated On']).toBe('Sep 30, 2026')
    const named = new EvaluationSummaryModel({ ...payload, cycle: { name: 'AY 2025-2026 Annual Student Honors & Awards', academic_year: '2025-2026' } })
    expect(named.fields.find((field) => field.label === 'Award Cycle / Academic Year').value).toBe('AY 2025-2026 Annual Student Honors & Awards')
    expect(model.section.total).toBe('15 / 50')
    expect(model.section.portfolioPotentialScore).toBe('30%')
    expect(model.section.status).toBe('Below threshold')
    expect(model.section.rows[0].criterion).toBe('Leadership Involvement — Executive Officer')
    expect(model.criteria[1].earnedText).toBe('0')
  })

  it('keeps the award portfolio: counted with points, not counted with the server reason, real files', () => {
    const model = new EvaluationSummaryModel({
      ...payload,
      portfolio: [
        { record_id: 'rec-1', achievement_title: 'SSG President', category_name: 'Leadership', subcategory_name: 'SSG', activity_date: '2025-08-01', criteria: ['Leadership Involvement'], counted: true, points: 10, not_counted_reason: null, reason_code: null, evidence: [{ id: 'e1', original_filename: 'appointment-letter.pdf', file_kind: 'pdf', uploaded_at: '2025-08-03 10:00:00' }, { id: 'e2', original_filename: 'oath.jpg', file_kind: 'image' }] },
        { record_id: 'rec-3', achievement_title: 'Class Mayor', category_name: 'Leadership', subcategory_name: null, activity_date: '2025-06-10', criteria: ['Leadership Involvement'], counted: false, points: 0, not_counted_reason: 'Only the highest qualifying achievement counts for this criterion; another achievement with an equal or higher value was used.', reason_code: 'HIGHEST_ONLY_NOT_SELECTED', evidence: [] }
      ]
    })
    expect(model.portfolio).toHaveLength(2)
    expect(model.countedCount).toBe(1)
    expect(model.portfolio[0].categoryLabel).toBe('Leadership › SSG')
    expect(model.portfolio[0].anchorId).toBe('portfolio-record-rec-1')
    expect(model.portfolio[0].files.map((file) => file.kindLabel)).toEqual(['PDF document', 'Image'])
    expect(model.portfolioIds.has('rec-1')).toBe(true)
    expect(model.section.rows[0].recordId).toBe('rec-1')

    const counted = visibleText(renderToStaticMarkup(<PortfolioEntry record={model.portfolio[0]} />))
    expect(counted).toContain('Counted · 10 points')
    expect(counted).toContain('File 1 of 2 · PDF document: appointment-letter.pdf')
    expect(counted).toContain('uploaded Aug 3, 2025')
    expect(counted).not.toMatch(/certificate/i)
    const notCounted = visibleText(renderToStaticMarkup(<PortfolioEntry record={model.portfolio[1]} />))
    expect(notCounted).toContain('Not counted · 0 points')
    expect(notCounted).toContain('Only the highest qualifying achievement counts')
    expect(notCounted).toContain('No supporting document is attached')
  })

  it('is one continuous workspace: summary then portfolio, linked by record id, printed together', () => {
    const view = read('../OSADEvaluationSummaryView.jsx')
    expect(view).not.toContain('role="tablist"')
    expect(view.match(/print-area/g)).toHaveLength(1)
    expect(view).toContain('STUDENT EVALUATION SUMMARY')
    expect(view).toContain('AWARD PORTFOLIO')
    expect(view).toContain('View evidence')
    expect(view).toContain('portfolioIds.has(row.recordId)')
    expect(view).toContain('automatically identified from verified achievements')
    expect(view).not.toMatch(/Mark as Candidate|Approve Candidate|Add Candidate|Promote/i)
  })

  it('renders the approved table format with the real rows, and an explicit empty row', () => {
    const model = new EvaluationSummaryModel(payload)
    const text = visibleText(renderToStaticMarkup(<EvaluationSummaryAwardSection award={model.section} />))
    for (const label of ['Achievement / Evidence', 'Criterion', 'Points', 'Total', 'Portfolio Potential Score', 'Qualification Threshold', 'SSG President', 'Below threshold']) {
      expect(text).toContain(label)
    }
    const empty = new EvaluationSummaryModel({ ...payload, items: [] })
    expect(visibleText(renderToStaticMarkup(<EvaluationSummaryAwardSection award={empty.section} />))).toContain('No approved achievements have earned points for this award.')
  })

  it('is view-only with print, and the candidate row opens it', () => {
    const view = read('../OSADEvaluationSummaryView.jsx')
    const route = read('../OSADAwardRoutePage.jsx')
    expect(view).toContain('fetchEvaluationSummary')
    expect(view).toContain('window.print()')
    expect(view).toContain('print-area')
    expect(view).not.toMatch(/finalize|manual-criteria|classify|recalculate/i)
    expect(route).toContain('<OSADEvaluationSummaryView')
    expect(route).not.toContain('OSADStudentAwardReviewWorkspace')
  })
})

describe('OSAD does not evaluate portfolios', () => {
  it('removes "Students for evaluation" and the sample-data preview', () => {
    const detail = visibleText(renderToStaticMarkup(<OSADAwardDetailPage award={{ id: 'a', name: 'Leadership Award', criteria: [] }} />))
    expect(detail).not.toContain('Students for evaluation')
    const app = read('../../../App.jsx')
    const route = read('../OSADAwardRoutePage.jsx')
    const catalog = read('../OSADAwardsAndCriteriaPage.jsx')
    expect(app).not.toContain('evaluation-summary-preview')
    expect(app).not.toContain(':awardId/evaluations')
    expect(route).not.toMatch(/summary-preview|OSADStudentsForEvaluationView/)
    expect(catalog).not.toContain('Preview Evaluation Summary')
  })

  it('lets OSAD print or export the candidate list', () => {
    const list = read('../OSADPotentialCandidatesView.jsx')
    expect(list).toContain('Print / Export PDF')
    expect(list).toContain('window.print()')
    expect(list).toContain('print-area')
    expect(list).toContain('View summary')
  })
})
