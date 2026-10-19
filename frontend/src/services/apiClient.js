import axios from 'axios'
import { resolveStoredAuthSession } from '../utils/authStorage'

const performanceLoggingEnabled = import.meta.env.DEV || import.meta.env.VITE_PERFORMANCE_LOGGING === 'true'
let authValidationToken = null
let authValidationPromise = null

const injectedApiBaseUrl = typeof __ACHIEVENEST_API_BASE_URL__ === 'string'
  ? __ACHIEVENEST_API_BASE_URL__
  : ''

export const API_BASE_URL = injectedApiBaseUrl
  || import.meta.env.VITE_API_BASE_URL
  || '/api/v1'

function responseBytes(data) {
  try {
    return new Blob([typeof data === 'string' ? data : JSON.stringify(data)]).size
  } catch {
    return null
  }
}

/**
 * Browser FormData requests must not inherit the JSON default header. When a
 * Content-Type is supplied without the browser-generated multipart boundary,
 * PHP receives an empty uploaded-files collection and reports FILE_REQUIRED.
 */
function removeMultipartContentType(headers) {
  if (!headers) return

  if (typeof headers.delete === 'function') {
    headers.delete('Content-Type')
    return
  }

  delete headers['Content-Type']
  delete headers['content-type']
}

async function validateStoredAuthToken(token) {
  if (!token) return false
  if (authValidationToken === token && authValidationPromise) {
    return authValidationPromise
  }

  authValidationToken = token
  authValidationPromise = axios.get(`${API_BASE_URL.replace(/\/$/, '')}/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    timeout: 5000
  }).then(() => true).catch(error => {
    if (error.response?.status === 401) return false
    // A failed validation due to connectivity or server trouble is inconclusive;
    // do not turn a temporary outage into a forced sign-out.
    return null
  }).finally(() => {
    if (authValidationToken === token) {
      authValidationToken = null
      authValidationPromise = null
    }
  })

  return authValidationPromise
}

/**
 * AchieveNest REST API Client Layer
 * Pre-configured Axios instance with JWT Bearer Token interceptors and error handlers.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000
})

// Request Interceptor: Attach JWT Bearer Token from local storage or session storage
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      // Leave Content-Type unset so XMLHttpRequest/fetch supplies the required
      // multipart boundary. This applies to every protected file upload.
      removeMultipartContentType(config.headers)
    }

    if (performanceLoggingEnabled) {
      config.metadata = {
        requestId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        startedAt: performance.now()
      }
    }
    try {
      const { token } = resolveStoredAuthSession()

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
  async (error) => {
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
        const requestUrl = String(error.config?.url || '')
        const isCredentialSubmission = /\/auth\/(login|demo-login)\/?(?:\?.*)?$/.test(requestUrl)
        let shouldClearSession = !error.config || /\/auth\/me\/?(?:\?.*)?$/.test(requestUrl)

        if (!isCredentialSubmission && !shouldClearSession) {
          const authorization = error.config?.headers?.Authorization
            || error.config?.headers?.authorization
          const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
            ? authorization.slice(7)
            : resolveStoredAuthSession().token
          const validation = await validateStoredAuthToken(token)
          shouldClearSession = validation === false
        }

        if (shouldClearSession) {
          console.warn('API session validation failed (401). Redirecting to login.')
          localStorage.removeItem('achievenest_current_user')
          sessionStorage.removeItem('achievenest_current_user')
          localStorage.removeItem('achievenest_access_token')
          sessionStorage.removeItem('achievenest_access_token')
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new Event('storage'))
          }
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
