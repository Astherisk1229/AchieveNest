export default class OrganizationModeratorAssignmentModel {
  constructor(data = {}) {
    this.id = data.id || `oma-${Date.now()}`
    this.organizationId = data.organizationId || ''
    this.personnelId = data.personnelId || ''
    this.personnelName = data.personnelName || ''
    this.status = data.status || 'active' // active | ended
    this.effectiveFrom = data.effectiveFrom || new Date().toISOString()
    this.effectiveTo = data.effectiveTo || null
    this.assignedBy = data.assignedBy || 'OSAD Staff'
    this.assignedAt = data.assignedAt || new Date().toISOString()
    this.endReason = data.endReason || null
  }

  static validate(data = {}, organizations = [], eligiblePersonnel = []) {
    const errors = []
    const { organizationId, personnelId } = data

    if (!organizationId) {
      errors.push('Student Organization ID is required for Moderator assignment.')
    } else {
      const org = organizations.find(o => o.id === organizationId && o.status === 'active')
      if (!org) errors.push('Selected Student Organization is invalid or archived.')
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
