import { describe, it, expect } from 'vitest'
import {
  normalizeRoleContext,
  normalizeAssignedRoles,
  isRoleAssigned,
  getSafeFallbackRole,
  CANONICAL_ROLES
} from '../roleContext'
import { getPersonnelNavigation } from '../../config/personnelRoleNavigation'

describe('roleContext utility & navigation registry', () => {
  describe('normalizeRoleContext', () => {
    it('normalizes legacy aliases to canonical identifiers', () => {
      expect(normalizeRoleContext('faculty')).toBe(CANONICAL_ROLES.PERSONNEL)
      expect(normalizeRoleContext('dep_sec')).toBe(CANONICAL_ROLES.DEPARTMENT_SECRETARY)
      expect(normalizeRoleContext('org_moderator')).toBe(CANONICAL_ROLES.ORGANIZATION_MODERATOR)
      expect(normalizeRoleContext('coordinator')).toBe(CANONICAL_ROLES.PROGRAM_COORDINATOR)
    })
  })

  describe('normalizeAssignedRoles', () => {
    it('does not grant specialized roles on missing data', () => {
      const roles = normalizeAssignedRoles(undefined, 'personnel')
      expect(roles).toEqual(['personnel'])
      expect(roles).not.toContain('program_coordinator')
      expect(roles).not.toContain('organization_moderator')
    })

    it('deduplicates and normalizes role arrays correctly', () => {
      const roles = normalizeAssignedRoles(['coordinator', 'dep_sec', 'personnel'], 'personnel')
      expect(roles).toContain('personnel')
      expect(roles).toContain('program_coordinator')
      expect(roles).toContain('department_secretary')
      expect(roles.length).toBe(3)
    })
  })

  describe('isRoleAssigned & fallback', () => {
    it('verifies assigned roles correctly', () => {
      const user = { user_type: 'personnel', assigned_roles: ['program_coordinator'] }
      expect(isRoleAssigned(user, 'program_coordinator')).toBe(true)
      expect(isRoleAssigned(user, 'organization_moderator')).toBe(false)
    })

    it('derives safe fallback role from user assignments', () => {
      const user = { user_type: 'personnel', assigned_roles: ['program_coordinator'] }
      expect(getSafeFallbackRole(user)).toBe('personnel')
    })
  })

  describe('getPersonnelNavigation', () => {
    it('returns ONLY personal links for personnel context', () => {
      const nav = getPersonnelNavigation('personnel')
      const labels = nav.map(n => n.label)
      expect(labels).toEqual(['Dashboard Overview', 'Edit Portfolio', 'Portfolio', 'Account'])
      expect(labels).not.toContain('Verification Workspace')
      expect(labels).not.toContain('Events & Activities')
    })

    it('returns ONLY operational links for program_coordinator (NO personal portfolio link)', () => {
      const nav = getPersonnelNavigation('program_coordinator')
      const labels = nav.map(n => n.label)
      expect(labels).toContain('Verification Workspace')
      expect(labels).toContain('Student Roster & Dossiers')
      expect(labels).not.toContain('My Portfolio Dossier')
    })

    it('returns Department Secretary operational links correctly', () => {
      const nav = getPersonnelNavigation('department_secretary')
      const labels = nav.map(n => n.label)
      expect(labels).toContain('Review & Endorsement')
      expect(labels).toContain('Department Faculty Roster')
      expect(labels).not.toContain('My Portfolio Dossier')
    })
  })
})
