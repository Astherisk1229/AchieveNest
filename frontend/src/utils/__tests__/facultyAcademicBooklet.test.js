import { describe, expect, it } from 'vitest'
import { FACULTY_ACADEMIC_CRITERIA, isFacultyAcademicFormat, normalizeFacultyBookletItems, resolveFacultyCriterion } from '../facultyAcademicBooklet'

describe('Faculty Academic booklet integrity', () => {
  it('routes canonical category codes to official criteria without title guessing', () => {
    expect(resolveFacultyCriterion({ category_code: 'A.1', title: 'Doctor of Philosophy' })).toBe('A.1')
    expect(resolveFacultyCriterion({ category_code: 'B.3', title: 'Research Project' })).toBe('B.3')
    expect(resolveFacultyCriterion({ category: 'Unclassified', is_unclassified: true })).toBeNull()
  })

  it('deduplicates accomplishments and preserves exact evidence identity', () => {
    const item = { id: 'acc-1', category_code: 'A.1', title: 'Doctor of Philosophy in Psychology', organizer_or_publisher: 'Harrington Institute of Advanced Studies', occurrence_date: '2050-12-18', primary_evidence: { id: 'ev-1', original_filename: 'degree.pdf', mime_type: 'application/pdf', status: 'active', previewable: true } }
    const rows = normalizeFacultyBookletItems({ area_a_items: [item, item] })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ accomplishmentId: 'acc-1', criterionKey: 'A.1', reference: 'A1-001', accomplishment_display: 'Doctor of Philosophy in Psychology', organization_display: 'Harrington Institute of Advanced Studies', date_or_period_display: '2050-12-18' })
    expect(rows[0].evidence.id).toBe('ev-1')
  })

  it('renders frozen Ph.D. Units metadata in submitted portfolios', () => {
    const submittedItem = {
      accomplishment_id: '4427f8cb-e60b-4ca3-9b90-3f0753dc036f',
      criterion_code: 'C.3',
      category_metadata: {},
      item_description: 'Doctoral Program in Communication',
      scoring_payload: {
        category_metadata: {
          portfolio_format: 'faculty_academic',
          subcategory_code: 'A1_PHD_UNITS',
          start_date: '2025-06-27',
          end_date: '2026-04-27',
          details: {
            program: 'Doctoral Program in Communication',
            institution: 'NOTRE DAME OF MARBEL UNIVERSITY',
            semester: 'Second Semester',
            academic_year: '2025-2026',
            units_completed: 15
          }
        }
      }
    }

    expect(resolveFacultyCriterion(submittedItem)).toBe('A.1')
    expect(normalizeFacultyBookletItems({ items: [submittedItem] })).toEqual([
      expect.objectContaining({
        accomplishmentId: submittedItem.accomplishment_id,
        criterionKey: 'A.1',
        subcategoryCode: 'A1_PHD_UNITS',
        date_or_period_display: '2025-06-27 – 2026-04-27',
        accomplishment_display: 'Doctoral Program in Communication',
        organization_display: 'NOTRE DAME OF MARBEL UNIVERSITY',
        remarks_classification_display: 'Ph.D. Units · Second Semester · AY 2025-2026 · 15 units completed'
      })
    ])
  })

  it('keeps separate Ph.D. Units semester submissions as separate Education rows', () => {
    const phdItem = (id, semester) => ({
      accomplishment_id: id,
      criterion_code: 'A.1',
      scoring_payload: {
        category_metadata: {
          subcategory_code: 'A1_PHD_UNITS',
          start_date: '2025-06-27',
          end_date: '2026-04-27',
          details: {
            program: 'Doctoral Program in Communication',
            institution: 'NOTRE DAME OF MARBEL UNIVERSITY',
            semester,
            academic_year: '2025-2026',
            units_completed: 15
          }
        }
      }
    })

    const rows = normalizeFacultyBookletItems({ items: [phdItem('phd-1', 'First Semester'), phdItem('phd-2', 'Second Semester')] })
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.reference)).toEqual(['A1-001', 'A1-002'])
  })

  it('continues to classify actual years-of-service items as C.3', () => {
    expect(resolveFacultyCriterion({ accomplishment_id: 'service-1', criterion_code: 'C.3', title: 'Years of Service at NDMU' })).toBe('C.3')
  })

  it('renders a genuinely empty source and rejects non-teaching format reuse', () => {
    expect(normalizeFacultyBookletItems({})).toEqual([])
    expect(isFacultyAcademicFormat({ personnel_group: 'faculty' })).toBe(true)
    expect(isFacultyAcademicFormat({ personnel_group: 'non_teaching_faculty' })).toBe(false)
  })

  it('defines official deterministic ordering and category-specific table headings', () => {
    expect(FACULTY_ACADEMIC_CRITERIA.map((criterion) => criterion.key)).toEqual([
      'A.1', 'A.2', 'A.3', 'B.1', 'B.2', 'B.3', 'B.4', 'B.5', 'B.6',
      'C.1.1', 'C.1.2', 'C.1.3', 'C.1.4', 'C.2.1', 'C.2.2', 'C.2.3', 'C.3'
    ])
    expect(FACULTY_ACADEMIC_CRITERIA.find((criterion) => criterion.key === 'A.1')?.columns).toEqual([
      'Date(s)', 'Course/Degree', 'School/University', 'Remarks'
    ])
    expect(FACULTY_ACADEMIC_CRITERIA.find((criterion) => criterion.key === 'B.3')?.columns[2]).toBe('Granted by')
    expect(FACULTY_ACADEMIC_CRITERIA.find((criterion) => criterion.key === 'C.3')?.columns).toHaveLength(2)
  })
})
