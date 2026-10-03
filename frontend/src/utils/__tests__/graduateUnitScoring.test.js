import { describe, expect, it } from 'vitest'
import { aggregateGraduateUnits, graduateUnitPoints } from '../graduateUnitScoring'
import { calculateNDMUScores } from '../../pages/hr-admin/evaluation-submissions/evaluation/rating/NDMURatingEngine'
import { validateAccomplishmentForm } from '../personnelAccomplishmentForm'
import { FACULTY_ACADEMIC_ENTRY_SCHEMA } from '../../config/facultyAcademicAccomplishmentSchema'

const item = (id, code, units, extra = {}) => ({
  id, categoryArea: 'areaA', criterionCode: 'A.1', criterionKey: code, verificationStatus: 'verified', ratingStatus: 'rated', awardedPoints: 0,
  scoringPayload: { category_metadata: { subcategory_code: code === 'A.1.2' ? 'A1_PHD_UNITS' : 'A1_MA_UNITS', details: { units_completed: String(units) } } },
  ...extra,
})

describe('Graduate units: separate semesters, summed units, table applied once', () => {
  it('uses the official tables', () => {
    expect([3, 6, 9, 12, 15, 18].map(u => graduateUnitPoints('PHD', u))).toEqual([2, 4, 6, 8, 10, 10])
    expect([3, 15, 18, 30, 33].map(u => graduateUnitPoints('MA', u))).toEqual([1, 5, 6, 10, 10])
  })

  it('6 + 9 MA units = 15 units = 5 points, from two separate items', () => {
    const levels = aggregateGraduateUnits([item('a', 'A.1.4', 6), item('b', 'A.1.4', 9)])
    expect(levels.MA).toMatchObject({ units: 15, points: 5, itemIds: ['a', 'b'] })
  })

  it('12 + 6 Ph.D. units = 10 points, never 8 + 4', () => {
    const scores = calculateNDMUScores([item('a', 'A.1.2', 12), item('b', 'A.1.2', 6)])
    expect(scores.graduateUnits.PHD).toMatchObject({ units: 18, points: 10 })
    expect(scores.areaA.degrees).toBe(10)
  })

  it('keeps MA and Ph.D. units apart and ignores unrated semesters', () => {
    const levels = aggregateGraduateUnits([item('a', 'A.1.4', 6), item('b', 'A.1.2', 9), item('c', 'A.1.4', 9, { ratingStatus: 'unrated' })])
    expect(levels.MA.units).toBe(6)
    expect(levels.PHD.units).toBe(9)
  })

  it('requires the semester and a consecutive academic year on each units record', () => {
    const config = FACULTY_ACADEMIC_ENTRY_SCHEMA.find(c => c.code === 'A.1').subcategories.find(s => s.code === 'A1_MA_UNITS')
    const base = { startDate: '2025-06-01', endDate: '2025-10-15', ongoing: false, persistedEvidence: [{ id: 'e' }], pendingEvidence: [], details: { units_completed: '6', program: 'MA Education', institution: 'NDMU' } }
    const errors = validateAccomplishmentForm({ ...base, details: { ...base.details, academic_year: '2025-2027' } }, config, '2026-10-03')
    expect(errors.semester).toBeTruthy()
    expect(errors.academic_year).toBeTruthy()
    expect(validateAccomplishmentForm({ ...base, details: { ...base.details, semester: 'First Semester', academic_year: '2025-2026' } }, config, '2026-10-03')).toEqual({})
  })
})
