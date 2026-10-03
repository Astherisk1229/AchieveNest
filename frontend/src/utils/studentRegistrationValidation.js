export const STUDENT_SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V']

export const sanitizeStudentNumber = (value = '') => String(value).replace(/\D/g, '').slice(0, 50)

export const sanitizePersonName = (value = '') => String(value)
  .normalize('NFC')
  .replace(/[^\p{L}\p{M} '\u2019.-]/gu, '')

export const normalizeInstitutionalEmail = (value = '') => String(value).toLowerCase().replace(/\s/g, '')

export const isInstitutionalEmail = (value = '') => (
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@ndmu\.edu\.ph$/.test(value)
)

export const getProgramCollegeId = (program) => program?.college_id || program?.collegeId || ''

export const isActiveReference = (item) => (
  item?.status === undefined || item?.status === null || String(item.status).toLowerCase() === 'active'
)

export const getProgramLabel = (program) => {
  if (!program) return ''
  return [program.code, program.name].filter(Boolean).join(' — ')
}

export const filterPrograms = (programs, collegeId, query = '') => {
  if (!collegeId) return []
  const needle = query.trim().toLocaleLowerCase()
  return programs.filter((program) => {
    if (!isActiveReference(program) || getProgramCollegeId(program) !== collegeId) return false
    if (!needle) return true
    return `${program.code || ''} ${program.name || ''}`.toLocaleLowerCase().includes(needle)
  })
}
