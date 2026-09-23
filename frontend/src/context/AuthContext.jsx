import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getCurrentUser,
  authenticateUser,
  fetchProfileAndCreateSession,
  updateUserRoleContext,
  logoutUser
} from '../services/authService'
import { resolveDefaultActiveRole } from '../utils/roleContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser())
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const syncUserFromStorage = useCallback(() => {
    const current = getCurrentUser()
    setUser(current)
  }, [])

  // Initial session restoration
  useEffect(() => {
    let isMounted = true

    async function initializeSession() {
      try {
        const persistentToken = localStorage.getItem('achievenest_access_token')
        const sessionToken = sessionStorage.getItem('achievenest_access_token')
        const localToken = persistentToken ||
          sessionToken ||
          getCurrentUser()?.token ||
          getCurrentUser()?.access_token

        // Restore a locally issued CodeIgniter session token.
        if (localToken) {
          try {
            const resolvedUser = await fetchProfileAndCreateSession(
              localToken,
              getCurrentUser()?.institutional_email || getCurrentUser()?.email || '',
              Boolean(persistentToken)
            )
            if (isMounted) {
              setUser(resolvedUser)
            }
          } catch (apiErr) {
            console.warn('Local session profile revalidation failed:', apiErr)
            if (isMounted) {
              await logoutUser()
              setUser(null)
            }
          }
          return
        }

        if (isMounted) {
          setUser(null)
        }
      } catch (err) {
        console.error('Session initialization error:', err)
        if (isMounted) {
          await logoutUser()
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeSession()

    const handleStorageChange = () => {
      syncUserFromStorage()
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      isMounted = false
      window.removeEventListener('storage', handleStorageChange)
    }
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

  const logout = async () => {
    setIsLoading(true)
    try {
      await logoutUser()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const switchRoleContext = (newRoleContext) => {
    const updated = updateUserRoleContext(newRoleContext)
    if (updated) {
      setUser({ ...updated })
    }
    return updated
  }

  const activeRoleContext = user?.active_role_context || resolveDefaultActiveRole(user?.account_type || user?.user_type, user?.assigned_roles || user?.roles) || null
  const isAuthenticated = !!user

  const value = {
    user,
    setUser,
    activeRoleContext,
    isAuthenticated,
    isLoading,
    isInitializing,
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
      activeRoleContext: fallbackUser?.active_role_context || resolveDefaultActiveRole(fallbackUser?.account_type || fallbackUser?.user_type, fallbackUser?.assigned_roles || fallbackUser?.roles) || null,
      isAuthenticated: !!fallbackUser,
      isLoading: false,
      isInitializing: false,
      login: async () => {},
      logout: () => {},
      switchRoleContext: (role) => updateUserRoleContext(role),
      syncUserFromStorage: () => {}
    }
  }
  return context
}

export default AuthContext
