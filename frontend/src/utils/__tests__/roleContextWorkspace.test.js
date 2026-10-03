import { describe, expect, it } from 'vitest'
import { isWorkspaceAvailable, resolveRouteOwnership } from '../roleContext'

describe('workspace availability', () => {
  const dean = {
    account_type: 'personnel',
    assigned_roles: ['personnel', 'dean'],
    role_assignments: [{ role_key: 'dean', scope_type: 'college', scope_id: 'college-1' }]
  }

  it('requires an active scoped assignment for the Dean workspace', () => {
    expect(isWorkspaceAvailable(dean, 'dean')).toBe(true)
    expect(isWorkspaceAvailable({ ...dean, role_assignments: [] }, 'dean')).toBe(false)
  })

  it('keeps Personnel workspace independent from Dean scope', () => {
    expect(isWorkspaceAvailable({ ...dean, role_assignments: [] }, 'personnel')).toBe(true)
  })

  it('requires a Department-scoped assignment for the Department Head workspace', () => {
    const head = {
      account_type: 'personnel',
      assigned_roles: ['personnel', 'department_head'],
      role_assignments: [{ role_key: 'department_head', scope_type: 'department', scope_id: 'department-1' }]
    }
    expect(isWorkspaceAvailable(head, 'department_head')).toBe(true)
    expect(isWorkspaceAvailable({ ...head, role_assignments: [] }, 'department_head')).toBe(false)
    expect(isWorkspaceAvailable({ ...head, role_assignments: [{ role_key: 'department_head', scope_type: 'college', scope_id: 'college-1' }] }, 'department_head')).toBe(false)
  })

  it('requires an academic-program assignment for the Program Coordinator workspace', () => {
    const coordinator = {
      account_type: 'personnel',
      assigned_roles: ['personnel', 'program_coordinator'],
      role_assignments: [{
        role_key: 'program_coordinator',
        scope_type: 'academic_program',
        scope_id: 'program-1'
      }]
    }

    expect(isWorkspaceAvailable(coordinator, 'program_coordinator')).toBe(true)
    expect(isWorkspaceAvailable({ ...coordinator, role_assignments: [] }, 'program_coordinator')).toBe(false)
  })

  it('requires an organization assignment for the Organization Moderator workspace', () => {
    const moderator = {
      account_type: 'personnel',
      assigned_roles: ['personnel', 'organization_moderator'],
      role_assignments: [{
        role_key: 'organization_moderator',
        scope_type: 'organization',
        scope_id: 'organization-1'
      }]
    }

    expect(isWorkspaceAvailable(moderator, 'organization_moderator')).toBe(true)
    expect(isWorkspaceAvailable({ ...moderator, role_assignments: [] }, 'organization_moderator')).toBe(false)
  })

  it('distinguishes workspace-owned routes from shared personnel utilities', () => {
    expect(resolveRouteOwnership('/dean/dashboard')).toEqual({ type: 'workspace', workspace: 'dean' })
    expect(resolveRouteOwnership('/dean/faculty-ranking-reviews/submission-1')).toEqual({ type: 'workspace', workspace: 'dean' })
    expect(resolveRouteOwnership('/personnel/dashboard')).toEqual({ type: 'workspace', workspace: 'personnel' })
    expect(resolveRouteOwnership('/personnel/dashboard', 'program_coordinator')).toEqual({ type: 'workspace', workspace: 'program_coordinator' })
    expect(resolveRouteOwnership('/personnel/dashboard', 'organization_moderator')).toEqual({ type: 'workspace', workspace: 'organization_moderator' })
    expect(resolveRouteOwnership('/personnel/portfolio/edit')).toEqual({ type: 'workspace', workspace: 'personnel' })
    expect(resolveRouteOwnership('/personnel/account')).toEqual({ type: 'shared' })
    expect(resolveRouteOwnership('/personnel/settings/')).toEqual({ type: 'shared' })
    expect(resolveRouteOwnership('/unmanaged')).toEqual({ type: 'unknown' })
  })
})
