import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getCurrentUser, authenticateUser, updateUserRoleContext, logoutUser } from '../services/authService'
import { normalizeRoleContext, normalizeAssignedRoles } from '../utils/roleContext'

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

  const login = async (emailOrUser, password, rememberMe = true) => {
    setIsLoading(true)
    try {
      let loggedUser
      if (typeof emailOrUser === 'object' && emailOrUser !== null) {
        loggedUser = emailOrUser
      } else {
        loggedUser = await authenticateUser(emailOrUser, password, rememberMe)
      }
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
    const fallbackUser = getCurrentUser()
    return {
      user: fallbackUser,
      setUser: () => {},
      activeRoleContext: fallbackUser?.active_role_context || fallbackUser?.user_type || 'personnel',
      isAuthenticated: !!fallbackUser,
      isLoading: false,
      login: async () => {},
      logout: () => {},
      switchRoleContext: (role) => updateUserRoleContext(role),
      syncUserFromStorage: () => {}
    }
  }
  return context
}

export default AuthContext
