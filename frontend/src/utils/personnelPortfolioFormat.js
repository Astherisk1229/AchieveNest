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
    if (norm === 'academic' || norm === 'faculty_academic' || norm === 'teaching_faculty') {
      return PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
    }
    return PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING
  }

  const group = normalize(snapshot?.personnel_group_at_submission || personnel?.personnel_group || personnel?.personnel_affiliation?.personnel_group)
  const side = normalize(snapshot?.organizational_side_at_submission || personnel?.organizational_side || personnel?.personnel_affiliation?.organizational_side)
  const legacyClassification = normalize(
    snapshot?.personnel_classification_at_submission ||
    personnel?.personnel_classification ||
    personnel?.personnel_affiliation?.personnel_classification ||
    personnel?.classification
  )

  if (group === 'non_teaching_faculty') return PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING
  if (group === 'faculty' && side === 'academic') return PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
  if (group === 'faculty' && side === 'non_academic') return PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING
  if (group === 'faculty' && (legacyClassification === 'academic' || legacyClassification === 'teaching_faculty' || legacyClassification === 'faculty_academic')) {
    return PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
  }

  // Compatibility for records created before canonical group/side fields existed.
  if (legacyClassification === 'faculty_academic' || legacyClassification === 'academic' || legacyClassification === 'teaching_faculty') {
    return PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
  }
  return PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING
}

export function usesFacultyAcademicPortfolio(personnel = {}, snapshot = {}) {
  return resolvePersonnelPortfolioFormat(personnel, snapshot) === PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
}
