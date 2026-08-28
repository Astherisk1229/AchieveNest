import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getCurrentUser,
  authenticateUser,
  fetchProfileAndCreateSession,
  updateUserRoleContext,
  logoutUser
} from '../services/authService'
import { resolveDefaultActiveRole } from '../utils/roleContext'
import { supabase } from '../config/supabase'

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
        const isLocalDefense = import.meta.env.VITE_AUTH_MODE === 'local-defense'
        const persistentToken = localStorage.getItem('achievenest_access_token')
        const sessionToken = sessionStorage.getItem('achievenest_access_token')
        const localToken = persistentToken ||
          sessionToken ||
          getCurrentUser()?.token ||
          getCurrentUser()?.access_token

        // 1. Local-defense or local token session restoration
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

        // 2. Hosted Supabase track
        if (!isLocalDefense) {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error || !session?.access_token) {
            if (isMounted) {
              await logoutUser()
              setUser(null)
            }
            return
          }

          try {
            const resolvedUser = await fetchProfileAndCreateSession(
              session.access_token,
              session.user?.email || ''
            )
            if (isMounted) {
              setUser(resolvedUser)
            }
          } catch (apiErr) {
            console.warn('Supabase session profile revalidation failed:', apiErr)
            if (isMounted) {
              await logoutUser()
              setUser(null)
            }
          }
        } else {
          // In local defense mode without saved token: clean unauthenticated state
          if (isMounted) {
            setUser(null)
          }
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

    let subscription = null
    if (import.meta.env.VITE_AUTH_MODE !== 'local-defense') {
      const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          if (isMounted) {
            setUser(null)
          }
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          try {
            const resolvedUser = await fetchProfileAndCreateSession(
              session.access_token,
              session.user?.email || ''
            )
            if (isMounted) {
              setUser(resolvedUser)
            }
          } catch (e) {
            console.warn('AuthStateChange profile sync warning:', e)
          }
        }
      })
      subscription = authListener.data?.subscription
    }

    const handleStorageChange = () => {
      syncUserFromStorage()
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      isMounted = false
      subscription?.unsubscribe?.()
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
