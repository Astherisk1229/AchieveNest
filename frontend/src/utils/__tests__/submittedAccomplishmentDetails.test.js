import { describe, expect, it } from 'vitest'
import { submittedAccomplishmentDetails, submittedScoringOptions } from '../submittedAccomplishmentDetails'
import { facultySubcategoryByCode } from '../../config/facultyAcademicAccomplishmentSchema'

describe('submitted accomplishment detail display', () => {
  it('shows only values frozen into the B.1 evaluation item', () => {
    const item = {
      scoring_payload: { occurrence_date: '2026-05-15', category_metadata: {
        subcategory_code: 'B1_ACTIVITY', start_date: '2026-05-14', end_date: '2026-05-15',
        details: { activity_title: 'Festival', organizer: 'College of Arts', role: 'Judge', extent: '2 Days', scope: 'National', participants: '40' },
      } },
    }
    const rows = submittedAccomplishmentDetails(item)
    expect(rows).toEqual(expect.arrayContaining([
      { key: 'role', label: 'Role', value: 'Judge' },
      { key: 'extent', label: 'Extent / Duration', value: '2 Days' },
      { key: 'scope', label: 'Participant Level / Scope', value: 'National' },
      { key: 'start_date', label: 'Start date', value: '2026-05-14' },
      { key: 'end_date', label: 'End date', value: '2026-05-15' },
    ]))
    expect(rows.find(row => row.key === 'occurrence_date')).toBeUndefined()
    expect(rows.find(row => row.key === 'participants')).toBeUndefined()
  })

  it('does not include numeric participant count in the B.1 entry schema', () => {
    const schema = facultySubcategoryByCode('B1_ACTIVITY')
    expect(schema.fields.map(field => field.name)).not.toContain('participants')
  })

  it('shows locked option points but never invents absent values', () => {
    const item = { scoring_payload: JSON.stringify({ category_metadata: { subcategory_code: 'B3_RESEARCH', details: { research_title: 'Study' } } }),
      criterion_snapshot: { matched_options: [{ label: 'Judge', points: 3 }, { label: 'Unknown' }] } }
    expect(submittedAccomplishmentDetails(item)).toContainEqual({ key: 'research_title', label: 'Research', value: 'Study' })
    expect(submittedAccomplishmentDetails(item).some(row => row.key === 'granting_body')).toBe(false)
    expect(submittedScoringOptions(item)).toEqual([{ label: 'Judge', points: 3 }])
  })

  it('keeps a historical unmapped item’s scalar snapshot details visible', () => {
    const item = { scoring_payload: { category_metadata: { subcategory_code: 'OLD', details: { custom_field: 'Submitted' } }, occurrence_date: '2025-02-05' } }
    expect(submittedAccomplishmentDetails(item)).toEqual([
      { key: 'custom_field', label: 'custom field', value: 'Submitted' },
      { key: 'occurrence_date', label: 'Date', value: '2025-02-05' },
    ])
  })
})
