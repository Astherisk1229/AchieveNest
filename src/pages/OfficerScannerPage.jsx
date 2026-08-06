import React, { useState, useEffect, useRef } from 'react'
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
  ChevronLeft,
  Sparkles,
  Volume2,
  Users,
  Search
} from 'lucide-react'

import OrganizationController from '../controllers/OrganizationController'
import AttendanceController from '../controllers/AttendanceController'

export default function OfficerScannerPage() {
  const { eventId } = useParams()
  const activeEventId = eventId || 'evt-1'

  // Fetch event details & session
  const [eventData, setEventData] = useState(() => {
    const allEvts = OrganizationController.getEvents()
    return allEvts.find(e => e.id === activeEventId) || allEvts[0]
  })

  const [session, setSession] = useState(() => AttendanceController.getSession(activeEventId))

  // Countdown timer state (seconds remaining until start time)
  const [countdown, setCountdown] = useState(872) // 14 mins 32 secs mock
  const [scannedStudent, setScannedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Sync session state on updates
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail && (e.detail.eventId === activeEventId || !e.detail.eventId)) {
        setSession({ ...AttendanceController.getSession(activeEventId) })
      }
    }
    window.addEventListener('achievenest_attendance_update', handleUpdate)
    return () => window.removeEventListener('achievenest_attendance_update', handleUpdate)
  }, [activeEventId])

  // Digital countdown ticker
  useEffect(() => {
    if (session.session_status === 'Locked' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            AttendanceController.updateSessionStatus(activeEventId, 'Active')
            playUnlockChime()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [session.session_status, countdown, activeEventId])

  // Format countdown seconds into HH:MM:SS
  const formatCountdown = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0')
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0')
    const secs = (totalSecs % 60).toString().padStart(2, '0')
    return `${hrs}:${mins}:${secs}`
  }

  // Synthesize success chime sound using Web Audio API (Zero asset dependencies!)
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
    } catch (e) {
      // AudioContext fallback ignored
    }
  }

  const playUnlockChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3) // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {}
  }

  // Student Officer Authentication Lock state
  const [activeOfficer, setActiveOfficer] = useState(null)
  const [officerBarcode, setOfficerBarcode] = useState('')
  const [officerError, setOfficerError] = useState('')

  const handleAuthenticateOfficer = (barcodeToUse) => {
    const code = barcodeToUse || officerBarcode
    setOfficerError('')

    try {
      const officer = AttendanceController.verifyOfficerBarcode(code)
      setActiveOfficer(officer)
      setOfficerBarcode('')
    } catch (err) {
      setOfficerError(err.message || 'Invalid Officer Barcode ID')
    }
  }

  // Handle student check-in barcode scan
  const handleScanSubmit = (codeToScan) => {
    setErrorMessage('')
    const targetCode = codeToScan || manualBarcode
    if (!targetCode) return

    try {
      const officerLabel = activeOfficer ? `${activeOfficer.full_name} (${activeOfficer.position.split(' ')[0]})` : 'Officer Alex (Gate 1)'
      const record = AttendanceController.recordScan(activeEventId, targetCode, officerLabel)
      setScannedStudent(record)
      setIsModalOpen(true)
      playSuccessChime()
      setManualBarcode('')
    } catch (err) {
      setErrorMessage(err.message)
    }
  }

  const handleForceUnlockDemo = () => {
    AttendanceController.updateSessionStatus(activeEventId, 'Active')
    playUnlockChime()
  }


  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-[#2d8a4e] selection:text-white pb-12">
      
      {/* Top Mobile Gateway Bar */}
      <div className="bg-[#1b4332] border-b border-[#245233] p-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4"/>
                <circle cx="50" cy="50" r="28" fill="#ffffff" />
                <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">AchieveNest Gateway</h1>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">NDMU Student Officer Scanner</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
              session.session_status === 'Active' 
                ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                : session.session_status === 'Closed'
                ? 'bg-slate-700 text-slate-300'
                : 'bg-amber-400 text-slate-950 font-bold'
            }`}>
              {session.session_status === 'Active' ? '● LIVE SCANNER' : session.session_status === 'Closed' ? 'CLOSED' : '🔒 PRE-START LOCKED'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Event Meta Card */}
        <div className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700/80 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span>{eventData.category || 'Organization Event'}</span>
            <span className="text-slate-400 font-medium">Gate 1 Access Point</span>
          </div>
          <h2 className="text-lg font-extrabold text-white leading-snug">{eventData.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {session.attendance_start_time || '08:30'} - {session.attendance_end_time || '09:30'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {eventData.venue}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATE A: PRE-START COUNTDOWN LOCK                                         */}
        {/* ========================================================================= */}
        {session.session_status === 'Locked' ? (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 border border-amber-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              <Lock className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest">
                PRE-START LOCKED
              </span>
              <h3 className="text-xl font-extrabold text-white pt-2">Attendance Has Not Started</h3>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                Barcode scanning is locked until the scheduled start time ({session.attendance_start_time || '8:30 AM'}).
              </p>
            </div>

            {/* Countdown Box */}
            <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Attendance Opens In</p>
              <div className="text-3xl sm:text-4xl font-black tracking-widest font-mono text-emerald-400">
                {formatCountdown(countdown)}
              </div>
            </div>

            {/* Simulating unlock button for instant testing/demoing */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleForceUnlockDemo}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Simulate Start Time Reached (Unlock Scanner)</span>
              </button>
            </div>

          </div>
        ) : session.session_status === 'Closed' ? (

          /* ========================================================================= */
          /* STATE C: POST-SESSION LOCK                                                */
          /* ========================================================================= */
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-slate-700 flex items-center justify-center text-slate-300 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Attendance Session Closed</h3>
            <p className="text-xs text-slate-400">Total Scanned: {session.scanned_list.length} student participants</p>
          </div>

        ) : !activeOfficer ? (

          /* ========================================================================= */
          /* STATE B: OFFICER BARCODE AUTHENTICATION LOCK REQUIRED                     */
          /* ========================================================================= */
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 border border-amber-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="text-xl font-extrabold text-white">Student Officer Authentication Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assigned Gate Officers must scan or enter their official <strong className="text-emerald-400">NDMU Officer Barcode ID</strong> to unlock the scanner terminal.
              </p>
            </div>

            {/* Officer Barcode Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleAuthenticateOfficer()
              }} 
              className="w-full max-w-sm mx-auto space-y-3"
            >
              <input
                type="text"
                placeholder="Scan Officer Barcode (e.g., OFFICER-2024-001)..."
                value={officerBarcode}
                onChange={(e) => setOfficerBarcode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 shadow-inner"
                autoFocus
              />

              {officerError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{officerError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Authenticate Officer & Unlock Terminal</span>
              </button>
            </form>

            {/* Quick Test Officer Presets */}
            <div className="pt-2 border-t border-slate-800 w-full max-w-sm mx-auto text-center space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Officer Barcode Presets:</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAuthenticateOfficer('OFFICER-2024-001')}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-950 text-emerald-400 border border-slate-700 hover:border-emerald-500 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  OFFICER-2024-001 (Juan - VP)
                </button>
                <button
                  type="button"
                  onClick={() => handleAuthenticateOfficer('OFFICER-2024-002')}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-950 text-emerald-400 border border-slate-700 hover:border-emerald-500 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  OFFICER-2024-002 (Maria - Sec)
                </button>
              </div>
            </div>
          </div>
        ) : (

          /* ========================================================================= */
          /* STATE C: ACTIVE SCANNER WORKSPACE (UNLOCKED OFFICER SHIFT)                */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Active Duty Officer Badge Bar */}
            <div className="p-4 bg-emerald-950/80 rounded-2xl border border-emerald-800 text-white flex items-center justify-between text-xs shadow-lg">
              <div className="flex items-center gap-3">
                <img 
                  src={activeOfficer.avatar} 
                  alt={activeOfficer.full_name}
                  className="w-9 h-9 rounded-full border border-emerald-400 object-cover" 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-xs">{activeOfficer.full_name}</span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold border border-emerald-400/30">
                      ON DUTY
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-300/80 font-medium">{activeOfficer.position}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveOfficer(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Lock Terminal & Transfer Duty"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Switch Officer</span>
              </button>
            </div>

            
            {/* Camera Scanner Container */}
            <div className="bg-slate-950 rounded-3xl border-2 border-emerald-500/50 p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
              
              {/* Corner Targets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>

              {/* Viewfinder Graphic */}
              <div className="w-40 h-40 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col items-center justify-center text-emerald-400 mx-auto relative group">
                <QrCode className="w-16 h-16 animate-pulse text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-widest mt-2">WebCam Active</span>
                
                {/* Laser scan line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce top-1/2"></div>
              </div>

              {/* Manual Barcode Input Form */}
              <div className="pt-2 space-y-2">
                <p className="text-xs font-bold text-slate-300">Scan or Enter NDMU Student Barcode:</p>
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleScanSubmit() }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="e.g., 2022-01452"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shrink-0 cursor-pointer"
                  >
                    Scan ID
                  </button>
                </form>

                {errorMessage && (
                  <p className="text-xs text-rose-400 font-bold bg-rose-950/50 p-2 rounded-xl border border-rose-800/50 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* Quick Demo Test Presets */}
              <div className="pt-2 border-t border-slate-900">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Test Barcode Presets:</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={() => handleScanSubmit('2022-01452')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 text-[11px] font-mono text-emerald-300 transition cursor-pointer"
                  >
                    2022-01452 (Juan)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScanSubmit('2021-00123')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 text-[11px] font-mono text-emerald-300 transition cursor-pointer"
                  >
                    2021-00123 (Maria)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScanSubmit('2023-08812')}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 text-[11px] font-mono text-emerald-300 transition cursor-pointer"
                  >
                    2023-08812 (Marcus)
                  </button>
                </div>
              </div>

            </div>

            {/* Recent Officers Scan Log */}
            <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Recent Scans ({session.scanned_list.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {session.scanned_list.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500 font-medium">No barcodes scanned yet.</p>
                ) : (
                  session.scanned_list.map((scan) => (
                    <div key={scan.id} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                          {scan.full_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-white truncate">{scan.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{scan.student_id} • {scan.program}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-400 shrink-0">{scan.scanned_at}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ================= SCANNED STUDENT PROFILE MODAL ================= */}
      {isModalOpen && scannedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border-2 border-emerald-400 p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                CHECK-IN VERIFIED
              </span>
              <h3 className="text-xl font-black text-white pt-2">{scannedStudent.full_name}</h3>
              <p className="text-xs font-mono font-bold text-emerald-400">{scannedStudent.student_id}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Program:</span>
                <span className="font-bold text-white">{scannedStudent.program}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Year Level:</span>
                <span className="font-bold text-white">{scannedStudent.year_level || '3rd Year'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-bold text-emerald-400">{scannedStudent.scanned_at}</span>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs transition shadow-md cursor-pointer"
            >
              Continue Scanning next Student
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
