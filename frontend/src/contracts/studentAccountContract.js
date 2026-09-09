/**
 * Student Account Form & Lifecycle Contract Constants & Display Helpers
 * 
 * Canonical source of truth for frontend Student Year Levels, Sex Options,
 * display fallbacks, and numeric academic year sorting.
 */

import {
  EARLIEST_ACADEMIC_YEAR_START,
  generateAcademicYearOptions,
  getAcademicYearValues,
  getDefaultAcademicYear
} from '../utils/academicYearGenerator'

/** Canonical Student Year Levels (Graduate is strictly excluded) */
export const STUDENT_YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year'
]

/** Canonical Sex Options */
export const STUDENT_SEX_OPTIONS = [
  'Male',
  'Female',
  'Prefer not to say'
]

/** Full option objects for Sex select dropdowns with placeholder */
export const STUDENT_SEX_SELECT_OPTIONS = [
  { value: '', label: 'Select Sex', disabled: true },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
]

/** Full option objects for Year Level select dropdowns with placeholder */
export const STUDENT_YEAR_LEVEL_SELECT_OPTIONS = [
  { value: '', label: 'Select Year Level', disabled: true },
  ...STUDENT_YEAR_LEVELS.map(yl => ({ value: yl, label: yl }))
]

/**
 * Format sex for safe display in UI tables, details, and profiles.
 * Renders canonical value or approved neutral fallback for legacy NULL rows.
 * 
 * @param {string|null|undefined} sex 
 * @param {string} [fallback='Not yet provided']
 * @returns {string}
 */
export function formatStudentSexDisplay(sex, fallback = 'Not yet provided') {
  if (!sex || typeof sex !== 'string' || !sex.trim()) {
    return fallback
  }
  const clean = sex.trim()
  if (STUDENT_SEX_OPTIONS.includes(clean)) {
    return clean
  }
  return clean
}

/**
 * Compare two academic year strings (YYYY-YYYY) numerically by starting year.
 * 
 * @param {string} ay1
 * @param {string} ay2
 * @param {boolean} [descending=true]
 * @returns {number}
 */
export function compareAcademicYears(ay1, ay2, descending = true) {
  const startYear1 = parseInt((ay1 || '').split('-')[0], 10) || 0
  const startYear2 = parseInt((ay2 || '').split('-')[0], 10) || 0
  return descending ? startYear2 - startYear1 : startYear1 - startYear2
}

export {
  EARLIEST_ACADEMIC_YEAR_START,
  generateAcademicYearOptions,
  getAcademicYearValues,
  getDefaultAcademicYear
}
