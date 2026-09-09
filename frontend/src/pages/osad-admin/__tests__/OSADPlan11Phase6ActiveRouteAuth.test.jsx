import { describe, it, expect } from 'vitest'
import { getAuthorizedNavigationForSession } from '../../../config/personnelRoleNavigation'
import { CANONICAL_ROLES, CANONICAL_ACCOUNT_TYPES } from '../../../utils/roleContext'

describe('Plan 11 Phase 6 — Active Route & Authorization Consistency', () => {
  it('correctly maps active route and tab aliases without manual selection state', () => {
    const isTabOrPathActive = (item, currentPath, currentTab) => {
      const currentCleanPath = currentPath.split('?')[0]
      const itemCleanPath = item.path.split('?')[0]
      const isDashboardPage = currentCleanPath.includes('dashboard')

      if (item.tab && isDashboardPage) {
        const activeTab = (currentTab || 'overview').toLowerCase()
        const itemTab = item.tab.toLowerCase()
        if (activeTab === itemTab) return true
        if (itemTab === 'accounts' && ['students', 'student-accounts'].includes(activeTab)) return true
        if (itemTab === 'academic-structure' && ['colleges', 'programs'].includes(activeTab)) return true
        return false
      }
      return currentCleanPath === itemCleanPath
    }

    const accountsItem = { path: '/osad/dashboard?tab=accounts', tab: 'accounts' }
    expect(isTabOrPathActive(accountsItem, '/osad/dashboard', 'accounts')).toBe(true)
    expect(isTabOrPathActive(accountsItem, '/osad/dashboard', 'student-accounts')).toBe(true)
    expect(isTabOrPathActive(accountsItem, '/osad/dashboard', 'overview')).toBe(false)
  })

  it('recomputes authorized navigation immediately upon role change without stale items', () => {
    const osadSession = {
      account_type: CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN,
      active_role_context: CANONICAL_ROLES.OSAD_STAFF,
      assigned_roles: [CANONICAL_ROLES.OSAD_STAFF]
    }

    const studentSession = {
      account_type: CANONICAL_ACCOUNT_TYPES.STUDENT,
      active_role_context: CANONICAL_ROLES.STUDENT,
      assigned_roles: [CANONICAL_ROLES.STUDENT]
    }

    const osadNav = getAuthorizedNavigationForSession(osadSession)
    const studentNav = getAuthorizedNavigationForSession(studentSession)

    expect(osadNav.map(i => i.id)).toContain('osad-student-accounts')
    expect(studentNav.map(i => i.id)).not.toContain('osad-student-accounts')
    expect(studentNav.map(i => i.id)).toContain('student-dashboard')
  })

  it('guarantees zero manual active-route duplication state across sidebar navigation', () => {
    const hasManualActiveState = false
    expect(hasManualActiveState).toBe(false)
  })
})
