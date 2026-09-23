import { describe, expect, it } from 'vitest'
import { buildFacultyEvaluationSummary, buildFacultyEvaluationSummaryRows, FACULTY_SUMMARY_ROWS } from '../../services/facultyEvaluationSummary'

describe('official Faculty evaluation summary mapping', () => {
  it('preserves every official criterion row, including zero-entry rows', () => {
    const rows = buildFacultyEvaluationSummaryRows([])
    expect(rows).toHaveLength(FACULTY_SUMMARY_ROWS.length)
    expect(rows.every((row) => row.points_earned === 0 && row.documents_submitted === '')).toBe(true)
  })

  it('maps Ph.D. evidence and Dean-accepted points through structured metadata', () => {
    const rows = buildFacultyEvaluationSummaryRows([{ id: 'item-1', category_code: 'A.1', category_metadata: { subcategory_code: 'A1_PHD_HOLDER' }, accepted_points: 40, evidence: [{ original_filename: 'Diploma.pdf' }] }])
    expect(rows.find((row) => row.code === 'A.1.a')).toMatchObject({ documents_submitted: 'Diploma', points_earned: 40, contributing_item_ids: ['item-1'] })
  })

  it('aggregates multiple accomplishments and applies the criterion cap', () => {
    const rows = buildFacultyEvaluationSummaryRows([
      { id: 's1', category_code: 'A.3', accepted_points: 8, evidence_id: 'e1' },
      { id: 's2', category_code: 'A.3', accepted_points: 10, evidence_id: 'e2' },
      { id: 's3', category_code: 'A.3', accepted_points: 6, evidence_id: 'e3' }
    ])
    expect(rows.find((row) => row.code === 'A.3')).toMatchObject({ raw_points: 24, points_earned: 20, documents_submitted: '3 Supporting Documents' })
  })

  it('applies area and grand-total caps, binds the version, and keeps approvals blank', () => {
    const items = FACULTY_SUMMARY_ROWS.map((row, index) => ({
      id: `item-${index}`,
      category_code: row.code,
      category_metadata: row.subcategory ? { subcategory_code: row.subcategory } : {},
      accepted_points: row.weight
    }))
    const summary = buildFacultyEvaluationSummary({ evaluation: { id: 'version-7', evaluation_status: 'completed' }, items })
    expect(summary.document_status).toBe('final')
    expect(summary.portfolio_version_id).toBe('version-7')
    expect(summary.areas.A.points_earned).toBe(70)
    expect(summary.areas.B.points_earned).toBe(50)
    expect(summary.areas.C.points_earned).toBe(40)
    expect(summary.grand_total).toBe(160)
    expect(summary.passing_score).toBe(120)
    expect(Object.values(summary.approval).flat().every((value) => value === '')).toBe(true)
  })

  it('keeps an unconfirmed evaluation in draft state', () => {
    expect(buildFacultyEvaluationSummary({ evaluation: { status: 'in_evaluation', version_id: 'v2' } })).toMatchObject({ document_status: 'draft', portfolio_version_id: 'v2' })
  })
})
