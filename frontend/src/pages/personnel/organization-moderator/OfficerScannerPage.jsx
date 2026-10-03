import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  QrCode, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  UserCheck, 
  Building2, 
  AlertCircle, 
  AlertTriangle,
  ChevronLeft,
  Users,
  Camera,
  Loader2
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

import attendanceService, { parseScannedIdentifier, normalizeAttendanceError } from '../../../services/attendanceService'
import eventService from '../../../services/eventService'
import { AchieveNestLogo } from '../../../components/brand'

/**
 * Deterministically sort attendance records by checked_in_at descending (newest first).
 */
export function sortRecordsDesc(recordList) {
  if (!Array.isArray(recordList)) return []
  return [...recordList].sort((a, b) => {
    const timeA = new Date(String(a.checked_in_at || a.verified_at || a.created_at || 0).replace(' ', 'T')).getTime()
    const timeB = new Date(String(b.checked_in_at || b.verified_at || b.created_at || 0).replace(' ', 'T')).getTime()
    return timeB - timeA
  })
}

/**
 * Format timestamp to 12-hour wall-clock time string with seconds (e.g., "11:58:04 PM", "12:14:27 AM").
 */
export function formatCheckInTime(dateStr) {
  if (!dateStr) return 'Just now'
  try {
    const d = new Date(String(dateStr).replace(' ', 'T'))
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  } catch {
    return dateStr
  }
}

/**
 * Format relative elapsed time (e.g., "Just now", "2 mins ago", "1 hr ago", "Yesterday").
 */
export function formatRelativeTime(dateStr, nowTimestamp = Date.now()) {
  if (!dateStr) return 'Just now'
  try {
    const normalized = String(dateStr).trim().replace(' ', 'T')
    const institutionalTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(normalized)
      ? `${normalized}+08:00`
      : normalized
    const d = new Date(institutionalTimestamp)
    if (isNaN(d.getTime())) return 'Just now'
    const diffSecs = Math.floor((nowTimestamp - d.getTime()) / 1000)
    if (diffSecs < 60) return 'Just now'
    const mins = Math.floor(diffSecs / 60)
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
    if (hours < 48) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Just now'
  }
}

/**
 * Format human-readable event / session schedule range (e.g., "Sep 24, 2026 · 11:54 PM – 12:42 AM").
 */
export function formatHumanSchedule(startStr, endStr) {
  if (!startStr) return 'Schedule'
  try {
    const dStart = new Date(String(startStr).replace(' ', 'T'))
    if (isNaN(dStart.getTime())) return startStr
    const startFormat = dStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const startDate = dStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    if (!endStr) return `${startDate} · ${startFormat}`

    const dEnd = new Date(String(endStr).replace(' ', 'T'))
    if (isNaN(dEnd.getTime())) return `${startDate} · ${startFormat}`
    const endFormat = dEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const endDate = dEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    if (startDate === endDate) {
      return `${startDate} · ${startFormat} – ${endFormat}`
    }
    return `${startDate} ${startFormat} – ${endDate} ${endFormat}`
  } catch {
    return `${startStr} – ${endStr}`
  }
}

export default function OfficerScannerPage() {
  const { eventId } = useParams()
  const activeEventId = eventId || ''

  // Canonical state
  const [eventData, setEventData] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // Scanner & Form state
  const [manualBarcode, setManualBarcode] = useState('')
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'duplicate' | 'error', message?: string, studentName?: string, method?: string, time?: string, record?: object, persistent?: boolean }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [highlightedRecordId, setHighlightedRecordId] = useState(null)

  const isSubmittingRef = useRef(false)
  const html5QrCodeRef = useRef(null)
  const feedbackTimeoutRef = useRef(null)
  const highlightTimeoutRef = useRef(null)
  const lastSuccessfulIdentifierRef = useRef(null)
  const lastSuccessfulAtRef = useRef(0)
  const refreshSequenceRef = useRef(0)
  const scannerContainerId = 'officer-qr-reader'

  // Lightweight page-level presentation timer for live relative-time recalculation (30s interval)
  const [, setRelativeTimeTick] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTimeTick(Date.now())
    }, 30000)

    return () => clearInterval(timer)
  }, [])

  // Synthesize success chime sound using Web Audio API
  const playSuccessChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1) // D6
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {
      // AudioContext fallback ignored
    }
  }

  // Load event details, attendance sessions, and initial records
  const loadEventAndSessions = useCallback(async () => {
    if (!activeEventId) return
    setLoading(true)
    try {
      const [allEvents, sessionList] = await Promise.all([
        eventService.list().catch(() => []),
        attendanceService.listEventAttendanceSessions(activeEventId).catch(() => [])
      ])

      const evt = allEvents.find(e => String(e.id) === String(activeEventId)) || {
        id: activeEventId,
        title: 'Organization Event',
        event_type: 'General',
        venue: 'NDMU Campus'
      }
      setEventData(evt)
      setSessions(sessionList)

      // Select active open session or the first session
      const openSess = sessionList.find(s => s.status === 'open') || sessionList[0] || null
      setActiveSession(openSess)

      if (openSess?.id) {
        const recs = await attendanceService.listAttendanceSessionRecords(openSess.id).catch(() => [])
        setRecords(sortRecordsDesc(recs))
      } else {
        setRecords([])
      }
    } catch {
      // Network failure fallback
    } finally {
      setLoading(false)
    }
  }, [activeEventId])

  useEffect(() => {
    loadEventAndSessions()
  }, [loadEventAndSessions])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    }
  }, [])

  // Select a specific session
  const handleSelectSession = async (sess) => {
    setActiveSession(sess)
    setFeedback(null)
    if (sess?.id) {
      try {
        const recs = await attendanceService.listAttendanceSessionRecords(sess.id)
        setRecords(sortRecordsDesc(recs))
      } catch {
        setRecords([])
      }
    }
  }

  // High-throughput continuous check-in submission handler
  const handleCheckIn = useCallback(async (rawCode, method = 'qr_scan') => {
    if (!activeSession?.id) {
      setFeedback({ type: 'error', message: 'No attendance session available.' })
      return
    }

    if (activeSession.status !== 'open') {
      setFeedback({ type: 'error', message: `Attendance session is "${activeSession.status}". Only "open" sessions allow check-in.` })
      return
    }

    const identifier = parseScannedIdentifier(rawCode)
    if (!identifier) {
      setFeedback({ type: 'error', message: 'Please enter a valid student identifier.' })
      return
    }

    // Independent same-identifier suppression (~2000ms for ONLY that identifier)
    const now = Date.now()
    if (rawCode === lastSuccessfulIdentifierRef.current && (now - lastSuccessfulAtRef.current) < 2000) {
      return
    }

    // Global concurrency request lock (only while POST is actually pending)
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      const record = await attendanceService.checkInAttendance(activeSession.id, {
        identifier,
        verification_method: method
      })

      // Update same-identifier suppression guard
      lastSuccessfulIdentifierRef.current = rawCode
      lastSuccessfulAtRef.current = Date.now()

      playSuccessChime()

      const studentDisplayName = record?.full_name || record?.student_name || 'NDMU Student'
      const methodLabel = method === 'qr_scan' ? 'QR Scan' : 'Manual'

      // Transient non-blocking success notification (updates cleanly if new student scans)
      setFeedback({
        type: 'success',
        studentName: studentDisplayName,
        method: methodLabel,
        time: 'Just now',
        record
      })

      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(prev => (prev?.type === 'success' ? null : prev))
      }, 1400)

      setManualBarcode('')

      // Immediately insert returned canonical record at top of Recent Check-ins
      if (record?.id) {
        setRecords(prev => {
          const filtered = prev.filter(r => r.id !== record.id)
          return sortRecordsDesc([record, ...filtered])
        })

        setHighlightedRecordId(record.id)
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedRecordId(null)
        }, 1500)
      }

      // Fast global unlock: scanner is immediately ready for next student (0ms delay)
      isSubmittingRef.current = false
      setIsSubmitting(false)

      // Concurrent background canonical records refresh with stale-race protection
      const currentRefreshSeq = ++refreshSequenceRef.current
      attendanceService.listAttendanceSessionRecords(activeSession.id)
        .then(updatedRecords => {
          if (currentRefreshSeq === refreshSequenceRef.current && Array.isArray(updatedRecords)) {
            setRecords(prev => {
              // Merge server records with any locally present un-refreshed items
              const serverIds = new Set(updatedRecords.map(r => r.id))
              const localUnsynced = prev.filter(r => !serverIds.has(r.id))
              return sortRecordsDesc([...updatedRecords, ...localUnsynced])
            })
          }
        })
        .catch(() => {})

    } catch (error) {
      const code = error?.error?.code || error?.code || error?.response?.data?.error?.code
      const status = error?.response?.status || error?.status || (code === 'ATTENDEE_ALREADY_CHECKED_IN' ? 409 : null)
      const isDuplicate = status === 409 || code === 'ATTENDEE_ALREADY_CHECKED_IN' || code === 'DUPLICATE_CHECK_IN'

      if (isDuplicate) {
        setFeedback({
          type: 'duplicate',
          message: 'Student is already checked in.'
        })
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedback(prev => (prev?.type === 'duplicate' ? null : prev))
        }, 2000)
      } else {
        const msg = normalizeAttendanceError(error)
        setFeedback({
          type: 'error',
          message: msg,
          persistent: Boolean(status && status >= 500)
        })

        if (!status || status < 500) {
          if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
          feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback(prev => (prev?.type === 'error' && !prev?.persistent ? null : prev))
          }, 2500)
        }
      }

      // Fast release on error
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [activeSession])

  const handleCheckInRef = useRef(handleCheckIn)
  useEffect(() => {
    handleCheckInRef.current = handleCheckIn
  }, [handleCheckIn])

  // Camera scanner lifecycle
  useEffect(() => {
    const isSessionOpen = activeSession?.status === 'open'
    if (!isSessionOpen) {
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
            // Frame parsing errors are ignored while waiting for valid QR
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
            setCameraError(err?.message || 'Camera offline or permission denied.')
            setCameraActive(false)
          }
        })
      } catch (err) {
        if (isMounted) {
          setCameraError(err?.message || 'Unable to start camera scanner.')
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
  }, [activeSession?.id, activeSession?.status])

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualBarcode.trim() || isSubmitting) return
    handleCheckIn(manualBarcode.trim(), 'manual')
  }

  const isSessionOpen = activeSession?.status === 'open'

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-[#16834a] selection:text-white pb-12">
      
      {/* Top Mobile Gateway Bar */}
      <div className="bg-[#EFF7F0] border-b border-[#69A97C] p-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/personnel/organization-moderator" className="p-1.5 rounded-lg bg-white text-[#17663B] hover:bg-[#EAF4EC] transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="rounded-lg bg-white px-2 py-1"><AchieveNestLogo variant="horizontal" size="compact" /></div>
            <div>
              <h1 className="font-extrabold text-sm text-[#17663B] tracking-tight leading-tight">Attendance Gateway</h1>
              <p className="text-[10px] text-[#356148] font-bold uppercase tracking-wider">NDMU Official Scanner</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
              isSessionOpen
                ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                : activeSession?.status === 'closed'
                ? 'bg-slate-700 text-slate-300'
                : 'bg-amber-400 text-slate-950 font-bold'
            }`}>
              {isSessionOpen ? '● LIVE SCANNER' : activeSession?.status === 'closed' ? 'CLOSED' : '🔒 SCHEDULED'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-5">
        
        {/* Event Meta Card */}
        <div className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700/80 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span>{eventData?.event_type || eventData?.category || 'Organization Event'}</span>
            <span className="text-slate-400 font-medium">Canonical Hub</span>
          </div>
          <h2 className="text-lg font-extrabold text-white leading-snug">{eventData?.title || 'Loading event...'}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {activeSession ? formatHumanSchedule(activeSession.check_in_start, activeSession.check_in_end) : 'Schedule'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {eventData?.venue || 'NDMU Venue'}
            </span>
          </div>

          {/* Session Switcher if multiple sessions exist */}
          {sessions.length > 1 && (
            <div className="pt-3 border-t border-slate-700/60 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Sessions:</span>
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer ${
                    activeSession?.id === s.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {s.session_name} ({s.status})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SCANNER WORKSPACE                                                         */}
        {/* ========================================================================= */}
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* Active Session Info Bar */}
          {activeSession && (
            <div className="p-3.5 bg-emerald-950/80 rounded-2xl border border-emerald-800 text-white flex items-center justify-between text-xs shadow-lg">
              <div>
                <span className="font-extrabold text-white text-xs">{activeSession.session_name}</span>
                <p className="text-[10px] text-emerald-300/80 font-medium capitalize">
                  Type: {activeSession.session_type} • Status: {activeSession.status}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isSessionOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              }`}>
                {activeSession.status?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Transient Success Notification Toast (Non-blocking, updates on consecutive scans) */}
          {feedback && feedback.type === 'success' && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-100 flex items-center gap-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  ✓ CHECK-IN VERIFIED
                </span>
                <p className="font-extrabold text-sm text-white truncate">
                  {feedback.studentName || 'NDMU Student'}
                </p>
                <p className="text-[10px] text-emerald-300/80 font-medium">
                  {feedback.method || 'QR Scan'} • {feedback.time || 'Just now'}
                </p>
              </div>
            </div>
          )}

          {/* Duplicate or Error Feedback Toast */}
          {feedback && feedback.type !== 'success' && (
            <div
              role="status"
              aria-live="polite"
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-xl animate-in fade-in duration-200 ${
                feedback.type === 'duplicate'
                  ? 'bg-amber-950/90 border-amber-500/80 text-amber-200'
                  : 'bg-rose-950/90 border-rose-500/80 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === 'duplicate' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Camera Scanner Container */}
          <div className="bg-slate-950 rounded-3xl border-2 border-emerald-500/50 p-5 text-center space-y-4 shadow-2xl relative overflow-hidden">
            {/* Corner Targets */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400 pointer-events-none"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400 pointer-events-none"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400 pointer-events-none"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400 pointer-events-none"></div>

            {/* Viewfinder Graphic / Camera Element */}
            {isSessionOpen ? (
              <>
                <div className="w-56 h-48 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 mx-auto relative overflow-hidden flex items-center justify-center">
                  {/* Empty QR Reader element owned by Html5Qrcode */}
                  <div
                    id={scannerContainerId}
                    className="w-full h-full"
                  />

                  {/* React-owned Overlay (sibling to reader, never inside reader) */}
                  {!cameraActive && (
                    <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-3 text-center gap-1.5 pointer-events-none z-10">
                      <Camera className="w-8 h-8 text-emerald-400 mx-auto" />
                      <span className="text-[10px] font-bold text-emerald-300 block">
                        {cameraError ? 'Camera Unavailable' : 'Initializing Camera...'}
                      </span>
                      {cameraError && (
                        <p className="text-[9px] text-amber-300 max-w-xs">{cameraError}</p>
                      )}
                    </div>
                  )}

                  {/* Processing indicator ONLY while network POST is genuinely pending */}
                  {isSubmitting && (
                    <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-400/60 text-emerald-200 text-xs font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>VERIFYING...</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 space-y-3">
                <Lock className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="font-extrabold text-sm text-white">Scanner Locked</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeSession
                    ? `This session is currently "${activeSession.status}". Please open the session from the dashboard to start scanning.`
                    : 'No attendance session configured for this event.'}
                </p>
              </div>
            )}

            {/* Manual Barcode Input Form */}
            <div className="pt-2 space-y-2 text-left">
              <label htmlFor="officer-manual-barcode" className="text-xs font-bold text-slate-300 block">
                Scan or Enter NDMU Student ID:
              </label>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  id="officer-manual-barcode"
                  type="text"
                  disabled={!isSessionOpen || isSubmitting}
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g. 2022-01452 or Profile UUID"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:bg-slate-900/50 disabled:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!isSessionOpen || !manualBarcode.trim() || isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-bold text-xs transition shrink-0 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Check In</span>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RECENT CHECK-INS SECTION (Canonical Attendance Feed)                     */}
          {/* ========================================================================= */}
          <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Recent Check-ins · {records.length}
              </h3>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {loading && records.length === 0 ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Loading recent check-ins...</span>
                </div>
              ) : records.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 font-medium">
                  No students have checked in yet.
                </p>
              ) : (
                records.map((rec) => {
                  const isHighlighted = highlightedRecordId === rec.id
                  const displayName = rec.full_name || rec.student_name || 'NDMU Student'
                  const methodText = (rec.verification_method || 'qr_scan') === 'manual' ? 'Manual' : 'QR Scan'
                  const displayTime = formatCheckInTime(rec.checked_in_at || rec.verified_at)
                  const relativeTime = formatRelativeTime(rec.checked_in_at || rec.verified_at)

                  return (
                    <div
                      key={rec.id || `${rec.attendee_profile_id}-${rec.checked_in_at}`}
                      className={`p-3 rounded-2xl border transition-all duration-500 flex items-center justify-between gap-3 text-xs ${
                        isHighlighted
                          ? 'bg-emerald-950/80 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.01]'
                          : 'bg-slate-900/80 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs shrink-0 transition-colors ${
                          isHighlighted
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                            : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400 font-bold'
                        }`}>
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-white truncate text-xs">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {methodText}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-white block">
                          {displayTime}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {relativeTime}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
