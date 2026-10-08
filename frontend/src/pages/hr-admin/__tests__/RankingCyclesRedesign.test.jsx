import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RankingCycleContext from '../../../components/ranking/RankingCycleContext'
import NewRankingCycleDialog from '../ranking-cycles/NewRankingCycleDialog'
import {
  conflictingGroups, featuredCycle, filterAndSortCycles, formatRange, generatedCycleName, groupsForCoverage, primaryAction, validateCycleDraft, workspacePath,
} from '../ranking-cycles/rankingCyclePresentation'

const root = path.resolve(import.meta.dirname, '../../../../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

const track = (group, status = 'DRAFT', extra = {}) => ({
  id: `${group}-track`, personnel_group: group, personnel_group_label: group === 'FACULTY' ? 'Teaching Faculty' : 'Non-Teaching Faculty', status, academic_year: '2026-2027', semester: 'FULL_ACADEMIC_YEAR', version: 1,
  current_stage: { key: 'evaluation', route: 'evaluation', label: 'Evaluation', index: 2 },
  criteria: { version_id: `${group}-v1`, title: group === 'FACULTY' ? 'Faculty Ranking Scale' : 'Non-Teaching Faculty Ranking Scale', version_number: '1.0', locked: true },
  ...extra,
})
const cycle = (overrides = {}) => ({
  id: 'cycle-1', academic_year: '2026-2027', display_name: 'AY 2026–2027 Personnel Ranking', cycle_name: 'Legacy cycle — Acceptance Fixture', created_at: '2026-09-01 08:00:00',
  coverage: { key: 'BOTH', label: 'Teaching Faculty + Non-Teaching Faculty', groups: ['FACULTY', 'NON_TEACHING_FACULTY'] },
  current_stage: { key: 'evaluation', label: 'Evaluation', index: 2 }, lifecycle_status: { key: 'ONGOING', label: 'Ongoing' },
  allowed_actions: ['open', 'settings'], is_read_only: false, is_archived: false, track_count: 2,
  tracks: [track('FACULTY', 'EVALUATION_ONGOING'), track('NON_TEACHING_FACULTY', 'EVALUATION_ONGOING')],
  schedule: { submission_open_at: '2026-09-01 00:00:00', submission_close_at: '2026-09-30 23:59:59', evaluation_start_at: '2026-10-01 00:00:00', evaluation_end_at: '2026-10-20 23:59:59' },
  ...overrides,
})

describe('Ranking period naming and coverage', () => {
  it('generates human-readable names from academic year and coverage', () => {
    expect(generatedCycleName('2026-2027', ['FACULTY', 'NON_TEACHING_FACULTY'])).toBe('AY 2026–2027 Personnel Ranking')
    expect(generatedCycleName('2026-2027', ['FACULTY'])).toBe('AY 2026–2027 Teaching Faculty Ranking')
    expect(generatedCycleName('2026-2027', ['NON_TEACHING_FACULTY'])).toBe('AY 2026–2027 Non-Teaching Faculty Ranking')
    expect(groupsForCoverage('BOTH')).toEqual(['FACULTY', 'NON_TEACHING_FACULTY'])
  })

  it('mirrors the backend generator so preview and saved names agree', () => {
    const service = read('backend/app/Services/RankingCycleService.php')
    for (const suffix of ['Personnel Ranking', 'Teaching Faculty Ranking', 'Non-Teaching Faculty Ranking']) expect(service).toContain(suffix)
  })

  it('formats schedules compactly', () => {
    expect(formatRange('2026-09-01 00:00:00', '2026-09-30 23:59:59')).toBe('Sep 1 – Sep 30, 2026')
    expect(formatRange(null, null)).toBe('Not set')
  })
})

describe('New Ranking Period validation', () => {
  const ready = { FACULTY: { phase: 'ready' }, NON_TEACHING_FACULTY: { phase: 'ready' } }
  const form = { academic_year: '2026-2027', coverage: 'BOTH', submission_open_at: '2026-09-01', submission_close_at: '2026-09-30', evaluation_start_at: '2026-10-01', evaluation_end_at: '2026-10-20' }

  it('is ready only when every required value is valid', () => {
    expect(validateCycleDraft(form, { criteria: ready }).ready).toBe(true)
    expect(validateCycleDraft({ ...form, coverage: '' }, { criteria: ready }).errors.coverage).toBeTruthy()
    expect(validateCycleDraft({ ...form, evaluation_start_at: '2026-09-15' }, { criteria: ready }).ready).toBe(true)
    expect(validateCycleDraft({ ...form, submission_close_at: '' }, { criteria: ready }).errors.submission).toBeTruthy()
    expect(validateCycleDraft(form, { criteria: { FACULTY: { phase: 'error', message: 'No active criteria' }, NON_TEACHING_FACULTY: { phase: 'ready' } } }).errors.criteria).toBe('No active criteria')
    expect(validateCycleDraft(form, { criteria: ready, today: '2026-10-05' }).errors.submission).toMatch(/already ended/)
  })

  it('blocks personnel groups that already have a cycle for the academic year', () => {
    const conflicts = conflictingGroups([cycle({ tracks: [track('FACULTY', 'CLOSED')] })], '2026-2027')
    expect([...conflicts]).toEqual(['FACULTY'])
    expect(validateCycleDraft(form, { criteria: ready, conflicts }).errors.coverage).toBe('AY 2026–2027 already has a Teaching Faculty ranking period.')
    expect(validateCycleDraft({ ...form, coverage: 'NON_TEACHING_FACULTY' }, { criteria: ready, conflicts }).ready).toBe(true)
  })

  it('renders the compact single-step modal with a live preview and no manual name field', () => {
    const html = renderToStaticMarkup(<MemoryRouter><NewRankingCycleDialog cycles={[]} onClose={() => {}} onCreated={() => {}}/></MemoryRouter>)
    for (const text of ['New Ranking Period', 'Academic Year', 'Personnel Coverage', 'Submission Period', 'Evaluation Period', 'Criteria', 'Period Preview', 'Not set', 'Cancel', 'Create Ranking Period']) expect(html).toContain(text)
    expect(html).toContain('Personnel Ranking')
    const text = html.replace(/<[^>]+>/g, ' ')
    expect(text).not.toMatch(/Cycle name|Save Draft|\btrack\b/i)
    expect(html).toMatch(/<button type="submit" form="new-ranking-cycle" disabled=""/)
  })
})

describe('Ranking Periods list model', () => {
  const cycles = [
    cycle(),
    cycle({ id: 'cycle-2', academic_year: '2025-2026', display_name: 'AY 2025–2026 Faculty Ranking', coverage: { key: 'FACULTY', label: 'Faculty', groups: ['FACULTY'] }, lifecycle_status: { key: 'COMPLETED', label: 'Completed' }, allowed_actions: ['view', 'archive'], tracks: [track('FACULTY', 'CLOSED', { current_stage: { route: 'results' } })] }),
    cycle({ id: 'cycle-3', academic_year: '2024-2025', display_name: 'AY 2024–2025 Non-Teaching Faculty Ranking', coverage: { key: 'NON_TEACHING_FACULTY', label: 'Non-Teaching Faculty', groups: ['NON_TEACHING_FACULTY'] }, lifecycle_status: { key: 'ARCHIVED', label: 'Archived' }, allowed_actions: ['view'] }),
  ]

  it('searches by human-readable name and filters by authoritative fields', () => {
    expect(filterAndSortCycles(cycles, { search: 'non-teaching faculty ranking' }).map(c => c.id)).toEqual(['cycle-3'])
    expect(filterAndSortCycles(cycles, { search: 'non-teaching' }).map(c => c.id)).toEqual(['cycle-1', 'cycle-3'])
    expect(filterAndSortCycles(cycles, { search: 'acceptance fixture' })).toHaveLength(0)
    expect(filterAndSortCycles(cycles, { coverage: 'FACULTY' }).map(c => c.id)).toEqual(['cycle-2'])
    expect(filterAndSortCycles(cycles, { status: 'ARCHIVED' }).map(c => c.id)).toEqual(['cycle-3'])
    expect(filterAndSortCycles(cycles, { academicYear: '2025-2026' }).map(c => c.id)).toEqual(['cycle-2'])
    expect(filterAndSortCycles(cycles).map(c => c.id)).toEqual(['cycle-1', 'cycle-2', 'cycle-3'])
    expect(filterAndSortCycles(cycles, { sort: 'oldest' }).map(c => c.id)).toEqual(['cycle-3', 'cycle-2', 'cycle-1'])
  })

  it('features the ongoing cycle on the HR Dashboard, never archived or incomplete ones', () => {
    expect(featuredCycle(cycles).id).toBe('cycle-1')
    const upcoming = cycle({ id: 'up', lifecycle_status: { key: 'UPCOMING', label: 'Upcoming' } })
    expect(featuredCycle([cycles[1], cycles[2], upcoming]).id).toBe('up')
    expect(featuredCycle([cycles[1], cycles[2]]).id).toBe('cycle-2')
    expect(featuredCycle([cycles[2], { id: 'x', lifecycle_status: { key: 'INCOMPLETE' } }])).toBeNull()
  })

  it('maps lifecycle to Open Period, View Period, or Complete Setup', () => {
    expect(primaryAction(cycles[0]).label).toBe('Open Period')
    expect(primaryAction(cycles[1]).label).toBe('View Period')
    expect(primaryAction(cycles[2]).label).toBe('View Period')
    expect(primaryAction({ allowed_actions: ['complete_setup', 'delete'] }).label).toBe('Complete Setup')
  })

  it('opens the real workspace at the track stage reported by the backend', () => {
    expect(workspacePath(cycles[0])).toBe('/hr/ranking-cycles/cycle-1/faculty/evaluation')
    expect(workspacePath(cycles[1])).toBe('/hr/ranking-cycles/cycle-2/faculty/results')
  })

  it('never uses the raw stored cycle name or Setup required in the page', () => {
    const page = read('frontend/src/pages/hr-admin/HRRankingCyclesPage.jsx')
    expect(page).not.toContain('cycle_name')
    expect(page).not.toContain('Setup required')
    expect(page).not.toContain('personnel-evaluation-setup')
    expect(page).toContain('Manage Criteria')
    expect(page).toContain('/hr/ranking-cycles/criteria')
    for (const column of ['Ranking Period', 'Coverage', 'Schedule', 'Current Stage', 'Status', 'Action']) expect(page).toContain(`>${column}</th>`)
  })

  it('routes Manage Criteria to the existing Criteria Sheets UI within Ranking Periods', () => {
    const app = read('frontend/src/App.jsx')
    const setup = read('frontend/src/pages/hr-admin/PersonnelEvaluationSetupPage.jsx')
    expect(app).toContain('path="/hr/ranking-cycles/criteria" element={<PersonnelEvaluationSetupPage criteriaOnly />}')
    expect(setup).toContain('criteriaOnly ? \'criteria\' : \'periods\'')
    expect(setup).toContain('Manage Criteria')
    expect(setup).toContain('Create New Version')
  })
})

describe('Personnel Ranking workspace header', () => {
  const render = (value, url = '/hr/ranking-cycles/cycle-1/faculty/evaluation') => renderToStaticMarkup(<MemoryRouter initialEntries={[url]}><Routes><Route path="/hr/ranking-cycles/:cycleId/:trackKey/:stage" element={<RankingCycleContext cycle={value} track={value.tracks[0]} trackKey="faculty" onViewCriteria={() => {}} onOpenSettings={() => {}}/>}/></Routes></MemoryRouter>)

  it('shows the Faculty | Non-Teaching Faculty switch only when both groups exist', () => {
    expect(render(cycle())).toContain('aria-label="Personnel type"')
    expect(render(cycle({ tracks: [track('FACULTY')] }))).not.toContain('aria-label="Personnel type"')
  })

  it('shows the locked criteria reference and Period Settings without a Ranking Setup detour', () => {
    const html = render(cycle())
    for (const text of ['Criteria:', 'Faculty Ranking Scale v1.0', 'Locked', 'View Criteria', 'Period Settings', 'Annual Reviews', 'Submissions', 'Evaluation', 'Results']) expect(html).toContain(text)
    expect(html).not.toContain('Ranking Setup')
    expect(html).not.toContain('Acceptance Fixture')
  })

  it('marks completed and archived cycles as read-only', () => {
    expect(render(cycle({ is_read_only: true, lifecycle_status: { key: 'COMPLETED', label: 'Completed' } }))).toContain('This period is completed.')
    expect(render(cycle({ is_read_only: true, is_archived: true, lifecycle_status: { key: 'ARCHIVED', label: 'Archived' } }))).toContain('This period is archived.')
  })
})

describe('Backend contract reuse', () => {
  it('allows evaluation to overlap an open submission period across every validation layer', () => {
    const service = read('backend/app/Services/PersonnelEvaluationPeriodService.php')
    const appMigration = read('backend/app/Database/Migrations/2026-09-11-000002_CreatePersonnelEvaluationPeriods.php')
    const canonicalMigration = read('backend/app/Phase17Canonical/Database/Migrations/2026-09-11-000002_CreatePersonnelEvaluationPeriods.php')
    expect(service).toContain("$data['submission_open_at'] <= $data['evaluation_start_at']")
    expect(service).not.toContain("$data['submission_close_at'] <= $data['evaluation_start_at']")
    for (const source of [appMigration, canonicalMigration]) {
      expect(source).toContain('evaluation_start_at >= submission_open_at')
      expect(source).not.toContain('evaluation_start_at >= submission_close_at')
    }
  })

  it('creates tracks only through the authoritative period service', () => {
    const service = read('backend/app/Services/RankingCycleService.php')
    expect(service).toContain('$this->periods->create(')
    expect(service).toContain("$this->periods->transition($track['id'], 'archive'")
    expect(service).toContain('transBegin')
    expect(service).not.toMatch(/table\('personnel_evaluation_periods'\)->insert/)
  })

  it('exposes cycle-level lifecycle routes', () => {
    const routes = read('backend/app/Config/Routes.php')
    for (const route of ["'hr/ranking-cycles/(:segment)/tracks'", "'hr/ranking-cycles/(:segment)/schedule'", "'hr/ranking-cycles/(:segment)/archive'", "'hr/ranking-cycles/(:segment)/cancel'", "'hr/ranking-cycles/(:segment)/restore'"]) expect(routes).toContain(route)
  })

  it('keeps cancellation and permanent deletion as separate safeguards', () => {
    const service = read('backend/app/Services/RankingCycleService.php')
    const dialog = read('frontend/src/pages/hr-admin/ranking-cycles/ArchiveCycleDialog.jsx')
    expect(service).toContain("'ranking_cycle_cancelled'")
    expect(service).toContain('RANKING_CYCLE_DELETE_BLOCKED')
    expect(service).toContain("'CANCELLED'")
    expect(dialog).toContain('Type the period name to confirm')
    expect(dialog).toContain('Why is this period being cancelled?')
  })

  it('limits locked workspace rows to view actions', () => {
    const workspace = read('backend/app/Services/RankingCycleWorkspaceReadService.php')
    expect(workspace).toContain("'read_only' => $locked")
    expect(workspace).toContain("str_starts_with($action, 'view_')")
  })
})
