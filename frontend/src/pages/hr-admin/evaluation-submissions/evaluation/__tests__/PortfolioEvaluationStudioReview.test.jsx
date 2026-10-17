import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PortfolioEvaluationStudio from '../PortfolioEvaluationStudio'
import PortfolioNavigator from '../../studio/portfolio/PortfolioNavigator'
import NonTeachingCriterionEvaluation from '../../studio/evaluation/NonTeachingCriterionEvaluation'

const submission = {
  id: 'review-1',
  faculty_name: 'Jordan Rivera',
  personnel_group: 'FACULTY',
  version_number: 2,
  items: [{ id: 'item-1', title: 'Research accomplishment', category_area: 'areaB', criterion_code: 'B.3', verification_status: 'pending' }]
}

describe('HR portfolio review', () => {
  it('shows a read-only booklet and Start Evaluation before review begins', () => {
    const html = renderToStaticMarkup(<PortfolioEvaluationStudio submission={{ ...submission, status: 'submitted' }} onStartEvaluation={() => {}} />)

    expect(html).toContain('Review Portfolio')
    expect(html).toContain('Print / Save PDF')
    expect(html).toContain('Start Evaluation')
    expect(html).toContain('Approved score summary')
    expect(html).not.toContain('Evaluation of selected accomplishment')
    expect(html).not.toContain('Evidence Decisions Completed')
  })

  it('shows the booklet and evaluation together once in progress', () => {
    const html = renderToStaticMarkup(<PortfolioEvaluationStudio submission={{ ...submission, status: 'in_evaluation' }} />)

    expect(html).toContain('Print / Save PDF')
    expect(html).toContain('Supporting evidence')
    expect(html).toContain('Evaluation of selected accomplishment')
    expect(html).toContain('Submitted accomplishments')
    expect(html).toContain('Approve')
    expect(html.indexOf('>Reject</span>')).toBeLessThan(html.indexOf('>Approve</span>'))
    expect(html).not.toContain('Start Evaluation')
  })

  it('keeps a completed review read-only while retaining its completion action', () => {
    const html = renderToStaticMarkup(<PortfolioEvaluationStudio submission={{ ...submission, status: 'ready_for_finalization' }} onOpenFinalizeModal={() => {}} />)

    expect(html).toContain('Read-only portfolio')
    expect(html).toContain('Finalize Evaluation')
    expect(html).not.toContain('Evaluation of selected accomplishment')
  })

  it('uses the non-teaching area names in its score summary', () => {
    const html = renderToStaticMarkup(<PortfolioEvaluationStudio submission={{ ...submission, personnel_group: 'NON_TEACHING_FACULTY', status: 'submitted' }} onStartEvaluation={() => {}} />)

    expect(html).toContain('A. Performance and Personal Indicators')
    expect(html).toContain('B. Service and Leadership')
    expect(html).not.toContain('C. Service &amp; Leadership')
  })

  it('puts HR DS inputs in the three Area A booklet cells during evaluation', () => {
    const ntf = { ...submission, personnel_group: 'NON_TEACHING_FACULTY', status: 'in_evaluation' }
    const booklet = renderToStaticMarkup(<PortfolioNavigator submission={ntf} evidenceItems={[]} bookletOnly onUpdateAreaADs={() => {}} />)
    const studio = renderToStaticMarkup(<PortfolioEvaluationStudio submission={ntf} />)

    expect(booklet).toContain('Print / Save PDF')
    expect(booklet).toContain('aria-label="DS for A.1 Job Performance"')
    expect(booklet).toContain('aria-label="DS for A.2 Personal Attitudes and Qualities"')
    expect(booklet).toContain('aria-label="DS for A.3 Efficiency"')
    expect(studio).not.toContain('Area A DS corrections')
    const submitted = renderToStaticMarkup(<PortfolioEvaluationStudio submission={{ ...ntf, status: 'submitted' }} />)
    expect(submitted).not.toContain('aria-label="DS for')
  })

  it('shows a direct DS panel when a non-teaching Area A row is selected', () => {
    const areaA = { id: 'area-a-1', category_area: 'areaA', criterion_code: 'A.1', criterion_title: 'Job Performance', awarded_points: 24.5, scoring_payload: { ds: [49] } }
    const html = renderToStaticMarkup(<PortfolioEvaluationStudio submission={{ ...submission, personnel_group: 'NON_TEACHING_FACULTY', status: 'in_evaluation', items: [areaA] }} />)

    expect(html).toContain('A.1 Area A score')
    expect(html).toContain('Points earned = DS × .50')
    expect(html).toContain('24.50 pts')
    expect(html).not.toContain('It cannot be changed in the evaluation.')
  })

  it('counts submitted proof files rather than accomplishments', () => {
    const html = renderToStaticMarkup(<PortfolioNavigator submission={submission} evidenceItems={[
      { ...submission.items[0], evidence_snapshot: [{ id: 'proof-1', original_filename: 'Research.pdf' }, { id: 'proof-2', original_filename: 'Certificate.png' }] }
    ]} />)

    expect(html).toContain('Attached Proofs (2)')
  })

  it('shows the locked B.2.b item points and capped category without a classification selector', () => {
    const item = {
      id: 'b2b', title: 'Community volunteer work', criterionCode: 'B.2.b', criterionKey: 'B.2.2',
      configured_points_snapshot: 25, verificationStatus: 'pending',
      criterion_snapshot: {
        criterion_reference: 'B.2.2', configured_points: 25, criterion_cap: 25,
        category: { category_code: 'B.2', max_points: 30 },
        subcategory: { subcategory_code: 'B.2.2', default_points: 25 },
      },
    }
    const html = renderToStaticMarkup(<NonTeachingCriterionEvaluation selectedEvidence={item} categoryRaw={25} evidence={[{ id: 'proof-1', original_filename: 'service.pdf' }]} />)
    expect(html).toContain('B.2.b · B.2.2')
    expect(html).toContain('View supporting document')
    expect(html).toContain('<details class="rounded-xl border border-slate-200 p-4 dark:border-slate-800"')
    expect(html).toContain('Approve this item · 25.00 pts')
    expect(html).toContain('Scoring details')
    expect(html).toContain('25.00 pts')
    expect(html).toContain('30.00 pts')
    expect(html).toContain('50.00 pts')
    expect(html).toContain('Add remark')
    expect(html).not.toContain('Reason for rejection (required)')
    expect(html).not.toContain('Select applicable classification')
    expect(html).not.toContain('40.00')
    const studio = renderToStaticMarkup(<PortfolioEvaluationStudio submission={{ ...submission, personnel_group: 'NON_TEACHING_FACULTY', status: 'in_evaluation', items: [{ ...item, category_area: 'areaB' }] }} />)
    expect(studio).toContain('B.2.b · B.2.2')
    expect(studio).not.toContain('40.00 Points Max')
  })

  it('requires a locked B.2 classification for a broad non-teaching item', () => {
    const item = {
      id: 'legacy-b2', criterionCode: 'B.2', criterionKey: 'B.2', title: 'Community activity',
      criterion_snapshot: { criterion_reference: 'B.2', category: { category_code: 'B.2', max_points: 30 } },
    }
    const criteriaSnapshot = { areas: [{ categories: [{ category_code: 'B.2', max_points: 30, subcategories: [
      { subcategory_code: 'B.2.1', name: 'Church Activities', default_points: 25 },
      { subcategory_code: 'B.2.2', name: 'Community / Civic Activities', default_points: 25 },
      { subcategory_code: 'B.2.3', name: 'Charity Projects', default_points: 5 },
    ] }] }] }
    const html = renderToStaticMarkup(<NonTeachingCriterionEvaluation selectedEvidence={item} criteriaSnapshot={criteriaSnapshot} />)
    expect(html).toContain('Select applicable classification...')
    expect(html).toContain('B.2.b · Community / Civic Activities · 25.00 pts')
    expect(html).toContain('disabled=""')
  })
})
