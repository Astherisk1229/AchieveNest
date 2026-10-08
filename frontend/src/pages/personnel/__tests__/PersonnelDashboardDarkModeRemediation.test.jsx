import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import PersonnelDashboardPage from '../PersonnelDashboardPage'

vi.mock('../../../services/authService', () => ({
  getCurrentUser: () => ({
    id: 'usr-pers-001',
    employee_id: 'EMP-2021-0842',
    full_name: 'Dr. Maria L. Santos, Ph.D.',
    account_type: 'personnel',
    active_role_context: 'personnel',
    must_change_password: false,
    academic_placement: {
      college_name: 'College of Arts and Sciences',
      academic_program_name: 'Bachelor of Science in Computer Science'
    }
  })
}))

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'usr-pers-001',
      employee_id: 'EMP-2021-0842',
      full_name: 'Dr. Maria L. Santos, Ph.D.',
      account_type: 'personnel',
      active_role_context: 'personnel'
    },
    activeRoleContext: 'personnel'
  })
}))

describe('Personnel Profile and accomplishment repository', () => {
  it('renders hero container with proper dark background, border, and light emerald typography', () => {
    const html = renderToString(
      <MemoryRouter>
        <PersonnelDashboardPage />
      </MemoryRouter>
    )

    // Hero container dark mode classes
    expect(html).toContain('dark:bg-slate-900')
    expect(html).toContain('dark:border-slate-800')

    // Hero title & subtitle dark mode typography
    expect(html).toContain('dark:text-emerald-300')
    expect(html).toContain('dark:text-slate-400')
    expect(html).toContain('Dr. Maria L. Santos, Ph.D.')
    expect(html).toContain('My Accomplishments')
  })

  it('keeps repository actions on Profile and leaves evaluation status to Portfolio', () => {
    const html = renderToString(
      <MemoryRouter>
        <PersonnelDashboardPage />
      </MemoryRouter>
    )

    expect(html).toContain('Edit Profile')
    expect(html).toContain('My Accomplishments')
    expect(html).toContain('Add Accomplishment')
    expect(html).not.toContain('Manage accomplishments')
    expect(html).not.toContain('Evaluation Period')
    expect(html).not.toContain('Portfolio Status')
  })

  it('renders accomplishment timeline and category pills with proper dark mode contrast', () => {
    const fixture = [{
      id: 'acc-test-1',
      title: 'Test Accomplishment',
      date: '2026-01-15',
      status: 'Verified',
      statusLabel: 'HR Verified',
      category: 'Research & Publications',
      issuer: 'Test Issuer',
      description: 'Fixture record for rendering checks.',
      icon: 'Award',
      attached_file_name: 'proof.pdf',
      evidence_id: 'ev-test-1'
    }]
    const html = renderToString(
      <MemoryRouter>
        <PersonnelDashboardPage initialAccomplishments={fixture} />
      </MemoryRouter>
    )

    // Timeline card surface
    expect(html).toContain('dark:bg-slate-900')
    expect(html).toContain('dark:border-slate-800')

    // Category pills right-side dark treatment
    expect(html).toContain('dark:text-emerald-300')
    expect(html).toContain('dark:border-emerald-800')

    // Proof button styling
    expect(html).toContain('dark:bg-slate-800')
    expect(html).toContain('dark:text-slate-200')
  })

  it('guarantees zero occurrences of low-contrast dark text on dark surfaces', () => {
    const html = renderToString(
      <MemoryRouter>
        <PersonnelDashboardPage />
      </MemoryRouter>
    )

    // Check that problematic dark green text class is completely absent
    expect(html).not.toContain('dark:text-[#245F42]')
    expect(html).not.toContain('dark:text-[#17663B]')
    expect(html).not.toContain('dark:text-[#064e2b]')
  })
})
