const GOVERNANCE_ACTIONS = Object.freeze({
  ASSIGN_DEAN: 'assign_dean',
  REVOKE_DEAN: 'revoke_dean',
  ASSIGN_PROGRAM_COORDINATOR: 'assign_program_coordinator',
  REVOKE_PROGRAM_COORDINATOR: 'revoke_program_coordinator',
  ASSIGN_ORGANIZATION_MODERATOR: 'assign_organization_moderator',
  REVOKE_ORGANIZATION_MODERATOR: 'revoke_organization_moderator'
})

const OWNERSHIP = Object.freeze({
  hr_admin: new Set([
    GOVERNANCE_ACTIONS.ASSIGN_DEAN,
    GOVERNANCE_ACTIONS.REVOKE_DEAN
  ]),
  osad_admin: new Set([
    GOVERNANCE_ACTIONS.ASSIGN_PROGRAM_COORDINATOR,
    GOVERNANCE_ACTIONS.REVOKE_PROGRAM_COORDINATOR,
    GOVERNANCE_ACTIONS.ASSIGN_ORGANIZATION_MODERATOR,
    GOVERNANCE_ACTIONS.REVOKE_ORGANIZATION_MODERATOR
  ])
})

export function canManageGovernanceAction(user, action) {
  const accountType = String(user?.account_type || user?.user_type || '').toLowerCase()
  const activeRole = String(user?.active_role_context || '').toLowerCase()

  if (accountType === 'hr_admin' && activeRole === 'hr_staff') {
    return OWNERSHIP.hr_admin.has(action)
  }
  if (accountType === 'osad_admin' && activeRole === 'osad_staff') {
    return OWNERSHIP.osad_admin.has(action)
  }
  return false
}

export { GOVERNANCE_ACTIONS }
