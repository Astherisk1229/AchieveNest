/**
 * HR Personnel Directory filters. Each filter reads the authoritative field returned by
 * GET /hr/personnel; nothing is inferred or defaulted.
 */
export const NOT_RECORDED = '__not_recorded'

const lower = (value) => String(value ?? '').trim().toLowerCase()

const roleKey = (role) => (typeof role === 'object' ? (role?.role_key || role?.name || '') : String(role || ''))

export function applyPersonnelFilters(list = [], filters = {}) {
  const {
    group = 'ALL',
    engagement = 'ALL',
    appointment = 'ALL',
    college = 'ALL',
    department = 'ALL',
    role = 'ALL',
    status = 'ALL'
  } = filters

  return list.filter((person) => {
    if (!person) return false
    // Group: resolved server-side by PersonnelClassificationService (same source as the totals).
    if (group !== 'ALL' && lower(person.personnel_group) !== group) return false
    // Employment type: personnel_profiles.faculty_engagement.
    if (engagement !== 'ALL' && lower(person.faculty_engagement) !== engagement) return false
    // Appointment: personnel_profiles.employment_status (permanent / probationary), or not recorded.
    if (appointment !== 'ALL') {
      const value = lower(person.employment_status)
      if (appointment === NOT_RECORDED ? value !== '' : value !== appointment) return false
    }
    // College: direct affiliation or the department's College (server COALESCE).
    if (college !== 'ALL' && person.college_id !== college && person.college_code !== college) return false
    if (department !== 'ALL' && person.administrative_unit_id !== department && person.administrative_unit_code !== department) return false
    if (role !== 'ALL' && !(person.assigned_roles || []).some((r) => roleKey(r) === role)) return false
    // Account status: profiles.status (active / suspended / inactive / archived) only.
    if (status !== 'ALL' && lower(person.status) !== status) return false
    return true
  })
}

/** Collapses duplicate rows for one person (e.g. two active affiliations) into one entry. */
export function uniquePersonnel(list = []) {
  const seen = new Set()
  return list.filter((person) => {
    if (!person?.id || seen.has(person.id)) return false
    seen.add(person.id)
    return true
  })
}
