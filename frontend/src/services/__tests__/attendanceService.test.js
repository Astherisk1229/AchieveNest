import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, post, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn()
}))

vi.mock('../apiClient', () => ({
  default: {
    get,
    post,
    patch
  }
}))

import attendanceService from '../attendanceService'

describe('attendanceService', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
  })

  it('listEventAttendanceSessions calls correct GET endpoint and unwraps sessions envelope', async () => {
    const sessions = [
      {
        id: 'session-1',
        event_id: 'event-100',
        session_name: 'Morning Session',
        session_type: 'morning',
        status: 'scheduled',
        check_in_start: '2026-10-01 08:00:00',
        check_in_end: '2026-10-01 10:00:00'
      }
    ]

    get.mockResolvedValue({
      data: {
        sessions
      }
    })

    const result = await attendanceService.listEventAttendanceSessions('event-100')
    expect(result).toEqual(sessions)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/events/event-100/attendance-sessions')
  })

  it('createAttendanceSession calls correct POST endpoint and sanitizes payload authority', async () => {
    const rawClientPayload = {
      session_name: 'Afternoon Breakout',
      session_type: 'breakout',
      check_in_start: '2026-10-01 13:00:00',
      check_in_end: '2026-10-01 15:00:00',
      // The following client-authority fields MUST NOT be sent
      id: 'fake-client-id',
      event_id: 'fake-event-id',
      status: 'open',
      organization_id: 'fake-org-id',
      created_at: '2026-10-01',
      updated_at: '2026-10-01'
    }

    const createdSession = {
      id: 'session-real-1',
      event_id: 'event-100',
      session_name: 'Afternoon Breakout',
      session_type: 'breakout',
      status: 'scheduled',
      check_in_start: '2026-10-01 13:00:00',
      check_in_end: '2026-10-01 15:00:00'
    }

    post.mockResolvedValue({
      data: {
        message: 'Attendance session created successfully.',
        session: createdSession
      }
    })

    const result = await attendanceService.createAttendanceSession('event-100', rawClientPayload)
    expect(result).toEqual(createdSession)

    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith(
      '/events/event-100/attendance-sessions',
      {
        session_name: 'Afternoon Breakout',
        session_type: 'breakout',
        check_in_start: '2026-10-01 13:00:00',
        check_in_end: '2026-10-01 15:00:00'
      }
    )

    // Ensure client authority fields were stripped
    const calledPayload = post.mock.calls[0][1]
    expect(calledPayload).not.toHaveProperty('id')
    expect(calledPayload).not.toHaveProperty('event_id')
    expect(calledPayload).not.toHaveProperty('status')
    expect(calledPayload).not.toHaveProperty('organization_id')
    expect(calledPayload).not.toHaveProperty('created_at')
    expect(calledPayload).not.toHaveProperty('updated_at')
  })

  it('createAttendanceSession requires eventId', async () => {
    await expect(
      attendanceService.createAttendanceSession('', { session_name: 'Test' })
    ).rejects.toThrow('Event ID is required to create an attendance session.')
  })

  it('getAttendanceSession calls correct GET endpoint and unwraps session envelope', async () => {
    const sessionData = {
      id: 'session-1',
      session_name: 'Plenary',
      status: 'open',
      records_count: 25
    }

    get.mockResolvedValue({
      data: {
        session: sessionData
      }
    })

    const result = await attendanceService.getAttendanceSession('session-1')
    expect(result).toEqual(sessionData)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/attendance-sessions/session-1')
  })

  it('transitionAttendanceSessionStatus calls PATCH status=open for opening', async () => {
    const updatedSession = {
      id: 'session-1',
      status: 'open'
    }

    patch.mockResolvedValue({
      data: {
        message: 'Attendance session opened successfully.',
        session: updatedSession
      }
    })

    const result = await attendanceService.transitionAttendanceSessionStatus('session-1', 'open')
    expect(result).toEqual(updatedSession)
    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith('/attendance-sessions/session-1/status', { status: 'open' })
  })

  it('transitionAttendanceSessionStatus calls PATCH status=closed for closing', async () => {
    const updatedSession = {
      id: 'session-1',
      status: 'closed'
    }

    patch.mockResolvedValue({
      data: {
        message: 'Attendance session closed successfully.',
        session: updatedSession
      }
    })

    const result = await attendanceService.transitionAttendanceSessionStatus('session-1', 'closed')
    expect(result).toEqual(updatedSession)
    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith('/attendance-sessions/session-1/status', { status: 'closed' })
  })

  it('transitionAttendanceSessionStatus rejects invalid statuses like "scheduled" or "cancelled"', async () => {
    await expect(
      attendanceService.transitionAttendanceSessionStatus('session-1', 'scheduled')
    ).rejects.toThrow('Status transition must be either "open" or "closed".')

    await expect(
      attendanceService.transitionAttendanceSessionStatus('session-1', 'cancelled')
    ).rejects.toThrow('Status transition must be either "open" or "closed".')

    expect(patch).not.toHaveBeenCalled()
  })

  it('listAttendanceSessionRecords calls correct GET endpoint and unwraps records envelope', async () => {
    const records = [
      {
        id: 'rec-1',
        session_id: 'session-1',
        student_id: '2023-0001',
        student_name: 'Juan Dela Cruz',
        verification_method: 'qr_scan',
        verified_at: '2026-10-01 08:30:00'
      }
    ]

    get.mockResolvedValue({
      data: {
        records
      }
    })

    const result = await attendanceService.listAttendanceSessionRecords('session-1')
    expect(result).toEqual(records)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/attendance-sessions/session-1/records')
  })

  it('checkInAttendance calls correct POST endpoint with identifier and verification_method', async () => {
    const record = {
      id: 'rec-new-1',
      session_id: 'session-1',
      student_id: '2023-0002',
      verification_method: 'qr_scan'
    }

    post.mockResolvedValue({
      data: {
        message: 'Attendee checked in successfully.',
        record
      }
    })

    const result = await attendanceService.checkInAttendance('session-1', {
      identifier: '2023-0002',
      verification_method: 'qr_scan'
    })

    expect(result).toEqual(record)
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/attendance-sessions/session-1/check-in', {
      identifier: '2023-0002',
      verification_method: 'qr_scan'
    })
  })

  it('returns safe fallback values when API returns empty envelopes or null inputs', async () => {
    get.mockResolvedValue({})
    post.mockResolvedValue({})
    patch.mockResolvedValue({})

    await expect(attendanceService.listEventAttendanceSessions(null)).resolves.toEqual([])
    await expect(attendanceService.getAttendanceSession(null)).resolves.toBeNull()
    await expect(attendanceService.listAttendanceSessionRecords(null)).resolves.toEqual([])

    await expect(attendanceService.listEventAttendanceSessions('ev-1')).resolves.toEqual([])
    await expect(attendanceService.getAttendanceSession('sess-1')).resolves.toBeNull()
    await expect(attendanceService.listAttendanceSessionRecords('sess-1')).resolves.toEqual([])
  })

  it('propagates API error exceptions without swallowing', async () => {
    get.mockRejectedValue(new Error('Network error: 500 Internal Server Error'))

    await expect(
      attendanceService.listEventAttendanceSessions('event-1')
    ).rejects.toThrow('Network error: 500 Internal Server Error')
  })

  describe('parseScannedIdentifier', () => {
    it('extracts plain string identifiers safely', async () => {
      const { parseScannedIdentifier } = await import('../attendanceService')
      expect(parseScannedIdentifier('2022-01452')).toBe('2022-01452')
      expect(parseScannedIdentifier('  2023-08812  ')).toBe('2023-08812')
      expect(parseScannedIdentifier('')).toBe('')
      expect(parseScannedIdentifier(null)).toBe('')
    })

    it('extracts identifier from JSON qr payload and drops untrusted metadata', async () => {
      const { parseScannedIdentifier } = await import('../attendanceService')
      const jsonQr = JSON.stringify({
        student_id: '2021-00123',
        name: 'Attacker Impersonation Name',
        role: 'super_admin',
        status: 'open'
      })
      expect(parseScannedIdentifier(jsonQr)).toBe('2021-00123')

      const jsonWithId = JSON.stringify({ id: 'uuid-123-abc' })
      expect(parseScannedIdentifier(jsonWithId)).toBe('uuid-123-abc')
    })

    it('extracts identifier from URL query params or path', async () => {
      const { parseScannedIdentifier } = await import('../attendanceService')
      expect(parseScannedIdentifier('https://achievenest.ndmu.edu.ph/verify?student_id=2024-00999')).toBe('2024-00999')
      expect(parseScannedIdentifier('https://achievenest.ndmu.edu.ph/students/2024-00999')).toBe('2024-00999')
    })
  })

  describe('normalizeAttendanceError', () => {
    it('normalizes 409 duplicate to friendly feedback from Axios error and raw rejected response data', async () => {
      const { normalizeAttendanceError } = await import('../attendanceService')
      const axiosErr = { response: { status: 409, data: { message: 'ATTENDEE_ALREADY_CHECKED_IN' } } }
      expect(normalizeAttendanceError(axiosErr)).toBe('Student is already checked in.')

      const rejectedDataErr = { error: { code: 'ATTENDEE_ALREADY_CHECKED_IN', message: 'Attendee has already checked in to this session.' } }
      expect(normalizeAttendanceError(rejectedDataErr)).toBe('Student is already checked in.')
    })

    it('normalizes 404 attendee not found', async () => {
      const { normalizeAttendanceError } = await import('../attendanceService')
      const err = { response: { status: 404 } }
      expect(normalizeAttendanceError(err)).toBe('Student identifier not found in institutional records.')
    })

    it('normalizes 403 unauthorized', async () => {
      const { normalizeAttendanceError } = await import('../attendanceService')
      const err = { response: { status: 403 } }
      expect(normalizeAttendanceError(err)).toBe('You are not authorized to record attendance for this session.')
    })

    it('normalizes 422 domain validation messages', async () => {
      const { normalizeAttendanceError } = await import('../attendanceService')
      const err = { response: { status: 422, data: { error: { message: 'Attendance session is not open.' } } } }
      expect(normalizeAttendanceError(err)).toBe('Attendance session is not open.')
    })

    it('sanitizes 500 internal errors without leaking internals', async () => {
      const { normalizeAttendanceError } = await import('../attendanceService')
      const err = { response: { status: 500, data: { message: 'SQLSTATE[42S02]: Base table or view not found' } } }
      expect(normalizeAttendanceError(err)).toBe('An internal server error occurred. Please try again.')
    })
  })
})

