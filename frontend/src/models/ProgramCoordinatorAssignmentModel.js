export default class ProgramCoordinatorAssignmentModel {
  constructor(data = {}) {
    this.id = data.id || `pca-${Date.now()}`
    this.departmentId = data.departmentId || ''
    this.personnelId = data.personnelId || ''
    this.personnelName = data.personnelName || ''
    this.status = data.status || 'active' // active | ended
    this.effectiveFrom = data.effectiveFrom || new Date().toISOString()
    this.effectiveTo = data.effectiveTo || null
    this.assignedBy = data.assignedBy || 'OSAD Staff'
    this.assignedAt = data.assignedAt || new Date().toISOString()
    this.endReason = data.endReason || null
  }

  static validate(data = {}, departments = [], eligiblePersonnel = []) {
    const errors = []
    const { departmentId, personnelId } = data

    if (!departmentId) {
      errors.push('Department ID is required for Program Coordinator assignment.')
    } else {
      const dept = departments.find(d => d.id === departmentId && d.status === 'active')
      if (!dept) errors.push('Selected Department is invalid or archived.')
    }

    if (!personnelId) {
      errors.push('Eligible HR Personnel selection is required.')
    } else {
      const p = eligiblePersonnel.find(item => item.id === personnelId)
      if (!p) errors.push('Selected Personnel is not recognized or eligible according to HR data.')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
