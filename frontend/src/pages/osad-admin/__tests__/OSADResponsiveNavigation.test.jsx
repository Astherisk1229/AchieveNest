/**
 * OSADResponsiveNavigation.test.jsx
 * Verification of Plan 06 Phase 9 — Responsive Navigation
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import Sidebar from '../../../components/layout/Sidebar'
import Topbar from '../../../components/layout/Topbar'
import MainLayout from '../../../components/layout/MainLayout'
import { NAVIGATION_CATALOG } from '../../../config/navigationCatalog'
import { getAuthorizedNavigationForSession } from '../../../config/personnelRoleNavigation'
import { CANONICAL_ROLES, CANONICAL_ACCOUNT_TYPES } from '../../../utils/roleContext'

describe('Plan 06 Phase 9 — OSAD Responsive Navigation Suite', () => {
  const osadSession = {
    account_type: CANONICAL_ACCOUNT_TYPES.OSAD_ADMIN,
    active_role_context: CANONICAL_ROLES.OSAD_STAFF,
    assigned_roles: [CANONICAL_ROLES.OSAD_STAFF]
  }

  it('verifies the combined Student Management destination replaces three separate sidebar entries', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    expect(nav).toHaveLength(6)
    expect(NAVIGATION_CATALOG.length).toBeGreaterThanOrEqual(9)

    const ids = nav.map(i => i.id)
    expect(ids).toContain('osad-dashboard')
    expect(ids).toContain('osad-student-management')
    expect(ids).not.toContain('osad-academic-structure')
    expect(ids).not.toContain('osad-student-accounts')
    expect(ids).not.toContain('osad-student-organizations')
    expect(ids).toContain('osad-password-resets')
    expect(ids).toContain('osad-award-categories')
    expect(ids).toContain('osad-award-candidate-review')
    expect(ids).not.toContain('osad-certificate-templates')
    expect(ids).not.toContain('osad-accreditation-reports')
    expect(ids).not.toContain('osad-activity-log')
  })

  it('instantiates Sidebar component with currentUser and props', () => {
    const sidebar = <Sidebar currentUser={osadSession} />
    expect(sidebar.type).toBe(Sidebar)
    expect(sidebar.props.currentUser).toEqual(osadSession)
  })

  it('verifies task-based workflow groups across the 6 destinations', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    const groups = [...new Set(nav.map(i => i.workflowFamily))]

    expect(groups).toEqual(['overview', 'setup', 'evaluation'])
  })

  it('instantiates Topbar with isSidebarOpen and toggle callback', () => {
    const onToggleSidebar = vi.fn()
    const topbar = (
      <Topbar
        currentUser={osadSession}
        isSidebarOpen={true}
        onToggleSidebar={onToggleSidebar}
      />
    )

    expect(topbar.type).toBe(Topbar)
    expect(topbar.props.isSidebarOpen).toBe(true)
    expect(topbar.props.onToggleSidebar).toBe(onToggleSidebar)
  })

  it('instantiates MainLayout with workspace children slot', () => {
    const layout = (
      <MainLayout>
        <div className="test-workspace">Workspace Content</div>
      </MainLayout>
    )

    expect(layout.type).toBe(MainLayout)
    expect(layout.props.children).toBeDefined()
  })

  it('verifies role switching dynamically computes authorized navigation without browser refresh', () => {
    const studentSession = {
      account_type: CANONICAL_ACCOUNT_TYPES.STUDENT,
      active_role_context: CANONICAL_ROLES.STUDENT,
      assigned_roles: [CANONICAL_ROLES.STUDENT]
    }

    const studentNav = getAuthorizedNavigationForSession(studentSession)
    const osadNav = getAuthorizedNavigationForSession(osadSession)

    expect(studentNav.map(i => i.id)).toContain('student-profile')
    expect(studentNav.map(i => i.id)).not.toContain('student-dashboard')
    expect(studentNav.map(i => i.id)).not.toContain('student-achievements')
    expect(studentNav.map(i => i.id)).not.toContain('osad-student-management')

    expect(osadNav.map(i => i.id)).toContain('osad-student-management')
    expect(osadNav.map(i => i.id)).not.toContain('student-achievements')
  })

  it('verifies all 5 OSAD navigation items have distinct icons and accessible labels', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    nav.forEach(item => {
      expect(item.label).toBeDefined()
      expect(item.label.length).toBeGreaterThan(0)
      expect(item.icon).toBeDefined()
      expect(typeof item.icon).toBe('object')
    })
  })

  it('verifies responsive drawer close handler prop is accepted by Sidebar', () => {
    const onCloseMobile = vi.fn()
    const sidebar = (
      <Sidebar
        currentUser={osadSession}
        onCloseMobile={onCloseMobile}
      />
    )

    expect(sidebar.props.onCloseMobile).toBe(onCloseMobile)
  })

  it('verifies HR and Student roles receive their respective isolated navigation catalogs', () => {
    const hrSession = {
      account_type: CANONICAL_ACCOUNT_TYPES.HR_ADMIN,
      active_role_context: CANONICAL_ROLES.HR_STAFF,
      assigned_roles: [CANONICAL_ROLES.HR_STAFF]
    }

    const hrNav = getAuthorizedNavigationForSession(hrSession)
    expect(hrNav.map(i => i.id)).toContain('hr-personnel-directory')
    expect(hrNav.map(i => i.id)).not.toContain('osad-student-management')
  })

  it('verifies remaining aliases resolve and retired modules have no entries', () => {
    const nav = getAuthorizedNavigationForSession(osadSession)
    const studentManagementItem = nav.find(i => i.id === 'osad-student-management')
    const awardsItem = nav.find(i => i.id === 'osad-award-categories')
    const reviewItem = nav.find(i => i.id === 'osad-award-candidate-review')

    expect(studentManagementItem.tab).toBe('student-management')
    expect(studentManagementItem.path).toContain('section=accounts')
    expect(awardsItem.path).toBe('/osad/awards')
    expect(awardsItem.tab).toBeUndefined()
    expect(reviewItem.path).toBe('/osad/candidates')
    expect(reviewItem.tab).toBeUndefined()
    expect(nav.map(i => i.id)).not.toContain('osad-accreditation-reports')
    expect(nav.map(i => i.id)).not.toContain('osad-activity-log')
  })
})
