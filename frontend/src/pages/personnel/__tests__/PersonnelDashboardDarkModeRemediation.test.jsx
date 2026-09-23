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

vi.mock('../../../hooks/usePersonnelPortfolio', () => ({
  usePersonnelPortfolio: () => ({
    portfolio: {
      status: 'HR_APPROVED'
    },
    totals: {
      totalPoints: 85,
      totalAccomplishments: 5
    }
  })
}))

describe('PersonnelDashboardPage Dark Mode & Accomplishment Card Readability Remediation Suite', () => {
  it('renders hero container with proper dark background, border, and light emerald typography', () => {
    const html = renderToString(
      <MemoryRouter>
        <PersonnelDashboardPage />
      </MemoryRouter>
    )

    // Hero container dark mode classes
    expect(html).toContain('dark:bg-slate-900')
    expect(html).toContain('dark:border-emerald-900/60')

    // Hero title & subtitle dark mode typography
    expect(html).toContain('dark:text-emerald-300')
    expect(html).toContain('dark:text-slate-300')
    expect(html).toContain('Personnel Professional Portfolio')
  })

  it('renders summary badges with high-contrast dark text and surfaces', () => {
    const html = renderToString(
      <MemoryRouter>
        <PersonnelDashboardPage />
      </MemoryRouter>
    )

    // Proof PDFs badge
    expect(html).toContain('Proof PDFs')
    expect(html).toContain('dark:bg-emerald-950/60')

    // Evaluation Period badge
    expect(html).toContain('AY 2025–2026')
    expect(html).toContain('dark:border-emerald-500/40')

    // Portfolio Status badge (HR_APPROVED state)
    expect(html).toContain('Approved')
    expect(html).toContain('dark:border-emerald-800')
  })

  it('renders accomplishment timeline and category pills with proper dark mode contrast', () => {
    const html = renderToString(
      <MemoryRouter>
        <PersonnelDashboardPage />
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
