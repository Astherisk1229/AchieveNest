import { describe, expect, it } from 'vitest'
import {
  ALL_FILTER_KEY,
  FACULTY_TIMELINE_FILTERS,
  NON_TEACHING_TIMELINE_FILTERS,
  filterTimelineEntries,
  normalizeTimelineFilterKey,
  resolveTimelineCode,
  timelineCategoryState,
  timelineFiltersFor,
  timelineFormatFor
} from '../personnelTimelineFilters'
import { PERSONNEL_PORTFOLIO_FORMATS } from '../../utils/personnelPortfolioFormat'
import { resolveNtpCriterion } from '../nonTeachingPortfolioSchema'

const FACULTY = PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC
const NTF = PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING

let seq = 0
const record = (category_code, extra = {}) => ({ id: `r${seq += 1}`, title: 'Record', status: 'Pending Review', raw_status: 'submitted', category_code, category_metadata: {}, ...extra })
const keysContaining = (filters, entry, format) => filters.filter((f) => f.key !== ALL_FILTER_KEY && filterTimelineEntries([entry], f.key, format).length === 1).map((f) => f.key)

describe('timeline filter configuration', () => {
  it('lists the Faculty filters in the approved order', () => {
    expect(FACULTY_TIMELINE_FILTERS.map((f) => f.label)).toEqual([
      'All', 'Education & Memberships', 'Seminars & Trainings', 'Speaking & Publications',
      'Research & Awards', 'Teaching & Creative Work', 'Service & Community'
    ])
  })

  it('lists the Non-Teaching Faculty filters in the approved order', () => {
    expect(NON_TEACHING_TIMELINE_FILTERS.map((f) => f.label)).toEqual(['All', 'School Activities', 'Community Activities', 'Speaking & Judging', 'Awards'])
  })

  it('never offers evaluator-managed or derived NTF categories as filters', () => {
    const codes = NON_TEACHING_TIMELINE_FILTERS.flatMap((f) => [...(f.codes || [])])
    for (const code of ['A.1', 'A.2', 'A.3', 'B.3']) expect(codes).not.toContain(code)
  })

  it('does not treat Faculty C.3 (years of service) as a logged accomplishment', () => {
    expect(resolveTimelineCode(record('C.3'), FACULTY)).toBeNull()
  })

  it('chooses the filter set from the authoritative personnel group', () => {
    expect(timelineFiltersFor(timelineFormatFor({ personnel_group: 'faculty' }))).toBe(FACULTY_TIMELINE_FILTERS)
    expect(timelineFiltersFor(timelineFormatFor({ personnel_group: 'non_teaching_faculty' }))).toBe(NON_TEACHING_TIMELINE_FILTERS)
    expect(timelineFiltersFor(timelineFormatFor({ personnel_affiliation: { personnel_group: 'faculty' } }))).toBe(FACULTY_TIMELINE_FILTERS)
  })

  it('resets a filter that the current group does not have back to All', () => {
    expect(normalizeTimelineFilterKey('teaching', NTF)).toBe(ALL_FILTER_KEY)
    expect(normalizeTimelineFilterKey('school', FACULTY)).toBe(ALL_FILTER_KEY)
    expect(normalizeTimelineFilterKey('speaking_judging', NTF)).toBe('speaking_judging')
    expect(normalizeTimelineFilterKey('speaking_publications', NTF)).toBe(ALL_FILTER_KEY)
  })
})

describe('Faculty mapping', () => {
  const matrix = [
    ['A.1', 'education'], ['A.2', 'education'], ['A.3', 'seminars'],
    ['B.1', 'speaking_publications'], ['B.2', 'speaking_publications'], ['B.3', 'research'], ['B.4', 'research'],
    ['B.5', 'teaching'], ['B.6', 'teaching'],
    ['C.1.1', 'service'], ['C.1.a', 'service'], ['C.1.4', 'service'], ['C.2.1', 'service'], ['C.2.a', 'service'], ['C.2.3', 'service']
  ]

  it.each(matrix)('%s appears only under %s', (code, key) => {
    expect(keysContaining(FACULTY_TIMELINE_FILTERS, record(code), FACULTY)).toEqual([key])
  })

  it('shows every classified Faculty record under All', () => {
    const entries = matrix.map(([code]) => record(code))
    expect(filterTimelineEntries(entries, ALL_FILTER_KEY, FACULTY)).toHaveLength(entries.length)
  })

  it('uses the criterion code or subcategory when the stored code is missing', () => {
    expect(resolveTimelineCode(record(null, { category_metadata: { criterion_code: 'A.3' } }), FACULTY)).toBe('A.3')
    expect(resolveTimelineCode(record(null, { category_metadata: { subcategory_code: 'A2_MEMBERSHIP' } }), FACULTY)).toBe('A.2')
  })

  it('keeps a valid category code when subcategory metadata is missing', () => {
    expect(resolveTimelineCode(record('B.6', { category_metadata: {} }), FACULTY)).toBe('B.6')
  })

  it('reads category_metadata delivered as JSON text', () => {
    expect(resolveTimelineCode(record(null, { category_metadata: JSON.stringify(JSON.stringify({ criterion_code: 'B.2' })) }), FACULTY)).toBe('B.2')
  })

  it('labels Faculty cards in plain language with the official title as supporting detail', () => {
    expect(timelineCategoryState(record('A.3'), FACULTY)).toMatchObject({ kind: 'classified', label: 'Seminar or training' })
    expect(timelineCategoryState(record('B.6'), FACULTY)).toMatchObject({ label: 'Creative work', official: 'B.6 — Creative Work' })
    expect(timelineCategoryState(record('C.1.1'), FACULTY)).toMatchObject({ label: 'School service', official: 'C.1.a — Moderator / Officer' })
    expect(timelineCategoryState(record('C.2.2'), FACULTY).label).toBe('Community service')
  })
})

describe('Non-Teaching Faculty mapping', () => {
  const matrix = [
    ['B.1.a', 'school'], ['B.1.b', 'school'], ['B.1.c', 'school'], ['B.1.d', 'school'],
    ['B.2.a', 'community'], ['B.2.b', 'community'], ['B.2.c', 'community'],
    ['B.4', 'speaking_judging'], ['B.5', 'awards']
  ]

  it.each(matrix)('%s appears only under %s', (code, key) => {
    expect(keysContaining(NON_TEACHING_TIMELINE_FILTERS, record(code), NTF)).toEqual([key])
  })

  it('shows every classified NTF record under All', () => {
    const entries = matrix.map(([code]) => record(code))
    expect(filterTimelineEntries(entries, ALL_FILTER_KEY, NTF)).toHaveLength(entries.length)
  })

  it('never offers Faculty-only filters to Non-Teaching Faculty', () => {
    const ntfKeys = NON_TEACHING_TIMELINE_FILTERS.map((f) => f.key)
    for (const f of FACULTY_TIMELINE_FILTERS.filter((item) => item.key !== ALL_FILTER_KEY)) {
      expect(ntfKeys).not.toContain(f.key)
      expect(normalizeTimelineFilterKey(f.key, NTF)).toBe(ALL_FILTER_KEY)
    }
  })

  it('does not read NTF codes with Faculty meanings', () => {
    // B.5 is an award for NTF (Teaching material for Faculty); B.4 is speaking/judging, not research.
    expect(timelineCategoryState(record('B.5'), NTF).label).toBe('Award or recognition')
    expect(timelineCategoryState(record('B.4'), NTF).label).toBe('Speaking or judging')
    expect(keysContaining(NON_TEACHING_TIMELINE_FILTERS, record('B.1.a'), NTF)).not.toContain('speaking_judging')
    expect(keysContaining(NON_TEACHING_TIMELINE_FILTERS, record('B.2.b'), NTF)).not.toContain('speaking_judging')
  })

  it('resolves legacy numbered codes through the existing NTF resolver', () => {
    expect(resolveTimelineCode(record('B.1.1'), NTF)).toBe('B.1.a')
    expect(resolveTimelineCode(record(null, { category_metadata: { subcategory_code: 'B.2.3' } }), NTF)).toBe('B.2.c')
    expect(resolveTimelineCode(record('B.4.1'), NTF)).toBe('B.4')
  })

  it('prefers the official form metadata', () => {
    expect(resolveTimelineCode(record(null, { category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.5' } }), NTF)).toBe('B.5')
  })

  it('shows the official Appendix N title as supporting detail', () => {
    expect(timelineCategoryState(record('B.1.a'), NTF)).toMatchObject({ label: 'Club moderator or officer', official: 'B.1.a — Moderator / Officer of Clubs' })
  })
})

describe('drafts and records without a recognized category', () => {
  it('marks an editable draft with no code as Needs category', () => {
    const state = timelineCategoryState(record(null, { status: 'draft', raw_status: 'draft' }), FACULTY)
    expect(state).toMatchObject({ kind: 'needs_category', label: 'Needs category', message: 'Choose a category before submitting.' })
  })

  it('marks a submitted record with no code as Category needs review', () => {
    const state = timelineCategoryState(record(null), NTF)
    expect(state).toMatchObject({ kind: 'needs_review', label: 'Category needs review', message: 'This record does not have a recognized category.' })
  })

  it('keeps unknown codes visible under All only', () => {
    const unknown = record('Z.9')
    expect(filterTimelineEntries([unknown], ALL_FILTER_KEY, FACULTY)).toEqual([unknown])
    expect(keysContaining(FACULTY_TIMELINE_FILTERS, unknown, FACULTY)).toEqual([])
    expect(timelineCategoryState(unknown, FACULTY).kind).toBe('needs_review')
  })

  it('never guesses a category from the title or category text', () => {
    const titled = record(null, { title: 'Best Paper Award — Research Congress', category: 'B.4 Professional Recognition or Awards' })
    expect(resolveTimelineCode(titled, FACULTY)).toBeNull()
    expect(resolveTimelineCode({ ...titled, title: 'Church choir lector' }, NTF)).toBeNull()
    expect(keysContaining(NON_TEACHING_TIMELINE_FILTERS, titled, NTF)).toEqual([])
  })

  it('leaves the NTF resolver unchanged when strict mode is not requested', () => {
    // The booklet keeps its legacy text fallback; only the dashboard asks for strict codes.
    expect(resolveNtpCriterion({ category: 'Church activities, parish lector' })).toBe('B.2.a')
    expect(resolveNtpCriterion({ category: 'Church activities, parish lector' }, { strict: true })).toBeNull()
  })
})
