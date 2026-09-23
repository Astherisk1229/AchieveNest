import { describe, it, expect } from 'vitest'
import CollegeModel from '../CollegeModel'
import DegreeProgramModel from '../DegreeProgramModel'
import StudentOrganizationModel from '../StudentOrganizationModel'
import ProgramCoordinatorAssignmentModel from '../ProgramCoordinatorAssignmentModel'
import OrganizationModeratorAssignmentModel from '../OrganizationModeratorAssignmentModel'

describe('OSAD Academic Structure and governance rules', () => {
  const colleges = [new CollegeModel({ id: 'col-ceac', code: 'CEAC', name: 'College of Engineering', status: 'active' })]
  const programs = [new DegreeProgramModel({ id: 'prog-bscs', collegeId: 'col-ceac', code: 'BSCS', name: 'BS Computer Science', status: 'active' })]
  const personnel = [{ id: 'pers-101', full_name: 'Prof. Marco Valdez', role: 'personnel' }]
  const organizations = [new StudentOrganizationModel({ id: 'org-cs', name: 'Computer Society', code: 'COMSOC', scopeType: 'college', collegeId: 'col-ceac', academicProgramIds: ['prog-bscs'], status: 'active' })]

  it('places Academic Programs directly under Colleges', () => {
    expect(DegreeProgramModel.validate({ collegeId: 'col-ceac', code: 'BSIT', name: 'BS IT' }, colleges, programs).isValid).toBe(true)
    expect(DegreeProgramModel.validate({ code: 'BSIT', name: 'BS IT' }, colleges, programs).isValid).toBe(false)
  })

  it('allows university or college organization scope with optional Program coverage', () => {
    expect(StudentOrganizationModel.validateScope({ scopeType: 'university' }, colleges, programs).isValid).toBe(true)
    expect(StudentOrganizationModel.validateScope({ scopeType: 'college', collegeId: 'col-ceac', academicProgramIds: ['prog-bscs'] }, colleges, programs).isValid).toBe(true)
    expect(StudentOrganizationModel.validateScope({ scopeType: 'department', collegeId: 'col-ceac' }, colleges, programs).isValid).toBe(false)
  })

  it('scopes coordinators to Academic Programs and moderators to Organizations', () => {
    expect(ProgramCoordinatorAssignmentModel.validate({ academicProgramId: 'prog-bscs', personnelId: 'pers-101' }, programs, personnel).isValid).toBe(true)
    expect(OrganizationModeratorAssignmentModel.validate({ organizationId: 'org-cs', personnelId: 'pers-101' }, organizations, personnel).isValid).toBe(true)
  })

  it('blocks deletion of a College with active Academic Programs', () => {
    const result = CollegeModel.isDeletable('col-ceac', programs, [])
    expect(result.canDelete).toBe(false)
    expect(result.activeAcademicProgramCount).toBe(1)
  })

  it('rejects Program coverage outside the selected College', () => {
    const otherProgram = new DegreeProgramModel({ id: 'prog-other', collegeId: 'col-other', code: 'OTHER', name: 'Other', status: 'active' })
    expect(StudentOrganizationModel.validateScope({ scopeType: 'college', collegeId: 'col-ceac', academicProgramIds: ['prog-other'] }, colleges, [otherProgram]).isValid).toBe(false)
  })

  it('rejects a coordinator assignment without an Academic Program', () => {
    expect(ProgramCoordinatorAssignmentModel.validate({ personnelId: 'pers-101' }, programs, personnel).isValid).toBe(false)
  })

  it('rejects an unknown coordinator', () => {
    expect(ProgramCoordinatorAssignmentModel.validate({ academicProgramId: 'prog-bscs', personnelId: 'missing' }, programs, personnel).isValid).toBe(false)
  })

  it('allows deletion of an empty College', () => {
    expect(CollegeModel.isDeletable('col-empty', programs, organizations).canDelete).toBe(true)
  })
})
