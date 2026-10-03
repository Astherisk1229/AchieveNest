/**
 * Dynamic Academic Year Generator Utility
 * 
 * Generates canonical academic year option pairs (YYYY-YYYY) starting from the
 * established lower bound (2025) through the current calendar year.
 * Sorted newest-first by default.
 */

export const EARLIEST_ACADEMIC_YEAR_START = 2025

/**
 * Generates dynamic academic year options in canonical format `YYYY-YYYY`
 * where `end_year = start_year + 1`.
 * 
 * @param {number} [currentYear=new Date().getFullYear()] - Starting anchor year (defaults to current calendar year)
 * @param {number} [earliestStartYear=EARLIEST_ACADEMIC_YEAR_START] - Verified lower bound (default: 2025)
 * @returns {Array<{ value: string, label: string }>} Array of option objects sorted newest-first
 */
export function generateAcademicYearOptions(
  currentYear = new Date().getFullYear(),
  earliestStartYear = EARLIEST_ACADEMIC_YEAR_START
) {
  const startYear = typeof currentYear === 'number' && !Number.isNaN(currentYear)
    ? Math.floor(currentYear)
    : new Date().getFullYear()

  const baseYear = typeof earliestStartYear === 'number' && !Number.isNaN(earliestStartYear)
    ? Math.floor(earliestStartYear)
    : EARLIEST_ACADEMIC_YEAR_START

  if (startYear < baseYear) {
    return []
  }

  const options = []
  for (let year = startYear; year >= baseYear; year -= 1) {
    const formattedAY = `${year}-${year + 1}`
    options.push({
      value: formattedAY,
      label: formattedAY
    })
  }

  return options
}

/**
 * Generates an array of canonical academic year string values `['YYYY-YYYY', ...]`
 * 
 * @param {number} [currentYear]
 * @param {number} [earliestStartYear]
 * @returns {string[]}
 */
export function getAcademicYearValues(
  currentYear = new Date().getFullYear(),
  earliestStartYear = EARLIEST_ACADEMIC_YEAR_START
) {
  return generateAcademicYearOptions(currentYear, earliestStartYear).map(opt => opt.value)
}

/**
 * Returns the default (latest) academic year value for selection.
 * 
 * @param {number} [currentYear]
 * @param {number} [earliestStartYear]
 * @returns {string}
 */
export function getDefaultAcademicYear(
  currentYear = new Date().getFullYear(),
  earliestStartYear = EARLIEST_ACADEMIC_YEAR_START
) {
  const options = generateAcademicYearOptions(currentYear, earliestStartYear)
  return options[0]?.value || `${EARLIEST_ACADEMIC_YEAR_START}-${EARLIEST_ACADEMIC_YEAR_START + 1}`
}
