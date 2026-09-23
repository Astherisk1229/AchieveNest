export function localToday(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function validateEmploymentStartDate(value, { required = false, today = new Date() } = {}) {
  if (!value) return required ? 'Employment start date is required.' : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Enter a valid employment start date.'
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return 'Enter a valid employment start date.'
  }
  if (value > localToday(today)) return 'Employment start date cannot be in the future.'
  return ''
}

export function formatEmploymentStartDate(value) {
  if (!value) return 'Not yet recorded'
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return 'Not yet recorded'
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }).format(parsed)
}
