/**
 * AchieveNest Authentication Service
 * Real Supabase Auth + backend-authoritative identity resolution.
 */

import { supabase } from '../config/supabase'
import apiClient from './apiClient'

export const DEMO_USERS = {
  student: {
    id: 'usr_std_001',
    email: 'student@ndmu.edu.ph',
    full_name: 'Juan A. Dela Cruz',
    user_type: 'student',
    student_id: '2023-0142',
    department: 'Department of Computer Studies',
    college: 'College of Information Technology Education (CITE)',
    program: 'BS Information Technology',
    year_level: '3rd Year',
    gpa: 3.85,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assigned_roles: []
  },
  personnel: {
    id: 'usr_per_001',
    email: 'faculty@ndmu.edu.ph',
    full_name: 'Dr. Maria Santos',
    user_type: 'personnel',
    employee_id: 'EMP-2021-0842',
    department: 'College of Information Technology',
    academic_rank: 'Associate Professor',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assigned_roles: ['program_coordinator', 'organization_moderator', 'department_secretary']
  },
  coordinator: {
    id: 'usr_coord_001',
    email: 'coordinator@ndmu.edu.ph',
    full_name: 'Prof. Ricardo Gomez',
    user_type: 'personnel',
    active_role_context: 'program_coordinator',
    employee_id: 'EMP-2015-012',
    department: 'College of Information Technology',
    academic_rank: 'Program Coordinator',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    assigned_roles: ['program_coordinator', 'organization_moderator', 'department_secretary']
  },
  organization: {
    id: 'usr_mod_001',
    email: 'moderator@ndmu.edu.ph',
    full_name: 'Dr. Ana Reyes',
    user_type: 'personnel',
    active_role_context: 'organization_moderator',
    employee_id: 'EMP-2019-088',
    department: 'Computer Society NDMU',
    academic_rank: 'Organization Moderator',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    assigned_roles: ['personnel', 'organization_moderator', 'program_coordinator', 'department_secretary']
  },
  depsec: {
    id: 'usr_depsec_001',
    email: 'sec@ndmu.edu.ph',
    full_name: 'Dr. Maria Santos',
    user_type: 'personnel',
    active_role_context: 'department_secretary',
    employee_id: 'EMP-2021-0842',
    department: 'College of Engineering, Architecture & Computing',
    academic_rank: 'Department Secretary',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assigned_roles: ['personnel', 'department_secretary', 'program_coordinator', 'organization_moderator']
  },

  osad: {
    id: 'usr_osad_001',
    email: 'osad@ndmu.edu.ph',
    full_name: 'Director Marcus Vance',
    user_type: 'osad_staff',
    employee_id: 'OSAD-2008-005',
    department: 'Office of Student Affairs & Development',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    assigned_roles: []
  },

  hr: {
    id: 'usr_hr_001',
    email: 'hr@ndmu.edu.ph',
    full_name: 'Director Evelyn Tan',
    user_type: 'hr_staff',
    employee_id: 'HR-2010-001',
    department: 'Human Resources',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assigned_roles: []
  }
}

const STORAGE_KEY_USER = 'achievenest_current_user'
const STORAGE_KEY_RESETS = 'achievenest_password_resets'

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

  const backendResponse = await apiClient.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  const user = backendResponse?.data?.user || backendResponse?.user || null
  if (!user) {
    throw new Error('Authenticated session is valid, but the backend profile could not be resolved.')
  }

  const sessionPayload = {
    ...user,
    id: user.id,
    email: user.institutional_email || cleanEmail,
    full_name: user.full_name || cleanEmail,
    user_type: user.account_type || 'personnel',
    active_role_context: user.account_type || 'personnel',
    assigned_roles: (user.roles || []).map(role => role.role_key),
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

import AuthController from '../controllers/AuthController'
import { normalizeRoleContext, normalizeAssignedRoles } from '../utils/roleContext'

export function getCurrentUser() {
  const local = localStorage.getItem(STORAGE_KEY_USER)
  const session = sessionStorage.getItem(STORAGE_KEY_USER)
  let raw = null
  if (local) raw = JSON.parse(local)
  else if (session) raw = JSON.parse(session)
  
  if (!raw) {
    return null
  }

  raw.user_type = normalizeRoleContext(raw.user_type)
  if (raw.active_role_context) {
    raw.active_role_context = normalizeRoleContext(raw.active_role_context)
  }
  raw.assigned_roles = normalizeAssignedRoles(raw.assigned_roles || raw.roles, raw.user_type)

  return raw
}

export function updateUserRoleContext(newRoleContext) {
  const normNewRole = normalizeRoleContext(newRoleContext)
  const local = localStorage.getItem(STORAGE_KEY_USER)
  const session = sessionStorage.getItem(STORAGE_KEY_USER)
  let raw = null
  if (local) raw = JSON.parse(local)
  else if (session) raw = JSON.parse(session)
  if (!raw) raw = { ...DEMO_USERS.personnel }

  raw.assigned_roles = normalizeAssignedRoles(raw.assigned_roles || raw.roles, raw.user_type)
  
  // Validate that the requested role context is in assigned_roles
  if (!raw.assigned_roles.includes(normNewRole)) {
    console.warn(`Role switch rejected: ${normNewRole} is not in assigned_roles [${raw.assigned_roles.join(', ')}]`)
    return raw
  }

  raw.active_role_context = normNewRole
  AuthController.updateUserRoleContext(normNewRole)

  if (local) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))
  if (session) sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))
  if (!local && !session) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(raw))

  // Dispatch storage event for real-time synchronization
  window.dispatchEvent(new Event('storage'))
  return raw
}




export function logoutUser() {
  localStorage.removeItem(STORAGE_KEY_USER)
  sessionStorage.removeItem(STORAGE_KEY_USER)
}

export async function requestPasswordReset(email, reason, requestedTargetOffice = 'auto') {
  await new Promise(resolve => setTimeout(resolve, 500))

  const cleanEmail = email.trim().toLowerCase()
  let targetOffice = requestedTargetOffice

  if (targetOffice === 'auto') {
    // Auto-detect target office based on email or user designation
    if (cleanEmail.includes('faculty') || cleanEmail.includes('personnel') || cleanEmail.includes('coord') || cleanEmail.includes('sec') || cleanEmail.includes('mod') || cleanEmail.includes('prof') || cleanEmail.includes('dr')) {
      targetOffice = 'hr'
    } else {
      targetOffice = 'osad'
    }
  }

  const existingResets = JSON.parse(localStorage.getItem(STORAGE_KEY_RESETS) || '[]')
  const matchedUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === cleanEmail)

  const resetRequest = {
    id: `req_${Date.now()}`,
    user_email: cleanEmail,
    user_name: matchedUser ? matchedUser.full_name : cleanEmail.split('@')[0].toUpperCase(),
    user_type: targetOffice === 'hr' ? 'personnel' : 'student',
    target_office: targetOffice, // 'hr' (Human Resources) vs 'osad' (Office of Student Affairs & Development)
    remarks: reason,
    status: 'pending',
    requested_at: new Date().toISOString()
  }

  existingResets.push(resetRequest)
  localStorage.setItem(STORAGE_KEY_RESETS, JSON.stringify(existingResets))

  window.dispatchEvent(new Event('achievenest_reset_request_submitted'))
  return resetRequest
}

