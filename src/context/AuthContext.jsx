import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, updateUserRoleContext, logoutUser } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())

  useEffect(() => {
    // Listen for storage events (e.g. across tabs)
    const handleStorage = () => {
      setUser(getCurrentUser())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = (userData) => {
    setUser(userData)
    if (userData) {
      localStorage.setItem('achievenest_current_user', JSON.stringify(userData))
      sessionStorage.setItem('achievenest_current_user', JSON.stringify(userData))
    }
    window.dispatchEvent(new Event('storage'))
  }

  const switchRole = (newRoleContext) => {
    const updated = updateUserRoleContext(newRoleContext)
    setUser({ ...updated })
    return updated
  }

  const logout = () => {
    logoutUser()
    setUser(null)
  }

  const updateUserProfile = (newFields) => {
    const current = getCurrentUser() || {}
    const updated = { ...current, ...newFields }
    localStorage.setItem('achievenest_current_user', JSON.stringify(updated))
    setUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRoleContext: user?.active_role_context || user?.user_type || 'student',
        login,
        switchRole,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
