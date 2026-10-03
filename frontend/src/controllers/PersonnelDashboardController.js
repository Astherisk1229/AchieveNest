import { filterTimelineEntries } from '../config/personnelTimelineFilters.js'
import PersonnelAchievementController from './PersonnelAchievementController.js'

export default class PersonnelDashboardController {
  /**
   * Builds the dashboard profile strictly from the authenticated user record.
   * Missing fields stay empty; no placeholder identity data is injected.
   */
  static getDefaultProfile(currentUser) {
    const employeeId = currentUser?.employee_id || currentUser?.institutional_id || ''

    return {
      full_name: currentUser?.full_name || '',
      student_id: employeeId,
      employee_id: employeeId,
      college: currentUser?.college || '',
      college_code: currentUser?.college_code || '',
      program: currentUser?.program || '',
      program_affiliations: currentUser?.program_affiliations || [],
      administrative_unit: currentUser?.administrative_unit || '',
      personnel_affiliation: currentUser?.personnel_affiliation || null,
      academic_rank: currentUser?.academic_rank || '',
      year_level: currentUser?.year_level || '',
      age: currentUser?.age || '',
      location: currentUser?.location || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      avatar_url: currentUser?.avatar_url || '',
      qr_code_id: employeeId ? `NDMU-FAC-${employeeId}` : ''
    }
  }

  static mergeProfile(previousProfile, currentUser) {
    const baseProfile = this.getDefaultProfile(currentUser)
    return {
      ...previousProfile,
      ...baseProfile,
      full_name: currentUser?.full_name || previousProfile.full_name || baseProfile.full_name,
      employee_id: baseProfile.employee_id || previousProfile.employee_id,
      personnel_affiliation: currentUser?.personnel_affiliation || previousProfile.personnel_affiliation || null,
      college: currentUser?.college || previousProfile.college || baseProfile.college,
      college_code: currentUser?.college_code || previousProfile.college_code || baseProfile.college_code,
      program_affiliations: currentUser?.program_affiliations || previousProfile.program_affiliations || baseProfile.program_affiliations,
      administrative_unit: currentUser?.administrative_unit || previousProfile.administrative_unit || baseProfile.administrative_unit,
      email: currentUser?.email || previousProfile.email || baseProfile.email,
      avatar_url: currentUser?.avatar_url || previousProfile.avatar_url || baseProfile.avatar_url
    }
  }

  /**
   * Maps a persisted accomplishment (AchievementModel or raw API row) to the timeline card shape.
   */
  static toTimelineEntry(item) {
    const status = item.status || 'Pending Review'
    const statusLabel = status === 'Verified' ? 'HR Verified' : status === 'Endorsed' ? 'Dean Endorsed' : status
    return {
      id: item.id,
      title: item.title,
      date: item.date,
      status,
      statusLabel,
      category: item.category || '',
      // Authoritative classification inputs for the timeline filters and badges.
      category_code: item.category_code ?? null,
      category_metadata: item.category_metadata || {},
      raw_status: item.status || '',
      academic_year: item.academic_year || '',
      issuer: item.issuer || item.location || '',
      description: item.description || '',
      icon: 'Award',
      attached_file_name: item.attached_file_name || '',
      evidence_id: item.evidence_id || null,
      evidence_mime_type: (Array.isArray(item.evidence) ? (item.evidence.find((file) => file?.id === item.evidence_id) || item.evidence[0]) : null)?.mime_type || ''
    }
  }

  /**
   * Loads the authenticated personnel's real accomplishments from the backend.
   */
  static async loadAccomplishments() {
    const list = await PersonnelAchievementController.loadAchievements()
    return list.map(item => this.toTimelineEntry(item))
  }

  /**
   * Persists a new accomplishment (and optional evidence file) to the backend.
   */
  static async saveAccomplishment(newEntry, file = null) {
    return PersonnelAchievementController.addAchievement(newEntry, file)
  }

  /**
   * Role-aware timeline filter: explicit code sets from the Faculty or Non-Teaching schemas.
   * `format` comes from resolvePersonnelPortfolioFormat(currentUser).
   */
  static filterAccomplishments(entries, filterKey, format) {
    return filterTimelineEntries(entries, filterKey, format)
  }
}
