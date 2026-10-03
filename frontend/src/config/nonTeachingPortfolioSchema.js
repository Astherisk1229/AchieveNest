/**
 * Non-Teaching Personnel portfolio (Appendix N — Non-Teaching Personnel Ranking Scale).
 *
 * One definition shared by the personnel "Add Accomplishment" form, the Portfolio Booklet,
 * the Dean / HR review views and the printed PDF, so every audience sees the same sections.
 *
 * Area A is rated by HR (DS × weight) and is never entered by personnel.
 * Area B codes use the printed form's lettering (B.1.a); the locked criteria number them (B.1.1).
 */

export const NTP_AREAS = Object.freeze([
  { key: 'A', title: 'A. PERFORMANCE AND PERSONAL INDICATORS', name: 'Area A: Performance and Personal Indicators', max: 90, personnelEntry: false },
  { key: 'B', title: 'B. SERVICE AND LEADERSHIP', name: 'Area B: Service and Leadership', max: 60, personnelEntry: true }
])

export const NTP_AREA_A_ITEMS = Object.freeze([
  { code: 'A.1', title: 'Job Performance', max: 50 },
  { code: 'A.2', title: 'Personal Attitudes and Qualities', max: 10 },
  { code: 'A.3', title: 'Efficiency', max: 30 }
])

const field = (name, label, extra = {}) => ({ name, label, required: true, ...extra })

/**
 * Personnel-entered criteria. `primary` is the main detail shown as the accomplishment title,
 * `secondary` lists the details shown in the booklet's second column.
 */
export const NTP_ENTRY_CRITERIA = Object.freeze([
  {
    code: 'B.1.a', group: 'B.1', groupTitle: 'B.1 School Involvement', title: 'Moderator / Officer of Clubs', max: 30, dateMode: 'period', allowOngoing: true,
    fields: [field('organization', 'Club / Organization', { placeholder: 'e.g. NDMU Staff Association' }), field('assignment_role', 'Role', { type: 'select', options: [['MODERATOR', 'Moderator'], ['OFFICER', 'Officer']] }), field('organizer', 'Conducted / Organized by', { placeholder: 'e.g. Office of Student Affairs' })],
    primary: 'organization', secondary: ['assignment_role', 'organizer'], columns: ['Date / Period', 'Club / Organization', 'Role · Conducted / Organized by', 'Remarks']
  },
  {
    code: 'B.1.b', group: 'B.1', groupTitle: 'B.1 School Involvement', title: 'Trainer / Coach', max: 20, dateMode: 'period', allowOngoing: true,
    fields: [field('activity', 'Activity / Team', { placeholder: 'e.g. University Chorale' }), field('organizer', 'Conducted / Organized by')],
    primary: 'activity', secondary: ['organizer'], columns: ['Date / Period', 'Activity / Team', 'Conducted / Organized by', 'Remarks']
  },
  {
    code: 'B.1.c', group: 'B.1', groupTitle: 'B.1 School Involvement', title: 'Membership in Working Committees', max: 20, dateMode: 'period', allowOngoing: true,
    fields: [field('committee', 'Committee', { placeholder: 'e.g. Foundation Day Committee' }), field('organizer', 'Conducted / Organized by')],
    primary: 'committee', secondary: ['organizer'], columns: ['Date / Period', 'Committee', 'Conducted / Organized by', 'Remarks']
  },
  {
    code: 'B.1.d', group: 'B.1', groupTitle: 'B.1 School Involvement', title: 'Rendered Service in School Activities', max: 10, dateMode: 'single',
    fields: [field('activity', 'Activity', { placeholder: 'e.g. Intramurals 2026 registration desk' }), field('organizer', 'Conducted / Organized by')],
    primary: 'activity', secondary: ['organizer'], columns: ['Date', 'Activity', 'Conducted / Organized by', 'Remarks']
  },
  {
    code: 'B.2.a', group: 'B.2', groupTitle: 'B.2 Community Involvement', title: 'Active Involvement in Church Activities', max: 25, dateMode: 'single',
    fields: [field('activity', 'Activity', { placeholder: 'e.g. Parish feast day' }), field('role', 'Role', { placeholder: 'e.g. Lector' })],
    primary: 'activity', secondary: ['role'], columns: ['Date', 'Activity', 'Role', 'Remarks']
  },
  {
    code: 'B.2.b', group: 'B.2', groupTitle: 'B.2 Community Involvement', title: 'Active Involvement in Community / Civic Activities', max: 25, dateMode: 'single',
    fields: [field('activity', 'Activity', { placeholder: 'e.g. Coastal clean-up' }), field('role', 'Role', { placeholder: 'e.g. Volunteer' })],
    primary: 'activity', secondary: ['role'], columns: ['Date', 'Activity', 'Role', 'Remarks']
  },
  {
    code: 'B.2.c', group: 'B.2', groupTitle: 'B.2 Community Involvement', title: 'Support to Charity and Community Projects', max: 5, dateMode: 'single',
    fields: [field('project', 'Project', { placeholder: 'e.g. Typhoon relief drive' }), field('beneficiary', 'Beneficiary / Organization', { required: false })],
    primary: 'project', secondary: ['beneficiary'], columns: ['Date', 'Project', 'Beneficiary / Organization', 'Remarks']
  },
  {
    code: 'B.4', group: 'B.4', groupTitle: 'B.4 Invited as Judge, Lecturer, Resource Person', title: 'Invited as Judge, Lecturer, Resource Person', max: 30, dateMode: 'single',
    fields: [field('engagement', 'Engagement / Event', { placeholder: 'e.g. Regional records management seminar' }), field('role', 'Role', { type: 'select', options: [['JUDGE', 'Judge'], ['LECTURER', 'Lecturer'], ['RESOURCE_PERSON', 'Resource Person']] }), field('organizer', 'Organizer')],
    primary: 'engagement', secondary: ['role', 'organizer'], columns: ['Date', 'Engagement', 'Role · Organizer', 'Remarks']
  },
  {
    code: 'B.5', group: 'B.5', groupTitle: 'B.5 Recognition / Meritorious Award', title: 'Recognition / Meritorious Award', max: 30, dateMode: 'single',
    fields: [field('award', 'Award / Recognition', { placeholder: 'e.g. Outstanding Employee 2026' }), field('issuing_body', 'Issuing Body')],
    primary: 'award', secondary: ['issuing_body'], columns: ['Date', 'Award / Recognition', 'Issuing Body', 'Remarks']
  }
])

/** B.3 is computed from the employment record, never entered. */
export const NTP_YEARS_OF_SERVICE = Object.freeze({ code: 'B.3', group: 'B.3', groupTitle: 'B.3 Number of Years at NDMU', title: 'Number of Years at NDMU', max: 10 })

export const ntpCriterionByCode = (code) => NTP_ENTRY_CRITERIA.find((criterion) => criterion.code === String(code || '').trim()) || null

/** Contract code used by the server (NTF-B1A, NTF-B4 …). */
export const ntpContractCode = (code) => `NTF-${String(code || '').replace(/\./g, '').toUpperCase()}`

/** "B.1.a Moderator / Officer of Clubs" — the category string stored on the accomplishment. */
export const ntpCategoryLabel = (criterion) => `${criterion.code} ${criterion.title}`

const optionLabel = (criterion, name, value) => {
  const definition = criterion.fields.find((item) => item.name === name)
  const option = definition?.options?.find(([key]) => key === value)
  return option ? option[1] : value
}

/** Human-readable detail value (select options resolved to their labels). */
export const ntpDetailText = (criterion, details = {}, name) => {
  const value = String(details?.[name] ?? '').trim()
  return value ? optionLabel(criterion, name, value) : ''
}

// Numbered locked subcategories (B.1.1) and keyword aliases for records that predate the lettered codes.
const NUMBERED = { 'B.1.1': 'B.1.a', 'B.1.2': 'B.1.b', 'B.1.3': 'B.1.c', 'B.1.4': 'B.1.d', 'B.2.1': 'B.2.a', 'B.2.2': 'B.2.b', 'B.2.3': 'B.2.c', 'B.4.1': 'B.4' }
const ALIASES = [
  [/moderator|officer of club/i, 'B.1.a'], [/trainer|coach/i, 'B.1.b'], [/working committee|committee/i, 'B.1.c'], [/rendered service|school activit/i, 'B.1.d'],
  [/church/i, 'B.2.a'], [/charity/i, 'B.2.c'], [/civic|community/i, 'B.2.b'],
  [/judge|lecturer|resource person|speaker/i, 'B.4'], [/recognition|meritorious|award/i, 'B.5']
]

const metadataOf = (item) => {
  let payload = item.scoring_payload || item.scoringPayload || {}
  if (typeof payload === 'string') { try { payload = JSON.parse(payload || '{}') } catch { payload = {} } }
  let metadata = item.category_metadata || payload.category_metadata || {}
  if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata || '{}') } catch { metadata = {} } }
  return metadata && typeof metadata === 'object' ? metadata : {}
}

/**
 * Resolves any personnel item (accomplishment or evaluation item) to an Appendix N entry code, or null.
 * Records saved with the official form carry portfolio_format = non_teaching_faculty; older records
 * used a different B/C list (where B.4 meant awards), so for those the category text decides.
 * With { strict: true } only stored codes are used (numbered, lettered or exact Appendix N codes).
 */
export function resolveNtpCriterion(item = {}, { strict = false } = {}) {
  const metadata = metadataOf(item)
  if (metadata.portfolio_format === 'non_teaching_faculty' && ntpCriterionByCode(metadata.criterion_code)) return metadata.criterion_code
  const codes = [item.criterion_key, item.criterionKey, item.subcategory_code, metadata.subcategory_code, item.criterion_code, item.criterionCode, item.category_code, ...(strict ? [metadata.criterion_code] : [])]
    .map((value) => String(value || '').trim()).filter(Boolean)
  for (const value of codes) if (NUMBERED[value]) return NUMBERED[value]
  for (const value of codes) if (/^B\.\d\.[a-d]$/.test(value) && ntpCriterionByCode(value)) return value
  // strict: callers that already know the person is Non-Teaching Faculty (e.g. the dashboard
  // timeline) accept an exact Appendix N code and never guess from category text.
  if (strict) return codes.find((value) => ntpCriterionByCode(value)) || null
  const category = String(item.category || item.criterion_title || '').trim()
  const leading = category.match(/^(B\.\d(?:\.[a-d])?)\s+(.*)$/)
  if (leading) {
    const criterion = ntpCriterionByCode(leading[1])
    const firstWord = criterion?.title.split(/[\s/]+/)[0].toLowerCase()
    if (criterion && firstWord && leading[2].toLowerCase().startsWith(firstWord)) return criterion.code
  }
  return ALIASES.find(([pattern]) => pattern.test(category))?.[1] || null
}
