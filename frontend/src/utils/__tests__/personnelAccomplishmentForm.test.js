import { describe, expect, it } from 'vitest'
import { facultySubcategoryByCode } from '../../config/facultyAcademicAccomplishmentSchema'
import { isStrictIsoDate, mapAccomplishmentToForm, validateAccomplishmentForm } from '../personnelAccomplishmentForm'

describe('Faculty accomplishment form contract', () => {
  it('keeps degree-holder and units schemas distinct', () => {
    expect(facultySubcategoryByCode('A1_PHD_HOLDER').fields.map((field) => field.name)).toEqual(['degree_title', 'institution'])
    expect(facultySubcategoryByCode('A1_PHD_UNITS').fields.map((field) => field.name)).toEqual(['units_completed', 'program', 'institution'])
  })

  it('strictly rejects impossible calendar dates', () => {
    expect(isStrictIsoDate('2026-02-30')).toBe(false)
    expect(isStrictIsoDate('2026-09-10')).toBe(true)
  })

  it('rejects non-positive units and future completed dates', () => {
    const config = facultySubcategoryByCode('A1_PHD_UNITS')
    const errors = validateAccomplishmentForm({ startDate: '2026-09-01', endDate: '2026-09-20', ongoing: false, details: { units_completed: '0', program: 'Ph.D. Education', institution: 'NDMU' }, persistedEvidence: [{ id: 'ev-1' }], pendingEvidence: [] }, config, '2026-09-10')
    expect(errors.units_completed).toMatch(/greater than zero/i)
    expect(errors.endDate).toMatch(/future/i)
  })

  it('prefills structured metadata and persisted evidence without inventing values', () => {
    const form = mapAccomplishmentToForm({ id: 'acc-1', category_code: 'A.1', occurrence_date: '2026-08-01', category_metadata: JSON.stringify({ subcategory_code: 'A1_PHD_HOLDER', details: { degree_title: 'Doctor of Philosophy', institution: 'NDMU' } }), evidence: [{ id: 'ev-1', original_filename: 'degree.pdf' }] })
    expect(form).toMatchObject({ id: 'acc-1', categoryCode: 'A.1', subcategoryCode: 'A1_PHD_HOLDER', date: '2026-08-01', details: { degree_title: 'Doctor of Philosophy', institution: 'NDMU' }, legacy: false })
    expect(form.persistedEvidence[0].id).toBe('ev-1')
  })
})
