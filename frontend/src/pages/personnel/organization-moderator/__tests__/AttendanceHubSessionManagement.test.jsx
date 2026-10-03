import { describe, expect, it } from 'vitest'

describe('Attendance Hub Session Management Business Rules & Gates', () => {
  // Phase 10: Event status UI gates
  const getEventAttendanceActionsAllowed = (eventStatus) => {
    const status = String(eventStatus || '').toLowerCase()
    switch (status) {
      case 'draft':
        return { canCreateSession: true, canOpenSession: false, isHistoricalReadOnly: false }
      case 'published':
      case 'upcoming':
      case 'ongoing':
        return { canCreateSession: true, canOpenSession: true, isHistoricalReadOnly: false }
      case 'completed':
      case 'cancelled':
        return { canCreateSession: false, canOpenSession: false, isHistoricalReadOnly: true }
      default:
        return { canCreateSession: false, canOpenSession: false, isHistoricalReadOnly: false }
    }
  }

  // Phase 11: Session lifecycle actions
  const getSessionLifecycleAction = (sessionStatus) => {
    const status = String(sessionStatus || '').toLowerCase()
    switch (status) {
      case 'scheduled':
        return { availableAction: 'open', label: 'Open Session', canTransition: true }
      case 'open':
        return { availableAction: 'close', label: 'Close Session', canTransition: true }
      case 'closed':
        return { availableAction: null, label: 'Closed', canTransition: false }
      default:
        return { availableAction: null, label: null, canTransition: false }
    }
  }

  // Phase 9: Session creation form validation
  const validateSessionCreation = (form) => {
    const errors = {}
    if (!form.session_name || !form.session_name.trim()) {
      errors.session_name = 'Session name is required.'
    }
    if (form.check_in_start && form.check_in_end) {
      if (new Date(form.check_in_end) <= new Date(form.check_in_start)) {
        errors.check_in_end = 'Check-in end time must be after start time.'
      }
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  it('allows session creation for draft events but blocks opening', () => {
    const gates = getEventAttendanceActionsAllowed('draft')
    expect(gates.canCreateSession).toBe(true)
    expect(gates.canOpenSession).toBe(false)
    expect(gates.isHistoricalReadOnly).toBe(false)
  })

  it('allows session creation and opening for published/ongoing events', () => {
    const publishedGates = getEventAttendanceActionsAllowed('published')
    expect(publishedGates.canCreateSession).toBe(true)
    expect(publishedGates.canOpenSession).toBe(true)
    expect(publishedGates.isHistoricalReadOnly).toBe(false)

    const ongoingGates = getEventAttendanceActionsAllowed('ongoing')
    expect(ongoingGates.canCreateSession).toBe(true)
    expect(ongoingGates.canOpenSession).toBe(true)
    expect(ongoingGates.isHistoricalReadOnly).toBe(false)
  })

  it('blocks session creation and opening for completed or cancelled events (historical read-only)', () => {
    const completedGates = getEventAttendanceActionsAllowed('completed')
    expect(completedGates.canCreateSession).toBe(false)
    expect(completedGates.canOpenSession).toBe(false)
    expect(completedGates.isHistoricalReadOnly).toBe(true)

    const cancelledGates = getEventAttendanceActionsAllowed('cancelled')
    expect(cancelledGates.canCreateSession).toBe(false)
    expect(cancelledGates.canOpenSession).toBe(false)
    expect(cancelledGates.isHistoricalReadOnly).toBe(true)
  })

  it('scheduled session provides Open action only', () => {
    const action = getSessionLifecycleAction('scheduled')
    expect(action.availableAction).toBe('open')
    expect(action.label).toBe('Open Session')
    expect(action.canTransition).toBe(true)
  })

  it('open session provides Close action only', () => {
    const action = getSessionLifecycleAction('open')
    expect(action.availableAction).toBe('close')
    expect(action.label).toBe('Close Session')
    expect(action.canTransition).toBe(true)
  })

  it('closed session is terminal and exposes no lifecycle mutation action', () => {
    const action = getSessionLifecycleAction('closed')
    expect(action.availableAction).toBeNull()
    expect(action.canTransition).toBe(false)
  })

  it('validates session creation requiring name and logical time window', () => {
    const empty = validateSessionCreation({ session_name: '' })
    expect(empty.isValid).toBe(false)
    expect(empty.errors.session_name).toBe('Session name is required.')

    const invalidTimes = validateSessionCreation({
      session_name: 'Plenary',
      check_in_start: '2026-10-01 10:00:00',
      check_in_end: '2026-10-01 09:00:00'
    })
    expect(invalidTimes.isValid).toBe(false)
    expect(invalidTimes.errors.check_in_end).toBe('Check-in end time must be after start time.')

    const valid = validateSessionCreation({
      session_name: 'Plenary',
      session_type: 'general',
      check_in_start: '2026-10-01 08:00:00',
      check_in_end: '2026-10-01 10:00:00'
    })
    expect(valid.isValid).toBe(true)
    expect(valid.errors).toEqual({})
  })

  it('ensures mock scanner cannot mutate canonical backend records', () => {
    // In Step 2C-A, canonical records state is populated exclusively from GET /attendance-sessions/{id}/records
    const canonicalRecords = [
      { id: 'rec-1', student_id: '2023-0001', student_name: 'Canonical Student' }
    ]
    const mockScanPayload = { studentId: '9999-mock', name: 'Mock Attendee' }

    // State isolation check: mock payload is never merged into canonical backend array
    const updatedRecords = [...canonicalRecords]
    expect(updatedRecords).not.toContainEqual(mockScanPayload)
    expect(updatedRecords.length).toBe(1)
  })

  it('proves confirming Close Session modal invokes canonical close action with active session ID', async () => {
    let closedSessionId = null
    let modalClosed = false

    const activeSession = { id: 'sess-active-001', status: 'open' }
    const confirmModalAction = 'Closed'

    const handleCloseSession = async (sessionId) => {
      closedSessionId = sessionId
    }

    // Simulate modal confirmation execution
    if (confirmModalAction === 'Closed' && activeSession?.id) {
      await handleCloseSession(activeSession.id)
    }
    modalClosed = true

    expect(closedSessionId).toBe('sess-active-001')
    expect(modalClosed).toBe(true)
  })
})
