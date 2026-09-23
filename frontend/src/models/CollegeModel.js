import { isValidHex } from '../utils/colorContrast.js'

export default class CollegeModel {
  constructor(data = {}) {
    this.id = data.id || `col-${Date.now()}`
    this.code = (data.code || '').trim().toUpperCase()
    this.name = (data.name || '').trim()
    this.description = data.description || ''
    this.status = data.status || 'active' // active | archived
    this.logo_storage_key = data.logo_storage_key || null
    this.logo_original_name = data.logo_original_name || null
    this.logo_mime_type = data.logo_mime_type || null
    this.logo_updated_at = data.logo_updated_at || null
    this.acronym_badge_color = data.acronym_badge_color ? data.acronym_badge_color.trim().toUpperCase() : null
    this.createdBy = data.createdBy || 'OSAD Staff'
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString()
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString()
  }

  static validate(data = {}, existingColleges = []) {
    const errors = []
    const code = (data.code || '').trim().toUpperCase()
    const name = (data.name || '').trim()
    const badgeColor = data.acronym_badge_color || data.acronymBadgeColor

    if (!code) errors.push('College code is required.')
    if (!name) errors.push('College name is required.')

    if (badgeColor && !isValidHex(badgeColor)) {
      errors.push('Acronym badge color must be a valid 6-digit hex string (e.g. #16834A).')
    }

    const duplicateCode = existingColleges.find(
      c => c.id !== data.id && c.code.toUpperCase() === code
    )
    if (duplicateCode) errors.push(`College code "${code}" already exists.`)

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static isDeletable(collegeId, academicPrograms = [], organizations = []) {
    const activePrograms = academicPrograms.filter(program => program.collegeId === collegeId && program.status !== 'archived')
    const activeOrgs = organizations.filter(o => o.collegeId === collegeId && o.status !== 'archived')
    return {
      canDelete: activePrograms.length === 0 && activeOrgs.length === 0,
      activeAcademicProgramCount: activePrograms.length,
      activeOrganizationCount: activeOrgs.length
    }
  }
}
