import CollegeModel from '../models/CollegeModel.js'
import DepartmentModel from '../models/DepartmentModel.js'
import DegreeProgramModel from '../models/DegreeProgramModel.js'
import StudentOrganizationModel from '../models/StudentOrganizationModel.js'
import ProgramCoordinatorAssignmentModel from '../models/ProgramCoordinatorAssignmentModel.js'
import OrganizationModeratorAssignmentModel from '../models/OrganizationModeratorAssignmentModel.js'

export default class AcademicStructureController {
  constructor(initialState = {}) {
    this.colleges = initialState.colleges || [
      new CollegeModel({ id: 'col-ceac', code: 'CEAC', name: 'College of Engineering, Architecture & Computing' }),
      new CollegeModel({ id: 'col-cba', code: 'CBA', name: 'College of Business & Accountancy' }),
      new CollegeModel({ id: 'col-cas', code: 'CAS', name: 'College of Arts & Sciences' })
    ]

    this.departments = initialState.departments || [
      {
        id: 'dept-01',
        collegeId: 'col-ceac',
        name: 'Department of Computer Studies (CEAC)',
        code: 'DEPT-CS',
        programs: ['BS Computer Science', 'BS Information Technology'],
        dean_name: 'Dr. Ana Reyes',
        dean_id: 'usr-[#16834a]-201',
        student_count: 320,
        status: 'active'
      },
      {
        id: 'dept-02',
        collegeId: 'col-cba',
        name: 'Department of Business Administration (CBA)',
        code: 'DEPT-BUS',
        programs: ['BS Business Administration', 'BS Accountancy'],
        dean_name: 'Prof. Grace Tan',
        dean_id: 'usr-[#16834a]-203',
        student_count: 245,
        status: 'active'
      },
      {
        id: 'dept-03',
        collegeId: 'col-cas',
        name: 'Department of Communication & Social Sciences (CAS)',
        code: 'DEPT-COM',
        programs: ['BA Communication', 'BS Psychology'],
        dean_name: 'Dr. Fernando Alonzo',
        dean_id: 'usr-[#16834a]-204',
        student_count: 190,
        status: 'active'
      }
    ]

    this.degreePrograms = initialState.degreePrograms || [
      new DegreeProgramModel({ id: 'prog-01', departmentId: 'dept-01', code: 'BSCS', name: 'BS Computer Science', degreeLevel: 'Bachelor', status: 'active' }),
      new DegreeProgramModel({ id: 'prog-02', departmentId: 'dept-01', code: 'BSIT', name: 'BS Information Technology', degreeLevel: 'Bachelor', status: 'active' }),
      new DegreeProgramModel({ id: 'prog-03', departmentId: 'dept-02', code: 'BSBA', name: 'BS Business Administration', degreeLevel: 'Bachelor', status: 'active' }),
      new DegreeProgramModel({ id: 'prog-04', departmentId: 'dept-03', code: 'BACOM', name: 'BA Communication', degreeLevel: 'Bachelor', status: 'active' })
    ]

    this.organizations = initialState.organizations || [
      {
        id: 'org-01',
        name: 'Computer Society NDMU',
        category: 'Academic & Technology',
        coordinator_name: 'Engr. Roberto Cruz',
        coordinator_id: 'usr-[#16834a]-202',
        member_count: 140,
        status: 'Active'
      },
      {
        id: 'org-02',
        name: 'Junior Executive Club',
        category: 'Business Leadership',
        coordinator_name: 'Prof. Grace Tan',
        coordinator_id: 'usr-[#16834a]-203',
        member_count: 95,
        status: 'Active'
      },
      {
        id: 'org-03',
        name: 'Supreme Student Council',
        category: 'Student Government',
        coordinator_name: 'Engr. Roberto Cruz',
        coordinator_id: 'usr-[#16834a]-202',
        member_count: 220,
        status: 'Active'
      }
    ]

    this.clubs = initialState.clubs || [
      {
        id: 'club-01',
        name: 'AI & Robotics Student Guild',
        parent_org: 'Computer Society NDMU',
        moderator_name: 'Dr. Ana Reyes',
        moderator_id: 'usr-[#16834a]-201',
        member_count: 45,
        status: 'Active'
      },
      {
        id: 'club-02',
        name: 'FinTech & Accounting Circle',
        parent_org: 'Junior Executive Club',
        moderator_name: 'Prof. Grace Tan',
        moderator_id: 'usr-[#16834a]-203',
        member_count: 38,
        status: 'Active'
      },
      {
        id: 'club-03',
        name: 'Green Campus Environment Club',
        parent_org: 'Supreme Student Council',
        moderator_name: 'Dr. Fernando Alonzo',
        moderator_id: 'usr-[#16834a]-204',
        member_count: 60,
        status: 'Active'
      }
    ]

    this.programCoordinatorAssignments = initialState.programCoordinatorAssignments || [
      new ProgramCoordinatorAssignmentModel({ id: 'pca-01', departmentId: 'dept-01', personnelId: 'usr-[#16834a]-202', personnelName: 'Prof. Marco Valdez', status: 'active' }),
      new ProgramCoordinatorAssignmentModel({ id: 'pca-02', departmentId: 'dept-02', personnelId: 'usr-[#16834a]-203', personnelName: 'Prof. Grace Tan', status: 'active' })
    ]

    this.organizationModeratorAssignments = initialState.organizationModeratorAssignments || [
      new OrganizationModeratorAssignmentModel({ id: 'oma-01', organizationId: 'org-01', personnelId: 'usr-[#16834a]-205', personnelName: 'Prof. Elena Rostova', status: 'active' })
    ]
  }

  getColleges() {
    return [...this.colleges]
  }

  getDepartments(collegeId = null) {
    if (!collegeId || collegeId === 'all') return [...this.departments]
    return this.departments.filter(d => d.collegeId === collegeId)
  }

  getDegreePrograms(departmentId = null) {
    if (!departmentId || departmentId === 'all') return [...this.degreePrograms]
    return this.degreePrograms.filter(p => p.departmentId === departmentId)
  }

  getOrganizations() {
    return [...this.organizations]
  }

  getClubs() {
    return [...this.clubs]
  }

  getProgramCoordinatorAssignments() {
    return [...this.programCoordinatorAssignments]
  }

  getOrganizationModeratorAssignments() {
    return [...this.organizationModeratorAssignments]
  }

  createCollege(payload) {
    const college = new CollegeModel(payload)
    this.colleges.push(college)
    return college
  }

  createDepartment(payload) {
    const dept = new DepartmentModel(payload)
    this.departments.push(dept)
    return dept
  }

  createDegreeProgram(payload) {
    const program = new DegreeProgramModel(payload)
    this.degreePrograms.push(program)
    return program
  }

  createStudentOrganizationWithScope(payload) {
    const organization = new StudentOrganizationModel(payload)
    this.organizations.push(organization)
    return organization
  }

  assignProgramCoordinatorToDepartment(departmentId, personnelId, personnelName) {
    const previous = this.programCoordinatorAssignments.find(a => a.departmentId === departmentId && a.status === 'active')
    if (previous) {
      previous.status = 'ended'
      previous.effectiveTo = new Date().toISOString()
      previous.endReason = 'Replaced by OSAD Staff'
    }

    const assignment = new ProgramCoordinatorAssignmentModel({ departmentId, personnelId, personnelName, status: 'active' })
    this.programCoordinatorAssignments.push(assignment)
    return assignment
  }

  assignOrganizationModeratorToOrg(organizationId, personnelId, personnelName) {
    const previous = this.organizationModeratorAssignments.find(a => a.organizationId === organizationId && a.status === 'active')
    if (previous) {
      previous.status = 'ended'
      previous.effectiveTo = new Date().toISOString()
      previous.endReason = 'Replaced by OSAD Staff'
    }

    const assignment = new OrganizationModeratorAssignmentModel({ organizationId, personnelId, personnelName, status: 'active' })
    this.organizationModeratorAssignments.push(assignment)
    return assignment
  }
}