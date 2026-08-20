/**
 * PermissionRoute.jsx
 * Route Authorization Guard Component for AchieveNest.
 * 
 * Enforces pre-render route authorization by checking authenticated user session,
 * validated active role context, and required permissions.
 */

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getCurrentUser } from '../../services/authService'
import { can } from '../../security/permissionResolver'
import { normalizeRoleContext, normalizeAssignedRoles, isRoleAssigned } from '../../utils/roleContext'
import ForbiddenPage from '../../pages/common/ForbiddenPage'

export default function PermissionRoute({
  children,
  requiredPermissions = [],
  allowedActiveContexts = []
}) {
  const { user: authUser, activeRoleContext: authContext } = useAuth() || {}
  const user = authUser || getCurrentUser()

  // 1. Unauthenticated check
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const assignedRoles = normalizeAssignedRoles(user.assigned_roles, user.role)
  const activeContext = normalizeRoleContext(authContext || user.active_role_context || user.role)

  // 2. Security check: Active context MUST be legitimately assigned to the account
  if (!isRoleAssigned(activeContext, assignedRoles)) {
    return <ForbiddenPage />
  }

  // 3. Allowed active contexts check
  if (Array.isArray(allowedActiveContexts) && allowedActiveContexts.length > 0) {
    if (!allowedActiveContexts.includes(activeContext)) {
      return <ForbiddenPage />
    }
  }

  // 4. Required permissions check
  const userSession = {
    ...user,
    active_role_context: activeContext,
    assigned_roles: assignedRoles
  }

  if (Array.isArray(requiredPermissions) && requiredPermissions.length > 0) {
    const hasPermissions = requiredPermissions.every(perm => can(userSession, perm))
    if (!hasPermissions) {
      return <ForbiddenPage />
    }
  }

  return children
}
