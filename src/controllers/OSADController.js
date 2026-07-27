/**
 * OSADController.js
 * Business Logic & Data Store Controller for Office of Student Affairs & Services (OSAD).
 * Strictly follows OOP & MVC architecture.
 */

class OSADController {
  #users
  #awardCategories
  #awardees
  #auditLogs
  #accreditationReports

  constructor() {
    this.#users = [
      // Students
      {
        id: 'usr-std-101',
        full_name: 'Juan Dela Cruz',
        student_id: '2023-10492',
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
        student_id: '2023-10495',
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
        student_id: '2024-11002',
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
        student_id: '2022-09821',
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
        student_id: '2023-10511',
        role: 'student',
        program: 'BS Civil Engineering',
        year_level: '3rd Year',
        college: 'CEAC',
        email: 'david.miller@ndmu.edu.ph',
        total_points: 290,
        verified_count: 7,
        status: 'Active'
      },

      // Personnel / Faculty
      {
        id: 'usr-[#2d8a4e]-201',
        full_name: 'Dr. Ana Reyes',
        employee_id: 'EMP-8821',
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
        id: 'usr-[#2d8a4e]-202',
        full_name: 'Engr. Roberto Cruz',
        employee_id: 'EMP-7491',
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
        id: 'usr-[#2d8a4e]-203',
        full_name: 'Prof. Grace Tan',
        employee_id: 'EMP-6102',
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
        id: 'usr-[#2d8a4e]-204',
        full_name: 'Dr. Fernando Alonzo',
        employee_id: 'EMP-9011',
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
        student_id: '2023-10495',
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
        student_id: '2022-09821',
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
        student_id: '2023-10492',
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
        generated_date: '2026-07-27'
      }
    ]
  }

  // --- Metrics Overview ---
  getMetrics() {
    const totalStudents = this.#users.filter(u => u.role === 'student').length
    const totalPersonnel = this.#users.filter(u => u.role === 'personnel').length
    const activeAwards = this.#awardCategories.filter(a => a.is_active).length
    const totalVerifiedAchievements = 1254
    const pendingAuditAlerts = this.#auditLogs.filter(l => l.severity === 'WARNING' || l.severity === 'HIGH').length

    return {
      total_students: totalStudents,
      total_personnel: totalPersonnel,
      active_awards: activeAwards,
      total_verified_achievements: totalVerifiedAchievements,
      pending_audit_alerts: pendingAuditAlerts
    }
  }

  // --- User Account Management & Role Assignment ---
  getUsers(roleFilter = 'all', searchTerm = '') {
    return this.#users.filter(u => {
      const matchRole = roleFilter === 'all' ? true : u.role === roleFilter
      const term = searchTerm.toLowerCase()
      const matchTerm = !term ? true : (
        u.full_name.toLowerCase().includes(term) ||
        (u.student_id && u.student_id.toLowerCase().includes(term)) ||
        (u.employee_id && u.employee_id.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.department && u.department.toLowerCase().includes(term)) ||
        (u.program && u.program.toLowerCase().includes(term))
      )
      return matchRole && matchTerm
    })
  }

  assignProgramCoordinator(userId, programName) {
    const usr = this.#users.find(u => u.id === userId)
    if (!usr) return null
    if (!usr.assigned_roles.includes('program_coordinator')) {
      usr.assigned_roles.push('program_coordinator')
    }
    usr.coordinator_program = programName

    this.addAuditLog(
      'ROLE_ASSIGNMENT',
      `Assigned role [Program Coordinator] for ${programName}`,
      usr.full_name,
      'INFO'
    )
    return { ...usr }
  }

  assignOrganizationModerator(userId, orgName) {
    const usr = this.#users.find(u => u.id === userId)
    if (!usr) return null
    if (!usr.assigned_roles.includes('organization_moderator')) {
      usr.assigned_roles.push('organization_moderator')
    }
    usr.moderator_org = orgName

    this.addAuditLog(
      'ROLE_ASSIGNMENT',
      `Assigned role [Organization Moderator] for ${orgName}`,
      usr.full_name,
      'INFO'
    )
    return { ...usr }
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

  getStudentLeaderboards(collegeFilter = 'all') {
    const students = this.#users
      .filter(u => u.role === 'student' && (collegeFilter === 'all' || u.college === collegeFilter || u.program.toLowerCase().includes(collegeFilter.toLowerCase())))
      .map(std => ({
        id: std.id,
        student_name: std.full_name,
        student_id: std.student_id,
        program: std.program,
        college: std.college,
        year_level: std.year_level,
        total_points: std.total_points,
        verified_count: std.verified_count
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

  confirmAwardee(candidateData) {
    const newAwardee = {
      id: `awd-rec-${Date.now()}`,
      student_name: candidateData.student_name,
      student_id: candidateData.student_id,
      program: candidateData.program,
      award_title: candidateData.award_title,
      rank: candidateData.rank,
      total_score: candidateData.weighted_score || candidateData.total_points,
      status: 'Confirmed',
      confirmed_at: new Date().toISOString().split('T')[0]
    }

    this.#awardees.unshift(newAwardee)

    // Update confirmed count in category
    const cat = this.#awardCategories.find(a => a.title === candidateData.award_title)
    if (cat) cat.confirmed_awardees += 1

    this.addAuditLog(
      'AWARDEE_CONFIRMATION',
      `Confirmed awardee [${newAwardee.student_name}] for [${newAwardee.award_title}] (Rank #${newAwardee.rank})`,
      newAwardee.student_name,
      'SUCCESS'
    )

    return newAwardee
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
