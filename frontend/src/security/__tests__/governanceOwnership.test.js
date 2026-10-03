import { describe, expect, it } from 'vitest'
import { canManageGovernanceAction, GOVERNANCE_ACTIONS } from '../governanceOwnership'

const hr = { account_type: 'hr_admin', active_role_context: 'hr_staff' }
const osad = { account_type: 'osad_admin', active_role_context: 'osad_staff' }

describe('Phase 16 governance ownership', () => {
  it('allows HR to assign and revoke Dean only', () => {
    expect(canManageGovernanceAction(hr, GOVERNANCE_ACTIONS.ASSIGN_DEAN)).toBe(true)
    expect(canManageGovernanceAction(hr, GOVERNANCE_ACTIONS.REVOKE_DEAN)).toBe(true)
    expect(canManageGovernanceAction(hr, GOVERNANCE_ACTIONS.ASSIGN_PROGRAM_COORDINATOR)).toBe(false)
    expect(canManageGovernanceAction(hr, GOVERNANCE_ACTIONS.ASSIGN_ORGANIZATION_MODERATOR)).toBe(false)
  })

  it('allows OSAD to manage Coordinators and Moderators, never Dean', () => {
    expect(canManageGovernanceAction(osad, GOVERNANCE_ACTIONS.ASSIGN_PROGRAM_COORDINATOR)).toBe(true)
    expect(canManageGovernanceAction(osad, GOVERNANCE_ACTIONS.REVOKE_PROGRAM_COORDINATOR)).toBe(true)
    expect(canManageGovernanceAction(osad, GOVERNANCE_ACTIONS.ASSIGN_ORGANIZATION_MODERATOR)).toBe(true)
    expect(canManageGovernanceAction(osad, GOVERNANCE_ACTIONS.REVOKE_ORGANIZATION_MODERATOR)).toBe(true)
    expect(canManageGovernanceAction(osad, GOVERNANCE_ACTIONS.ASSIGN_DEAN)).toBe(false)
    expect(canManageGovernanceAction(osad, GOVERNANCE_ACTIONS.REVOKE_DEAN)).toBe(false)
  })

  it('denies governance mutation to personnel roles', () => {
    expect(canManageGovernanceAction(
      { account_type: 'personnel', active_role_context: 'dean' },
      GOVERNANCE_ACTIONS.ASSIGN_DEAN
    )).toBe(false)
  })
})
