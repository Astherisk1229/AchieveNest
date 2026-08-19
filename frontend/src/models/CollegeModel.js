export default class CollegeModel {
  constructor(data = {}) {
    this.id = data.id || `col-${Date.now()}`
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.description = data.description || ''
    this.status = data.status || 'active' // active | archived
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  static validate(data = {}, existingColleges = []) {
    const errors = []
    const code = (data.code || '').trim().toUpperCase()
    const name = (data.name || '').trim()

    if (!code) errors.push('College code is required.')
    if (!name) errors.push('College name is required.')

    const duplicateCode = existingColleges.find(
      c => c.id !== data.id && c.code.toUpperCase() === code
    )
    if (duplicateCode) errors.push(`College code "${code}" already exists.`)

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static isDeletable(collegeId, departments = [], organizations = []) {
    const activeDepts = departments.filter(d => d.collegeId === collegeId && d.status !== 'archived')
    const activeOrgs = organizations.filter(o => o.collegeId === collegeId && o.status !== 'archived')
    return {
      canDelete: activeDepts.length === 0 && activeOrgs.length === 0,
      activeDepartmentCount: activeDepts.length,
      activeOrganizationCount: activeOrgs.length
    }
  }
}
