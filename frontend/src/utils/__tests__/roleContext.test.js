import { describe, it, expect } from 'vitest'
import {
  normalizeAccountType,
  normalizeRoleContext,
  normalizeAssignedRoles,
  getValidRolesForAccountType,
  isValidAccountRoleCombination,
  resolveDefaultActiveRole,
  isRoleAssigned,
  getSafeFallbackRole,
  CANONICAL_ROLES,
  CANONICAL_ACCOUNT_TYPES
} from '../roleContext'
import { getAuthorizedNavigationForSession } from '../../config/personnelRoleNavigation'

describe('roleContext utility & navigation registry', () => {
  describe('normalizeAccountType', () => {
    it('normalizes account types correctly', () => {
      expect(normalizeAccountType('student')).toBe(CANONICAL_ACCOUNT_TYPES.STUDENT)
      expect(normalizeAccountType('personnel')).toBe(CANONICAL_ACCOUNT_TYPES.PERSONNEL)
      expect(normalizeAccountType('faculty')).toBe(CANONICAL_ACCOUNT_TYPES.PERSONNEL)
      expect(normalizeAccountType('hr_admin')).toBe(CANONICAL_ACCOUNT_TYPES.HR_ADMIN)
      expect(normalizeAccountType('hr')).toBe(CANONICAL_ACCOUNT_TYPES.HR_ADMIN)
      expect(normalizeAccountType('osad_admin')).toBe(CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN)
      expect(normalizeAccountType('osad')).toBe(CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN)
    })
  })

  describe('normalizeRoleContext', () => {
    it('normalizes legacy aliases to canonical identifiers', () => {
      expect(normalizeRoleContext('faculty')).toBe(CANONICAL_ROLES.PERSONNEL)
      expect(normalizeRoleContext('dep_sec')).toBe(CANONICAL_ROLES.DEPARTMENT_SECRETARY)
      expect(normalizeRoleContext('org_moderator')).toBe(CANONICAL_ROLES.ORGANIZATION_MODERATOR)
      expect(normalizeRoleContext('coordinator')).toBe(CANONICAL_ROLES.PROGRAM_COORDINATOR)
      expect(normalizeRoleContext('hr_staff')).toBe(CANONICAL_ROLES.HR_STAFF)
      expect(normalizeRoleContext('osad_staff')).toBe(CANONICAL_ROLES.OSAD_STAFF)
      expect(normalizeRoleContext('student')).toBe(CANONICAL_ROLES.STUDENT)
    })
  })

  describe('Account/Role Matrix Validation', () => {
    it('returns valid roles for each account type', () => {
      expect(getValidRolesForAccountType('student')).toEqual(['student'])
      expect(getValidRolesForAccountType('personnel')).toEqual([
        'personnel', 'department_secretary', 'program_coordinator', 'organization_moderator'
      ])
      expect(getValidRolesForAccountType('hr_admin')).toEqual(['hr_staff'])
      expect(getValidRolesForAccountType('osad_admin')).toEqual(['osad_staff'])
    })

    it('validates account/role combinations accurately', () => {
      // Valid combinations
      expect(isValidAccountRoleCombination('hr_admin', 'hr_staff')).toBe(true)
      expect(isValidAccountRoleCombination('osad_admin', 'osad_staff')).toBe(true)
      expect(isValidAccountRoleCombination('student', 'student')).toBe(true)
      expect(isValidAccountRoleCombination('personnel', 'personnel')).toBe(true)
      expect(isValidAccountRoleCombination('personnel', 'program_coordinator')).toBe(true)

      // Invalid combinations (Defense against privilege crossover)
      expect(isValidAccountRoleCombination('hr_admin', 'personnel')).toBe(false)
      expect(isValidAccountRoleCombination('hr_admin', 'osad_staff')).toBe(false)
      expect(isValidAccountRoleCombination('osad_admin', 'personnel')).toBe(false)
      expect(isValidAccountRoleCombination('osad_admin', 'hr_staff')).toBe(false)
      expect(isValidAccountRoleCombination('student', 'hr_staff')).toBe(false)
      expect(isValidAccountRoleCombination('personnel', 'hr_staff')).toBe(false)
      expect(isValidAccountRoleCombination('personnel', 'osad_staff')).toBe(false)
    })
  })

  describe('resolveDefaultActiveRole', () => {
    it('resolves hr_staff for hr_admin when hr_staff is assigned', () => {
      expect(resolveDefaultActiveRole('hr_admin', ['hr_staff'])).toBe('hr_staff')
    })

    it('does NOT silently grant hr_staff when assigned_roles is empty', () => {
      expect(resolveDefaultActiveRole('hr_admin', [])).toBe(null)
    })

    it('does NOT grant hr_staff when assigned role is invalid for hr_admin', () => {
      expect(resolveDefaultActiveRole('hr_admin', ['osad_staff'])).toBe(null)
      expect(resolveDefaultActiveRole('hr_admin', ['personnel'])).toBe(null)
    })

    it('resolves osad_staff for osad_admin when osad_staff is assigned', () => {
      expect(resolveDefaultActiveRole('osad_admin', ['osad_staff'])).toBe('osad_staff')
    })

    it('does NOT grant osad_staff when assigned_roles is empty or invalid', () => {
      expect(resolveDefaultActiveRole('osad_admin', [])).toBe(null)
      expect(resolveDefaultActiveRole('osad_admin', ['hr_staff'])).toBe(null)
    })

    it('resolves student for student account type', () => {
      expect(resolveDefaultActiveRole('student', ['student'])).toBe('student')
      expect(resolveDefaultActiveRole('student', [])).toBe(null)
    })

    it('resolves personnel for personnel account type', () => {
      expect(resolveDefaultActiveRole('personnel', ['personnel', 'program_coordinator'])).toBe('personnel')
      expect(resolveDefaultActiveRole('personnel', ['program_coordinator'])).toBe('program_coordinator')
      expect(resolveDefaultActiveRole('personnel', ['hr_staff'])).toBe(null)
    })
  })

  describe('getAuthorizedNavigationForSession', () => {
    it('returns strictly 5 HR items for HR Admin session (resolving empty sidebar bug)', () => {
      const hrSession = {
        account_type: 'hr_admin',
        active_role_context: 'hr_staff',
        assigned_roles: ['hr_staff']
      }
      const nav = getAuthorizedNavigationForSession(hrSession)
      const labels = nav.map(n => n.label)

      expect(labels).toEqual([
        'HR Dashboard',
        'Personnel Directory',
        'Evaluation Submissions',
        'HR Audit Trail',
        'Rank Assignment Logs'
      ])
      expect(labels).not.toContain('Personnel Dashboard')
      expect(labels).not.toContain('Dashboard Overview')
      expect(labels).not.toContain('OSAD Dashboard')
    })

    it('returns strictly OSAD items for OSAD Admin session', () => {
      const osadSession = {
        account_type: 'osad_admin',
        active_role_context: 'osad_staff',
        assigned_roles: ['osad_staff']
      }
      const nav = getAuthorizedNavigationForSession(osadSession)
      const labels = nav.map(n => n.label)

      expect(labels).toContain('OSAD Dashboard')
      expect(labels).toContain('Academic Structure')
      expect(labels).toContain('Certificate Templates')
      expect(labels).not.toContain('HR Dashboard')
      expect(labels).not.toContain('Edit Portfolio')
    })

    it('returns empty array when HR Admin has missing roles', () => {
      const brokenSession = {
        account_type: 'hr_admin',
        active_role_context: 'hr_staff',
        assigned_roles: [] // missing!
      }
      const nav = getAuthorizedNavigationForSession(brokenSession)
      expect(nav).toEqual([])
    })

    it('returns empty array when HR Admin has wrong role', () => {
      const wrongRoleSession = {
        account_type: 'hr_admin',
        active_role_context: 'osad_staff',
        assigned_roles: ['osad_staff']
      }
      const nav = getAuthorizedNavigationForSession(wrongRoleSession)
      expect(nav).toEqual([])
    })

    it('returns ONLY personal links for personnel context', () => {
      const personnelSession = {
        account_type: 'personnel',
        active_role_context: 'personnel',
        assigned_roles: ['personnel']
      }
      const nav = getAuthorizedNavigationForSession(personnelSession)
      const labels = nav.map(n => n.label)
      expect(labels).toEqual(['Dashboard Overview', 'Edit Portfolio', 'Portfolio', 'Account'])
      expect(labels).not.toContain('Verification Workspace')
      expect(labels).not.toContain('HR Dashboard')
    })

    it('returns ONLY operational links for program_coordinator', () => {
      const coordinatorSession = {
        account_type: 'personnel',
        active_role_context: 'program_coordinator',
        assigned_roles: ['personnel', 'program_coordinator']
      }
      const nav = getAuthorizedNavigationForSession(coordinatorSession)
      const labels = nav.map(n => n.label)
      expect(labels).toContain('Verification Workspace')
      expect(labels).toContain('Student Roster & Dossiers')
      expect(labels).not.toContain('Edit Portfolio')
    })
  })
})
