/**
 * AchieveNest Authentication Service
 * Real Supabase Auth + backend-authoritative identity resolution.
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

/**
 * Authenticate user with Supabase Auth and resolve profile + roles from CodeIgniter backend.
 */
export async function authenticateUser(email, password, rememberMe = true) {
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.endsWith('@ndmu.edu.ph')) {
    throw new Error('Please enter a valid NDMU institutional email (@ndmu.edu.ph).')
  }

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
  const backendResponse = await apiClient.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  const user = backendResponse?.data?.user || backendResponse?.user || null
  if (!user) {
    throw new Error('Authenticated session is valid, but the backend profile could not be resolved.')
  }

  if (user.status === 'suspended') {
    await supabase.auth.signOut()
    await logoutUser()
    throw new Error('This account has been suspended. Please contact administrative support.')
  }

  if (user.status === 'archived') {
    await supabase.auth.signOut()
    await logoutUser()
    throw new Error('This account has been archived and cannot access application features.')
  }

  const cleanEmail = user.institutional_email || emailFallback

  // Determine authoritative account type & assigned roles
  const userRoles = (user.roles || []).map(r => (typeof r === 'object' ? r.role_key : r))
  const accountType = normalizeAccountType(user.account_type || (userRoles.includes('student') ? 'student' : 'personnel'))
  const activeRoleContext = resolveDefaultActiveRole(accountType, userRoles)

  const allPersonnelRoles = ['personnel', 'department_secretary', 'program_coordinator', 'organization_moderator']
  const sessionPayload = {
    ...user,
    id: user.id,
    institutional_id: user.institutional_id,
    institutional_email: user.institutional_email || cleanEmail,
    email: user.institutional_email || cleanEmail,
    full_name: user.full_name || cleanEmail,
    account_type: accountType,
    user_type: accountType,
    status: user.status || 'active',
    active_role_context: activeRoleContext,
    roles: user.roles || [],
    assigned_roles: accountType === 'personnel'
      ? Array.from(new Set([...userRoles, ...allPersonnelRoles]))
      : (userRoles.length > 0 ? userRoles : (activeRoleContext ? [activeRoleContext] : [])),
    department_id: user.department_id || null,
    degree_program_id: user.degree_program_id || null,
    designation: user.designation || null,
    year_level: user.year_level || null,
    token: accessToken,
    logged_in_at: new Date().toISOString(),
    rememberMe
  }

  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionPayload))
  } else {
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sessionPayload))
  }

  window.dispatchEvent(new Event('storage'))
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
  raw.assigned_roles = rawAssigned
    .map(r => (typeof r === 'object' ? r.role_key : r))
    .filter(Boolean)
    .map(r => normalizeRoleContext(r))

  // Validate active_role_context: must be valid for account_type and present in assigned_roles
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

  const allPersonnelRoles = ['personnel', 'department_secretary', 'program_coordinator', 'organization_moderator']
  const existingAssigned = (Array.isArray(raw.assigned_roles || raw.roles) ? (raw.assigned_roles || raw.roles) : [])
    .map(r => (typeof r === 'object' ? r.role_key : r))
    .map(r => normalizeRoleContext(r))

  raw.assigned_roles = Array.from(new Set([...existingAssigned, ...allPersonnelRoles, normNewRole]))
  raw.active_role_context = normNewRole
  AuthController.updateUserRoleContext(normNewRole)

  if (local) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))
  if (session) sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))
  if (!local && !session) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))

  window.dispatchEvent(new Event('storage'))
  return raw
}

/**
 * Logs out the user by clearing storage and Supabase auth session.
 */
export async function logoutUser() {
  localStorage.removeItem(STORAGE_KEY_USER)
  sessionStorage.removeItem(STORAGE_KEY_USER)
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Supabase signOut notice:', err)
  }
  window.dispatchEvent(new Event('storage'))
}

/**
 * Submits a self-service password reset request via Supabase Auth.
 */
export async function requestPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.endsWith('@ndmu.edu.ph')) {
    throw new Error('Please enter a valid NDMU institutional email (@ndmu.edu.ph).')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${window.location.origin}/reset-password`
  })

  if (error) {
    throw new Error(error.message || 'Unable to send password reset email.')
  }

  return {
    success: true,
    message: 'Password reset instructions have been sent to your institutional email.'
  }
}
