/**
 * Display formatting for student achievement dates. Parses the backend's plain strings
 * ("YYYY-MM-DD" and "YYYY-MM-DD HH:MM:SS[.ffffff]") by hand so no time-zone shift occurs.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parts(value) {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/)
  if (!match) return null
  const [, y, m, d, hh, mm] = match
  const month = Number(m) - 1
  if (month < 0 || month > 11) return null
  return { year: Number(y), month, day: Number(d), hour: hh === undefined ? null : Number(hh), minute: mm === undefined ? null : Number(mm) }
}

/** "2026-05-28" -> "May 28, 2026"; invalid/empty -> '' */
export function formatDate(value) {
  const p = parts(value)
  return p ? `${MONTHS[p.month]} ${p.day}, ${p.year}` : ''
}

/** Activity date or range: "May 28, 2026", "May 28 – 30, 2026", "May 28 – Jun 2, 2026", "Dec 30, 2025 – Jan 2, 2026" */
export function formatDateRange(start, end) {
  const a = parts(start)
  const b = parts(end)
  if (!a) return ''
  if (!b || (a.year === b.year && a.month === b.month && a.day === b.day)) return formatDate(start)
  if (a.year !== b.year) return `${formatDate(start)} – ${formatDate(end)}`
  if (a.month !== b.month) return `${MONTHS[a.month]} ${a.day} – ${MONTHS[b.month]} ${b.day}, ${a.year}`
  return `${MONTHS[a.month]} ${a.day} – ${b.day}, ${a.year}`
}

/** "2026-09-30 14:42:30.000000" -> "Sep 30, 2026, 2:42 PM" */
export function formatDateTime(value) {
  const p = parts(value)
  if (!p) return ''
  if (p.hour === null) return formatDate(value)
  const suffix = p.hour >= 12 ? 'PM' : 'AM'
  const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12
  return `${formatDate(value)}, ${hour12}:${String(p.minute).padStart(2, '0')} ${suffix}`
}

export const NO_ACTIVITY_DATE = 'No activity date yet'
