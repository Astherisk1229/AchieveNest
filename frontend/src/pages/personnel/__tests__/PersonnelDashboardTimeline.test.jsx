import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import PersonnelDashboardPage from '../PersonnelDashboardPage'
import PersonnelDashboardController from '../../../controllers/PersonnelDashboardController'

// The signed-in user is swapped per test; modules read it through these mocks.
const session = vi.hoisted(() => ({ user: null }))

vi.mock('../../../services/authService', () => ({ getCurrentUser: () => session.user }))
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: session.user, activeRoleContext: session.user?.active_role_context || 'personnel' }) }))
vi.mock('../../../hooks/usePersonnelPortfolio', () => ({ usePersonnelPortfolio: () => ({ portfolio: null, totals: {} }) }))
vi.mock('../modals/FacultyAcademicSubmissionModal', () => ({ default: () => <div data-testid="faculty-submission-modal" /> }))
vi.mock('../modals/PersonnelSubmissionModal', () => ({ default: () => <div data-testid="ntf-submission-modal" /> }))
vi.mock('../program-coordinator/CoordinatorDashboardPage', () => ({ default: () => <div data-testid="coordinator-dashboard" /> }))
vi.mock('../organization-moderator/OrganizationModeratorDashboardPage', () => ({ default: () => <div data-testid="moderator-dashboard" /> }))
vi.mock('../../hr-admin/HREvaluationSubmissionsPage', () => ({ HREvaluationSubmissionsPage: () => <div data-testid="dean-evaluation-workspace" /> }))

const faculty = { id: 'p-fac', full_name: 'Demo Faculty', active_role_context: 'personnel', personnel_affiliation: { personnel_group: 'faculty', organizational_side: 'academic' } }
const nonTeaching = { id: 'p-ntf', full_name: 'Demo Staff', active_role_context: 'personnel', personnel_affiliation: { personnel_group: 'non_teaching_faculty', organizational_side: 'non_academic' } }

const entry = (id, category_code, extra = {}) => PersonnelDashboardController.toTimelineEntry({
  id, title: `Record ${id}`, date: '2026-01-15', status: 'Pending Review', category: category_code || 'Unclassified',
  category_code, category_metadata: {}, issuer: 'NDMU', evidence_id: `ev-${id}`, ...extra
})

const render = (user, accomplishments = [], path = '/personnel/dashboard') => {
  session.user = user
  return renderToString(<MemoryRouter initialEntries={[path]}><PersonnelDashboardPage initialAccomplishments={accomplishments} /></MemoryRouter>)
}

const filterButtons = (html) => [...html.matchAll(/<button[^>]*aria-pressed="(true|false)"[^>]*>([^<]*)<\/button>/g)].map((m) => [m[2], m[1]])

beforeEach(() => { session.user = null })

describe('Personnel Dashboard accomplishments timeline', () => {
  it('gives Faculty the Faculty filters and the Faculty submission form', () => {
    const html = render(faculty, [entry('a', 'A.3')])
    expect(filterButtons(html).map(([label]) => label)).toEqual(['All', 'Education &amp; Memberships', 'Seminars &amp; Trainings', 'Speaking &amp; Publications', 'Research &amp; Awards', 'Teaching &amp; Creative Work', 'Service &amp; Community'])
    expect(html).toContain('data-testid="faculty-submission-modal"')
    expect(html).not.toContain('data-testid="ntf-submission-modal"')
    expect(html).not.toContain('School Activities')
  })

  it('gives Non-Teaching Faculty the NTF filters and the NTF submission form', () => {
    const html = render(nonTeaching, [entry('b', 'B.1.a')])
    expect(filterButtons(html).map(([label]) => label)).toEqual(['All', 'School Activities', 'Community Activities', 'Speaking &amp; Judging', 'Awards'])
    expect(html).toContain('data-testid="ntf-submission-modal"')
    expect(html).not.toContain('data-testid="faculty-submission-modal"')
    expect(html).not.toMatch(/Seminars &amp; Trainings|Teaching &amp; Creative Work|Education &amp; Memberships/)
  })

  it('exposes an accessible, keyboard-operable filter group with All selected', () => {
    const html = render(faculty, [entry('a', 'A.3')])
    expect(html).toContain('role="group" aria-label="Filter accomplishments by type"')
    expect(html).toContain('>Show:</span>')
    const buttons = filterButtons(html)
    expect(buttons[0]).toEqual(['All', 'true'])
    expect(buttons.slice(1).every(([, pressed]) => pressed === 'false')).toBe(true)
    // Native buttons, never removed from the tab order.
    expect(html).not.toMatch(/aria-pressed="[^"]*"[^>]*tabindex="-1"/)
  })

  it('offers a labeled select on small screens', () => {
    const html = render(nonTeaching, [entry('b', 'B.1.a')])
    expect(html).toMatch(/<label for="accomplishment-filter-select"[^>]*>Show accomplishments<\/label>/)
    expect(html).toContain('<option value="all" selected="">All accomplishments</option>')
  })

  it('uses plain-language copy and readable category badges', () => {
    const html = render(nonTeaching, [entry('b', 'B.1.a'), entry('c', 'B.5')])
    expect(html).toContain('Add accomplishment')
    expect(html).toContain('View proof')
    expect(html).toContain('Club moderator or officer')
    expect(html).toContain('Official category: B.1.a — Moderator / Officer of Clubs')
    expect(html).toContain('2 accomplishments')
    for (const old of ['Log Accomplishment', 'Showing ', 'Filtered:', 'Unclassified', 'Degrees &amp; Orgs']) expect(html).not.toContain(old)
  })

  it('lists a draft without a category under Needs attention with a text warning', () => {
    const html = render(faculty, [entry('d', null, { status: 'draft', category: '' }), entry('a', 'A.3')])
    expect(html).toContain('Needs attention')
    expect(html).toContain('Needs category')
    expect(html).toContain('Choose a category before submitting.')
    expect(html).toContain('Finish details')
    expect(html).toContain('1 accomplishment<')
  })

  it('flags a submitted record without a category for review instead of guessing', () => {
    const html = render(faculty, [entry('u', null, { title: 'Best Paper Award' })])
    expect(html).toContain('Category needs review')
    expect(html).toContain('This record does not have a recognized category.')
    expect(html).not.toContain('Award or recognition')
  })

  it('shows the first-use empty state', () => {
    const html = render(faculty, [])
    expect(html).toContain('No accomplishments yet')
    expect(html).toContain('Add your first accomplishment and attach supporting proof.')
    expect(filterButtons(html)).toEqual([])
  })

  it('keeps the special dashboard contexts routed as before', () => {
    expect(render({ ...faculty, active_role_context: 'program_coordinator' })).toContain('data-testid="coordinator-dashboard"')
    expect(render({ ...faculty, active_role_context: 'organization_moderator' })).toContain('data-testid="moderator-dashboard"')
    expect(render({ ...faculty, active_role_context: 'dean' }, [], '/personnel/dashboard?tab=workspace')).toContain('data-testid="dean-evaluation-workspace"')
    // The faculty view of a coordinator still shows the personal timeline.
    expect(render({ ...faculty, active_role_context: 'program_coordinator' }, [entry('a', 'A.3')], '/personnel/dashboard?tab=faculty_view')).toContain('Accomplishments Timeline')
  })
})
