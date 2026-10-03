// Pure helpers for the HR Ranking Periods module. Everything shown here is derived from the
// authoritative /hr/ranking-cycles projection; the only client-side derivation is the live
// preview of a cycle that does not exist yet, which mirrors RankingCycleService::generatedName.

export const FACULTY = 'FACULTY'
export const NON_TEACHING_FACULTY = 'NON_TEACHING_FACULTY'
export const GROUPS = [FACULTY, NON_TEACHING_FACULTY]

export const GROUP_LABELS = { [FACULTY]: 'Faculty', [NON_TEACHING_FACULTY]: 'Non-Teaching Faculty' }
export const TRACK_KEYS = { [FACULTY]: 'faculty', [NON_TEACHING_FACULTY]: 'non-teaching-faculty' }
export const GROUP_BY_TRACK_KEY = { faculty: FACULTY, 'non-teaching-faculty': NON_TEACHING_FACULTY }

export const STAGES = [
  { key: 'annual_reviews', route: 'annual-reviews', label: 'Annual Reviews' },
  { key: 'submissions', route: 'submissions', label: 'Submissions' },
  { key: 'evaluation', route: 'evaluation', label: 'Evaluation' },
  { key: 'results', route: 'results', label: 'Results' },
]

export const LIFECYCLE_OPTIONS = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'INCOMPLETE', label: 'Incomplete Configuration' },
]

export const COVERAGE_OPTIONS = [
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'NON_TEACHING_FACULTY', label: 'Non-Teaching Faculty' },
  { value: 'BOTH', label: 'Both' },
]

export const academicYearLabel = year => year ? `AY ${String(year).replace('-', '–')}` : 'AY Not set'

export function generatedCycleName(year, groups = []) {
  const prefix = academicYearLabel(year)
  const selected = GROUPS.filter(group => groups.includes(group))
  if (selected.length === 2) return `${prefix} Personnel Ranking`
  if (selected[0] === FACULTY) return `${prefix} Faculty Ranking`
  if (selected[0] === NON_TEACHING_FACULTY) return `${prefix} Non-Teaching Faculty Ranking`
  return `${prefix} Ranking Period`
}

export const coverageLabel = groups => {
  const selected = GROUPS.filter(group => groups.includes(group))
  if (selected.length === 2) return 'Faculty + Non-Teaching Faculty'
  return selected.length ? GROUP_LABELS[selected[0]] : 'Not set'
}

export const groupsForCoverage = coverage => coverage === 'BOTH' ? [...GROUPS] : GROUPS.includes(coverage) ? [coverage] : []

const toDate = value => {
  if (!value) return null
  const text = String(value)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00`) : new Date(text.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value, withYear = true) {
  const date = toDate(value)
  if (!date) return 'Not set'
  return new Intl.DateTimeFormat('en-US', withYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' }).format(date)
}

/** "Sep 1 – Sep 30, 2026" when both ends share a year, otherwise both years. */
export function formatRange(start, end) {
  const from = toDate(start)
  const to = toDate(end)
  if (!from && !to) return 'Not set'
  if (!from || !to) return `${formatDate(start)} – ${formatDate(end)}`
  return from.getFullYear() === to.getFullYear() ? `${formatDate(start, false)} – ${formatDate(end)}` : `${formatDate(start)} – ${formatDate(end)}`
}

export const localToday = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

export const dateOnly = value => value ? String(value).slice(0, 10) : ''

export function academicYearOptions(now = new Date(), existing = []) {
  const start = now.getFullYear() - 1
  const years = new Set(existing.filter(Boolean))
  for (let year = start; year <= start + 3; year += 1) years.add(`${year}-${year + 1}`)
  return [...years].sort().reverse()
}

/**
 * Tracks of other cycles that would block a new track for this academic year and group.
 * Mirrors RankingCycleService::assertNoConflictingTrack (same identity or an unfinished track).
 */
export function conflictingGroups(cycles, academicYear, excludeCycleId = null) {
  const blocked = new Set()
  for (const cycle of cycles || []) {
    if (cycle.id === excludeCycleId) continue
    for (const track of cycle.tracks || []) {
      if (track.academic_year !== academicYear) continue
      const unfinished = ['DRAFT', 'OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'].includes(track.status)
      if (track.semester === 'FULL_ACADEMIC_YEAR' || unfinished) blocked.add(track.personnel_group)
    }
  }
  return blocked
}

export function validateCycleDraft(form, { criteria = {}, conflicts = new Set(), today = null } = {}) {
  const errors = {}
  const groups = groupsForCoverage(form.coverage)
  if (!/^\d{4}-\d{4}$/.test(form.academic_year || '') || Number(form.academic_year.slice(5)) !== Number(form.academic_year.slice(0, 4)) + 1) errors.academic_year = 'Select an academic year.'
  if (!groups.length) errors.coverage = 'Select the personnel covered by this cycle.'
  const blocked = groups.filter(group => conflicts.has(group))
  if (blocked.length) errors.coverage = `${academicYearLabel(form.academic_year)} already has a ${blocked.map(group => GROUP_LABELS[group]).join(' and ')} ranking period.`
  if (!form.submission_open_at || !form.submission_close_at) errors.submission = 'Enter the submission start and end dates.'
  else if (form.submission_close_at < form.submission_open_at) errors.submission = 'The submission period must end after it starts.'
  else if (today && form.submission_close_at < today) errors.submission = 'The submission period has already ended. Choose current or future dates.'
  if (!form.evaluation_start_at || !form.evaluation_end_at) errors.evaluation = 'Enter the evaluation start and end dates.'
  else if (form.evaluation_end_at <= form.evaluation_start_at) errors.evaluation = 'The evaluation period must end after it starts.'
  else if (form.submission_close_at && form.evaluation_start_at <= form.submission_close_at) errors.evaluation = 'The evaluation period must start after the submission period ends.'
  for (const group of groups) {
    const entry = criteria[group]
    if (!entry || entry.phase === 'loading') errors.criteria = 'Loading the applicable criteria…'
    else if (entry.phase === 'error') errors.criteria = entry.message || `No active criteria is configured for ${GROUP_LABELS[group]}.`
  }
  return { errors, groups, ready: Object.keys(errors).length === 0 }
}

export const criteriaLabel = criteria => criteria ? `${criteria.title || 'Ranking criteria'} v${criteria.version_number || '—'}` : 'Not set'

/** Normalize the /admin/ranking-criteria/active payload to the label shown before creation. */
export function activeCriteriaSummary(payload) {
  const data = payload?.data || payload
  const version = data?.version
  if (!version?.id) return null
  return { version_id: version.id, title: data.sheet?.name || 'Ranking criteria', version_number: version.version_number, total_points: data.sheet?.overall_max_points ?? version.total_max_points, passing_score: data.sheet?.passing_score ?? version.passing_score }
}

export function cycleSearchText(cycle) {
  return [cycle.display_name, cycle.academic_year_label, cycle.coverage?.label, cycle.lifecycle_status?.label, cycle.current_stage?.label].filter(Boolean).join(' ').toLowerCase()
}

export function filterAndSortCycles(cycles, { search = '', academicYear = 'all', coverage = 'all', status = 'all', sort = 'newest' } = {}) {
  const query = search.trim().toLowerCase()
  const rows = (cycles || []).filter(cycle => {
    if (query && !cycleSearchText(cycle).includes(query)) return false
    if (academicYear !== 'all' && cycle.academic_year !== academicYear) return false
    if (coverage !== 'all' && cycle.coverage?.key !== coverage) return false
    if (status !== 'all' && cycle.lifecycle_status?.key !== status) return false
    return true
  })
  const byCreated = (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))
  const comparators = {
    newest: (a, b) => String(b.academic_year).localeCompare(String(a.academic_year)) || byCreated(a, b),
    oldest: (a, b) => String(a.academic_year).localeCompare(String(b.academic_year)) || -byCreated(a, b),
    name: (a, b) => String(a.display_name).localeCompare(String(b.display_name)),
  }
  return [...rows].sort(comparators[sort] || comparators.newest)
}

export function primaryAction(cycle) {
  const actions = cycle.allowed_actions || []
  if (actions.includes('complete_setup')) return { kind: 'complete_setup', label: 'Complete Setup' }
  if (actions.includes('open')) return { kind: 'open', label: 'Open Period' }
  return { kind: 'view', label: 'View Period' }
}

export function workspacePath(cycle, group = null) {
  const tracks = cycle?.tracks || []
  const track = tracks.find(item => item.personnel_group === group) || tracks.find(item => item.personnel_group === FACULTY) || tracks[0]
  const base = `/hr/ranking-cycles/${encodeURIComponent(cycle.id)}`
  if (!track) return base
  const stage = track.current_stage?.route || 'annual-reviews'
  return `${base}/${TRACK_KEYS[track.personnel_group] || 'faculty'}/${stage}`
}

/**
 * The period the HR Dashboard features: the newest ongoing cycle, else the next upcoming one,
 * else the most recently completed one. Archived and incomplete cycles are never featured.
 */
export function featuredCycle(cycles = []) {
  const byYearDesc = (a, b) => String(b.academic_year).localeCompare(String(a.academic_year)) || String(b.created_at || '').localeCompare(String(a.created_at || ''))
  const withStatus = key => cycles.filter(cycle => cycle.lifecycle_status?.key === key)
  const ongoing = withStatus('ONGOING').sort(byYearDesc)
  if (ongoing.length) return ongoing[0]
  const upcoming = withStatus('UPCOMING').sort((a, b) => String(a.schedule?.submission_open_at || '9999').localeCompare(String(b.schedule?.submission_open_at || '9999')))
  if (upcoming.length) return upcoming[0]
  return withStatus('COMPLETED').sort(byYearDesc)[0] || null
}
