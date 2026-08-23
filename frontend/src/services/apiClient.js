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

// Request Interceptor: Attach JWT Bearer Token from the current Supabase session
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await import('../config/supabase').then(({ supabase }) => supabase.auth.getSession())
      const token = session?.access_token

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      } else {
        delete config.headers.Authorization
      }
    } catch {
      delete config.headers.Authorization
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
        window.dispatchEvent(new Event('storage'))
      }
      return Promise.reject(error.response.data || error.response)
    }
    return Promise.reject(error)
  }
)

export default apiClient
