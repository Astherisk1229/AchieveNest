import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, activeRoleContext } = useAuth()
  const location = useLocation()

  if (!user) {
    // User is not logged in -> redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = activeRoleContext || user.user_type
    const isAllowed = allowedRoles.includes(userRole) || allowedRoles.includes(user.user_type)
    
    if (!isAllowed) {
      // User is logged in but lacks allowed role -> fallback to home
      return <Navigate to="/" replace />
    }
  }

  return children
}
