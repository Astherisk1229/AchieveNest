import apiClient from './apiClient'

/**
 * Canonical frontend API service for Attendance Sessions and Records.
 *
 * Backend authority lives in the backend attendance_sessions and attendance_records tables.
 */
const attendanceService = {
  /**
   * List all attendance sessions configured for a specific event.
   */
  async listEventAttendanceSessions(eventId) {
    if (!eventId) return []
    const response = await apiClient.get(
      `/events/${encodeURIComponent(eventId)}/attendance-sessions`
    )
    return response?.data?.sessions ?? response?.data ?? []
  },

  /**
   * Create a new attendance session under an event.
   * Client payload contains only session_name, session_type, check_in_start, check_in_end.
   */
  async createAttendanceSession(eventId, payload) {
    if (!eventId) throw new Error('Event ID is required to create an attendance session.')
    const body = {
      session_name: payload?.session_name?.trim?.() ?? payload?.session_name,
      session_type: payload?.session_type ?? 'general',
      check_in_start: payload?.check_in_start,
      check_in_end: payload?.check_in_end
    }

    const response = await apiClient.post(
      `/events/${encodeURIComponent(eventId)}/attendance-sessions`,
      body
    )
    return response?.data?.session ?? response?.data ?? null
  },

  /**
   * Fetch details and record count for a single attendance session.
   */
  async getAttendanceSession(sessionId) {
    if (!sessionId) return null
    const response = await apiClient.get(
      `/attendance-sessions/${encodeURIComponent(sessionId)}`
    )
    return response?.data?.session ?? response?.data ?? null
  },

  /**
   * Transition session status (scheduled -> open, open -> closed).
   */
  async transitionAttendanceSessionStatus(sessionId, status) {
    if (!sessionId) throw new Error('Session ID is required to transition status.')
    const targetStatus = String(status ?? '').trim().toLowerCase()
    if (targetStatus !== 'open' && targetStatus !== 'closed') {
      throw new Error('Status transition must be either "open" or "closed".')
    }

    const response = await apiClient.patch(
      `/attendance-sessions/${encodeURIComponent(sessionId)}/status`,
      { status: targetStatus }
    )
    return response?.data?.session ?? response?.data ?? null
  },

  /**
   * List verified attendance records for a session.
   */
  async listAttendanceSessionRecords(sessionId) {
    if (!sessionId) return []
    const response = await apiClient.get(
      `/attendance-sessions/${encodeURIComponent(sessionId)}/records`
    )
    return response?.data?.records ?? response?.data ?? []
  },

  /**
   * Record attendee check-in against a session (backend representation).
   */
  async checkInAttendance(sessionId, payload) {
    if (!sessionId) throw new Error('Session ID is required for check-in.')
    const rawIdentifier = payload?.identifier
    const identifier = parseScannedIdentifier(rawIdentifier)
    if (!identifier) throw new Error('Attendee identifier is required.')

    const method = payload?.verification_method === 'manual' ? 'manual' : 'qr_scan'
    const body = {
      identifier,
      verification_method: method
    }

    const response = await apiClient.post(
      `/attendance-sessions/${encodeURIComponent(sessionId)}/check-in`,
      body
    )
    return response?.data?.record ?? response?.data ?? null
  }
}

/**
 * Safely extract only the attendee identifier from raw QR scan or manual input.
 * Strips all untrusted metadata, JSON wrappers, or URL parameters.
 */
export function parseScannedIdentifier(rawInput) {
  if (!rawInput) return ''
  const text = String(rawInput).trim()
  if (!text) return ''

  // Handle JSON encoded QR code
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text)
      const id = parsed.identifier || parsed.student_id || parsed.studentId || parsed.id || parsed.institutional_id
      if (id && typeof id === 'string') {
        return id.trim()
      }
    } catch {
      // Fall through to plain text
    }
  }

  // Handle URL encoded QR code
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text)
      const idParam = url.searchParams.get('id') || url.searchParams.get('student_id') || url.searchParams.get('identifier')
      if (idParam) return idParam.trim()
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length > 0) return parts[parts.length - 1].trim()
    } catch {
      // Fall through to plain text
    }
  }

  return text
}

/**
 * Map API error responses to safe, user-friendly feedback without exposing backend internals.
 */
export function normalizeAttendanceError(error) {
  if (!error) return 'An error occurred while recording attendance.'

  const code = error?.error?.code || error?.code || error?.response?.data?.error?.code
  const status = error?.response?.status || error?.status || (code === 'ATTENDEE_ALREADY_CHECKED_IN' ? 409 : null)
  const backendMessage = error?.error?.message 
    || error?.response?.data?.error?.message 
    || error?.response?.data?.message 
    || error?.message

  if (status === 409 || code === 'ATTENDEE_ALREADY_CHECKED_IN' || code === 'DUPLICATE_CHECK_IN') {
    return 'Student is already checked in.'
  }
  if (status === 404 || code === 'ATTENDEE_NOT_FOUND') {
    return 'Student identifier not found in institutional records.'
  }
  if (status === 403 || code === 'UNAUTHORIZED_ATTENDANCE') {
    return 'You are not authorized to record attendance for this session.'
  }
  if (status === 422) {
    if (backendMessage && typeof backendMessage === 'string' && !backendMessage.includes('SQL') && !backendMessage.includes('Exception')) {
      return backendMessage
    }
    return 'Student is not eligible or session check-in window is closed.'
  }
  if (status >= 500) {
    return 'An internal server error occurred. Please try again.'
  }

  return (backendMessage && typeof backendMessage === 'string' && !backendMessage.includes('SQL') && !backendMessage.includes('Exception')) 
    ? backendMessage 
    : 'Failed to record attendance. Please try again.'
}

export default attendanceService

