import { describe, expect, it } from 'vitest'
import { getEvaluationCriterionContext } from '../evaluationCriterionContext'

const facultySnapshot = (overrides = {}) => ({
  criterion_version_id: 'faculty-v1',
  criterion_snapshot: {
    criterion_reference: 'A.3.1',
    category: { category_code: 'A.3', name: 'Seminars / Trainings', max_points: 20 },
    subcategory: { subcategory_code: 'A.3.1', name: 'Attendance to Seminar / Training' },
    configured_points: 8,
    criterion_cap: 20,
    ...overrides,
  },
})

describe('evaluation criterion context and initial remarks', () => {
  it('1. includes subcategory points and category cut-off without a level', () => {
    const context = getEvaluationCriterionContext(facultySnapshot())
    expect(context.generatedRemark).toBe('Attendance to Seminar / Training — 8 points. Category cut-off: 20 points.')
  })

  it('2. uses the selected configured level label', () => {
    const context = getEvaluationCriterionContext(facultySnapshot({ selected_level: { option_group_code: 'LEVEL', label: 'National' } }))
    expect(context.level).toBe('National')
    expect(context.generatedRemark).toContain('National — 8 points.')
  })

  it('3. leaves the saved evaluator edit distinct from the generated basis', () => {
    const context = getEvaluationCriterionContext({ ...facultySnapshot(), evaluator_remarks: 'Certificate and date verified.' })
    expect(context.generatedRemark).toContain('8 points')
    expect(context).not.toHaveProperty('evaluatorRemarks')
  })

  it('4. does not use evaluator remarks to determine configured points', () => {
    const context = getEvaluationCriterionContext({ ...facultySnapshot(), evaluator_remarks: '999 points' })
    expect(context.configuredPoints).toBe('8')
  })

  it('5. does not use evaluator remarks to determine selected level', () => {
    const context = getEvaluationCriterionContext({ ...facultySnapshot({ selected_level: { option_group_code: 'LEVEL', label: 'National' } }), evaluator_remarks: 'International' })
    expect(context.level).toBe('National')
  })

  it('6. keeps category and subcategory from the criterion snapshot', () => {
    const context = getEvaluationCriterionContext({ ...facultySnapshot(), evaluator_remarks: 'Different category: A.1' })
    expect(context.category).toBe('Seminars / Trainings')
    expect(context.subcategory).toBe('Attendance to Seminar / Training')
  })

  it('7. uses a historical snapshot remark instead of recalculating from a newer version', () => {
    const oldItem = facultySnapshot({ system_generated_remark: 'Local — 4 points. Category cut-off: 20 points.' })
    oldItem.criterion_version_id = 'faculty-v1'
    expect(getEvaluationCriterionContext(oldItem).generatedRemark).toBe('Local — 4 points. Category cut-off: 20 points.')
    expect(getEvaluationCriterionContext(oldItem).criteriaVersionId).toBe('faculty-v1')
  })

  it('8. describes manual judgment and cap without inventing a point breakdown', () => {
    const context = getEvaluationCriterionContext(facultySnapshot({ evaluator_judgment_required: true, configured_points: 40, criterion_cap: 40, subcategory: { name: 'Conduct of Research' } }))
    expect(context.generatedRemark).toBe('Conduct of Research — manual evaluator scoring. Maximum: 40 points.')
    expect(context.generatedRemark).not.toContain('40 points. Category cut-off')
  })

  it('9. returns Faculty configuration context for Dean evaluation items', () => {
    const context = getEvaluationCriterionContext(facultySnapshot())
    expect(context.criterionReference).toBe('A.3.1')
    expect(context.category).toBe('Seminars / Trainings')
  })

  it('10. returns Non-Teaching configuration context for HR evaluation items', () => {
    const item = facultySnapshot({ category: { category_code: 'B.1', name: 'School Involvement', max_points: 30 }, subcategory: { subcategory_code: 'B.1.1', name: 'Moderator / Officer of Clubs' }, configured_points: 30, criterion_cap: 30 })
    item.criterion_snapshot.criterion_reference = 'B.1.1'
    item.criterion_version_id = 'ntf-v1'
    const context = getEvaluationCriterionContext(item)
    expect(context.criteriaVersionId).toBe('ntf-v1')
    expect(context.generatedRemark).toBe('Moderator / Officer of Clubs — 30 points. Category cut-off: 30 points.')
  })

  it('11. ignores arbitrary remarks as a source of criterion points', () => {
    const item = facultySnapshot()
    const before = getEvaluationCriterionContext(item)
    const after = getEvaluationCriterionContext({ ...item, evaluator_remarks: '0 points; A.1; International' })
    expect(after.configuredPoints).toBe(before.configuredPoints)
    expect(after.category).toBe(before.category)
    expect(after.generatedRemark).toBe(before.generatedRemark)
  })
})
