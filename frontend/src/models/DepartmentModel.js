export default class DepartmentModel {
  constructor(data = {}) {
    this.id = data.id || `dept-${Date.now()}`
    this.collegeId = data.collegeId || ''
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.description = data.description || ''
    this.status = data.status || 'active'
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  static validate(data = {}, colleges = [], existingDepartments = []) {
    const errors = []
    const collegeId = data.collegeId
    const code = (data.code || '').trim().toUpperCase()
    const name = (data.name || '').trim()

    if (!collegeId) {
      errors.push('A parent College must be selected for the Department.')
    } else {
      const parentCollege = colleges.find(c => c.id === collegeId && c.status === 'active')
      if (!parentCollege) {
        errors.push('Selected parent College is invalid or archived.')
      }
    }

    if (!code) errors.push('Department code is required.')
    if (!name) errors.push('Department name is required.')

    const duplicateCode = existingDepartments.find(
      d => d.id !== data.id && d.code.toUpperCase() === code
    )
    if (duplicateCode) errors.push(`Department code "${code}" already exists.`)

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static isDeletable(departmentId, programs = [], organizations = [], assignments = []) {
    const activePrograms = programs.filter(p => p.departmentId === departmentId && p.status !== 'archived')
    const activeOrgs = organizations.filter(o => o.departmentId === departmentId && o.status !== 'archived')
    const activeAssignments = assignments.filter(a => a.departmentId === departmentId && a.status === 'active')

    return {
      canDelete: activePrograms.length === 0 && activeOrgs.length === 0 && activeAssignments.length === 0,
      activeProgramCount: activePrograms.length,
      activeOrganizationCount: activeOrgs.length,
      activeAssignmentCount: activeAssignments.length
    }
  }
}
