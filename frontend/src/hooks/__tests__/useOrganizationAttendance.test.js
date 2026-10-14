import { beforeEach, describe, expect, it, vi } from 'vitest'
import { refreshAttendanceSessionsAfterTransition } from '../useOrganization'

const {
  listEventAttendanceSessions,
  createAttendanceSession,
  getAttendanceSession,
  transitionAttendanceSessionStatus,
  listAttendanceSessionRecords
} = vi.hoisted(() => ({
  listEventAttendanceSessions: vi.fn(),
  createAttendanceSession: vi.fn(),
  getAttendanceSession: vi.fn(),
  transitionAttendanceSessionStatus: vi.fn(),
  listAttendanceSessionRecords: vi.fn()
}))

vi.mock('../../services/attendanceService', () => ({
  default: {
    listEventAttendanceSessions,
    createAttendanceSession,
    getAttendanceSession,
    transitionAttendanceSessionStatus,
    listAttendanceSessionRecords
  }
}))

describe('useOrganization attendance session state & action wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verifies attendance service interaction on session load', async () => {
    const mockSessions = [
      {
        id: 'sess-1',
        event_id: 'ev-1',
        session_name: 'Opening Plenary',
        session_type: 'general',
        status: 'scheduled',
        check_in_start: '2026-10-01 08:00:00',
        check_in_end: '2026-10-01 10:00:00'
      }
    ]

    listEventAttendanceSessions.mockResolvedValue(mockSessions)

    const result = await listEventAttendanceSessions('ev-1')
    expect(result).toEqual(mockSessions)
    expect(listEventAttendanceSessions).toHaveBeenCalledWith('ev-1')
  })

  it('verifies attendance session creation flow using canonical server response', async () => {
    const newSession = {
      id: 'sess-new',
      event_id: 'ev-1',
      session_name: 'Breakout Session A',
      session_type: 'breakout',
      status: 'scheduled'
    }

    createAttendanceSession.mockResolvedValue(newSession)

    const created = await createAttendanceSession('ev-1', {
      session_name: 'Breakout Session A',
      session_type: 'breakout'
    })

    expect(created).toEqual(newSession)
    expect(createAttendanceSession).toHaveBeenCalledWith('ev-1', {
      session_name: 'Breakout Session A',
      session_type: 'breakout'
    })
  })

  it('verifies opening scheduled session transitions status to open', async () => {
    const openSession = {
      id: 'sess-1',
      session_name: 'Keynote',
      status: 'open'
    }

    transitionAttendanceSessionStatus.mockResolvedValue(openSession)

    const updated = await transitionAttendanceSessionStatus('sess-1', 'open')
    expect(updated).toEqual(openSession)
    expect(transitionAttendanceSessionStatus).toHaveBeenCalledWith('sess-1', 'open')
  })

  it('verifies closing open session transitions status to closed', async () => {
    const closedSession = {
      id: 'sess-1',
      session_name: 'Keynote',
      status: 'closed'
    }

    transitionAttendanceSessionStatus.mockResolvedValue(closedSession)

    const updated = await transitionAttendanceSessionStatus('sess-1', 'closed')
    expect(updated).toEqual(closedSession)
    expect(transitionAttendanceSessionStatus).toHaveBeenCalledWith('sess-1', 'closed')
  })

  it('does not report a completed transition as failed when its session-list refresh is unavailable', async () => {
    const refreshSessions = vi.fn().mockRejectedValue(new Error('Unable to connect to the AchieveNest server.'))

    await expect(
      refreshAttendanceSessionsAfterTransition(refreshSessions, 'ev-1')
    ).resolves.toBe(false)

    expect(refreshSessions).toHaveBeenCalledWith('ev-1')
  })

  it('verifies loading canonical records for an active session', async () => {
    const records = [
      {
        id: 'rec-1',
        session_id: 'sess-1',
        student_id: '2023-1234',
        student_name: 'Maria Santos',
        verification_method: 'qr_scan'
      }
    ]

    listAttendanceSessionRecords.mockResolvedValue(records)

    const loaded = await listAttendanceSessionRecords('sess-1')
    expect(loaded).toEqual(records)
    expect(listAttendanceSessionRecords).toHaveBeenCalledWith('sess-1')
  })
})
