export default class StudentOrganizationModel {
  constructor(data = {}) {
    this.id = data.id || `org-${Date.now()}`
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.organizationType = data.organizationType || 'academic' // academic | cultural | sports | religious | special_interest
    this.scopeType = data.scopeType || 'university' // university | college | department | degree_program
    this.collegeId = data.collegeId || null
    this.departmentId = data.departmentId || null
    this.degreeProgramId = data.degreeProgramId || null
    this.recognitionStatus = data.recognitionStatus || 'recognized' // draft | pending_recognition | recognized | suspended | archived
    this.status = data.status || 'active'
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  static validateScope(data = {}, colleges = [], departments = [], programs = []) {
    const errors = []
    const { scopeType, collegeId, departmentId, degreeProgramId } = data

    if (!['university', 'college', 'department', 'degree_program'].includes(scopeType)) {
      errors.push('Invalid Student Organization scope selected.')
      return { isValid: false, errors }
    }

    if (scopeType === 'university') {
      if (collegeId || departmentId || degreeProgramId) {
        errors.push('University-wide organizations must not specify academic parents.')
      }
    }

    if (scopeType === 'college') {
      if (!collegeId) errors.push('College-based organization requires a College.')
      else {
        const c = colleges.find(item => item.id === collegeId && item.status === 'active')
        if (!c) errors.push('Selected parent College is invalid or archived.')
      }
      if (departmentId || degreeProgramId) {
        errors.push('College-based organization must not specify Department or Program.')
      }
    }

    if (scopeType === 'department') {
      if (!collegeId) errors.push('Department-based organization requires a College.')
      if (!departmentId) errors.push('Department-based organization requires a Department.')
      else {
        const d = departments.find(item => item.id === departmentId && item.status === 'active')
        if (!d) errors.push('Selected parent Department is invalid or archived.')
        else if (d.collegeId !== collegeId) errors.push('Selected Department does not belong to the selected College.')
      }
      if (degreeProgramId) {
        errors.push('Department-based organization must not specify a Degree Program.')
      }
    }

    if (scopeType === 'degree_program') {
      if (!collegeId) errors.push('Program-based organization requires a College.')
      if (!departmentId) errors.push('Program-based organization requires a Department.')
      if (!degreeProgramId) errors.push('Program-based organization requires a Degree Program.')
      else {
        const p = programs.find(item => item.id === degreeProgramId && item.status === 'active')
        if (!p) errors.push('Selected parent Degree Program is invalid or archived.')
        else if (p.departmentId !== departmentId) errors.push('Selected Degree Program does not belong to the selected Department.')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validate(data = {}, colleges = [], departments = [], programs = [], existingOrgs = []) {
    const name = (data.name || '').trim()
    const code = (data.code || '').trim().toUpperCase()

    const errors = []
    if (!name) errors.push('Organization name is required.')
    if (!code) errors.push('Organization code is required.')

    const duplicateCode = existingOrgs.find(
      o => o.id !== data.id && o.code.toUpperCase() === code
    )
    if (duplicateCode) errors.push(`Organization code "${code}" already exists.`)

    const scopeValidation = this.validateScope(data, colleges, departments, programs)
    errors.push(...scopeValidation.errors)

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
