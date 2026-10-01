import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, QrCode, CheckCircle2, UserCheck, Camera, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import attendanceService, { parseScannedIdentifier, normalizeAttendanceError } from '../../../services/attendanceService'

export default function AttendanceScannerModal({
  isOpen,
  onClose,
  activeEvent,
  activeSession,
  attendanceRecords = [],
  onCheckInSuccess
}) {
  const [manualIdInput, setManualIdInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'duplicate' | 'error', message: string, record?: object }
  const [cameraError, setCameraError] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)

  const isSubmittingRef = useRef(false)
  const html5QrCodeRef = useRef(null)
  const scannerContainerId = 'attendance-qr-reader'

  const isSessionOpen = activeSession?.status === 'open'

  // Clear feedback after temporary delay
  const showFeedback = useCallback((type, message, record = null) => {
    setFeedback({ type, message, record })
  }, [])

  // Core canonical check-in submission handler
  const handleCheckIn = useCallback(async (rawIdentifier, method = 'qr_scan') => {
    if (!activeSession?.id) {
      showFeedback('error', 'No active attendance session selected.')
      return
    }

    if (!isSessionOpen) {
      showFeedback('error', 'Attendance session must be open to record check-in.')
      return
    }

    const identifier = parseScannedIdentifier(rawIdentifier)
    if (!identifier) {
      showFeedback('error', 'Please enter a valid student identifier.')
      return
    }

    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const record = await attendanceService.checkInAttendance(activeSession.id, {
        identifier,
        verification_method: method
      })

      showFeedback('success', `Check-in recorded for student: ${record?.student_id || identifier}`, record)
      setManualIdInput('')

      if (typeof onCheckInSuccess === 'function') {
        await onCheckInSuccess(record)
      }
    } catch (error) {
      const status = error.response?.status || error.status
      if (status === 409) {
        showFeedback('duplicate', 'This student has already checked in for this session.')
      } else {
        const errorMsg = normalizeAttendanceError(error)
        showFeedback('error', errorMsg)
      }
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [activeSession, isSessionOpen, onCheckInSuccess, showFeedback])

  const handleCheckInRef = useRef(handleCheckIn)
  useEffect(() => {
    handleCheckInRef.current = handleCheckIn
  }, [handleCheckIn])

  // Camera scanner lifecycle
  useEffect(() => {
    if (!isOpen || !isSessionOpen) {
      setCameraActive(false)
      return
    }

    let isMounted = true
    setCameraError(null)

    const timer = setTimeout(() => {
      const element = document.getElementById(scannerContainerId)
      if (!element || !isMounted) return

      try {
        const scanner = new Html5Qrcode(scannerContainerId)
        html5QrCodeRef.current = scanner

        scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            if (isMounted && !isSubmittingRef.current) {
              handleCheckInRef.current(decodedText, 'qr_scan')
            }
          },
          () => {
            // Frame parsing errors are normal while scanning
          }
        ).then(() => {
          if (isMounted) {
            setCameraActive(true)
          } else {
            try {
              if (scanner.isScanning) {
                scanner.stop().then(() => {
                  try { scanner.clear() } catch {}
                }).catch(() => {
                  try { scanner.clear() } catch {}
                })
              } else {
                try { scanner.clear() } catch {}
              }
            } catch {}
          }
        }).catch((err) => {
          if (isMounted) {
            setCameraError(err?.message || 'Camera access not available or permission denied.')
            setCameraActive(false)
          }
        })
      } catch (err) {
        if (isMounted) {
          setCameraError(err?.message || 'Unable to initialize camera scanner.')
          setCameraActive(false)
        }
      }
    }, 150)

    return () => {
      isMounted = false
      clearTimeout(timer)
      setCameraActive(false)

      const scanner = html5QrCodeRef.current
      html5QrCodeRef.current = null

      if (scanner) {
        try {
          if (scanner.isScanning) {
            scanner.stop().then(() => {
              try { scanner.clear() } catch {}
            }).catch(() => {
              try { scanner.clear() } catch {}
            })
          } else {
            try { scanner.clear() } catch {}
          }
        } catch {
          try { scanner.clear() } catch {}
        }
      }
    }
  }, [isOpen, isSessionOpen])

  if (!isOpen) return null

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualIdInput.trim() || isSubmitting) return
    handleCheckIn(manualIdInput.trim(), 'manual')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Gateway Header */}
        <div className="p-6 bg-[#EFF7F0] border-b border-[#69A97C] text-[#17663B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] border border-[#B7DDC4] flex items-center justify-center text-[#17663B]">
              <QrCode className="w-5 h-5 text-[#17663B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-[#17663B]">Attendance Verification Scanner</h3>
                {activeSession ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    activeSession.status === 'open'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : activeSession.status === 'closed'
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {activeSession.status?.toUpperCase() || 'SESSION'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF7E6] text-[#795600] border border-[#E5C276] text-[10px] font-bold">
                    No Session Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-[#356148] font-medium">
                {activeEvent?.title || 'Organization Event'} • {activeSession?.session_name || 'Session'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close scanner modal"
            className="p-2 rounded-xl text-[#356148] hover:bg-[#EAF4EC] hover:text-[#17663B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Session Gate Warning */}
        {!isSessionOpen && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {activeSession
                ? `Attendance session is currently "${activeSession.status}". Only "open" sessions accept check-ins.`
                : 'No session is selected. Please select and open an attendance session.'}
            </span>
          </div>
        )}

        {/* Live Feedback Banner */}
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3 text-xs font-semibold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : feedback.type === 'duplicate'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {feedback.type === 'duplicate' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
              {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scanner Viewfinder Box */}
        <div className="p-5 bg-slate-900 text-white flex flex-col items-center justify-center relative min-h-[220px]">
          {isSessionOpen ? (
            <>
              <div className="w-56 h-44 rounded-2xl bg-slate-950 border-2 border-dashed border-emerald-400/80 overflow-hidden relative flex items-center justify-center">
                {/* Dedicated QR Reader element owned solely by Html5Qrcode */}
                <div
                  id={scannerContainerId}
                  className="w-full h-full"
                />

                {/* React-owned Overlay (sibling to reader, never inside reader) */}
                {!cameraActive && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center gap-1.5 pointer-events-none z-10">
                    <Camera className="w-6 h-6 text-emerald-400" />
                    <span className="text-[11px] text-slate-300 font-medium">
                      {cameraError ? 'Camera offline' : 'Starting camera...'}
                    </span>
                    {cameraError && (
                      <span className="text-[10px] text-amber-300 max-w-xs">{cameraError}</span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-center space-y-2">
              <Camera className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">Scanner disabled while session is not open.</p>
            </div>
          )}
        </div>

        {/* Manual Barcode / Student ID Entry */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <label htmlFor="manual-student-id" className="sr-only">Student Institutional ID</label>
            <input
              id="manual-student-id"
              type="text"
              disabled={!isSessionOpen || isSubmitting}
              placeholder="Enter NDMU Student ID (e.g. 2022-01452 or UUID)..."
              value={manualIdInput}
              onChange={(e) => setManualIdInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#16834a] disabled:bg-slate-100 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={!isSessionOpen || !manualIdInput.trim() || isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Record Check-in</span>
              )}
            </button>
          </form>
        </div>

        {/* Canonical Real-time Verified Attendees List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2 max-h-56">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Attendees ({attendanceRecords.length})
            </h4>
            <span className="text-xs font-bold text-[#16834a] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Canonical Live Records</span>
            </span>
          </div>

          {attendanceRecords.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">
              No verified attendance records for this session yet.
            </p>
          ) : (
            attendanceRecords.map((record) => (
              <div
                key={record.id || record.student_id}
                className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {record.student_name || record.full_name || 'NDMU Student'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {record.student_id || record.identifier} • {record.verification_method || 'qr_scan'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                  {record.verified_at || record.checked_in_at || record.timestamp || 'Verified'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Records saved directly to canonical database.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  )
}
