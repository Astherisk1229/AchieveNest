import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import PersonnelDashboardPage from '../PersonnelDashboardPage'
import PersonnelDashboardController from '../../../controllers/PersonnelDashboardController'
import AchievementModel from '../../../models/AchievementModel'

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

const filterButtons = (html) => [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
  .filter((match) => /aria-pressed="(true|false)"/.test(match[1]))
  .map((match) => [match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(), match[1].match(/aria-pressed="(true|false)"/)[1]])

beforeEach(() => { session.user = null })

describe('Personnel Dashboard accomplishments timeline', () => {
  it('gives Faculty the Faculty filters and the Faculty submission form', () => {
    const html = render(faculty, [entry('a', 'A.3')])
    expect(filterButtons(html).map(([label]) => label)).toEqual(['All (1)', 'Education & Memberships', 'Seminars & Trainings', 'Speaking & Publications', 'Research & Awards', 'Teaching & Creative Work', 'Service & Community'])
    expect(html).toContain('data-testid="faculty-submission-modal"')
    expect(html).not.toContain('data-testid="ntf-submission-modal"')
    expect(html).not.toContain('School Activities')
  })

  it('gives Non-Teaching Faculty the NTF filters and the NTF submission form', () => {
    const html = render(nonTeaching, [entry('b', 'B.1.a')])
    expect(filterButtons(html).map(([label]) => label)).toEqual(['All (1)', 'School Activities', 'Community Activities', 'Speaking & Judging', 'Awards'])
    expect(html).toContain('data-testid="ntf-submission-modal"')
    expect(html).not.toContain('data-testid="faculty-submission-modal"')
    expect(html).not.toMatch(/Seminars &amp; Trainings|Teaching &amp; Creative Work|Education &amp; Memberships/)
  })

  it('exposes an accessible, keyboard-operable filter group with All selected', () => {
    const html = render(faculty, [entry('a', 'A.3')])
    expect(html).toContain('role="group" aria-label="Filter accomplishments by type"')
    expect(html).toContain('>Show:</span>')
    const buttons = filterButtons(html)
    expect(buttons[0]).toEqual(['All (1)', 'true'])
    expect(buttons.slice(1).every(([, pressed]) => pressed === 'false')).toBe(true)
    // Native buttons, never removed from the tab order.
    expect(html).not.toMatch(/aria-pressed="[^"]*"[^>]*tabindex="-1"/)
  })

  it('offers a labeled select on small screens', () => {
    const html = render(nonTeaching, [entry('b', 'B.1.a')])
    expect(html).toMatch(/<label for="accomplishment-filter-select"[^>]*>Show accomplishments<\/label>/)
    expect(html).toContain('<option value="all" selected="">All accomplishments</option>')
  })

  it('presents the permanent repository with plain-language categories and actions', () => {
    const html = render(nonTeaching, [entry('b', 'B.1.a'), entry('c', 'B.5')])
    expect(html).toContain('My Accomplishments')
    expect(html).toContain('<p>Your permanent repository of professional accomplishments.</p><p>These records remain here even if they have been used in previous evaluations.</p>')
    expect(html).toContain('Add Accomplishment')
    expect(html).toContain('Search accomplishments...')
    expect(html).toContain('Sort accomplishments')
    expect(html).toContain('aria-label="Actions for Record b"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('>View proof</button>')
    expect(html).not.toContain('>Delete</button>')
    expect(html).toContain('Club moderator or officer')
    expect(html).toContain('Official category: B.1.a — Moderator / Officer of Clubs')
    expect(html).not.toContain('2 accomplishments')
    expect(html).toContain('Available for future evaluation')
    expect(html).toContain('Edit Profile')
    expect(html).not.toContain('Manage accomplishments')
    for (const old of ['Log Accomplishment', 'Showing ', 'Filtered:', 'Unclassified', 'Degrees &amp; Orgs']) expect(html).not.toContain(old)
  })

  it('lists a draft without a category under Needs attention with a text warning', () => {
    const html = render(faculty, [entry('d', null, { status: 'draft', category: '' }), entry('a', 'A.3')])
    expect(html).toContain('Needs attention')
    expect(html).toContain('Needs category')
    expect(html).toContain('Choose a category before submitting.')
    expect(html).toContain('Finish details')
    expect(html).not.toContain('2 accomplishments')
    expect(filterButtons(html).map(([label]) => label)).toContain('All (2)')
  })

  it('shows permanent Education records as reusable in future evaluations', () => {
    const html = render(faculty, [entry('degree', 'A.1', { reuse: { is_consumed: false, status_label: 'Education is reusable' } })])
    expect(html).toContain('Reusable in evaluations')
  })

  it('shows previously finalized use without hiding the repository record', () => {
    const html = render(faculty, [entry('used', 'B.2', { reuse: { is_consumed: true, last_used_academic_year: 'AY 2024-2026', status_label: 'Used in finalized evaluation' } })])
    expect(html).toContain('Used in 2024-2026 Evaluation')
    expect(html).toContain('Record used')
  })

  it('keeps backend reuse metadata and the edit gate when hydrating repository records', () => {
    const model = new AchievementModel({
      id: 'repo-1',
      title: 'Published Research',
      category: 'B.2 Publication',
      status: 'draft',
      reuse: { is_consumed: true, last_used_academic_year: 'AY 2024-2026', status_label: 'Used in finalized evaluation' }
    })
    const repositoryEntry = PersonnelDashboardController.toTimelineEntry(model)

    expect(repositoryEntry.reuse.is_consumed).toBe(true)
    expect(repositoryEntry.is_editable).toBe(true)
    expect(repositoryEntry.is_deletable).toBe(true)
    expect(repositoryEntry.raw_status).toBe('draft')
  })

  it('does not offer repository deletion for verified accomplishments', () => {
    const verified = new AchievementModel({ id: 'verified', title: 'Verified record', status: 'verified' })
    expect(PersonnelDashboardController.toTimelineEntry(verified).is_deletable).toBe(false)
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
    expect(render({ ...faculty, active_role_context: 'program_coordinator' }, [entry('a', 'A.3')], '/personnel/dashboard?tab=faculty_view')).toContain('My Accomplishments')
  })
})
