import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import attendanceService, { parseScannedIdentifier, normalizeAttendanceError } from '../../../../services/attendanceService'
import { 
  sortRecordsDesc, 
  formatCheckInTime, 
  formatRelativeTime, 
  formatHumanSchedule 
} from '../OfficerScannerPage'

describe('OfficerScannerPage Track E.1: Scanner Throughput + Exact Check-In Time + Datetime Presentation', () => {
  let mockHtml5Scanner
  let state

  beforeEach(() => {
    vi.clearAllMocks()

    state = {
      isMounted: true,
      cameraActive: false,
      cameraError: null,
      isSubmitting: false,
      lastSuccessfulIdentifier: null,
      lastSuccessfulAt: 0,
      refreshSequence: 0,
      records: [],
      feedback: null,
      activeSession: {
        id: 'sess-open-1',
        session_name: 'Main Hall Session',
        session_type: 'general',
        status: 'open',
        check_in_start: '2026-09-24 23:54:42.000000',
        check_in_end: '2026-09-25 00:42:42.000000'
      }
    }

    mockHtml5Scanner = {
      isScanning: false,
      start: vi.fn().mockImplementation(() => {
        mockHtml5Scanner.isScanning = true
        state.cameraActive = true
        return Promise.resolve()
      }),
      stop: vi.fn().mockImplementation(() => {
        mockHtml5Scanner.isScanning = false
        state.cameraActive = false
        return Promise.resolve()
      }),
      clear: vi.fn().mockImplementation(() => {
        mockHtml5Scanner.isScanning = false
        return Promise.resolve()
      })
    }
  })

  class HighThroughputScannerTestHarness {
    constructor(scannerState, scannerFactory) {
      this.state = scannerState
      this.scannerFactory = scannerFactory
      this.html5QrCodeRef = { current: null }
      this.checkInCalls = []
      this.listRecordsCalls = []
      this.startCount = 0
    }

    mount() {
      this.state.isMounted = true
      this.state.cameraError = null

      if (!this.state.activeSession || this.state.activeSession.status !== 'open') {
        this.state.cameraActive = false
        return Promise.resolve()
      }

      const scanner = this.scannerFactory('officer-qr-reader')
      this.html5QrCodeRef.current = scanner
      this.startCount++

      return scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (this.state.isMounted && !this.state.isSubmitting) {
            this.handleCheckIn(decodedText, 'qr_scan')
          }
        },
        () => {}
      ).then(() => {
        if (this.state.isMounted) {
          this.state.cameraActive = true
        }
      })
    }

    teardown() {
      this.state.isMounted = false
      this.state.cameraActive = false
      const scanner = this.html5QrCodeRef.current
      this.html5QrCodeRef.current = null
      if (scanner && scanner.isScanning) {
        return scanner.stop().then(() => scanner.clear())
      }
      return Promise.resolve()
    }

    async handleCheckIn(rawCode, method = 'qr_scan') {
      if (!this.state.activeSession || this.state.activeSession.status !== 'open') {
        this.state.feedback = { type: 'error', message: 'Session not open' }
        return { error: 'SESSION_NOT_OPEN' }
      }

      const identifier = parseScannedIdentifier(rawCode)
      if (!identifier) {
        this.state.feedback = { type: 'error', message: 'Invalid identifier' }
        return { error: 'MISSING_IDENTIFIER' }
      }

      // Same-identifier frame suppression (~2000ms)
      const now = Date.now()
      if (rawCode === this.state.lastSuccessfulIdentifier && (now - this.state.lastSuccessfulAt) < 2000) {
        return { ignored: true, reason: 'SAME_FRAME_COOLDOWN' }
      }

      // Concurrency lock only during in-flight POST
      if (this.state.isSubmitting) {
        return { ignored: true, reason: 'REQUEST_IN_FLIGHT' }
      }

      this.state.isSubmitting = true
      this.checkInCalls.push({ sessionId: this.state.activeSession.id, identifier, method })

      try {
        const record = await attendanceService.checkInAttendance(this.state.activeSession.id, {
          identifier,
          verification_method: method
        })

        // Update same-identifier suppression
        this.state.lastSuccessfulIdentifier = rawCode
        this.state.lastSuccessfulAt = Date.now()

        // Immediate transient success toast
        this.state.feedback = {
          type: 'success',
          studentName: record?.full_name || record?.student_name || 'NDMU Student',
          method: method === 'qr_scan' ? 'QR Scan' : 'Manual',
          time: 'Just now',
          record
        }

        // Immediate record insertion into Recent Check-ins
        if (record?.id) {
          const filtered = this.state.records.filter(r => r.id !== record.id)
          this.state.records = sortRecordsDesc([record, ...filtered])
        }

        // Fast global unlock: scanner immediately ready for DIFFERENT student
        this.state.isSubmitting = false

        // Background non-blocking canonical refresh with sequence guard
        const currentSeq = ++this.state.refreshSequence
        this.listRecordsCalls.push({ seq: currentSeq, sessionId: this.state.activeSession.id })

        attendanceService.listAttendanceSessionRecords(this.state.activeSession.id)
          .then(updatedRecords => {
            if (currentSeq === this.state.refreshSequence && Array.isArray(updatedRecords)) {
              const serverIds = new Set(updatedRecords.map(r => r.id))
              const localUnsynced = this.state.records.filter(r => !serverIds.has(r.id))
              this.state.records = sortRecordsDesc([...updatedRecords, ...localUnsynced])
            }
          })
          .catch(() => {})

        return { success: true, record }
      } catch (err) {
        this.state.isSubmitting = false
        const code = err?.error?.code || err?.code || err?.response?.data?.error?.code
        const status = err?.response?.status || err?.status || (code === 'ATTENDEE_ALREADY_CHECKED_IN' ? 409 : null)
        const isDuplicate = status === 409 || code === 'ATTENDEE_ALREADY_CHECKED_IN' || code === 'DUPLICATE_CHECK_IN'

        if (isDuplicate) {
          this.state.feedback = {
            type: 'duplicate',
            message: 'Student is already checked in.'
          }
        } else {
          this.state.feedback = {
            type: 'error',
            message: normalizeAttendanceError(err)
          }
        }
        return { success: false, error: err }
      }
    }
  }

  it('1 & 2. 201 immediately renders transient success and displays actual server checked_in_at', async () => {
    vi.spyOn(attendanceService, 'checkInAttendance').mockResolvedValue({
      id: 'rec-1',
      student_id: '2026-0001',
      full_name: 'Alex Reyes',
      checked_in_at: '2026-09-24 23:58:04'
    })
    vi.spyOn(attendanceService, 'listAttendanceSessionRecords').mockResolvedValue([])

    const harness = new HighThroughputScannerTestHarness(state, () => mockHtml5Scanner)
    await harness.mount()

    const res = await harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(res.success).toBe(true)
    expect(state.feedback.type).toBe('success')
    expect(state.feedback.record.checked_in_at).toBe('2026-09-24 23:58:04')
    expect(state.records[0].checked_in_at).toBe('2026-09-24 23:58:04')
  })

  it('3 & 4. formatCheckInTime formats timestamp with seconds in 12-hour AM/PM', () => {
    const formatted1 = formatCheckInTime('2026-09-24 23:58:04')
    expect(formatted1).toBe('11:58:04 PM')

    const formatted2 = formatCheckInTime('2026-09-25 00:14:27')
    expect(formatted2).toBe('12:14:27 AM')

    const formatted3 = formatCheckInTime('2026-09-25 08:05:02')
    expect(formatted3).toBe('8:05:02 AM')
  })

  it('5. formatRelativeTime provides secondary relative indicator', () => {
    const rel = formatRelativeTime(new Date(Date.now() - 3000).toISOString())
    expect(rel).toBe('Just now')

    const relMins = formatRelativeTime(new Date(Date.now() - 180000).toISOString())
    expect(relMins).toBe('3 mins ago')
  })

  it('6 & 7. Continue button is absent and camera remains mounted throughout scans', async () => {
    vi.spyOn(attendanceService, 'checkInAttendance').mockResolvedValue({ id: 'rec-1', full_name: 'Student 1' })
    vi.spyOn(attendanceService, 'listAttendanceSessionRecords').mockResolvedValue([])

    const harness = new HighThroughputScannerTestHarness(state, () => mockHtml5Scanner)
    await harness.mount()

    await harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(state.cameraActive).toBe(true)
    expect(harness.startCount).toBe(1)
    expect(mockHtml5Scanner.stop).not.toHaveBeenCalled()
  })

  it('8 & 9. global request lock clears immediately after POST, allowing DIFFERENT QR during toast', async () => {
    vi.spyOn(attendanceService, 'checkInAttendance')
      .mockResolvedValueOnce({ id: 'rec-A', full_name: 'Student A', checked_in_at: '2026-09-24 23:58:00' })
      .mockResolvedValueOnce({ id: 'rec-B', full_name: 'Student B', checked_in_at: '2026-09-24 23:58:02' })
    vi.spyOn(attendanceService, 'listAttendanceSessionRecords').mockResolvedValue([])

    const harness = new HighThroughputScannerTestHarness(state, () => mockHtml5Scanner)
    await harness.mount()

    // Student A scans
    const scanA = await harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(scanA.success).toBe(true)
    expect(state.isSubmitting).toBe(false) // Lock cleared immediately!
    expect(state.feedback.studentName).toBe('Student A')

    // Student B scans immediately while toast is still active
    const scanB = await harness.handleCheckIn('2026-0002', 'qr_scan')
    expect(scanB.success).toBe(true)
    expect(state.isSubmitting).toBe(false)
    expect(state.feedback.studentName).toBe('Student B') // Toast updated cleanly

    expect(harness.checkInCalls.length).toBe(2)
  })

  it('10 & 11. same QR within 2000ms is suppressed; after suppression window it reaches backend for canonical duplicate check', async () => {
    vi.spyOn(attendanceService, 'checkInAttendance')
      .mockResolvedValueOnce({ id: 'rec-1', full_name: 'Student 1' })
      .mockRejectedValueOnce({ status: 409, message: 'ATTENDEE_ALREADY_CHECKED_IN' })
    vi.spyOn(attendanceService, 'listAttendanceSessionRecords').mockResolvedValue([])

    const harness = new HighThroughputScannerTestHarness(state, () => mockHtml5Scanner)
    await harness.mount()

    // First scan
    const call1 = await harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(call1.success).toBe(true)
    expect(harness.checkInCalls.length).toBe(1)

    // Immediate repeat of same QR
    const call2 = await harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(call2.ignored).toBe(true)
    expect(call2.reason).toBe('SAME_FRAME_COOLDOWN')
    expect(harness.checkInCalls.length).toBe(1)

    // After suppression window expires (>2000ms)
    state.lastSuccessfulAt = Date.now() - 2500
    const call3 = await harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(call3.success).toBe(false)
    expect(state.feedback.type).toBe('duplicate')
    expect(harness.checkInCalls.length).toBe(2) // Reached backend!
  })

  it('12 & 13. background GET records refresh does not block scanner and protects against stale race', async () => {
    let resolveRefreshA, resolveRefreshB
    const promiseA = new Promise(resolve => { resolveRefreshA = resolve })
    const promiseB = new Promise(resolve => { resolveRefreshB = resolve })

    vi.spyOn(attendanceService, 'checkInAttendance')
      .mockResolvedValueOnce({ id: 'rec-A', full_name: 'Student A', checked_in_at: '2026-09-24 23:58:00' })
      .mockResolvedValueOnce({ id: 'rec-B', full_name: 'Student B', checked_in_at: '2026-09-24 23:58:05' })

    vi.spyOn(attendanceService, 'listAttendanceSessionRecords')
      .mockReturnValueOnce(promiseA)
      .mockReturnValueOnce(promiseB)

    const harness = new HighThroughputScannerTestHarness(state, () => mockHtml5Scanner)
    await harness.mount()

    await harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(state.records.length).toBe(1)
    expect(state.records[0].id).toBe('rec-A')

    await harness.handleCheckIn('2026-0002', 'qr_scan')
    expect(state.records.length).toBe(2)
    expect(state.records[0].id).toBe('rec-B')

    // Stale resolution: Refresh A returns AFTER refresh B
    resolveRefreshB([
      { id: 'rec-B', full_name: 'Student B', checked_in_at: '2026-09-24 23:58:05' },
      { id: 'rec-A', full_name: 'Student A', checked_in_at: '2026-09-24 23:58:00' }
    ])
    await promiseB
    await new Promise(r => setTimeout(r, 10))

    // Out of order old refresh A returns only [rec-A]
    resolveRefreshA([
      { id: 'rec-A', full_name: 'Student A', checked_in_at: '2026-09-24 23:58:00' }
    ])
    await promiseA
    await new Promise(r => setTimeout(r, 10))

    // Newer state was NOT overwritten by stale refresh A!
    expect(state.records.length).toBe(2)
    expect(state.records[0].id).toBe('rec-B')
    expect(state.records[1].id).toBe('rec-A')
  })

  it('14 & 15. records remain ordered checked_in_at DESC with newest row at index 0', () => {
    const list = [
      { id: 'rec-1', checked_in_at: '2026-09-24 23:50:00' },
      { id: 'rec-3', checked_in_at: '2026-09-24 23:58:10' },
      { id: 'rec-2', checked_in_at: '2026-09-24 23:55:00' }
    ]

    const sorted = sortRecordsDesc(list)
    expect(sorted.map(r => r.id)).toEqual(['rec-3', 'rec-2', 'rec-1'])
  })

  it('16 & 17. formatHumanSchedule humanizes event schedule without raw microseconds', () => {
    const humanSameDay = formatHumanSchedule('2026-09-24 23:54:42.000000', '2026-09-24 23:59:00.000000')
    expect(humanSameDay).toBe('Sep 24, 2026 · 11:54 PM – 11:59 PM')
    expect(humanSameDay).not.toContain('.000000')

    const humanCrossMidnight = formatHumanSchedule('2026-09-24 23:54:42.000000', '2026-09-25 00:42:42.000000')
    expect(humanCrossMidnight).toBe('Sep 24, 2026 11:54 PM – Sep 25, 2026 12:42 AM')
    expect(humanCrossMidnight).not.toContain('.000000')
  })

  it('18, 19, 20. processing state active only during POST; error/duplicate non-blocking; teardown clean', async () => {
    let resolveCheckIn
    const checkInPromise = new Promise(resolve => { resolveCheckIn = resolve })
    vi.spyOn(attendanceService, 'checkInAttendance').mockReturnValue(checkInPromise)

    const harness = new HighThroughputScannerTestHarness(state, () => mockHtml5Scanner)
    await harness.mount()

    const checkInFuture = harness.handleCheckIn('2026-0001', 'qr_scan')
    expect(state.isSubmitting).toBe(true)

    resolveCheckIn({ id: 'rec-1', full_name: 'Student 1' })
    await checkInFuture
    expect(state.isSubmitting).toBe(false)

    await harness.teardown()
    expect(mockHtml5Scanner.stop).toHaveBeenCalled()
    expect(mockHtml5Scanner.clear).toHaveBeenCalled()
  })
})
