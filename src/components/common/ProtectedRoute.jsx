import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, activeRoleContext } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0) {
    const userRole = user?.user_type
    const isAuthorized = allowedRoles.includes(userRole) || allowedRoles.includes(activeRoleContext)

    if (!isAuthorized) {
      // Redirect to authorized portal landing route based on user type
      if (userRole === 'osad_staff') return <Navigate to="/osad/dashboard" replace />
      if (userRole === 'hr_staff') return <Navigate to="/hr/dashboard" replace />
      if (userRole === 'personnel') return <Navigate to="/personnel/dashboard" replace />
      return <Navigate to="/student/dashboard" replace />
    }
  }

  return children
}
