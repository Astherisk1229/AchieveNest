/**
 * Personnel Dashboard → Accomplishments Timeline: plain-language filters and badges.
 *
 * This module does not define categories. It groups the codes that already exist in the
 * authoritative schemas (facultyAcademicAccomplishmentSchema.js for Faculty,
 * nonTeachingPortfolioSchema.js for Non-Teaching Faculty) into a few familiar filters.
 * Records are classified only from their stored codes (category_code and
 * category_metadata), never from titles or category text.
 */
import { FACULTY_ACADEMIC_ENTRY_SCHEMA, facultySchemaByCode, facultySubcategoryByCode } from './facultyAcademicAccomplishmentSchema'
import { ntpCriterionByCode, resolveNtpCriterion } from './nonTeachingPortfolioSchema'
import { PERSONNEL_PORTFOLIO_FORMATS, resolvePersonnelPortfolioFormat } from '../utils/personnelPortfolioFormat'

export const ALL_FILTER_KEY = 'all'

const ALL_FILTER = Object.freeze({ key: ALL_FILTER_KEY, label: 'All', codes: null, emptyHeading: 'No accomplishments yet' })

// Faculty C.1.x / C.2.x entry codes, read from the schema (C.3 is derived from service history).
const facultyCodesUnder = (prefix) => FACULTY_ACADEMIC_ENTRY_SCHEMA
  .filter((item) => !item.derived && item.code.split('.').slice(0, 2).join('.') === prefix)
  .map((item) => item.code)

const filter = (key, label, codes, emptyHeading) => Object.freeze({ key, label, codes: Object.freeze(new Set(codes)), emptyHeading })

export const FACULTY_TIMELINE_FILTERS = Object.freeze([
  ALL_FILTER,
  filter('education', 'Education & Memberships', ['A.1', 'A.2'], 'No education or memberships yet'),
  filter('seminars', 'Seminars & Trainings', ['A.3'], 'No seminars or trainings yet'),
  filter('speaking_publications', 'Speaking & Publications', ['B.1', 'B.2'], 'No speaking engagements or publications yet'),
  filter('research', 'Research & Awards', ['B.3', 'B.4'], 'No research or awards yet'),
  filter('teaching', 'Teaching & Creative Work', ['B.5', 'B.6'], 'No teaching materials or creative work yet'),
  filter('service', 'Service & Community', ['C.1', ...facultyCodesUnder('C.1'), 'C.2', ...facultyCodesUnder('C.2')], 'No service or community activities yet')
])

export const NON_TEACHING_TIMELINE_FILTERS = Object.freeze([
  ALL_FILTER,
  filter('school', 'School Activities', ['B.1.a', 'B.1.b', 'B.1.c', 'B.1.d'], 'No school activities yet'),
  filter('community', 'Community Activities', ['B.2.a', 'B.2.b', 'B.2.c'], 'No community activities yet'),
  filter('speaking_judging', 'Speaking & Judging', ['B.4'], 'No speaking or judging engagements yet'),
  filter('awards', 'Awards', ['B.5'], 'No awards yet')
])

// Short card badges. Official titles stay in the schemas and are shown as supporting detail.
const FACULTY_BADGES = Object.freeze({
  'A.1': 'Education', 'A.2': 'Professional membership', 'A.3': 'Seminar or training',
  'B.1': 'Speaking engagement', 'B.2': 'Publication', 'B.3': 'Research', 'B.4': 'Award or recognition',
  'B.5': 'Teaching material', 'B.6': 'Creative work', 'C.1': 'School service', 'C.2': 'Community service'
})
const NON_TEACHING_BADGES = Object.freeze({
  'B.1.a': 'Club moderator or officer', 'B.1.b': 'Trainer or coach', 'B.1.c': 'Committee membership',
  'B.1.d': 'School activity service', 'B.2.a': 'Church activity', 'B.2.b': 'Community or civic activity',
  'B.2.c': 'Charity or community project', 'B.4': 'Speaking or judging', 'B.5': 'Award or recognition'
})

const FACULTY_DISPLAY_CODES = Object.freeze(Object.fromEntries(
  FACULTY_ACADEMIC_ENTRY_SCHEMA.filter((item) => item.displayCode).map((item) => [item.displayCode, item.code])
))

/** category_metadata may arrive as an object or as (possibly double-encoded) JSON text. */
export function timelineMetadata(item = {}) {
  let metadata = item.category_metadata ?? item.categoryMetadata ?? {}
  for (let i = 0; i < 2 && typeof metadata === 'string'; i += 1) {
    try { metadata = JSON.parse(metadata || '{}') } catch { metadata = {} }
  }
  return metadata && typeof metadata === 'object' ? metadata : {}
}

const clean = (value) => String(value ?? '').trim()

/** Faculty: stored code first, then the criterion code, then the subcategory's parent code. */
export function resolveFacultyTimelineCode(item = {}) {
  const metadata = timelineMetadata(item)
  for (const raw of [item.category_code, metadata.criterion_code]) {
    const value = clean(raw)
    if (!value) continue
    if (value === 'C.1' || value === 'C.2') return value
    const schema = facultySchemaByCode(FACULTY_DISPLAY_CODES[value] || value)
    if (schema && !schema.derived) return schema.code
  }
  const parent = facultySubcategoryByCode(clean(metadata.subcategory_code))?.categoryCode
  return parent && !facultySchemaByCode(parent)?.derived ? parent : null
}

/** Non-Teaching Faculty: the existing Appendix N resolver, without its category-text fallbacks. */
export function resolveNonTeachingTimelineCode(item = {}) {
  const metadata = timelineMetadata(item)
  return resolveNtpCriterion({ ...item, category_metadata: metadata }, { strict: true })
}

export function timelineFormatFor(personnel = {}) {
  return resolvePersonnelPortfolioFormat(personnel)
}

export function timelineFiltersFor(format) {
  return format === PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC ? FACULTY_TIMELINE_FILTERS : NON_TEACHING_TIMELINE_FILTERS
}

export function resolveTimelineCode(item, format) {
  return format === PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC ? resolveFacultyTimelineCode(item) : resolveNonTeachingTimelineCode(item)
}

const isDraft = (status) => clean(status).toLowerCase() === 'draft'

/**
 * Badge for one record:
 *  - classified       → short readable type (+ official code/title for supporting detail)
 *  - draft, no code    → "Needs category" (warning)
 *  - otherwise unknown → "Category needs review" (warning); never guessed from text
 */
export function timelineCategoryState(item, format) {
  const code = resolveTimelineCode(item, format)
  if (code) {
    if (format === PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC) {
      const group = code.split('.').slice(0, 2).join('.')
      const schema = facultySchemaByCode(code)
      const official = schema ? `${schema.displayCode || schema.code} — ${schema.label}` : code
      return { kind: 'classified', code, label: FACULTY_BADGES[code] || FACULTY_BADGES[group] || official, official }
    }
    const criterion = ntpCriterionByCode(code)
    return { kind: 'classified', code, label: NON_TEACHING_BADGES[code] || criterion?.title || code, official: criterion ? `${criterion.code} — ${criterion.title}` : code }
  }
  if (isDraft(item?.raw_status ?? item?.status)) {
    return { kind: 'needs_category', code: null, label: 'Needs category', message: 'Choose a category before submitting.' }
  }
  return { kind: 'needs_review', code: null, label: 'Category needs review', message: 'This record does not have a recognized category.' }
}

/** Records shown for a filter. "All" returns every record, including unclassified ones. */
export function filterTimelineEntries(entries = [], filterKey = ALL_FILTER_KEY, format) {
  const active = timelineFiltersFor(format).find((item) => item.key === filterKey)
  if (!active || !active.codes) return entries
  return entries.filter((entry) => {
    const code = resolveTimelineCode(entry, format)
    return Boolean(code) && active.codes.has(code)
  })
}

/** Keeps a selection valid for the current format; anything unavailable falls back to All. */
export function normalizeTimelineFilterKey(filterKey, format) {
  return timelineFiltersFor(format).some((item) => item.key === filterKey) ? filterKey : ALL_FILTER_KEY
}
