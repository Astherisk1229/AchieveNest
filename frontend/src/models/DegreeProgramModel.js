export default class DegreeProgramModel {
  constructor(data = {}) {
    this.id = data.id || `prog-${Date.now()}`
    this.college_id = data.college_id || data.collegeId || ''
    this.collegeId = this.college_id
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.degree_level = data.degree_level || data.degreeLevel || 'undergraduate'
    this.degreeLevel = this.degree_level
    this.description = data.description || ''
    this.status = data.status || 'active'
    this.coordinator_name = data.coordinator_name || data.coordinatorName || null
    this.coordinatorName = this.coordinator_name
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString()
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString()
  }

  static validate(data = {}, colleges = [], existingPrograms = []) {
    const errors = []
    const collegeId = data.college_id || data.collegeId
    const code = (data.code || '').trim().toUpperCase()
    const name = (data.name || '').trim()

    if (!collegeId) {
      errors.push('A parent College must be selected for the Academic Program.')
    } else if (colleges.length > 0) {
      const parentCollege = colleges.find(c => c.id === collegeId && (c.status === 'active' || c.status === undefined))
      if (!parentCollege) {
        errors.push('Selected parent College is invalid or inactive.')
      }
    }

    if (!code) errors.push('Academic Program code is required.')
    if (!name) errors.push('Academic Program name is required.')

    const duplicateCode = existingPrograms.find(
      p => p.id !== data.id && p.code.toUpperCase() === code
    )
    if (duplicateCode) errors.push(`Academic Program code "${code}" already exists.`)

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static isDeletable(programId, organizations = [], students = []) {
    const activeOrgs = organizations.filter(o => (o.degreeProgramId === programId || o.academic_program_id === programId) && o.status !== 'archived')
    const activeStudents = students.filter(s => (s.programId === programId || s.academic_program_id === programId))

    return {
      canDelete: activeOrgs.length === 0 && activeStudents.length === 0,
      activeAcademicProgramCount: activeOrgs.length,
      activeStudentCount: activeStudents.length
    }
  }
}
