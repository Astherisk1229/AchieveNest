import axios from 'axios'

const performanceLoggingEnabled = import.meta.env.DEV || import.meta.env.VITE_PERFORMANCE_LOGGING === 'true'

function responseBytes(data) {
  try {
    return new Blob([typeof data === 'string' ? data : JSON.stringify(data)]).size
  } catch {
    return null
  }
}

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
    if (performanceLoggingEnabled) {
      config.metadata = {
        requestId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        startedAt: performance.now()
      }
    }
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
  (response) => {
    if (performanceLoggingEnabled && response.config.metadata) {
      const duration = performance.now() - response.config.metadata.startedAt
      console.info('[PERF] API', {
        request_id: response.config.metadata.requestId,
        method: response.config.method?.toUpperCase(),
        route: response.config.url,
        status: response.status,
        duration_ms: Number(duration.toFixed(1)),
        response_bytes: responseBytes(response.data)
      })
    }
    return response.data
  },
  (error) => {
    if (performanceLoggingEnabled && error.config?.metadata) {
      const duration = performance.now() - error.config.metadata.startedAt
      console.info('[API ERROR]', {
        request_id: error.config.metadata.requestId,
        method: error.config.method?.toUpperCase(),
        url: `${error.config.baseURL || ''}${error.config.url || ''}`,
        code: error.code || 'UNKNOWN',
        message: error.message,
        response_received: Boolean(error.response),
        status: error.response?.status || 0,
        duration_ms: Number(duration.toFixed(1)),
        outcome: error.code === 'ECONNABORTED' ? 'timeout' : 'failed'
      })
    }
    if (error.response) {
      if (error.response.status === 401) {
        console.warn('API Unauthenticated (401). Redirecting to login session.')
        localStorage.removeItem('achievenest_current_user')
        sessionStorage.removeItem('achievenest_current_user')
        localStorage.removeItem('achievenest_access_token')
        sessionStorage.removeItem('achievenest_access_token')
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new Event('storage'))
        }
      } else if (error.response.status === 403 && error.response.data?.error?.code === 'PASSWORD_CHANGE_REQUIRED') {
        console.warn('Mandatory password change required (403). Restricting session.')
        const rawUser = localStorage.getItem('achievenest_current_user') || sessionStorage.getItem('achievenest_current_user')
        if (rawUser) {
          try {
            const user = JSON.parse(rawUser)
            user.must_change_password = true
            user.account_lifecycle_status = 'pending_first_login'
            user.required_next_action = 'change_password'
            user.can_access_protected_portal = false
            localStorage.setItem('achievenest_current_user', JSON.stringify(user))
            sessionStorage.setItem('achievenest_current_user', JSON.stringify(user))
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
              window.dispatchEvent(new Event('storage'))
            }
          } catch {
            // Ignore parse error
          }
        }
      }
      return Promise.reject(error.response.data || error.response)
    }

    const connectivityError = new Error('Unable to connect to the AchieveNest server. Please check the server connection and try again.')
    connectivityError.code = error.code || 'ERR_NETWORK'
    connectivityError.isNetworkError = true
    return Promise.reject(connectivityError)
  }
)

export default apiClient
