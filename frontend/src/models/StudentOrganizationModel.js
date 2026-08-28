export default class StudentOrganizationModel {
  constructor(data = {}) {
    this.id = data.id || `org-${Date.now()}`
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.organizationType = data.organizationType || 'academic' // academic | cultural | sports | religious | special_interest
    this.scopeType = data.scopeType || 'university' // university | college
    this.collegeId = data.collegeId || null
    this.academicProgramIds = data.academicProgramIds || data.academic_program_ids || []
    this.recognitionStatus = data.recognitionStatus || 'recognized' // draft | pending_recognition | recognized | suspended | archived
    this.status = data.status || 'active'
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  static validateScope(data = {}, colleges = [], programs = []) {
    const errors = []
    const { scopeType, collegeId } = data
    const academicProgramIds = data.academicProgramIds || data.academic_program_ids || []

    if (!['university', 'college'].includes(scopeType)) {
      errors.push('Invalid Student Organization scope selected.')
      return { isValid: false, errors }
    }

    if (scopeType === 'university') {
      if (collegeId || academicProgramIds.length) {
        errors.push('University-wide organizations must not specify academic parents.')
      }
    }

    if (scopeType === 'college') {
      if (!collegeId) errors.push('College-based organization requires a College.')
      else {
        const c = colleges.find(item => item.id === collegeId && item.status === 'active')
        if (!c) errors.push('Selected parent College is invalid or archived.')
      }
      for (const programId of academicProgramIds) {
        const program = programs.find(item => item.id === programId && item.status === 'active')
        if (!program) errors.push('Selected Academic Program coverage is invalid or archived.')
        else if (program.collegeId !== collegeId) errors.push('Academic Program coverage must belong to the selected College.')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validate(data = {}, colleges = [], programs = [], existingOrgs = []) {
    const name = (data.name || '').trim()
    const code = (data.code || '').trim().toUpperCase()

    const errors = []
    if (!name) errors.push('Organization name is required.')
    if (!code) errors.push('Organization code is required.')

    const duplicateCode = existingOrgs.find(
      o => o.id !== data.id && o.code.toUpperCase() === code
    )
    if (duplicateCode) errors.push(`Organization code "${code}" already exists.`)

    const scopeValidation = this.validateScope(data, colleges, programs)
    errors.push(...scopeValidation.errors)

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
