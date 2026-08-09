import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getCurrentUser, authenticateUser, updateUserRoleContext, logoutUser } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())
  const [isLoading, setIsLoading] = useState(false)

  const syncUserFromStorage = useCallback(() => {
    const current = getCurrentUser()
    setUser(current)
  }, [])

  useEffect(() => {
    const handleStorageChange = () => {
      syncUserFromStorage()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncUserFromStorage])

  const login = async (email, password, rememberMe = true) => {
    setIsLoading(true)
    try {
      const loggedUser = await authenticateUser(email, password, rememberMe)
      setUser(loggedUser)
      setIsLoading(false)
      return loggedUser
    } catch (err) {
      setIsLoading(false)
      throw err
    }
  }

  const logout = () => {
    logoutUser()
    setUser(null)
  }

  const switchRoleContext = (newRoleContext) => {
    const updated = updateUserRoleContext(newRoleContext)
    setUser({ ...updated })
    return updated
  }

  const activeRoleContext = user?.active_role_context || user?.user_type || 'student'
  const isAuthenticated = !!user

  const value = {
    user,
    setUser,
    activeRoleContext,
    isAuthenticated,
    isLoading,
    login,
    logout,
    switchRoleContext,
    syncUserFromStorage
  }

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext
