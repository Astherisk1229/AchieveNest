export default class DegreeProgramModel {
  constructor(data = {}) {
    this.id = data.id || `prog-${Date.now()}`
    this.departmentId = data.departmentId || ''
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.degreeLevel = data.degreeLevel || 'Bachelor' // Bachelor | Master | Doctorate | Associate
    this.description = data.description || ''
    this.status = data.status || 'active'
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  static validate(data = {}, departments = [], existingPrograms = []) {
    const errors = []
    const departmentId = data.departmentId
    const code = (data.code || '').trim().toUpperCase()
    const name = (data.name || '').trim()

    if (!departmentId) {
      errors.push('A parent Department must be selected for the Degree Program.')
    } else {
      const parentDept = departments.find(d => d.id === departmentId && d.status === 'active')
      if (!parentDept) {
        errors.push('Selected parent Department is invalid or archived.')
      }
    }

    if (!code) errors.push('Degree Program code is required.')
    if (!name) errors.push('Degree Program name is required.')

    const duplicateCode = existingPrograms.find(
      p => p.id !== data.id && p.code.toUpperCase() === code
    )
    if (duplicateCode) errors.push(`Degree Program code "${code}" already exists.`)

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
