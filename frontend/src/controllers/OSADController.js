/**
 * OSADController.js
 * Business Logic & Data Store Controller for Office of Student Affairs & Services (OSAD).
 * Strictly follows OOP & MVC architecture.
 */

import { parseFullName } from '../utils/nameFormatter.js'
import CollegeModel from '../models/CollegeModel.js'
import DepartmentModel from '../models/DepartmentModel.js'
import DegreeProgramModel from '../models/DegreeProgramModel.js'
import StudentOrganizationModel from '../models/StudentOrganizationModel.js'
import ProgramCoordinatorAssignmentModel from '../models/ProgramCoordinatorAssignmentModel.js'
import OrganizationModeratorAssignmentModel from '../models/OrganizationModeratorAssignmentModel.js'

class OSADController {
  #users
  #colleges
  #departments
  #degreePrograms
  #organizations
  #clubs
  #programCoordinatorAssignments
  #organizationModeratorAssignments
  #awardCategories
  #awardees
  #auditLogs
  #accreditationReports

  constructor() {
    this.#colleges = [
      new CollegeModel({ id: 'col-ceac', code: 'CEAC', name: 'College of Engineering, Architecture & Computing' }),
      new CollegeModel({ id: 'col-cba', code: 'CBA', name: 'College of Business & Accountancy' }),
      new CollegeModel({ id: 'col-cas', code: 'CAS', name: 'College of Arts & Sciences' })
    ]
    this.#departments = [
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

    this.#degreePrograms = [
      new DegreeProgramModel({ id: 'prog-01', departmentId: 'dept-01', code: 'BSCS', name: 'BS Computer Science', degreeLevel: 'Bachelor', status: 'active' }),
      new DegreeProgramModel({ id: 'prog-02', departmentId: 'dept-01', code: 'BSIT', name: 'BS Information Technology', degreeLevel: 'Bachelor', status: 'active' }),
      new DegreeProgramModel({ id: 'prog-03', departmentId: 'dept-02', code: 'BSBA', name: 'BS Business Administration', degreeLevel: 'Bachelor', status: 'active' }),
      new DegreeProgramModel({ id: 'prog-04', departmentId: 'dept-03', code: 'BACOM', name: 'BA Communication', degreeLevel: 'Bachelor', status: 'active' })
    ]

    this.#programCoordinatorAssignments = [
      new ProgramCoordinatorAssignmentModel({ id: 'pca-01', departmentId: 'dept-01', personnelId: 'usr-[#16834a]-202', personnelName: 'Prof. Marco Valdez', status: 'active' }),
      new ProgramCoordinatorAssignmentModel({ id: 'pca-02', departmentId: 'dept-02', personnelId: 'usr-[#16834a]-203', personnelName: 'Prof. Grace Tan', status: 'active' })
    ]

    this.#organizationModeratorAssignments = [
      new OrganizationModeratorAssignmentModel({ id: 'oma-01', organizationId: 'org-01', personnelId: 'usr-[#16834a]-205', personnelName: 'Prof. Elena Rostova', status: 'active' })
    ]

    this.#organizations = [
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

    this.#clubs = [
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
    this.#users = [
      // Students
      {
        id: 'usr-std-101',
        full_name: 'Juan Dela Cruz',
        student_id: '202310492',
        role: 'student',
        program: 'BS Computer Science',
        year_level: '3rd Year',
        college: 'CEAC',
        email: 'juan.delacruz@ndmu.edu.ph',
        total_points: 320,
        verified_count: 8,
        status: 'Active'
      },
      {
        id: 'usr-std-102',
        full_name: 'Maria Clara Santos',
        student_id: '202310495',
        role: 'student',
        program: 'BS Computer Science',
        year_level: '4th Year',
        college: 'CEAC',
        email: 'maria.santos@ndmu.edu.ph',
        total_points: 410,
        verified_count: 11,
        status: 'Active'
      },
      {
        id: 'usr-std-103',
        full_name: 'Alex Gonzaga',
        student_id: '202411002',
        role: 'student',
        program: 'BS Information Technology',
        year_level: '2nd Year',
        college: 'CEAC',
        email: 'alex.gonzaga@ndmu.edu.ph',
        total_points: 180,
        verified_count: 4,
        status: 'Active'
      },
      {
        id: 'usr-std-104',
        full_name: 'Samantha Ray',
        student_id: '202209821',
        role: 'student',
        program: 'BS Business Administration',
        year_level: '4th Year',
        college: 'CBA',
        email: 'samantha.ray@ndmu.edu.ph',
        total_points: 385,
        verified_count: 9,
        status: 'Active'
      },
      {
        id: 'usr-std-105',
        full_name: 'David Miller',
        student_id: '202310511',
        role: 'student',
        program: 'BS Civil Engineering',
        year_level: '3rd Year',
        college: 'CEAC',
        email: 'david.miller@ndmu.edu.ph',
        total_points: 290,
        verified_count: 7,
        status: 'Active'
      },

      // Personnel / Faculty (Employee IDs formatted without dashes per university standard)
      {
        id: 'usr-[#16834a]-201',
        full_name: 'Dr. Ana Reyes',
        employee_id: 'EMP8821',
        role: 'personnel',
        academic_rank: 'Associate Professor',
        department: 'Computer Science Department',
        email: 'ana.reyes@ndmu.edu.ph',
        assigned_roles: ['organization_moderator'],
        moderator_org: 'Computer Society NDMU',
        coordinator_program: null,
        status: 'Active'
      },
      {
        id: 'usr-[#16834a]-202',
        full_name: 'Engr. Roberto Cruz',
        employee_id: 'EMP7491',
        role: 'personnel',
        academic_rank: 'Assistant Professor',
        department: 'Computer Science Department',
        email: 'roberto.cruz@ndmu.edu.ph',
        assigned_roles: ['program_coordinator'],
        moderator_org: null,
        coordinator_program: 'BS Computer Science',
        status: 'Active'
      },
      {
        id: 'usr-[#16834a]-203',
        full_name: 'Prof. Grace Tan',
        employee_id: 'EMP6102',
        role: 'personnel',
        academic_rank: 'Senior Lecturer',
        department: 'Business Administration',
        email: 'grace.tan@ndmu.edu.ph',
        assigned_roles: ['department_secretary'],
        moderator_org: null,
        coordinator_program: null,
        status: 'Active'
      },
      {
        id: 'usr-[#16834a]-204',
        full_name: 'Dr. Fernando Alonzo',
        employee_id: 'EMP9011',
        role: 'personnel',
        academic_rank: 'Full Professor',
        department: 'Civil Engineering Department',
        email: 'fernando.alonzo@ndmu.edu.ph',
        assigned_roles: [],
        moderator_org: null,
        coordinator_program: null,
        status: 'Active'
      }
    ]

    this.#awardCategories = [
      {
        id: 'award-01',
        title: 'Leadership Excellence Award',
        category_type: 'Student Leadership',
        description: 'Highest distinction granted to student leaders with exemplary institutional service and project management.',
        min_points: 300,
        weight_multiplier: 1.5,
        required_prerequisites: 'Program Coordinator Verification',
        attached_template_id: 'OSAD-TPL-02',
        attached_template_name: 'Certificate of Leadership & Merit',
        is_active: true,
        confirmed_awardees: 2
      },
      {
        id: 'award-02',
        title: 'Student Researcher of the Year',
        category_type: 'Research & Innovation',
        description: 'Recognition for outstanding research publications, conference presentations, and innovation models.',
        min_points: 250,
        weight_multiplier: 2.0,
        required_prerequisites: 'Department Endorsement',
        attached_template_id: 'OSAD-TPL-04',
        attached_template_name: 'Excellence & Special Distinction Award',
        is_active: true,
        confirmed_awardees: 1
      },
      {
        id: 'award-03',
        title: 'Outstanding Athlete & Sportsmanship Award',
        category_type: 'Sports & Athletics',
        description: 'Awarded to varsity athletes demonstrating exceptional performance and sportsmanship in regional/national meets.',
        min_points: 200,
        weight_multiplier: 1.25,
        required_prerequisites: 'OSAD Athletics Verification',
        attached_template_id: 'OSAD-TPL-05',
        attached_template_name: 'NDMU Sports & Athletics Accreditation Certificate',
        is_active: true,
        confirmed_awardees: 3
      },
      {
        id: 'award-04',
        title: 'Culture & Arts Distinction Award',
        category_type: 'Culture & Arts',
        description: 'Honors student artists and performers who brought honor to NDMU in cultural and artistic showcases.',
        min_points: 180,
        weight_multiplier: 1.2,
        required_prerequisites: 'Cultural Affairs Endorsement',
        attached_template_id: 'OSAD-TPL-01',
        attached_template_name: 'Official NDMU Certificate of Participation',
        is_active: true,
        confirmed_awardees: 1
      },
      {
        id: 'award-05',
        title: 'Institutional Academic Honor Roll',
        category_type: 'Academic Excellence',
        description: 'Top-ranking academic distinction for students maintaining highest GPA and verified academic projects.',
        min_points: 350,
        weight_multiplier: 1.8,
        required_prerequisites: 'Dean / Coordinator Endorsement',
        attached_template_id: 'OSAD-TPL-04',
        attached_template_name: 'Excellence & Special Distinction Award',
        is_active: true,
        confirmed_awardees: 5
      }
    ]

    this.#awardees = [
      {
        id: 'awd-rec-01',
        student_name: 'Maria Clara Santos',
        student_id: '202310495',
        program: 'BS Computer Science',
        award_title: 'Institutional Academic Honor Roll',
        rank: 1,
        total_score: 410,
        status: 'Confirmed',
        confirmed_at: '2026-07-25'
      },
      {
        id: 'awd-rec-02',
        student_name: 'Samantha Ray',
        student_id: '202209821',
        program: 'BS Business Administration',
        award_title: 'Leadership Excellence Award',
        rank: 1,
        total_score: 385,
        status: 'Confirmed',
        confirmed_at: '2026-07-26'
      },
      {
        id: 'awd-rec-03',
        student_name: 'Juan Dela Cruz',
        student_id: '202310492',
        program: 'BS Computer Science',
        award_title: 'Leadership Excellence Award',
        rank: 2,
        total_score: 320,
        status: 'Confirmed',
        confirmed_at: '2026-07-26'
      }
    ]

    this.#auditLogs = [
      {
        id: 'log-1001',
        timestamp: '2026-07-27 22:15:40',
        admin_user: 'Director Marcus Vance (OSAD)',
        action_type: 'ROLE_ASSIGNMENT',
        target_entity: 'Engr. Roberto Cruz',
        details: 'Assigned role [Program Coordinator] for BS Computer Science',
        severity: 'INFO'
      },
      {
        id: 'log-1002',
        timestamp: '2026-07-27 21:04:12',
        admin_user: 'Director Marcus Vance (OSAD)',
        action_type: 'ROLE_ASSIGNMENT',
        target_entity: 'Dr. Ana Reyes',
        details: 'Assigned role [Organization Moderator] for Computer Society NDMU',
        severity: 'INFO'
      },
      {
        id: 'log-1003',
        timestamp: '2026-07-27 19:30:00',
        admin_user: 'Director Marcus Vance (OSAD)',
        action_type: 'AWARD_CRITERIA_UPDATE',
        target_entity: 'Leadership Excellence Award',
        details: 'Updated point threshold to 300 pts and weight multiplier to 1.5x',
        severity: 'INFO'
      },
      {
        id: 'log-1004',
        timestamp: '2026-07-26 16:45:10',
        admin_user: 'Director Marcus Vance (OSAD)',
        action_type: 'AWARDEE_CONFIRMATION',
        target_entity: 'Maria Clara Santos',
        details: 'Confirmed awardee status for Institutional Academic Honor Roll (Rank #1)',
        severity: 'SUCCESS'
      },
      {
        id: 'log-1005',
        timestamp: '2026-07-25 14:12:05',
        admin_user: 'System Automated Guard',
        action_type: 'ACCREDITATION_REPORT_GEN',
        target_entity: 'PACUCOA Year-End Audit',
        details: 'Compiled PACUCOA Level III accreditation achievement summary PDF',
        severity: 'INFO'
      }
    ]

    this.#accreditationReports = [
      {
        id: 'rpt-01',
        title: 'PACUCOA Level III Institutional Compliance Report',
        agency: 'PACUCOA',
        period: 'AY 2025-2026',
        total_student_achievements: 412,
        total_faculty_accomplishments: 188,
        accreditation_status: 'Compliant (96.4%)',
        generated_date: '2026-07-25'
      },
      {
        id: 'rpt-02',
        title: 'CHEd Regional Excellence & Student Welfare Audit',
        agency: 'CHEd Region XII',
        period: 'AY 2025-2026',
        total_student_achievements: 380,
        total_faculty_accomplishments: 154,
        accreditation_status: 'Compliant (98.1%)',
        generated_date: '2026-07-20'
      },
      {
        id: 'rpt-03',
        title: 'OSAD Annual University Honor Roll & Recognition Summary',
        agency: 'NDMU OSAD Central',
        period: 'AY 2025-2026',
        total_student_achievements: 520,
        total_faculty_accomplishments: 210,
        accreditation_status: 'Approved for Parangal',
      }
    ]
  }

  // --- Academic Structure Hierarchy Queries & Mutators ---
  getColleges() {
    return this.#colleges
  }

  getDepartments(collegeId = null) {
    if (!collegeId || collegeId === 'all') return this.#departments
    return this.#departments.filter(d => d.collegeId === collegeId)
  }

  getDegreePrograms(departmentId = null) {
    if (!departmentId || departmentId === 'all') return this.#degreePrograms
    return this.#degreePrograms.filter(p => p.departmentId === departmentId)
  }

  getStudentOrganizations(scopeFilter = 'all') {
    if (!scopeFilter || scopeFilter === 'all') return this.#organizations
    return this.#organizations.filter(o => o.scopeType === scopeFilter)
  }

  getProgramCoordinatorAssignments() {
    return this.#programCoordinatorAssignments
  }

  getOrganizationModeratorAssignments() {
    return this.#organizationModeratorAssignments
  }

  createCollege(payload) {
    const val = CollegeModel.validate(payload, this.#colleges)
    if (!val.isValid) throw new Error(val.errors.join(' '))

    const college = new CollegeModel(payload)
    this.#colleges.push(college)
    this.addAuditLog('COLLEGE_CREATED', `Created College [${college.name}] (${college.code})`, college.code, 'SUCCESS')
    return college
  }

  createDepartment(payload) {
    const val = DepartmentModel.validate(payload, this.#colleges, this.#departments)
    if (!val.isValid) throw new Error(val.errors.join(' '))

    const dept = new DepartmentModel(payload)
    this.#departments.push(dept)
    this.addAuditLog('DEPARTMENT_CREATED', `Created Department [${dept.name}] under College [${dept.collegeId}]`, dept.code, 'SUCCESS')
    return dept
  }

  createDegreeProgram(payload) {
    const val = DegreeProgramModel.validate(payload, this.#departments, this.#degreePrograms)
    if (!val.isValid) throw new Error(val.errors.join(' '))

    const prog = new DegreeProgramModel(payload)
    this.#degreePrograms.push(prog)
    this.addAuditLog('DEGREE_PROGRAM_CREATED', `Created Degree Program [${prog.name}] (${prog.code}) under Department [${prog.departmentId}]`, prog.code, 'SUCCESS')
    return prog
  }

  createStudentOrganizationWithScope(payload) {
    const val = StudentOrganizationModel.validate(payload, this.#colleges, this.#departments, this.#degreePrograms, this.#organizations)
    if (!val.isValid) throw new Error(val.errors.join(' '))

    const org = new StudentOrganizationModel(payload)
    this.#organizations.push(org)
    this.addAuditLog('ORGANIZATION_CREATED', `Created Student Organization [${org.name}] with scope [${org.scopeType}]`, org.code, 'SUCCESS')
    return org
  }

  assignProgramCoordinatorToDepartment(departmentId, personnelId, personnelName) {
    const val = ProgramCoordinatorAssignmentModel.validate({ departmentId, personnelId }, this.#departments, this.getPersonnelList())
    if (!val.isValid) throw new Error(val.errors.join(' '))

    // End previous active assignment for this department
    const previous = this.#programCoordinatorAssignments.find(a => a.departmentId === departmentId && a.status === 'active')
    if (previous) {
      previous.status = 'ended'
      previous.effectiveTo = new Date().toISOString()
      previous.endReason = 'Replaced by OSAD Staff'
    }

    const newAssignment = new ProgramCoordinatorAssignmentModel({
      departmentId,
      personnelId,
      personnelName,
      status: 'active'
    })

    this.#programCoordinatorAssignments.push(newAssignment)
    this.addAuditLog('PROGRAM_COORDINATOR_ASSIGNED', `Assigned Program Coordinator [${personnelName}] to Department [${departmentId}]`, departmentId, 'SUCCESS')
    return newAssignment
  }

  assignOrganizationModeratorToOrg(organizationId, personnelId, personnelName) {
    const val = OrganizationModeratorAssignmentModel.validate({ organizationId, personnelId }, this.#organizations, this.getPersonnelList())
    if (!val.isValid) throw new Error(val.errors.join(' '))

    const previous = this.#organizationModeratorAssignments.find(a => a.organizationId === organizationId && a.status === 'active')
    if (previous) {
      previous.status = 'ended'
      previous.effectiveTo = new Date().toISOString()
      previous.endReason = 'Replaced by OSAD Staff'
    }

    const newAssignment = new OrganizationModeratorAssignmentModel({
      organizationId,
      personnelId,
      personnelName,
      status: 'active'
    })

    this.#organizationModeratorAssignments.push(newAssignment)
    this.addAuditLog('ORGANIZATION_MODERATOR_ASSIGNED', `Assigned Organization Moderator [${personnelName}] to Student Organization [${organizationId}]`, organizationId, 'SUCCESS')
    return newAssignment
  }

  // --- Pre-Imported Student Soft-Mapping & Auto-Reconciliation Engine ---
  reconcileStudentsWithDepartment(department) {
    if (!department || !department.programs) return 0
    let reconciledCount = 0

    this.#users.forEach(usr => {
      if (usr.role === 'student' && usr.program) {
        const matchesProgram = department.programs.some(p => 
          usr.program.toLowerCase().includes(p.toLowerCase()) || 
          p.toLowerCase().includes(usr.program.toLowerCase())
        )
        if (matchesProgram) {
          usr.department_id = department.id
          usr.college = department.code
          reconciledCount++
        }
      }
    })

    if (reconciledCount > 0) {
      this.addAuditLog(
        'STUDENT_AUTO_RECONCILIATION',
        `Auto-reconciled ${reconciledCount} pre-imported student accounts to department [${department.name}] (${department.code})`,
        department.code,
        'SUCCESS'
      )
    }

    return reconciledCount
  }

  // --- Department Governance & Hierarchy ---
  getDepartments() {
    return [...this.#departments]
  }

  createDepartment(deptData) {
    const newDept = {
      id: `dept-${Date.now()}`,
      name: deptData.name,
      code: deptData.code || deptData.name.split(' ').map(w => w[0]).join(''),
      programs: deptData.programs || [],
      dean_name: deptData.dean_name || 'Unassigned',
      dean_id: deptData.dean_id || null,
      student_count: 0,
      status: 'Active'
    }

    if (deptData.dean_id) {
      const usr = this.#users.find(u => u.id === deptData.dean_id)
      if (usr) {
        newDept.dean_name = usr.full_name
        newDept.dean_id = usr.id
      }
    }

    // Auto-reconcile pre-imported students with this newly created department
    const reconciledCount = this.reconcileStudentsWithDepartment(newDept)
    newDept.student_count = reconciledCount || (deptData.programs ? deptData.programs.length * 80 : 0)

    this.#departments.push(newDept)

    this.addAuditLog(
      'DEPARTMENT_CREATED',
      `Created academic department [${newDept.name}] (${newDept.code}) with ${newDept.student_count} reconciled students`,
      newDept.name,
      'SUCCESS'
    )
    return { department: newDept, reconciledCount }
  }

  // --- Student Organization Governance ---
  getOrganizations() {
    return [...this.#organizations]
  }

  createOrganization(orgData) {
    const newOrg = {
      id: `org-${Date.now()}`,
      name: orgData.name,
      category: orgData.category || 'Special Interest',
      coordinator_name: orgData.coordinator_name || 'Unassigned',
      coordinator_id: orgData.coordinator_id || null,
      member_count: 0,
      status: 'Active'
    }

    if (orgData.coordinator_id) {
      this.assignProgramCoordinator(orgData.coordinator_id, newOrg.name)
    }

    this.#organizations.push(newOrg)

    this.addAuditLog(
      'ORGANIZATION_CREATED',
      `Created student organization [${newOrg.name}]`,
      newOrg.name,
      'SUCCESS'
    )
    return newOrg
  }

  // --- Personnel Selection Utility (Searchable Faculty List) ---
  getPersonnelList(searchQuery = '') {
    const term = searchQuery.toLowerCase().trim()
    const cleanTerm = term.replace(/-/g, '')
    return this.#users
      .filter(u => u.role === 'personnel')
      .filter(u => {
        if (!term) return true
        const cleanEmpId = (u.employee_id || '').toLowerCase().replace(/-/g, '')
        return (
          u.full_name.toLowerCase().includes(term) ||
          cleanEmpId.includes(cleanTerm) ||
          (u.department && u.department.toLowerCase().includes(term)) ||
          (u.email && u.email.toLowerCase().includes(term))
        )
      })
  }

  // --- Student Portfolio Access (Strictly Restricted from Personnel Portfolios) ---
  getStudentPortfolios(searchQuery = '', collegeFilter = 'all') {
    const term = searchQuery.toLowerCase().trim()
    return this.#users
      .filter(u => u.role === 'student')
      .filter(u => {
        const matchCollege = collegeFilter === 'all' ? true : u.college === collegeFilter
        const matchTerm = !term ? true : (
          u.full_name.toLowerCase().includes(term) ||
          u.student_id.toLowerCase().includes(term) ||
          u.program.toLowerCase().includes(term)
        )
        return matchCollege && matchTerm
      })
      .map(std => ({
        ...std,
        portfolio_items: [
          {
            id: `p-rec-${std.id}-1`,
            title: `1st Place — National ${std.program.includes('Computer') ? 'Hackathon & AI Challenge' : 'Academic Summit'} 2026`,
            category: 'National Competition',
            points: 120,
            date: '2026-02-14',
            status: 'OSAD Verified',
            proof_url: 'https://ndmu.edu.ph/proof/cert-881.pdf'
          },
          {
            id: `p-rec-${std.id}-2`,
            title: 'NDMU Supreme Student Council Executive Leadership Service',
            category: 'Student Leadership',
            points: 100,
            date: '2026-01-20',
            status: 'OSAD Verified',
            proof_url: 'https://ndmu.edu.ph/proof/cert-882.pdf'
          },
          {
            id: `p-rec-${std.id}-3`,
            title: 'Community Outreach & Extension Volunteer Accreditation',
            category: 'Community Extension',
            points: 80,
            date: '2025-11-18',
            status: 'OSAD Verified',
            proof_url: 'https://ndmu.edu.ph/proof/cert-883.pdf'
          }
        ]
      }))
  }

  // --- Student Password Governance ---
  resetStudentPassword(studentIdentifier, newPassword = 'NDMU-Student2026!') {
    const student = this.#users.find(u => 
      u.role === 'student' && 
      (u.id === studentIdentifier || u.student_id === studentIdentifier || u.email === studentIdentifier)
    )

    if (!student) {
      throw new Error(`Student account [${studentIdentifier}] not found.`)
    }

    student.password_reset_at = new Date().toISOString()
    student.must_change_password = true

    this.addAuditLog(
      'STUDENT_PASSWORD_RESET',
      `OSAD Admin reset credentials for student [${student.full_name}] (${student.student_id || student.email})`,
      student.full_name,
      'WARNING'
    )

    return {
      success: true,
      student_id: student.student_id,
      full_name: student.full_name,
      temp_password: newPassword,
      reset_at: student.password_reset_at
    }
  }

  getPasswordResetRequests() {
    try {
      const raw = localStorage.getItem('achievenest_password_resets')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(r => r.target_office === 'osad' || r.user_type === 'student' || !r.target_office)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch password reset requests:', e)
    }

    return [
      {
        id: 'req_01',
        user_email: 'student@ndmu.edu.ph',
        student_name: 'Juan Dela Cruz',
        student_id: '2023-0142',
        program: 'BS Information Technology',
        target_office: 'osad',
        remarks: 'Locked out of account. Forgot institutional password.',
        status: 'pending',
        requested_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }

  approvePasswordResetRequest(requestId, tempPassword = 'NDMU-Student2026!') {
    const requests = this.getPasswordResetRequests()
    const targetReq = requests.find(r => r.id === requestId)

    if (targetReq) {
      targetReq.status = 'approved'
      targetReq.approved_at = new Date().toISOString()
      targetReq.temp_password = tempPassword
      localStorage.setItem('achievenest_password_resets', JSON.stringify(requests))

      // Also reset password on student record and log audit
      try {
        this.resetStudentPassword(targetReq.user_email || targetReq.student_id, tempPassword)
      } catch (e) {
        console.warn('Student record sync during reset approval:', e)
      }
    }

    return targetReq
  }

  // --- Metrics Overview ---
  getMetrics() {
    const totalStudents = this.#users.filter(u => u.role === 'student').length
    const totalPersonnel = this.#users.filter(u => u.role === 'personnel').length
    const activeAwards = this.#awardCategories.filter(a => a.is_active).length
    const totalVerifiedAchievements = 1254
    const pendingAuditAlerts = this.#auditLogs.filter(l => l.severity === 'WARNING' || l.severity === 'HIGH').length

    // Compute derived operational metrics
    const departmentsWithCoord = this.#departments.filter(d => Boolean(d.assigned_coordinator_id || d.coordinator_name || d.dean_id)).length
    const orgsWithMod = this.#clubs.filter(c => Boolean(c.moderator_id || c.moderator_name)).length
    const totalRequired = this.#departments.length + this.#clubs.length
    const configured = departmentsWithCoord + orgsWithMod
    const setupCoveragePercent = totalRequired > 0 ? Math.round((configured / totalRequired) * 100) : 100

    return {
      total_students: totalStudents,
      total_personnel: totalPersonnel,
      active_awards: activeAwards,
      total_verified_achievements: totalVerifiedAchievements,
      pending_audit_alerts: pendingAuditAlerts,

      // Derived Operational Setup Coverage Metrics
      collegesCount: 5,
      departmentsCount: this.#departments.length,
      programsCount: 12,
      activeStudentsCount: totalStudents || 3840,
      activeOrganizationsCount: this.#clubs.length,
      departmentsWithCoordinatorCount: departmentsWithCoord,
      organizationsWithModeratorCount: orgsWithMod,
      totalRequiredAssignments: totalRequired,
      configuredAssignments: configured,
      pendingAssignmentsCount: Math.max(0, totalRequired - configured),
      setupCoveragePercent
    }
  }

  // --- User Account Management & Role Assignment ---
  getUsers(roleFilter = 'student', searchTerm = '', collegeFilter = 'all', sortBy = 'name') {
    let result = this.#users.filter(u => {
      const matchRole = roleFilter === 'all' ? true : u.role === roleFilter
      const matchCollege = collegeFilter === 'all' ? true : (u.college === collegeFilter || (u.department && u.department.includes(collegeFilter)))
      const term = searchTerm.toLowerCase()
      const matchTerm = !term ? true : (
        u.full_name.toLowerCase().includes(term) ||
        parseFullName(u.full_name).formatted.toLowerCase().includes(term) ||
        (u.student_id && u.student_id.toLowerCase().includes(term)) ||
        (u.employee_id && u.employee_id.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.department && u.department.toLowerCase().includes(term)) ||
        (u.program && u.program.toLowerCase().includes(term))
      )
      return matchRole && matchCollege && matchTerm
    })

    // Sorting (Last Name as basis for name sorting)
    result.sort((a, b) => {
      if (sortBy === 'points') return (b.total_points || 0) - (a.total_points || 0)
      if (sortBy === 'proofs') return (b.verified_count || 0) - (a.verified_count || 0)
      if (sortBy === 'id') return (a.student_id || a.employee_id || '').localeCompare(b.student_id || b.employee_id || '')
      
      const parsedA = parseFullName(a.full_name)
      const parsedB = parseFullName(b.full_name)
      const lastCmp = parsedA.lastName.localeCompare(parsedB.lastName)
      if (lastCmp !== 0) return lastCmp
      return parsedA.firstMiddle.localeCompare(parsedB.firstMiddle)
    })

    return result
  }

  // --- 3-Tier Administrative Role Assignment ---
  assignCollegeDean(userId, collegeName) {
    const usr = this.#users.find(u => u.id === userId)
    if (!usr) return null
    if (!usr.assigned_roles) usr.assigned_roles = []
    if (!usr.assigned_roles.includes('college_dean')) {
      usr.assigned_roles.push('college_dean')
    }
    usr.dean_college = collegeName

    // Update department record
    const dept = this.#departments.find(d => d.name.includes(collegeName) || d.code === collegeName)
    if (dept) {
      dept.dean_name = usr.full_name
      dept.dean_id = usr.id
    }

    this.addAuditLog(
      'ROLE_ASSIGNMENT',
      `Assigned role [College Dean] for ${collegeName}`,
      usr.full_name,
      'INFO'
    )
    return { ...usr }
  }

  assignProgramCoordinator(userId, deptName) {
    const usr = this.#users.find(u => u.id === userId)
    if (!usr) return null
    if (!usr.assigned_roles) usr.assigned_roles = []
    if (!usr.assigned_roles.includes('program_coordinator')) {
      usr.assigned_roles.push('program_coordinator')
    }
    usr.coordinator_department = deptName
    usr.coordinator_program = deptName

    // Update department record
    const dept = this.#departments.find(d => d.name === deptName || d.code === deptName || d.name.includes(deptName))
    if (dept) {
      dept.coordinator_name = usr.full_name
      dept.assigned_coordinator_id = usr.id
    }

    this.addAuditLog(
      'ROLE_ASSIGNMENT',
      `Assigned Department Program Coordinator for [${deptName}]`,
      usr.full_name,
      'INFO'
    )
    return { ...usr }
  }

  assignOrganizationModerator(userId, clubName) {
    const usr = this.#users.find(u => u.id === userId)
    if (!usr) return null
    if (!usr.assigned_roles) usr.assigned_roles = []
    if (!usr.assigned_roles.includes('organization_moderator')) {
      usr.assigned_roles.push('organization_moderator')
    }
    usr.moderator_org = clubName

    // Update club record
    const club = this.#clubs.find(c => c.name === clubName)
    if (club) {
      club.moderator_name = usr.full_name
      club.moderator_id = usr.id
    }

    this.addAuditLog(
      'ROLE_ASSIGNMENT',
      `Assigned role [Organization Moderator] for ${clubName}`,
      usr.full_name,
      'INFO'
    )
    return { ...usr }
  }

  // --- Student Clubs Governance ---
  getClubs() {
    return [...this.#clubs]
  }

  createClub(clubData) {
    const newClub = {
      id: `club-${Date.now()}`,
      name: clubData.name,
      parent_org: clubData.parent_org || 'Computer Society NDMU',
      moderator_name: clubData.moderator_name || 'Unassigned',
      moderator_id: clubData.moderator_id || null,
      member_count: 0,
      status: 'Active'
    }

    if (clubData.moderator_id) {
      this.assignOrganizationModerator(clubData.moderator_id, newClub.name)
    }

    this.#clubs.push(newClub)

    this.addAuditLog(
      'CLUB_CREATED',
      `Created student club [${newClub.name}] under [${newClub.parent_org}]`,
      newClub.name,
      'SUCCESS'
    )
    return newClub
  }

  revokeRole(userId, roleId) {
    const usr = this.#users.find(u => u.id === userId)
    if (!usr) return null
    usr.assigned_roles = usr.assigned_roles.filter(r => r !== roleId)
    if (roleId === 'program_coordinator') usr.coordinator_program = null
    if (roleId === 'organization_moderator') usr.moderator_org = null

    this.addAuditLog(
      'ROLE_REVOCATION',
      `Revoked role [${roleId}]`,
      usr.full_name,
      'WARNING'
    )
    return { ...usr }
  }

  // --- Award Management & Criteria Setup ---
  getAwardCategories() {
    return [...this.#awardCategories]
  }

  createAwardCategory(categoryData) {
    const newCat = {
      id: `award-${Date.now()}`,
      title: categoryData.title,
      category_type: categoryData.category_type || 'General Recognition',
      description: categoryData.description || '',
      min_points: Number(categoryData.min_points) || 100,
      weight_multiplier: Number(categoryData.weight_multiplier) || 1.0,
      required_prerequisites: categoryData.required_prerequisites || 'None',
      attached_template_id: categoryData.attached_template_id || 'OSAD-TPL-01',
      attached_template_name: categoryData.attached_template_name || 'Official NDMU Certificate of Participation',
      is_active: true,
      confirmed_awardees: 0
    }
    this.#awardCategories.push(newCat)

    this.addAuditLog(
      'AWARD_CATEGORY_CREATED',
      `Created new award category [${newCat.title}] with ${newCat.min_points} min points`,
      newCat.title,
      'SUCCESS'
    )
    return newCat
  }

  updateAwardCategory(id, updatedData) {
    const idx = this.#awardCategories.findIndex(a => a.id === id)
    if (idx !== -1) {
      this.#awardCategories[idx] = {
        ...this.#awardCategories[idx],
        ...updatedData
      }

      this.addAuditLog(
        'AWARD_CRITERIA_UPDATE',
        `Updated award criteria for [${this.#awardCategories[idx].title}]`,
        this.#awardCategories[idx].title,
        'INFO'
      )
      return this.#awardCategories[idx]
    }
    return null
  }

  // --- Identify Awardees & Automated Ranking Engine ---
  getAwardees() {
    return [...this.#awardees]
  }

  getStudentLeaderboards(categoryFilter = 'all', searchTerm = '') {
    const term = (searchTerm || '').toLowerCase().trim()
    const category = (categoryFilter || 'all').toLowerCase().trim()

    const students = this.#users
      .filter(u => u.role === 'student')
      .filter(u => {
        const matchCategory = category === 'all' || 
          (u.college && u.college.toLowerCase().includes(category)) || 
          (u.program && u.program.toLowerCase().includes(category))
        const matchTerm = !term || 
          (u.full_name && u.full_name.toLowerCase().includes(term)) || 
          (u.student_id && u.student_id.toLowerCase().includes(term)) || 
          (u.program && u.program.toLowerCase().includes(term))
        return matchCategory && matchTerm
      })
      .map(std => ({
        id: std.id,
        student_name: std.full_name,
        student_id: std.student_id,
        program: std.program,
        college: std.college,
        year_level: std.year_level,
        total_points: std.total_points,
        verified_count: std.verified_count,
        verified_proofs: std.verified_count,
        score: Math.round((std.total_points / 500) * 100 * 10) / 10
      }))
      .sort((a, b) => b.total_points - a.total_points)

    const maxPoints = Math.max(...students.map(s => s.total_points), 500)

    return students.map((std, index) => ({
      ...std,
      rank: index + 1,
      percentage: Math.round((std.total_points / maxPoints) * 100)
    }))
  }

  generateAwardCandidates(awardCategoryId) {
    const category = this.#awardCategories.find(a => a.id === awardCategoryId)
    if (!category) return []

    // Algorithm: Filter students matching min_points and calculate weighted score
    const candidates = this.#users
      .filter(u => u.role === 'student' && u.total_points >= category.min_points)
      .map(std => ({
        student_id_code: std.id,
        student_name: std.full_name,
        student_id: std.student_id,
        program: std.program,
        college: std.college,
        total_points: std.total_points,
        weighted_score: Math.round(std.total_points * category.weight_multiplier),
        award_title: category.title,
        is_eligible: true
      }))
      .sort((a, b) => b.weighted_score - a.weighted_score)
      .map((c, index) => ({
        ...c,
        rank: index + 1
      }))

    return candidates
  }

  confirmAwardee(candidateDataOrId) {
    const candidateId = typeof candidateDataOrId === 'string' ? candidateDataOrId : candidateDataOrId?.id
    const usr = this.#users.find(u => u.id === candidateId || u.student_id === candidateId) || {
      full_name: candidateDataOrId?.student_name || candidateDataOrId?.name || 'Student Candidate',
      student_id: candidateDataOrId?.student_id || '2024-01234',
      program: candidateDataOrId?.program || 'BS Computer Science',
      college: candidateDataOrId?.college || 'CEAC'
    }

    const awardTitle = candidateDataOrId?.award_title || "Dean's Honor Roll"

    // Enforce Rule: Only 1 student can be confirmed per award category.
    // Unconfirm any previously confirmed student for this same category.
    this.#awardees = this.#awardees.filter(a => a.award_title !== awardTitle)

    const newAwardee = {
      id: candidateId || `awd-rec-${Date.now()}`,
      student_name: usr.full_name || usr.student_name,
      student_id: usr.student_id,
      program: usr.program,
      award_title: awardTitle,
      rank: candidateDataOrId?.rank || 1,
      total_score: candidateDataOrId?.weighted_score || candidateDataOrId?.score || 90,
      status: 'Confirmed',
      confirmed_at: new Date().toISOString().split('T')[0]
    }

    this.#awardees.unshift(newAwardee)

    this.addAuditLog(
      'AWARDEE_CONFIRMATION',
      `Confirmed [${newAwardee.student_name}] as the sole awardee for [${newAwardee.award_title}] (Max 1 per category)`,
      newAwardee.student_name,
      'SUCCESS'
    )

    return newAwardee
  }

  batchConfirmAwardees(candidateIds = []) {
    const results = { confirmed: 0, skipped: 0, details: [] }
    candidateIds.forEach(id => {
      const confirmed = this.confirmAwardee(id)
      if (confirmed) {
        results.confirmed++
        results.details.push({ id, status: 'confirmed' })
      } else {
        results.skipped++
        results.details.push({ id, status: 'skipped' })
      }
    })
    return results
  }

  undoAwardeeConfirmation(candidateId, reason) {
    const index = this.#awardees.findIndex(a => a.id === candidateId || a.student_id === candidateId)
    if (index !== -1) {
      const removed = this.#awardees.splice(index, 1)[0]
      this.addAuditLog(
        'AWARDEE_CORRECTION',
        `Undid confirmation for candidate [${removed.student_name}]. Reason: ${reason || 'Administrative correction'}`,
        removed.student_name,
        'WARNING'
      )
      return true
    }
    return false
  }

  // --- Reports & Accreditation ---
  getAccreditationReports() {
    return [...this.#accreditationReports]
  }

  getAccreditationReportDetails(reportId) {
    const report = this.#accreditationReports.find(r => r.id === reportId) || this.#accreditationReports[0]
    
    const departmentBreakdown = [
      { dept: 'College of Engineering, Architecture & Computing (CEAC)', student_records: 184, faculty_records: 76, verification_rate: '98.2%', status: 'Compliant' },
      { dept: 'College of Business & Accountancy (CBA)', student_records: 122, faculty_records: 52, verification_rate: '95.4%', status: 'Compliant' },
      { dept: 'College of Arts & Sciences (CAS)', student_records: 64, faculty_records: 38, verification_rate: '94.8%', status: 'Compliant' },
      { dept: 'College of Education (CED)', student_records: 42, faculty_records: 22, verification_rate: '97.0%', status: 'Compliant' },
    ]

    const includedRecordsSample = [
      { id: 'rec-1', title: 'Machine Learning Frameworks in Higher Education Analytics', category: 'Research & Publications', owner: 'Dr. Maria Santos', dept: 'CEAC', verified_by: 'HR Verified', date: 'Jan 15, 2026' },
      { id: 'rec-2', title: 'National Hackathon Competition 2026 - 1st Place Winner', category: 'Student Competition', owner: 'Juan Dela Cruz', dept: 'CEAC', verified_by: 'OSAD Verified', date: 'Feb 10, 2026' },
      { id: 'rec-3', title: 'CHED Regional Training on AI Curriculum Integration', category: 'Seminars & Workshops', owner: 'Engr. Roberto Cruz', dept: 'CEAC', verified_by: 'HR Verified', date: 'Dec 04, 2025' },
      { id: 'rec-4', title: 'Barangay Smart Literacy Outreach Program', category: 'Extension Services', owner: 'Prof. Grace Tan', dept: 'CBA', verified_by: 'OSAD Verified', date: 'Nov 20, 2025' },
    ]

    return {
      ...report,
      departmentBreakdown,
      includedRecordsSample
    }
  }

  // --- Audit Logs ---
  getAuditLogs(searchTerm = '', categoryFilter = 'all') {
    return this.#auditLogs.filter(log => {
      const matchCat = categoryFilter === 'all' ? true : log.action_type === categoryFilter
      const term = searchTerm.toLowerCase()
      const matchTerm = !term ? true : (
        log.admin_user.toLowerCase().includes(term) ||
        log.action_type.toLowerCase().includes(term) ||
        log.target_entity.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term)
      )
      return matchCat && matchTerm
    })
  }

  addAuditLog(action_type, details, target_entity, severity = 'INFO') {
    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      admin_user: 'Director Marcus Vance (OSAD)',
      action_type,
      target_entity,
      details,
      severity
    }
    this.#auditLogs.unshift(logEntry)
    return logEntry
  }
}

export default new OSADController()
