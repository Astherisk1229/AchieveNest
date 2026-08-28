import axios from 'axios'

/**
 * AchieveNest REST API Client Layer
 * Pre-configured Axios instance with JWT Bearer Token interceptors and error handlers.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000
})

// Request Interceptor: Attach JWT Bearer Token from local storage or session storage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 1. Direct local token check (local-defense mode or authenticated session)
      let token = localStorage.getItem('achievenest_access_token') || sessionStorage.getItem('achievenest_access_token')

      if (!token) {
        const rawUser = localStorage.getItem('achievenest_current_user') || sessionStorage.getItem('achievenest_current_user')
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser)
            token = parsed?.token || parsed?.access_token
          } catch {
            token = null
          }
        }
      }

      // 2. Hosted Supabase fallback only if no local token and not explicitly local-defense
      if (!token && import.meta.env.VITE_AUTH_MODE !== 'local-defense') {
        try {
          const { supabase } = await import('../config/supabase')
          const { data: { session } } = await supabase.auth.getSession()
          token = session?.access_token
        } catch {
          token = null
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      } else if (!config.headers.Authorization) {
        delete config.headers.Authorization
      }
    } catch {
      if (!config.headers.Authorization) {
        delete config.headers.Authorization
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Global Error & Unauthenticated 401 Handler
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.warn('API Unauthenticated (401). Redirecting to login session.')
        localStorage.removeItem('achievenest_current_user')
        sessionStorage.removeItem('achievenest_current_user')
        localStorage.removeItem('achievenest_access_token')
        sessionStorage.removeItem('achievenest_access_token')
        window.dispatchEvent(new Event('storage'))
      }
      return Promise.reject(error.response.data || error.response)
    }
    return Promise.reject(error)
  }
)

export default apiClient
