export default class DegreeProgramModel {
  constructor(data = {}) {
    this.id = data.id || `prog-${Date.now()}`
    this.collegeId = data.collegeId || data.college_id || ''
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.degreeLevel = data.degreeLevel || 'Bachelor' // Bachelor | Master | Doctorate | Associate
    this.description = data.description || ''
    this.status = data.status || 'active'
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  static validate(data = {}, colleges = [], existingPrograms = []) {
    const errors = []
    const collegeId = data.collegeId || data.college_id
    const code = (data.code || '').trim().toUpperCase()
    const name = (data.name || '').trim()

    if (!collegeId) {
      errors.push('A parent College must be selected for the Academic Program.')
    } else {
      const parentCollege = colleges.find(c => c.id === collegeId && c.status === 'active')
      if (!parentCollege) {
        errors.push('Selected parent College is invalid or archived.')
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
    const activeOrgs = organizations.filter(o => o.degreeProgramId === programId && o.status !== 'archived')
    const activeStudents = students.filter(s => s.programId === programId)

    return {
      canDelete: activeOrgs.length === 0 && activeStudents.length === 0,
      activeOrganizationCount: activeOrgs.length,
      activeStudentCount: activeStudents.length
    }
  }
}
