/**
 * permissionResolver.test.js
 * Security Unit Test Suite for AchieveNest Permission Resolver & Navigation Catalog.
 */

import { describe, it, expect } from 'vitest'
import { can, canAccessNavigationItem, getAuthorizedNavigation } from '../permissionResolver'
import { NAVIGATION_CATALOG } from '../../config/navigationCatalog'
import { CANONICAL_ROLES, CANONICAL_ACCOUNT_TYPES } from '../../utils/roleContext'

describe('permissionResolver', () => {

  describe('can() permission evaluator', () => {
    it('returns true when user has the required permission and a valid assigned active context', () => {
      const session = {
        account_type: 'personnel',
        role: 'personnel',
        active_role_context: 'personnel',
        assigned_roles: ['personnel']
      }
      expect(can(session, 'portfolio.personal.read')).toBe(true)
      expect(can(session, 'portfolio.personal.update')).toBe(true)
    })

    it('returns false when user active context is NOT in assigned_roles (storage tampering defense)', () => {
      const session = {
        account_type: 'personnel',
        role: 'personnel',
        active_role_context: 'hr_staff', // Tampered active context
        assigned_roles: ['personnel']     // HR is NOT assigned!
      }
      expect(can(session, 'hr.personnel.manage')).toBe(false)
    })

    it('returns false when active context is incompatible with account type', () => {
      const session = {
        account_type: 'personnel',
        active_role_context: 'hr_staff',
        assigned_roles: ['personnel', 'hr_staff'] // Personnel accounts cannot hold hr_staff
      }
      expect(can(session, 'hr.personnel.manage')).toBe(false)
    })

    it('returns false for unassigned permissions', () => {
      const session = {
        account_type: 'student',
        role: 'student',
        active_role_context: 'student',
        assigned_roles: ['student']
      }
      expect(can(session, 'hr.personnel.manage')).toBe(false)
      expect(can(session, 'portfolio.personal.update')).toBe(false)
    })
  })

  describe('getAuthorizedNavigation pre-render catalog filtering', () => {
    it('returns strictly 5 HR items for HR Admin context', () => {
      const session = {
        account_type: 'hr_admin',
        active_role_context: 'hr_staff',
        assigned_roles: ['hr_staff']
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      const labels = nav.map(n => n.label)

      expect(labels).toEqual([
        'HR Dashboard',
        'Personnel Directory',
        'Evaluation Submissions',
        'HR Audit Trail',
        'Rank Assignment Logs'
      ])
      expect(labels).not.toContain('Dashboard Overview')
      expect(labels).not.toContain('OSAD Dashboard')
      expect(labels).not.toContain('Dashboard')
    })

    it('returns strictly OSAD items for OSAD Admin context', () => {
      const session = {
        account_type: 'osad_admin',
        active_role_context: 'osad_staff',
        assigned_roles: ['osad_staff']
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      const labels = nav.map(n => n.label)

      expect(labels).toContain('OSAD Dashboard')
      expect(labels).toContain('Academic Structure')
      expect(labels).toContain('Student Accounts')
      expect(labels).not.toContain('HR Dashboard')
      expect(labels).not.toContain('Edit Portfolio')
    })

    it('returns strictly 4 Personnel items for personnel context', () => {
      const session = {
        account_type: 'personnel',
        role: 'personnel',
        active_role_context: 'personnel',
        assigned_roles: ['personnel']
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      const labels = nav.map(n => n.label)

      expect(labels).toEqual(['Dashboard Overview', 'Edit Portfolio', 'Portfolio', 'Account'])
      expect(labels).not.toContain('Verification Workspace')
      expect(labels).not.toContain('Events & Activities')
      expect(labels).not.toContain('Personnel Directory')
    })

    it('returns strictly 3 operational items for program_coordinator context without personal portfolio links', () => {
      const session = {
        account_type: 'personnel',
        role: 'personnel',
        active_role_context: 'program_coordinator',
        assigned_roles: ['personnel', 'program_coordinator']
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      const labels = nav.map(n => n.label)

      expect(labels).toEqual(['Dashboard Overview', 'Verification Workspace', 'Student Roster & Dossiers'])
      expect(labels).not.toContain('Edit Portfolio')
      expect(labels).not.toContain('Portfolio')
    })

    it('returns strictly 5 operational items for organization_moderator context including Digital Certificates', () => {
      const session = {
        account_type: 'personnel',
        role: 'personnel',
        active_role_context: 'organization_moderator',
        assigned_roles: ['personnel', 'organization_moderator']
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      const labels = nav.map(n => n.label)

      expect(labels).toEqual([
        'Dashboard Overview',
        'Events & Activities',
        'Attendance Management',
        'Digital Certificates',
        'Organization Profile'
      ])
      expect(labels).not.toContain('Edit Portfolio')
    })

    it('returns strictly 3 operational items for department_secretary context', () => {
      const session = {
        account_type: 'personnel',
        role: 'personnel',
        active_role_context: 'department_secretary',
        assigned_roles: ['personnel', 'department_secretary']
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      const labels = nav.map(n => n.label)

      expect(labels).toEqual([
        'Dashboard Overview',
        'Review & Endorsement',
        'Department Faculty Roster'
      ])
      expect(labels).not.toContain('Edit Portfolio')
    })

    it('returns strictly Student items for student context', () => {
      const session = {
        account_type: 'student',
        role: 'student',
        active_role_context: 'student',
        assigned_roles: ['student']
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      const labels = nav.map(n => n.label)

      expect(labels).toEqual(['Dashboard', 'Achievements', 'Portfolio', 'Account'])
    })

    it('returns empty navigation array for unknown or unassigned roles (SAFE FALLBACK)', () => {
      const session = {
        account_type: 'unknown_type',
        role: 'unknown_role_xyz',
        active_role_context: 'unknown_role_xyz',
        assigned_roles: []
      }
      const nav = getAuthorizedNavigation(session, NAVIGATION_CATALOG)
      expect(nav).toEqual([])
    })
  })

})
