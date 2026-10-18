import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import DeanPortfolioEvaluationWorkspace from '../DeanPortfolioEvaluationWorkspace'

const root = path.resolve(process.cwd(), 'src')
const workspace = fs.readFileSync(path.join(root, 'pages/dean/DeanPortfolioEvaluationWorkspace.jsx'), 'utf8')
const summary = fs.readFileSync(path.join(root, 'components/evaluation/FacultyEvaluationSummary.jsx'), 'utf8')
const service = fs.readFileSync(path.join(root, 'services/deanWorkspaceService.js'), 'utf8')
const tab = fs.readFileSync(path.join(root, 'pages/dean/DeanPortfolioEvaluationTab.jsx'), 'utf8')
const hrPage = fs.readFileSync(path.join(root, 'pages/hr-admin/HREvaluationSubmissionsPage.jsx'), 'utf8')

describe('real Dean portfolio evaluation workspace contracts', () => {
  it('renders synchronized portfolio and locked-criteria panes in submission order', () => {
    expect(workspace).toContain('PortfolioBookletDocument')
    expect(workspace).toContain("serviceYearsSelected ? 'derived-service-years-C3' : active?.id")
    expect(workspace).toContain('if (row.source?.id) selectItem(row.source.id)')
    expect(workspace).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]')
    expect(workspace).toContain('evidenceFor(active)')
  })

  it('supports configured approve/reject decisions with no manual score field', () => {
    expect(workspace).toContain('approveDeanReviewItem')
    expect(workspace).toContain('rejectDeanReviewItem')
    expect(workspace).toContain('Enter a reason before rejecting this accomplishment.')
    // Only explicitly evaluator-scored locked criteria have a numeric input.
    expect(workspace.match(/type="number"/g)).toHaveLength(1)
    expect(workspace).toContain("const manual = preview?.mode === 'manual'")
    expect(workspace).toContain('manual ? <label')
    expect(service).toContain('/rate`')
    expect(service).toContain("verification_status: 'ineligible'")
  })

  it('checks persisted draft state and gates incomplete endorsement', () => {
    expect(workspace).toContain('await onReload()')
    expect(workspace).toContain('Saved and reloaded')
    expect(workspace).toContain('still need a decision.')
    expect(workspace).toContain('disabled={!editable || Boolean(busyId) || remaining > 0}')
    expect(tab).toContain("phase: current.data ? 'success' : 'loading'")
  })

  it('shares the official printable summary and lets authorized Dean endorsers edit comments', () => {
    expect(workspace).toContain('FacultyEvaluationSummary')
    expect(workspace).toContain('context={reportState.context}')
    expect(workspace).toContain('onSaveComments={async comments =>')
    expect(workspace).toContain('saveDeanSummaryComments(review.id, comments)')
    expect(hrPage).not.toContain('FacultyEvaluationSummary')
    expect(hrPage).toContain('Ranking Periods → Results')
    expect(summary).toContain('data-evaluation-summary')
    expect(summary).toContain('window.print()')
    expect(summary).toContain('rejection_reason')
  })

  it('uses whole-portfolio return instead of a separate correction-request action', () => {
    expect(workspace).not.toContain('Request Correction')
    expect(workspace).not.toContain('Request correction')
    expect(workspace).toContain('Return portfolio')
    expect(workspace).toContain('Return Portfolio for Revision')
  })

  it('disables all historical Dean review actions', () => {
    expect(workspace).toContain('readOnly: periodReadOnly = false')
    expect(workspace).toContain("const editable = !readOnly && review.status === 'in_evaluation'")
    expect(workspace).toContain("['ready_for_finalization', 'completed'].includes(review.status)")
    expect(workspace).toContain('getDeanReviewReport(review.id)')
  })

  it('keeps whole-portfolio return separate from the backend correction endpoint', () => {
    expect(workspace).toContain('returnDeanReview(review.id, value)')
    expect(workspace).not.toContain('window.prompt(')
    expect(service).toContain('/deficiencies`')
    expect(service).toContain('/return`')
  })

  it('uses an accessible return dialog with trimmed required instructions and preserves failures', () => {
    expect(workspace).toContain('title="Return Portfolio for Revision"')
    expect(workspace).toContain('inputLabel="Revision Instructions" inputRequired')
    expect(workspace).toContain('inputMaxLength={500}')
    expect(workspace).toContain('The entire portfolio will be returned for correction.')
    expect(workspace).toContain('const reason = returnDialog.instructions.trim()')
    expect(workspace).toContain('if (!reason || returnInFlight.current || busyId) return')
    expect(workspace).toContain('if (!returnInFlight.current) setReturnDialog({ open: false')
    expect(workspace).toContain('cancelLabel="Cancel"')
    expect(workspace).toContain('onCancel={closeReturnDialog} onConfirm={returnPortfolio}')
    expect(workspace).toContain("setReturnDialog({ open: false, instructions: '', error: '' })")
    expect(workspace).toContain('setReturnDialog(current => ({ ...current, error: failure?')
    expect(workspace).toContain('Portfolio returned successfully. Waiting for faculty revision.')
  })
})

const submittedV2 = {
  review: { id: 'v2-review', status: 'submitted', version_number: 2 },
  items: [{
    id: 'v2-item',
    criterion_code: 'A.3',
    portfolio_section: 'professional_development',
    item_description: 'R7BP_259C6B51884E Academic FAC-A3 Seminar Attendance',
    verification_status: 'pending',
    rating_status: 'unrated',
    scoring_payload: { category_metadata: { details: { venue: 'R7BP_259C6B51884E Controlled V2 Revision Venue' } } },
    evidence_snapshot: [{ id: 'evidence-1', original_filename: 'controlled-fac-a3.pdf', mime_type: 'application/pdf' }]
  }]
}

describe('submitted Version 2 read-only inspection', () => {
  it('shows returned instructions and original evidence without evaluation actions', () => {
    const returned = { ...submittedV2, review: { ...submittedV2.review, full_name: 'Jane Doe', status: 'returned_for_revision', return_reason: 'Please replace the certificate.' } }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={returned} onReload={() => {}} />)
    expect(html).toContain('Returned for Revision')
    expect(html).toContain('Jane Doe · Portfolio Version 2')
    expect(html).toContain('Please replace the certificate.')
    expect(html).toContain('Original submitted portfolio')
    expect(html).toContain('FACULTY DEVELOPMENT PROGRAM')
    expect(html).not.toContain('>Approve<')
    expect(html).not.toContain('>Reject<')
    expect(html).not.toContain('Endorse to HR')
    expect(html).not.toContain('>Return portfolio<')
  })
  it('renders the FAC-A3 item, revised venue, and proof before evaluation starts', () => {
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={submittedV2} onReload={() => {}} />)
    expect(html).toContain('Submitted portfolio · Version 2')
    // The original booklet remains the default and sole submitted portfolio view.
    expect(html).toContain('FACULTY DEVELOPMENT PROGRAM')
    expect(html).toContain('R7BP_259C6B51884E Academic FAC-A3 Seminar Attendance')
    expect(html).toContain('Print')
    expect(submittedV2.items[0].evidence_snapshot[0].original_filename).toBe('controlled-fac-a3.pdf')
    expect(html).not.toContain('Item list')
  })

  it('keeps start available without a separate correction action or pre-start scoring controls', () => {
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={submittedV2} onReload={() => {}} />)
    expect(html).toContain('Start Evaluation')
    expect(html).not.toContain('Request Correction')
    expect(html).not.toContain('Request correction')
    expect(html).not.toContain('>Approve</button>')
    expect(html).not.toContain('>Reject</button>')
    expect(html).not.toContain('Save Draft')
    expect(html).not.toContain('Endorse to HR')
    expect(submittedV2.review.status).toBe('submitted')
  })

  it('preserves the existing in-evaluation scoring workspace', () => {
    const inEvaluation = { ...submittedV2, review: { ...submittedV2.review, status: 'in_evaluation' }, score_previews: { 'v2-item': { mode: 'fixed', proposed_points: 2, additional_total_points: 2 } } }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={inEvaluation} onReload={() => {}} />)
    expect(html).toContain('Applicable HR criterion')
    expect(html).toContain('Approve')
    expect(html).toContain('Reject')
    expect(html.indexOf('>Reject</button>')).toBeLessThan(html.indexOf('>Approve</button>'))
    expect(html).toContain('Save remarks')
    expect(html).not.toContain('Start Evaluation')
  })

  it('does not ask the Dean to manually award points for graduate units', () => {
    const data = {
      review: { id: 'graduate-review', status: 'in_evaluation', total_score: 0 },
      items: [{
        id: 'units-item', criterion_code: 'A.1.2', criterion_key: 'A1_PHD_UNITS',
        item_description: 'Ph.D. Units', configured_points_snapshot: 10,
        evaluator_judgment_required: 0, verification_status: 'pending', rating_status: 'unrated',
      }],
      score_previews: { 'units-item': { mode: 'graduate_units', proposed_points: 10, additional_total_points: 10, scoring_basis: '15 submitted units; the PHD level totals 15 verified units.' } },
    }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={data} onReload={() => {}} />)
    expect(html).toContain('Graduate units · Read-only')
    expect(html).toContain('Graduate level points if approved')
    expect(html).toContain('Approve')
  })

  it('renders the preserved Ph.D. Units submission details in the Education booklet section', () => {
    const item = {
      id: 'v5-phd-units-item', accomplishment_id: 'canonical-phd-units',
      criterion_code: 'A.1', criterion_key: 'A.1.2',
      criterion_title: 'Doctoral Program in Communication',
      item_description: 'Doctoral Program in Communication',
      criterion_snapshot: { criterion: { code: 'A.1.2', name: 'Ph.D. Units' } },
      scoring_payload: { category_metadata: {
        portfolio_format: 'faculty_academic', criterion_code: 'A.1',
        subcategory_code: 'A1_PHD_UNITS', start_date: '2025-06-27', end_date: '2026-04-27',
        details: {
          program: 'Doctoral Program in Communication',
          institution: 'NOTRE DAME OF MARBEL UNIVERSITY',
          semester: 'Second Semester', academic_year: '2025-2026', units_completed: '15'
        }
      } }
    }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{
      review: { id: 'v5', version_number: 5, status: 'submitted', personnel_group: 'FACULTY' },
      items: [item], score_previews: { [item.id]: { mode: 'graduate_units', proposed_points: 10 } }
    }} onReload={() => {}} />)

    expect(html).toContain('EDUCATION')
    expect(html).toContain('Doctoral Program in Communication')
    expect(html).toContain('NOTRE DAME OF MARBEL UNIVERSITY')
    expect(html).toContain('2025-06-27')
    expect(html).toContain('2026-04-27')
  })

  it('shows the approved Ph.D. level score while the new Dean review is pending', () => {
    const item = {
      id: 'pending-units', criterion_code: 'A.1', criterion_key: 'A.1.2',
      item_description: 'Doctoral Program in Communication',
      verification_status: 'pending', rating_status: 'unrated', awarded_points: 0,
      criterion_snapshot: { provisional_scoring: { status: 'verified', verified_points: 0 } },
      scoring_payload: { category_metadata: {
        subcategory_code: 'A1_PHD_UNITS', details: { units_completed: '15', program: 'Doctoral Program in Communication' }
      } }
    }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{
      review: { id: 'v8', version_number: 8, status: 'in_evaluation', personnel_group: 'FACULTY', total_score: 118, area_a_score: 28 },
      items: [item],
      graduate_units: [{ level: 'PHD', units: 15, points: 10, item_ids: ['pending-units'] }],
      score_previews: { 'pending-units': { mode: 'graduate_units', proposed_points: 10, additional_total_points: 0 } }
    }} onReload={() => {}} />)

    expect(html).toContain('Approved: 10 points across 15 Ph.D. units')
    expect(html).toContain('Graduate level points if approved')
    expect(html).toContain('This graduate level is already included in the approved score summary.')
    expect(html).not.toContain('Approved: 0 points')
  })

  it('keeps the editable points field for manually scored criteria', () => {
    const data = {
      review: { id: 'manual-review', status: 'in_evaluation' },
      items: [{
        id: 'manual-item', criterion_code: 'B.3', item_description: 'Conduct of Research',
        configured_points_snapshot: 10, max_allowed_points: 10,
        evaluator_judgment_required: 1, verification_status: 'pending', rating_status: 'unrated',
      }],
      score_previews: { 'manual-item': { mode: 'manual', maximum_points: 10, proposed_points: null } },
    }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={data} onReload={() => {}} />)
    expect(html).toContain('Awarded Points')
    expect(html).toContain('type="number"')
  })

  it('shows the carried approved score when a resubmitted accomplishment is selected', () => {
    const item = {
      id: 'carried-research', criterion_code: 'B.3', criterion_key: 'B.3',
      item_description: 'Research paper', verification_status: 'verified', rating_status: 'rated',
      awarded_points: 12, evaluated_at: '2026-10-15 10:00:00',
      evaluator_judgment_required: 1, max_allowed_points: 20,
    }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{
      review: { id: 'v8', status: 'in_evaluation', version_number: 8, submitted_at: '2026-10-16 10:00:00' },
      items: [item], score_previews: { 'carried-research': { mode: 'manual', proposed_points: 12, maximum_points: 20 } }
    }} onReload={() => {}} />)

    expect(html).toContain('Saved approval: 12.00 pts')
    expect(html).toContain('Carried from the returned version')
    expect(html).toContain('value="12"')
    expect(html).toContain('1 of 1 reviewed')
  })

  it('keeps fixed and automatic evidence scores read-only', () => {
    const review = { id: 'review', status: 'in_evaluation', personnel_group: 'faculty' }
    const fixed = { id: 'fixed', criterion_code: 'A.1', item_description: 'Degree', configured_points_snapshot: 10, evaluator_judgment_required: 0, verification_status: 'pending', rating_status: 'unrated' }
    const automatic = { ...fixed, id: 'automatic', criterion_code: 'B.2', item_description: 'Publication', evaluator_judgment_required: 1, criterion_snapshot: { category: { category_code: 'B.2', max_points: 12 }, award_maximum_after_evidence_verification: true } }
    const fixedHtml = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items: [fixed], score_previews: { fixed: { mode: 'fixed', proposed_points: 10, additional_total_points: 10 } } }} onReload={() => {}} />)
    const automaticHtml = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items: [automatic], score_previews: { automatic: { mode: 'automatic', proposed_points: 12, additional_total_points: 12 } } }} onReload={() => {}} />)
    expect(fixedHtml).toContain('Fixed by HR criteria · Read-only')
    expect(fixedHtml).toContain('10.00 pts')
    expect(fixedHtml).not.toContain('type="number"')
    expect(automaticHtml).toContain('Automatic · Read-only')
    expect(automaticHtml).toContain('12.00 pts')
    expect(automaticHtml).not.toContain('type="number"')
  })

  it('shows the persisted backend total and the capped contribution separately', () => {
    const review = { id: 'capped-review', status: 'in_evaluation', total_score: 8 }
    const item = { id: 'capped', criterion_code: 'A.3', item_description: 'Second seminar', verification_status: 'pending', rating_status: 'unrated' }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items: [item], score_previews: { capped: { mode: 'fixed', proposed_points: 6, additional_total_points: 2, scoring_basis: 'Locked criterion.' } } }} onReload={() => {}} />)
    expect(html).toContain('Approved score summary')
    expect(html).toContain('Total Approved Points')
    expect(html.match(/Total Approved Points/g)).toHaveLength(1)
    expect(html).toContain('8.00 pts')
    expect(html).toContain('6.00 pts')
    expect(html).toContain('Will add 2.00 pts')
    expect(html).toContain('after category and area limits')
  })

  it('shows authoritative overall and per-area approved scores with review progress once', () => {
    const review = { id: 'area-summary', status: 'in_evaluation', total_score: 20, area_a_score: 12, area_b_score: 5, area_c_score: 3 }
    const items = [
      { id: 'approved', criterion_code: 'A.1', item_description: 'Degree', verification_status: 'verified', rating_status: 'rated', awarded_points: 12 },
      { id: 'rejected', criterion_code: 'B.4', item_description: 'Award', verification_status: 'ineligible', rating_status: 'unrated' },
      { id: 'pending', criterion_code: 'C.1.1', item_description: 'Service', verification_status: 'pending', rating_status: 'unrated' },
    ]
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items }} onReload={() => {}} />)
    expect(html).toContain('Approved score summary')
    expect(html).toContain('2 of 3 reviewed')
    expect(html).toContain('12.00 pts')
    expect(html).toContain('5.00 pts')
    expect(html).toContain('3.00 pts')
    expect(html).toContain('20.00 pts')
    expect(html.match(/role="progressbar"/g)).toHaveLength(1)
  })

  it('shows submitted details and locked scoring options beside the booklet', () => {
    const review = { id: 'detail-review', status: 'in_evaluation', total_score: 0 }
    const item = { id: 'detail', criterion_code: 'B.1', item_description: 'Festival', verification_status: 'pending', rating_status: 'unrated',
      scoring_payload: { category_metadata: { subcategory_code: 'B1_ACTIVITY', start_date: '2026-05-14', end_date: '2026-05-15', details: { activity_title: 'Festival', organizer: 'College of Arts', role: 'Judge', extent: '2 Days', scope: 'National' } } },
      criterion_snapshot: { matched_options: [{ label: 'Judge', points: 3 }] } }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items: [item], score_previews: { detail: { mode: 'fixed', proposed_points: 8 } } }} onReload={() => {}} />)
    expect(html).toContain('College of Arts')
    expect(html).toContain('2 Days')
    expect(html).toContain('2026-05-14')
    expect(html).toContain('Accomplishment details')
    expect(html).toContain('<details class="mt-2 text-sm">')
    expect(html).toContain('Matched locked HR options')
    expect(html).toContain('3.00 pts')
  })

  it('flags a mismatched locked criterion and prevents approval', () => {
    const review = { id: 'bad-review', status: 'in_evaluation', total_score: 0 }
    const item = { id: 'bad', criterion_code: 'A.1', item_description: 'Degree', verification_status: 'pending', rating_status: 'unrated' }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items: [item], score_previews: { bad: { mode: 'unavailable', reason: 'The submitted criterion does not match its locked evaluation snapshot.' } } }} onReload={() => {}} />)
    expect(html).toContain('The submitted criterion does not match its locked evaluation snapshot.')
    expect(html).toMatch(/disabled=""[^>]*>.*?Approve/)
  })

  it('shows the selected item proof, progress, and navigation while keeping history read-only', () => {
    const review = { id: 'review', status: 'in_evaluation' }
    const first = { id: 'first', criterion_code: 'A.3', item_description: 'First seminar', configured_points_snapshot: 2, verification_status: 'verified', rating_status: 'rated', awarded_points: 2, evidence_snapshot: [{ id: 'proof-1', original_filename: 'first.pdf' }] }
    const second = { id: 'second', criterion_code: 'A.3', item_description: 'Second seminar', configured_points_snapshot: 2, verification_status: 'pending', rating_status: 'unrated' }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items: [first, second] }} onReload={() => {}} />)
    expect(html).toContain('1 of 2 reviewed')
    expect(html).toContain('first.pdf')
    expect(html).toContain('Previous')
    expect(html).toContain('Next')
    const historical = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={{ review, items: [first, second] }} onReload={() => {}} readOnly />)
    expect(historical).not.toContain('Endorse to HR')
    expect(historical).not.toContain('Return portfolio')
  })
})
