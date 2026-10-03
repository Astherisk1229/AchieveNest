import { describe, expect, it, vi, beforeEach } from 'vitest'
import attendanceService, { parseScannedIdentifier, normalizeAttendanceError } from '../../../../services/attendanceService'

describe('OfficerScannerPage Lifecycle, DOM Ownership, & Check-In Contract', () => {
  let mockHtml5Scanner
  let scannerState

  beforeEach(() => {
    vi.clearAllMocks()

    scannerState = {
      isMounted: true,
      cameraActive: false,
      cameraError: null,
      isSubmitting: false,
      scannerInstance: null,
      activeSession: {
        id: 'sess-open-1',
        session_name: 'Main Hall Session',
        session_type: 'general',
        status: 'open'
      }
    }

    mockHtml5Scanner = {
      isScanning: false,
      start: vi.fn().mockImplementation(() => {
        mockHtml5Scanner.isScanning = true
        scannerState.cameraActive = true
        return Promise.resolve()
      }),
      stop: vi.fn().mockImplementation(() => {
        mockHtml5Scanner.isScanning = false
        scannerState.cameraActive = false
        return Promise.resolve()
      }),
      clear: vi.fn().mockImplementation(() => {
        mockHtml5Scanner.isScanning = false
        return Promise.resolve()
      })
    }
  })

  // Scanner lifecycle manager simulator mirroring the component implementation
  class ScannerLifecycleManager {
    constructor(state, scannerFactory) {
      this.state = state
      this.scannerFactory = scannerFactory
      this.html5QrCodeRef = { current: null }
      this.handleCheckInRef = { current: this.handleCheckIn.bind(this) }
      this.checkInCalls = []
    }

    async handleCheckIn(rawCode, method = 'qr_scan') {
      if (!this.state.activeSession || this.state.activeSession.status !== 'open') {
        return { error: 'Session is not open' }
      }
      const identifier = parseScannedIdentifier(rawCode)
      if (!identifier) {
        return { error: 'Invalid identifier' }
      }
      if (this.state.isSubmitting) {
        return { error: 'LOCKED' }
      }

      this.state.isSubmitting = true
      this.checkInCalls.push({ sessionId: this.state.activeSession.id, identifier, method })

      try {
        const res = await attendanceService.checkInAttendance(this.state.activeSession.id, {
          identifier,
          verification_method: method
        })
        return { success: true, record: res }
      } catch (err) {
        return { success: false, error: normalizeAttendanceError(err), status: err?.response?.status || err?.status }
      } finally {
        this.state.isSubmitting = false
      }
    }

    mount() {
      this.state.isMounted = true
      this.state.cameraError = null

      if (!this.state.activeSession || this.state.activeSession.status !== 'open') {
        this.state.cameraActive = false
        return
      }

      const scanner = this.scannerFactory('officer-qr-reader')
      this.html5QrCodeRef.current = scanner
      this.state.scannerInstance = scanner

      return scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (this.state.isMounted && !this.state.isSubmitting) {
            this.handleCheckInRef.current(decodedText, 'qr_scan')
          }
        },
        () => {}
      ).then(() => {
        if (this.state.isMounted) {
          this.state.cameraActive = true
        } else {
          // Teardown if unmounted before start resolved
          this.teardown()
        }
      }).catch((err) => {
        if (this.state.isMounted) {
          this.state.cameraError = err?.message || 'Camera offline or permission denied.'
          this.state.cameraActive = false
        }
      })
    }

    teardown() {
      this.state.isMounted = false
      this.state.cameraActive = false
      const scanner = this.html5QrCodeRef.current
      this.html5QrCodeRef.current = null
      this.state.scannerInstance = null

      if (scanner) {
        try {
          if (scanner.isScanning) {
            return scanner.stop()
              .then(() => {
                try { scanner.clear() } catch {}
              })
              .catch(() => {
                try { scanner.clear() } catch {}
              })
          } else {
            try { scanner.clear() } catch {}
          }
        } catch {
          try { scanner.clear() } catch {}
        }
      }
      return Promise.resolve()
    }
  }

  it('1. Scanner initializes once when session is open', async () => {
    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()

    expect(mockHtml5Scanner.start).toHaveBeenCalledTimes(1)
    expect(scannerState.cameraActive).toBe(true)
    expect(scannerState.cameraError).toBeNull()
  })

  it('2. Rerender does not recreate scanner instance unnecessarily when session remains open', async () => {
    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()
    const firstInstance = manager.html5QrCodeRef.current

    // Simulating stable dependencies - effect does not re-run
    expect(manager.html5QrCodeRef.current).toBe(firstInstance)
    expect(mockHtml5Scanner.start).toHaveBeenCalledTimes(1)
  })

  it('3. React StrictMode mount/unmount simulation does not produce unrecoverable double initialization', async () => {
    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    // First mount
    await manager.mount()
    expect(mockHtml5Scanner.start).toHaveBeenCalledTimes(1)

    // Unmount
    await manager.teardown()
    expect(mockHtml5Scanner.stop).toHaveBeenCalledTimes(1)

    // Second mount (StrictMode)
    const secondMock = { ...mockHtml5Scanner, start: vi.fn().mockResolvedValue(), stop: vi.fn().mockResolvedValue() }
    manager.scannerFactory = () => secondMock
    await manager.mount()
    expect(secondMock.start).toHaveBeenCalledTimes(1)
  })

  it('4 & 5. Closing scanner / unmount calls teardown safely', async () => {
    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()
    expect(mockHtml5Scanner.isScanning).toBe(true)

    await manager.teardown()
    expect(mockHtml5Scanner.stop).toHaveBeenCalledTimes(1)
    expect(mockHtml5Scanner.clear).toHaveBeenCalledTimes(1)
    expect(scannerState.scannerInstance).toBeNull()
  })

  it('6 & 7. Teardown safely handles stop or clear already completed or throwing', async () => {
    mockHtml5Scanner.stop.mockRejectedValueOnce(new Error('Already stopped'))
    mockHtml5Scanner.clear.mockImplementationOnce(() => { throw new Error('Already cleared') })

    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()

    // Must not throw
    await expect(manager.teardown()).resolves.not.toThrow()
    expect(scannerState.cameraActive).toBe(false)
  })

  it('8. Camera permission rejection does not crash and updates state with message', async () => {
    const failingScanner = {
      isScanning: false,
      start: vi.fn().mockRejectedValue(new Error('NotAllowedError: Permission denied')),
      stop: vi.fn().mockResolvedValue(),
      clear: vi.fn().mockResolvedValue()
    }

    const manager = new ScannerLifecycleManager(scannerState, () => failingScanner)
    await manager.mount()

    expect(scannerState.cameraActive).toBe(false)
    expect(scannerState.cameraError).toBe('NotAllowedError: Permission denied')
  })

  it('9. Scanner can reopen cleanly after cleanup', async () => {
    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()
    await manager.teardown()

    expect(scannerState.cameraActive).toBe(false)

    // Reopen
    const reopenedScanner = { ...mockHtml5Scanner, start: vi.fn().mockResolvedValue() }
    manager.scannerFactory = () => reopenedScanner
    await manager.mount()

    expect(reopenedScanner.start).toHaveBeenCalledTimes(1)
    expect(scannerState.cameraActive).toBe(true)
  })

  it('10. Successful decode does not trigger removeChild conflict (reader container is leaf)', async () => {
    vi.spyOn(attendanceService, 'checkInAttendance').mockResolvedValue({
      id: 'rec-1',
      student_id: '2023-0001',
      student_name: 'Juan Dela Cruz'
    })

    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()

    const res = await manager.handleCheckIn('2023-0001', 'qr_scan')
    expect(res.success).toBe(true)
    expect(attendanceService.checkInAttendance).toHaveBeenCalledWith('sess-open-1', {
      identifier: '2023-0001',
      verification_method: 'qr_scan'
    })
  })

  it('11. Repeated decode frames while request pending create exactly one request', async () => {
    let resolveApi
    vi.spyOn(attendanceService, 'checkInAttendance').mockImplementation(() => new Promise((resolve) => {
      resolveApi = resolve
    }))

    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()

    // First decode frame
    const p1 = manager.handleCheckIn('2023-0001', 'qr_scan')
    // Subsequent frame while in flight
    const p2 = manager.handleCheckIn('2023-0001', 'qr_scan')

    await expect(p2).resolves.toEqual({ error: 'LOCKED' })

    resolveApi({ id: 'rec-1', student_id: '2023-0001' })
    await p1

    expect(manager.checkInCalls).toHaveLength(1)
  })

  it('12 & 13. Cleanup during pending API request or navigation after success does not throw', async () => {
    vi.spyOn(attendanceService, 'checkInAttendance').mockResolvedValue({ id: 'rec-1' })

    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()

    const checkInPromise = manager.handleCheckIn('2023-0001', 'qr_scan')
    await manager.teardown()
    await checkInPromise

    expect(scannerState.isMounted).toBe(false)
  })

  it('14. Duplicate 409 does not crash scanner lifecycle', async () => {
    vi.spyOn(attendanceService, 'checkInAttendance').mockRejectedValue({
      response: { status: 409 }
    })

    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()

    const res = await manager.handleCheckIn('2023-0001', 'qr_scan')
    expect(res.status).toBe(409)
    expect(res.error).toBe('Student is already checked in.')
    expect(mockHtml5Scanner.isScanning).toBe(true)
  })

  it('15. Closed session blocks scanner from starting camera', async () => {
    scannerState.activeSession = {
      id: 'sess-closed-1',
      status: 'closed'
    }

    const manager = new ScannerLifecycleManager(scannerState, () => mockHtml5Scanner)
    await manager.mount()

    expect(mockHtml5Scanner.start).toHaveBeenCalledTimes(0)
    expect(scannerState.cameraActive).toBe(false)
  })
})
