/**
 * AchieveNest Authentication Service
 * Dual-mode: Local-Defense authentication (WAMP MySQL) & Hosted Supabase Auth.
 */

import { supabase } from '../config/supabase'
import apiClient from './apiClient'
import AuthController from '../controllers/AuthController'
import {
  normalizeAccountType,
  normalizeRoleContext,
  normalizeAssignedRoles,
  resolveDefaultActiveRole,
  isValidAccountRoleCombination
} from '../utils/roleContext'

const STORAGE_KEY_USER = 'achievenest_current_user'
const STORAGE_KEY_TOKEN = 'achievenest_access_token'

function dispatchStorageEvent() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('storage'))
  }
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY_USER)
  sessionStorage.removeItem(STORAGE_KEY_USER)
  localStorage.removeItem(STORAGE_KEY_TOKEN)
  sessionStorage.removeItem(STORAGE_KEY_TOKEN)
}

/**
 * Authenticates user via local-defense API or hosted Supabase Auth based on environment configuration.
 */
export async function authenticateUser(email, password, rememberMe = true) {
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.endsWith('@ndmu.edu.ph')) {
    throw new Error('Please enter a valid NDMU institutional email (@ndmu.edu.ph).')
  }

  const authMode = import.meta.env.VITE_AUTH_MODE || 'local-defense'

  // 1. Local-Defense Track (Direct CodeIgniter JWT authentication)
  if (authMode === 'local-defense') {
    const res = await apiClient.post('/auth/login', {
      institutional_email: cleanEmail,
      password,
      remember_me: rememberMe
    })

    const accessToken = res?.data?.access_token || res?.access_token
    if (!accessToken) {
      throw new Error('Login succeeded but no access token was returned.')
    }

    return await fetchProfileAndCreateSession(accessToken, cleanEmail, rememberMe)
  }

  // 2. Hosted Supabase Auth Track
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password
  })

  if (error) {
    throw new Error(error.message || 'Supabase authentication failed.')
  }

  const accessToken = data?.session?.access_token
  if (!accessToken) {
    throw new Error('Supabase login succeeded but no access token was returned.')
  }

  return await fetchProfileAndCreateSession(accessToken, cleanEmail, rememberMe)
}

/**
 * Resolves profile from backend /api/v1/auth/me using the provided access token.
 */
export async function fetchProfileAndCreateSession(accessToken, emailFallback = '', rememberMe = true) {
  clearStoredSession()

  // Store token first so apiClient interceptor picks it up immediately
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY_TOKEN, accessToken)
  } else {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, accessToken)
  }

  let backendResponse
  try {
    backendResponse = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  } catch (error) {
    clearStoredSession()
    dispatchStorageEvent()
    throw error
  }

  const user = backendResponse?.data?.user || backendResponse?.user || null
  if (!user) {
    clearStoredSession()
    dispatchStorageEvent()
    throw new Error('Authenticated session is valid, but the backend profile could not be resolved.')
  }

  if (user.status === 'suspended') {
    await logoutUser()
    throw new Error('This account has been suspended. Please contact administrative support.')
  }

  if (user.status === 'archived') {
    await logoutUser()
    throw new Error('This account has been archived and cannot access application features.')
  }

  const cleanEmail = user.institutional_email || user.email || emailFallback

  // Determine authoritative account type & assigned roles
  const userRoles = (user.roles || []).map(r => (typeof r === 'object' ? r.role_key : r)).map(r => normalizeRoleContext(r))
  const accountType = normalizeAccountType(user.account_type || (userRoles.includes('student') ? 'student' : 'personnel'))
  const authoritativeAssignedRoles = normalizeAssignedRoles(userRoles, accountType)
  const activeRoleContext = resolveDefaultActiveRole(accountType, authoritativeAssignedRoles)

  const sessionPayload = {
    ...user,
    id: user.id,
    institutional_id: user.institutional_id,
    institutional_email: cleanEmail,
    email: cleanEmail,
    full_name: user.full_name || cleanEmail,
    account_type: accountType,
    user_type: accountType,
    status: user.status || 'active',
    active_role_context: activeRoleContext,
    roles: user.roles || [],
    role_assignments: user.role_assignments || [],
    assigned_roles: authoritativeAssignedRoles,
    academic_placement: user.academic_placement || null,
    personnel_affiliation: user.personnel_affiliation || null,
    program_affiliations: user.program_affiliations || [],
    department_id: user.department_id || null,
    designation: user.designation || null,
    year_level: user.year_level || null,
    must_change_password: Boolean(user.must_change_password),
    token: accessToken,
    access_token: accessToken,
    logged_in_at: new Date().toISOString(),
    rememberMe
  }

  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionPayload))
  } else {
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionPayload))
  }

  dispatchStorageEvent()
  return sessionPayload
}

/**
 * Retrieves the currently saved user session from storage with validation and restoration.
 */
export function getCurrentUser() {
  const local = localStorage.getItem(STORAGE_KEY_USER)
  const session = sessionStorage.getItem(STORAGE_KEY_USER)
  let raw = null
  if (local) {
    try { raw = JSON.parse(local) } catch { raw = null }
  } else if (session) {
    try { raw = JSON.parse(session) } catch { raw = null }
  }

  if (!raw) {
    return null
  }

  raw.account_type = normalizeAccountType(raw.account_type || raw.user_type)
  raw.user_type = raw.account_type

  const rawAssigned = Array.isArray(raw.assigned_roles || raw.roles) ? (raw.assigned_roles || raw.roles) : []
  raw.assigned_roles = normalizeAssignedRoles(rawAssigned, raw.account_type)

  // Validate active_role_context: must be valid for account_type and present in authoritative assigned_roles
  const isCurrentActiveValid = raw.active_role_context &&
    isValidAccountRoleCombination(raw.account_type, raw.active_role_context) &&
    raw.assigned_roles.includes(normalizeRoleContext(raw.active_role_context))

  if (!isCurrentActiveValid) {
    raw.active_role_context = resolveDefaultActiveRole(raw.account_type, raw.assigned_roles)
  } else {
    raw.active_role_context = normalizeRoleContext(raw.active_role_context)
  }

  return raw
}

/**
 * Updates the user's active UI role context among authorized assigned roles (Personnel only).
 */
export function updateUserRoleContext(newRoleContext) {
  const normNewRole = normalizeRoleContext(newRoleContext)
  const local = localStorage.getItem(STORAGE_KEY_USER)
  const session = sessionStorage.getItem(STORAGE_KEY_USER)
  let raw = null
  if (local) {
    try { raw = JSON.parse(local) } catch { raw = null }
  } else if (session) {
    try { raw = JSON.parse(session) } catch { raw = null }
  }

  if (!raw) return null

  raw.account_type = normalizeAccountType(raw.account_type || raw.user_type)

  // Dedicated admin accounts cannot switch roles
  if (raw.account_type !== 'personnel') {
    console.warn(`Role switch rejected: Account type [${raw.account_type}] does not support role switching.`)
    return raw
  }

  if (!isValidAccountRoleCombination(raw.account_type, normNewRole)) {
    console.warn(`Role switch rejected: ${normNewRole} is not an authorized role for this account.`)
    return raw
  }

  const existingAssigned = normalizeAssignedRoles(raw.assigned_roles || raw.roles, raw.account_type)

  // Confirm requested role is present in authoritative assigned_roles
  if (!existingAssigned.includes(normNewRole)) {
    console.warn(`Role switch rejected: ${normNewRole} is not assigned to this personnel account.`)
    return raw
  }

  raw.assigned_roles = existingAssigned
  raw.active_role_context = normNewRole
  AuthController.updateUserRoleContext(normNewRole)

  if (local) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))
  if (session) sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))
  if (!local && !session) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))

  dispatchStorageEvent()
  return raw
}

/**
 * Logs out the user by clearing storage and notifying the backend for server revocation.
 */
export async function logoutUser() {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Ignore network/server errors during logout
  }

  clearStoredSession()

  try {
    const authMode = import.meta.env.VITE_AUTH_MODE || 'local-defense'
    if (authMode !== 'local-defense') {
      await supabase.auth.signOut().catch(() => {})
    }
  } catch {
    // Ignore in local-defense mode
  }

  dispatchStorageEvent()
}

/**
 * Submits an administrator-handled password reset request via the backend API.
 */
export async function requestPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.endsWith('@ndmu.edu.ph')) {
    throw new Error('Please enter a valid NDMU institutional email (@ndmu.edu.ph).')
  }

  const response = await apiClient.post('/password-reset-requests', {
    institutional_email: cleanEmail
  })

  return {
    success: true,
    message: response?.data?.message || 'If an eligible account exists, your password reset request has been submitted to the appropriate office.'
  }
}

/**
 * Submits a mandatory password change for the authenticated user and clears must_change_password flag.
 */
export async function submitPasswordChange(newPassword, confirmPassword) {
  const currentUser = getCurrentUser()
  const token = currentUser?.token || currentUser?.access_token

  const response = await apiClient.post('/auth/change-password', {
    new_password: newPassword,
    confirm_password: confirmPassword
  }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })

  // Update local session to clear must_change_password
  if (currentUser) {
    currentUser.must_change_password = false
    const local = localStorage.getItem(STORAGE_KEY_USER)
    const session = sessionStorage.getItem(STORAGE_KEY_USER)
    if (local) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser))
    if (session) sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser))
    if (!local && !session) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser))
    dispatchStorageEvent()
  }

  return response?.data || response
}
