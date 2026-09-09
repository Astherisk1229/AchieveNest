export default class ProgramCoordinatorAssignmentModel {
  constructor(data = {}) {
    this.id = data.id || `pca-${Date.now()}`
    this.academicProgramId = data.academicProgramId || data.academic_program_id || ''
    this.personnelId = data.personnelId || ''
    this.personnelName = data.personnelName || ''
    this.status = data.status || 'active' // active | ended
    this.effectiveFrom = data.effectiveFrom || new Date().toISOString()
    this.effectiveTo = data.effectiveTo || null
    this.assignedBy = data.assignedBy || 'OSAD Staff'
    this.assignedAt = data.assignedAt || new Date().toISOString()
    this.endReason = data.endReason || null
  }

  static validate(data = {}, academicPrograms = [], eligiblePersonnel = []) {
    const errors = []
    const academicProgramId = data.academicProgramId || data.academic_program_id
    const { personnelId } = data

    if (!academicProgramId) {
      errors.push('Academic Program ID is required for Program Coordinator assignment.')
    } else {
      const program = academicPrograms.find(p => p.id === academicProgramId && p.status === 'active')
      if (!program) errors.push('Selected Academic Program is invalid or archived.')
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
