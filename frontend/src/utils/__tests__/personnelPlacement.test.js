import { describe, expect, it } from 'vitest'
import { collectPersonnelPlacementOptions, formatPersonnelPlacement, isAcademicPersonnel, validatePersonnelPlacement } from '../personnelPlacement'

const options = {
  colleges: [{ id: 'college-1', code: 'CEAC', name: 'Engineering' }],
  academicPrograms: [{ id: 'program-1', collegeId: 'college-1', code: 'BSCS', name: 'Computer Science' }, { id: 'program-2', collegeId: 'college-2', code: 'BSA', name: 'Accountancy' }],
  administrativeUnits: [{ id: 'unit-1', code: 'HR', name: 'Human Resources Office' }]
}

describe('Personnel placement rules', () => {
  it('recognizes Academic Personnel from the authoritative classification', () => expect(isAcademicPersonnel({ personnel_classification: 'academic' })).toBe(true))
  it('does not infer Academic Personnel from placement strings', () => expect(isAcademicPersonnel({ college: 'CEAC' })).toBe(false))
  it('requires a College for Academic Personnel', () => expect(validatePersonnelPlacement({ classification: 'academic', academicProgramIds: ['program-1'] }, options).errors.collegeId).toBeTruthy())
  it('requires at least one Academic Program', () => expect(validatePersonnelPlacement({ classification: 'academic', collegeId: 'college-1' }, options).errors.academicProgramIds).toBeTruthy())
  it('rejects an Academic Program outside the selected College', () => expect(validatePersonnelPlacement({ classification: 'academic', collegeId: 'college-1', academicProgramIds: ['program-2'] }, options).isValid).toBe(false))
  it('accepts multiple Programs within the selected College', () => {
    const multi = { ...options, academicPrograms: [...options.academicPrograms, { id: 'program-3', collegeId: 'college-1', code: 'BSIT', name: 'Information Technology' }] }
    expect(validatePersonnelPlacement({ classification: 'academic', collegeId: 'college-1', academicProgramIds: ['program-1', 'program-3'] }, multi).isValid).toBe(true)
  })
  it('requires an Administrative Unit for Non-Academic Personnel', () => expect(validatePersonnelPlacement({ classification: 'non_academic' }, options).errors.administrativeUnitId).toBeTruthy())
  it('does not require College or Programs for Non-Academic Personnel', () => expect(validatePersonnelPlacement({ classification: 'non_academic', administrativeUnitId: 'unit-1' }, options).isValid).toBe(true))
  it('formats Academic affiliation without a Department fallback', () => expect(formatPersonnelPlacement({ personnel_classification: 'academic', college_code: 'CEAC', program_affiliations: [{ code: 'BSCS' }] })).toBe('CEAC • BSCS'))
  it('formats Non-Academic affiliation as its Administrative Unit', () => expect(formatPersonnelPlacement({ personnel_classification: 'non_academic', administrative_unit_name: 'Human Resources Office' })).toBe('Human Resources Office'))
  it('collects reference IDs from the authoritative directory response', () => {
    const result = collectPersonnelPlacementOptions([{ college_id: 'college-1', college_code: 'CEAC', program_affiliations: [{ academic_program_id: 'program-1', college_id: 'college-1', code: 'BSCS' }], administrative_unit_id: 'unit-1', administrative_unit_code: 'HR' }])
    expect(result.colleges[0].id).toBe('college-1')
    expect(result.academicPrograms[0].id).toBe('program-1')
    expect(result.administrativeUnits[0].id).toBe('unit-1')
  })
})
