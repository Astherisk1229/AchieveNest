import { describe, it, expect } from 'vitest'
import CollegeModel from '../CollegeModel'
import DepartmentModel from '../DepartmentModel'
import DegreeProgramModel from '../DegreeProgramModel'
import StudentOrganizationModel from '../StudentOrganizationModel'
import ProgramCoordinatorAssignmentModel from '../ProgramCoordinatorAssignmentModel'
import OrganizationModeratorAssignmentModel from '../OrganizationModeratorAssignmentModel'

describe('OSAD Academic Hierarchy & Student Organization Rules', () => {
  const mockColleges = [
    new CollegeModel({ id: 'col-ceac', code: 'CEAC', name: 'College of Engineering', status: 'active' })
  ]

  const mockDepartments = [
    new DepartmentModel({ id: 'dept-cs', collegeId: 'col-ceac', code: 'DEPT-CS', name: 'Department of Computer Studies', status: 'active' })
  ]

  const mockPrograms = [
    new DegreeProgramModel({ id: 'prog-bscs', departmentId: 'dept-cs', code: 'BSCS', name: 'BS Computer Science', status: 'active' })
  ]

  const mockPersonnel = [
    { id: 'pers-101', full_name: 'Prof. Marco Valdez', role: 'personnel' }
  ]

  const mockOrganizations = [
    new StudentOrganizationModel({ id: 'org-cs', name: 'Computer Society', code: 'COMSOC', scopeType: 'department', collegeId: 'col-ceac', departmentId: 'dept-cs', status: 'active' })
  ]

  it('validates College creation with required code and name', () => {
    const valid = CollegeModel.validate({ code: 'CBA', name: 'College of Business' }, mockColleges)
    expect(valid.isValid).toBe(true)

    const invalid = CollegeModel.validate({ code: 'CEAC', name: 'Duplicate' }, mockColleges)
    expect(invalid.isValid).toBe(false)
    expect(invalid.errors[0]).toContain('already exists')
  })

  it('rejects Department creation if parent College is missing or archived', () => {
    const invalidNoCollege = DepartmentModel.validate({ code: 'DEPT-[#16834a]', name: 'No College Dept' }, mockColleges, [])
    expect(invalidNoCollege.isValid).toBe(false)
    expect(invalidNoCollege.errors[0]).toContain('parent College must be selected')

    const validDept = DepartmentModel.validate({ collegeId: 'col-ceac', code: 'DEPT-[#16834a]', name: 'Valid Dept' }, mockColleges, [])
    expect(validDept.isValid).toBe(true)
  })

  it('rejects Degree Program creation if parent Department is missing', () => {
    const invalidNoDept = DegreeProgramModel.validate({ code: 'BSIT', name: 'BS IT' }, mockDepartments, [])
    expect(invalidNoDept.isValid).toBe(false)

    const validProg = DegreeProgramModel.validate({ departmentId: 'dept-cs', code: 'BSIT', name: 'BS IT' }, mockDepartments, [])
    expect(validProg.isValid).toBe(true)
  })

  it('validates Student Organization Scope rules accurately', () => {
    // University Scope
    const uniScope = StudentOrganizationModel.validateScope({ scopeType: 'university' })
    expect(uniScope.isValid).toBe(true)

    // Department Scope without Department ID
    const invalidDeptOrg = StudentOrganizationModel.validateScope(
      { scopeType: 'department', collegeId: 'col-ceac' },
      mockColleges,
      mockDepartments,
      mockPrograms
    )
    expect(invalidDeptOrg.isValid).toBe(false)
    expect(invalidDeptOrg.errors[0]).toContain('Department-based organization requires a Department')

    // Valid Department Scope
    const validDeptOrg = StudentOrganizationModel.validateScope(
      { scopeType: 'department', collegeId: 'col-ceac', departmentId: 'dept-cs' },
      mockColleges,
      mockDepartments,
      mockPrograms
    )
    expect(validDeptOrg.isValid).toBe(true)
  })

  it('assigns Program Coordinator to a Department and Organization Moderator to an Organization', () => {
    const coordinatorVal = ProgramCoordinatorAssignmentModel.validate(
      { departmentId: 'dept-cs', personnelId: 'pers-101' },
      mockDepartments,
      mockPersonnel
    )
    expect(coordinatorVal.isValid).toBe(true)

    const moderatorVal = OrganizationModeratorAssignmentModel.validate(
      { organizationId: 'org-cs', personnelId: 'pers-101' },
      mockOrganizations,
      mockPersonnel
    )
    expect(moderatorVal.isValid).toBe(true)
  })

  it('blocks deletion of a College with active Departments', () => {
    const deleteCheck = CollegeModel.isDeletable('col-ceac', mockDepartments, [])
    expect(deleteCheck.canDelete).toBe(false)
    expect(deleteCheck.activeDepartmentCount).toBe(1)
  })
})
