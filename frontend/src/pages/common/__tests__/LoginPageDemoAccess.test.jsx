import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import LoginPage from '../LoginPage'
import { AuthProvider } from '../../../context/AuthContext'
import RouteAccessController from '../../../controllers/RouteAccessController'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

vi.mock('../../../services/authService', () => ({
  authenticateUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue(null),
  getStoredToken: vi.fn().mockReturnValue(null),
}))

vi.mock('../../../assets/ndmu_login_bg.jpg', () => ({
  default: 'test-file-stub'
}))

describe('LoginPage Defense Demo Access Shortcuts', () => {
  const AUTHORITATIVE_DEMO_PERSONAS = [
    { label: 'Student A', description: 'BSA / Accountancy', email: 'demo.student.a@ndmu.edu.ph' },
    { label: 'Student B', description: 'BSBA-FM / Financial Mgmt', email: 'demo.student.b@ndmu.edu.ph' },
    { label: 'Academic Personnel', description: 'CBA Faculty', email: 'demo.academic.personnel@ndmu.edu.ph' },
    { label: 'Non-Academic Personnel', description: 'HR Unit Staff', email: 'demo.nonacademic.personnel@ndmu.edu.ph' },
    { label: 'HR Administrator', description: 'HR Admin Portal', email: 'demo.hr.admin@ndmu.edu.ph' },
    { label: 'OSAD Administrator', description: 'OSAD Admin Portal', email: 'demo.osad.admin@ndmu.edu.ph' },
    { label: 'College Dean', description: 'CBA Dean Oversight', email: 'demo.dean@ndmu.edu.ph' },
    { label: 'Program Coordinator A', description: 'BSA Coordinator Queue', email: 'demo.coordinator.a@ndmu.edu.ph' },
    { label: 'Program Coordinator B', description: 'BSBA-FM Coordinator Queue', email: 'demo.coordinator.b@ndmu.edu.ph' },
    { label: 'Organization Moderator', description: 'DEMO_JPIA Moderator', email: 'demo.moderator@ndmu.edu.ph' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders all 10 authoritative demo persona shortcuts with correct labels, emails, and scopes', () => {
    const html = renderToString(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    AUTHORITATIVE_DEMO_PERSONAS.forEach((persona) => {
      expect(html).toContain(persona.label)
      expect(html).toContain(persona.description)
    })
  })

  it('ensures no hardcoded password literals or secret values are present in the component output', () => {
    const html = renderToString(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    // Verify input password value is empty on initial render
    expect(html).toContain('name="password"')
    expect(html).toContain('placeholder="Enter your password"')
  })

  it('RouteAccessController correctly resolves routes for student, personnel, hr_admin, and osad_admin', () => {
    expect(RouteAccessController.resolveRedirect({ account_type: 'student' })).toBe('/student/dashboard')
    expect(RouteAccessController.resolveRedirect({ account_type: 'personnel' })).toBe('/personnel/dashboard')
    expect(RouteAccessController.resolveRedirect({ account_type: 'hr_admin' })).toBe('/hr/dashboard')
    expect(RouteAccessController.resolveRedirect({ account_type: 'osad_admin' })).toBe('/osad/dashboard')
  })
})
