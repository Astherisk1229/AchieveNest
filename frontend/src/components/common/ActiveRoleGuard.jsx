import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { normalizeRoleContext, normalizeAccountType, CANONICAL_ROLES } from '../../utils/roleContext'

export default function ActiveRoleGuard({
  children,
  allowedAccountTypes = [],
  allowedActiveContexts = [CANONICAL_ROLES.PERSONNEL],
  redirectTo = '/personnel/dashboard?tab=overview',
  message = 'Switch to Personnel Account to access your personal portfolio.'
}) {
  const location = useLocation()
  const { user, activeRoleContext } = useAuth() || {}

  const currentAccountType = normalizeAccountType(user?.account_type || user?.user_type)
  const currentContext = normalizeRoleContext(
    activeRoleContext || user?.active_role_context
  )

  if (Array.isArray(allowedAccountTypes) && allowedAccountTypes.length > 0) {
    const normAllowedTypes = allowedAccountTypes.map(t => normalizeAccountType(t))
    if (!normAllowedTypes.includes(currentAccountType)) {
      return (
        <Navigate
          to={redirectTo}
          replace
          state={{
            blockedReason: message,
            attemptedPath: location.pathname
          }}
        />
      )
    }
  }

  const normAllowed = allowedActiveContexts.map(c => normalizeRoleContext(c))

  if (!normAllowed.includes(currentContext)) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          blockedReason: message,
          attemptedPath: location.pathname
        }}
      />
    )
  }

  return children
}
