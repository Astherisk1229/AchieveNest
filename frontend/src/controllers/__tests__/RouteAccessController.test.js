import { describe, it, expect } from 'vitest'
import RouteAccessController from '../RouteAccessController'

describe('RouteAccessController — Admin Portal Isolation & Route Access', () => {
  describe('resolveRedirect', () => {
    it('resolves string account types correctly', () => {
      expect(RouteAccessController.resolveRedirect('student')).toBe('/student/dashboard')
      expect(RouteAccessController.resolveRedirect('personnel')).toBe('/personnel/dashboard')
      expect(RouteAccessController.resolveRedirect('hr_admin')).toBe('/hr/dashboard')
      expect(RouteAccessController.resolveRedirect('osad_admin')).toBe('/osad/dashboard')
    })

    it('resolves user session objects correctly', () => {
      expect(RouteAccessController.resolveRedirect({ account_type: 'student' })).toBe('/student/dashboard')
      expect(RouteAccessController.resolveRedirect({ account_type: 'personnel' })).toBe('/personnel/dashboard')
      expect(RouteAccessController.resolveRedirect({ account_type: 'hr_admin' })).toBe('/hr/dashboard')
      expect(RouteAccessController.resolveRedirect({ account_type: 'osad_admin' })).toBe('/osad/dashboard')
    })

    it('defaults unknown account types to student dashboard', () => {
      expect(RouteAccessController.resolveRedirect('unknown_type')).toBe('/student/dashboard')
      expect(RouteAccessController.resolveRedirect(null)).toBe('/student/dashboard')
    })
  })

  describe('Portal Isolation & Authorization Rules', () => {
    const hrAdmin = {
      account_type: 'hr_admin',
      roles: ['hr_staff'],
    }

    const osadAdmin = {
      account_type: 'osad_admin',
      roles: ['osad_staff'],
    }

    const standardPersonnel = {
      account_type: 'personnel',
      roles: ['personnel'],
    }

    const personnelWithSpecializedRole = {
      account_type: 'personnel',
      roles: ['personnel', 'hr_staff', 'department_secretary'],
    }

    const student = {
      account_type: 'student',
      roles: ['student'],
    }

    it('allows HR Admin exclusively in HR portal and denies in other portals', () => {
      // HR portal (allowedAccountTypes: ['hr_admin'], requiredRoles: ['hr_staff'])
      expect(RouteAccessController.isAllowedAccess(hrAdmin, ['hr_admin'], ['hr_staff'])).toBe(true)

      // Personnel portal (allowedAccountTypes: ['personnel'], requiredRoles: ['personnel'])
      expect(RouteAccessController.isAllowedAccess(hrAdmin, ['personnel'], ['personnel'])).toBe(false)

      // OSAD portal (allowedAccountTypes: ['osad_admin'], requiredRoles: ['osad_staff'])
      expect(RouteAccessController.isAllowedAccess(hrAdmin, ['osad_admin'], ['osad_staff'])).toBe(false)

      // Student portal (allowedAccountTypes: ['student'], requiredRoles: ['student'])
      expect(RouteAccessController.isAllowedAccess(hrAdmin, ['student'], ['student'])).toBe(false)
    })

    it('allows OSAD Admin exclusively in OSAD portal and denies in other portals', () => {
      // OSAD portal
      expect(RouteAccessController.isAllowedAccess(osadAdmin, ['osad_admin'], ['osad_staff'])).toBe(true)

      // Personnel portal
      expect(RouteAccessController.isAllowedAccess(osadAdmin, ['personnel'], ['personnel'])).toBe(false)

      // HR portal
      expect(RouteAccessController.isAllowedAccess(osadAdmin, ['hr_admin'], ['hr_staff'])).toBe(false)

      // Student portal
      expect(RouteAccessController.isAllowedAccess(osadAdmin, ['student'], ['student'])).toBe(false)
    })

    it('allows Personnel in Personnel portal and blocks from HR/OSAD portals', () => {
      // Personnel portal
      expect(RouteAccessController.isAllowedAccess(standardPersonnel, ['personnel'], ['personnel'])).toBe(true)

      // HR portal
      expect(RouteAccessController.isAllowedAccess(standardPersonnel, ['hr_admin'], ['hr_staff'])).toBe(false)

      // OSAD portal
      expect(RouteAccessController.isAllowedAccess(standardPersonnel, ['osad_admin'], ['osad_staff'])).toBe(false)
    })

    it('denies Personnel with specialized roles from entering HR or OSAD admin portals', () => {
      // Even if a personnel account has hr_staff role string, account_type check blocks them
      expect(RouteAccessController.isAllowedAccess(personnelWithSpecializedRole, ['hr_admin'], ['hr_staff'])).toBe(false)
      expect(RouteAccessController.isAllowedAccess(personnelWithSpecializedRole, ['osad_admin'], ['osad_staff'])).toBe(false)
    })

    it('allows Student in Student portal and blocks from Personnel, HR, OSAD portals', () => {
      expect(RouteAccessController.isAllowedAccess(student, ['student'], ['student'])).toBe(true)
      expect(RouteAccessController.isAllowedAccess(student, ['personnel'], ['personnel'])).toBe(false)
      expect(RouteAccessController.isAllowedAccess(student, ['hr_admin'], ['hr_staff'])).toBe(false)
      expect(RouteAccessController.isAllowedAccess(student, ['osad_admin'], ['osad_staff'])).toBe(false)
    })

    it('handles unauthenticated or empty user objects safely', () => {
      expect(RouteAccessController.isAllowedAccess(null, ['hr_admin'])).toBe(false)
      expect(RouteAccessController.isAllowedAccess(undefined, ['osad_admin'])).toBe(false)
    })
  })
})
