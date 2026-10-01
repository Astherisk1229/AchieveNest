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
const hrPage = fs.readFileSync(path.join(root, 'pages/hr-admin/HREvaluationSubmissionsPage.jsx'), 'utf8')

describe('real Dean portfolio evaluation workspace contracts', () => {
  it('renders synchronized portfolio and locked-criteria panes in submission order', () => {
    expect(workspace).toContain('Exact submitted portfolio')
    expect(workspace).toContain('Locked criteria evaluation sheet')
    expect(workspace).toContain('items.map((item,index)')
    expect(workspace).toContain('setActiveId(item.id)')
    expect(workspace).toContain('evidenceFor(item)')
  })

  it('supports configured approve/reject decisions with no manual score field', () => {
    expect(workspace).toContain('approveDeanReviewItem')
    expect(workspace).toContain('rejectDeanReviewItem')
    expect(workspace).toContain('A rejection reason is required.')
    expect(workspace).not.toMatch(/type=["']number["']/)
    expect(service).toContain('/rate`')
    expect(service).toContain("verification_status: 'ineligible'")
  })

  it('checks persisted draft state and gates incomplete endorsement', () => {
    expect(workspace).toContain('await onReload()')
    expect(workspace).toContain('Saved and reloaded')
    expect(workspace).toContain('Evaluation is incomplete.')
    expect(workspace).toContain('disabled={!editable||remaining>0}')
  })

  it('shares one immutable printable summary between Dean and HR', () => {
    expect(workspace).toContain('FacultyEvaluationSummary')
    expect(hrPage).not.toContain('FacultyEvaluationSummary')
    expect(hrPage).toContain('Ranking Cycles → Results')
    expect(summary).toContain('data-evaluation-summary')
    expect(summary).toContain('window.print()')
    expect(summary).toContain('rejection_reason')
  })

  it('exposes the deficiency action for non-completed Dean reviews', () => {
    expect(workspace).toContain("const deficiencyAllowed = review.status !== 'completed'")
    expect(workspace).toContain('Request Correction')
    expect(workspace).toContain('Create Deficiency Request')
  })

  it('uses the exact item-linked backend deficiency contract', () => {
    expect(service).toContain('createDeanDeficiency')
    expect(service).toContain('/deficiencies`')
    expect(service).toContain('evaluation_item_id: evaluationItemId')
    expect(workspace).toContain('createDeanDeficiency(review.id, reason, deficiency.itemId)')
  })

  it('prevents duplicate submits and surfaces API failures', () => {
    expect(workspace).toContain("setBusyId('deficiency')")
    expect(workspace).toContain("disabled={busyId === 'deficiency' || !deficiency.reason.trim()}")
    expect(workspace).toContain('The correction request could not be created.')
  })

  it('keeps deficiency creation separate from whole-portfolio return', () => {
    expect(workspace).toContain('Create an item-level deficiency without returning the whole portfolio.')
    expect(workspace).toContain("perform('return', () => returnDeanReview(review.id, reason))")
    expect(service).toContain('/deficiencies`')
    expect(service).toContain('/return`')
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
  it('renders the FAC-A3 item, revised venue, and proof before evaluation starts', () => {
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={submittedV2} onReload={() => {}} />)
    expect(html).toContain('Submitted Portfolio · Version 2')
    expect(html).toContain('R7BP_259C6B51884E Academic FAC-A3 Seminar Attendance')
    expect(html).toContain('R7BP_259C6B51884E Controlled V2 Revision Venue')
    expect(html).toContain('controlled-fac-a3.pdf')
  })

  it('keeps start and correction actions available without pre-start scoring controls', () => {
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={submittedV2} onReload={() => {}} />)
    expect(html).toContain('Start Evaluation')
    expect(html).toContain('Request Correction')
    expect(html).not.toContain('Approve')
    expect(html).not.toContain('Reject')
    expect(html).not.toContain('Save Draft')
    expect(html).not.toContain('Endorse to HR')
    expect(submittedV2.review.status).toBe('submitted')
  })

  it('preserves the existing in-evaluation scoring workspace', () => {
    const inEvaluation = { ...submittedV2, review: { ...submittedV2.review, status: 'in_evaluation' } }
    const html = renderToStaticMarkup(<DeanPortfolioEvaluationWorkspace data={inEvaluation} onReload={() => {}} />)
    expect(html).toContain('Locked HR Criteria')
    expect(html).toContain('Approve')
    expect(html).toContain('Reject')
    expect(html).toContain('Save Draft')
    expect(html).not.toContain('Start Evaluation')
  })
})
