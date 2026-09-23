import { describe, expect, it } from 'vitest'
import { NAVIGATION_CATALOG, WORKSPACE_NAVIGATION } from '../navigationCatalog'
import { isNavigationItemActive } from '../personnelRoleNavigation'
import { CANONICAL_ROLES } from '../../utils/roleContext'

describe('global sidebar navigation metadata', () => {
  it('provides one workspace presentation for every supported context', () => {
    expect(Object.keys(WORKSPACE_NAVIGATION).sort()).toEqual(Object.values(CANONICAL_ROLES).sort())
    Object.values(WORKSPACE_NAVIGATION).forEach(workspace => {
      expect(workspace.label).toBeTruthy()
      expect(typeof workspace.icon).toBe('object')
    })
  })

  it('provides a Lucide component and stable identity for every navigation item', () => {
    expect(NAVIGATION_CATALOG.length).toBeGreaterThan(0)
    NAVIGATION_CATALOG.forEach(item => {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.path).toMatch(/^\//)
      expect(typeof item.icon).toBe('object')
    })
  })

  it('keeps parent navigation active for nested routes and tab aliases', () => {
    expect(isNavigationItemActive({ path: '/dean/faculty-ranking-reviews' }, '/dean/faculty-ranking-reviews/submission-1')).toBe(true)
    expect(isNavigationItemActive({ path: '/osad/dashboard?tab=academic-structure', tab: 'academic-structure' }, '/osad/dashboard', 'programs')).toBe(true)
    expect(isNavigationItemActive({ path: '/dean/college-personnel' }, '/dean/dashboard')).toBe(false)
  })

  it('keeps affected workspace navigation inside the shared personnel workspace route', () => {
    const affected = NAVIGATION_CATALOG.filter(item => ['personnel', 'program_coordinator', 'organization_moderator'].some(role => item.requiredActiveContexts?.includes(role)))
    affected.forEach(item => expect(item.path).toMatch(/^\/personnel\//))
    expect(affected.find(item => item.id === 'personnel-dashboard-overview')?.path).toBe('/personnel/dashboard?tab=overview')
    expect(affected.find(item => item.id === 'coordinator-verification-workspace')?.path).toBe('/personnel/dashboard?tab=workspace')
  })
})
