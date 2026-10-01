export const PERSONNEL_PORTFOLIO_FORMATS = Object.freeze({
  FACULTY_ACADEMIC: 'faculty_academic',
  NON_TEACHING: 'non_teaching'
})

export const PORTFOLIO_FORMATS = PERSONNEL_PORTFOLIO_FORMATS

const normalize = (value) => String(value || '').trim().toLowerCase()

/** Resolve the portfolio format from authoritative Personnel classification fields. */
export function resolvePersonnelPortfolioFormat(personnel = {}, snapshot = {}) {
  if (typeof personnel === 'string') {
    const norm = normalize(personnel)
    if (norm === 'faculty') {
      return PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
    }
    return PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING
  }

  const group = normalize(snapshot?.personnel_group_at_submission || personnel?.personnel_group || personnel?.personnel_affiliation?.personnel_group)

  if (group === 'non_teaching_faculty') return PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING
  if (group === 'faculty') return PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
  return PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING
}

export function usesFacultyAcademicPortfolio(personnel = {}, snapshot = {}) {
  return resolvePersonnelPortfolioFormat(personnel, snapshot) === PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
}

/**
 * Personnel-group rules remain authoritative when workspace configuration is
 * unavailable or was resolved from an older scale assignment.
 */
export function isPersonnelAreaEntryAllowed(personnel = {}, areaCode = '', areaConfig = null) {
  const normalizedArea = normalize(areaCode).toUpperCase()

  if (!usesFacultyAcademicPortfolio(personnel) && normalizedArea === 'A') {
    return false
  }

  if (!areaConfig) return true

  if (areaConfig.is_personnel_entry_allowed === false) return false
  if (areaConfig.entry_policy) return areaConfig.entry_policy === 'personnel_entry_allowed'

  return true
}
