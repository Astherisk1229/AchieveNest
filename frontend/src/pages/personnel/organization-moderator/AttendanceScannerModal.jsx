import React, { useState } from 'react'
import { X, QrCode, CheckCircle2, UserCheck, ShieldCheck, Camera, Lock, Unlock, ShieldAlert, LogOut } from 'lucide-react'
import AttendanceController from '../../../controllers/AttendanceController'

export default function AttendanceScannerModal({ isOpen, onClose, activeEvent }) {
  const [activeOfficer, setActiveOfficer] = useState(null) // null = Locked Terminal
  const [officerBarcode, setOfficerBarcode] = useState('')
  const [officerError, setOfficerError] = useState('')

  const [scannedLogs, setScannedLogs] = useState([
    { id: '1', student_id: '2021-00123', name: 'Maria Clara Santos', course: 'BSIT', timestamp: '9:02 AM', officer_name: 'Juan Dela Cruz (CompSoc VP)' },
    { id: '2', student_id: '2023-08812', name: 'Marcus Aurelius Vance', course: 'BSCpE', timestamp: '9:05 AM', officer_name: 'Juan Dela Cruz (CompSoc VP)' }
  ])
  const [manualIdInput, setManualIdInput] = useState('')

  if (!isOpen) return null

  // Officer Unlock Handler
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

  // Student Attendance Scan Handler
  const handleSimulateScan = () => {
    if (!activeOfficer) return

    const randomId = `2022-${Math.floor(10000 + Math.random() * 90000)}`
    const demoNames = ['Ana Reyes', 'Mark Tan', 'Patricia Cruz', 'Gabriel Lim', 'Rhea Gomez']
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)]
    
    const newLog = {
      id: String(Date.now()),
      student_id: randomId,
      name: randomName,
      course: 'BS Computer Science',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      officer_name: `${activeOfficer.full_name} (${activeOfficer.position.split(' ')[0]})`
    }
    setScannedLogs([newLog, ...scannedLogs])
  }

  const handleManualAdd = (e) => {
    e.preventDefault()
    if (!manualIdInput || !activeOfficer) return

    const newLog = {
      id: String(Date.now()),
      student_id: manualIdInput,
      name: 'Registered NDMU Student',
      course: 'CEAC Department',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      officer_name: `${activeOfficer.full_name} (${activeOfficer.position.split(' ')[0]})`
    }
    setScannedLogs([newLog, ...scannedLogs])
    setManualIdInput('')
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
                <h3 className="font-extrabold text-lg text-[#17663B]">AchieveNest Student Officer Gateway</h3>
                {activeOfficer ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#E7F5EA] text-[#17663B] border border-[#BBDCC3] text-[10px] font-bold">
                    Active Officer: {activeOfficer.name}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF7E6] text-[#795600] border border-[#E5C276] text-[10px] font-bold">
                    No Officer
                  </span>
                )}
              </div>
              <p className="text-xs text-[#356148] font-medium">Verify attendance and validate student QR passes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[#356148] hover:bg-[#EAF4EC] hover:text-[#17663B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STATE 1: LOCKED TERMINAL (OFFICER BARCODE AUTHENTICATION REQUIRED)         */}
        {/* ========================================================================= */}
        {!activeOfficer ? (
          <div className="p-8 bg-slate-900 text-white flex flex-col items-center justify-center text-center space-y-6 flex-1">
            
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h4 className="text-lg font-extrabold text-white">Student Officer Authentication Required</h4>
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
              className="w-full max-w-sm space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Scan Officer Barcode (e.g., OFFICER-2024-001)..."
                  value={officerBarcode}
                  onChange={(e) => setOfficerBarcode(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 shadow-inner"
                  autoFocus
                />
              </div>

              {officerError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>{officerError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Authenticate Officer & Unlock Terminal</span>
              </button>
            </form>

            {/* Quick Test Officer Presets */}
            <div className="pt-2 border-t border-slate-800 w-full max-w-sm text-center space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Officer Barcode Presets:</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAuthenticateOfficer('OFFICER-2024-001')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 border border-slate-700 hover:border-emerald-500 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  OFFICER-2024-001 (Juan - VP)
                </button>
                <button
                  type="button"
                  onClick={() => handleAuthenticateOfficer('OFFICER-2024-002')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 border border-slate-700 hover:border-emerald-500 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  OFFICER-2024-002 (Maria - Sec)
                </button>
              </div>
            </div>

          </div>
        ) : (

          /* ========================================================================= */
          /* STATE 2: UNLOCKED SCANNING TERMINAL (ACTIVE DUTY OPERATOR)                */
          /* ========================================================================= */
          <>
            {/* Active Duty Officer Badge Bar */}
            <div className="p-3.5 bg-emerald-950 border-b border-emerald-800 text-white flex items-center justify-between text-xs px-6">
              <div className="flex items-center gap-3">
                <img 
                  src={activeOfficer.avatar} 
                  alt={activeOfficer.full_name}
                  className="w-8 h-8 rounded-full border border-emerald-400 object-cover" 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-xs">{activeOfficer.full_name}</span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-[#245F42] text-[9px] font-extrabold border border-emerald-400/30">
                      ON DUTY
                    </span>
                  </div>
                  <p className="text-[10px] text-[#245F42]/80 font-medium">{activeOfficer.position}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveOfficer(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Lock Terminal & Transfer Duty"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Officer</span>
              </button>
            </div>

            {/* Camera / Scanner Simulation Box */}
            <div className="p-6 bg-slate-900 text-white flex flex-col items-center justify-center relative min-h-[190px]">
              <div className="w-48 h-28 rounded-2xl border-2 border-dashed border-emerald-400/80 flex flex-col items-center justify-center gap-2 bg-emerald-950/40 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse"></div>
                <Camera className="w-7 h-7 text-emerald-400" />
                <span className="text-[10px] font-bold text-[#245F42]">Align NDMU Digital Barcode</span>
              </div>

              <button
                onClick={handleSimulateScan}
                className="mt-3 px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Simulate Live Student Barcode Scan</span>
              </button>
            </div>

            {/* Manual Barcode Entry */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50">
              <form onSubmit={handleManualAdd} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter NDMU Student ID Barcode (e.g. 2022-01452)..."
                  value={manualIdInput}
                  onChange={(e) => setManualIdInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#16834a]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition cursor-pointer"
                >
                  Record Check-in
                </button>
              </form>
            </div>

            {/* Real-time Scan Logs List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-2 max-h-56">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Verified Attendees ({scannedLogs.length})
                </h4>
                <span className="text-xs font-bold text-[#16834a] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Audit Trail Active</span>
                </span>
              </div>

              {scannedLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{log.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {log.student_id} • Verified by: <span className="font-bold text-emerald-800">{log.officer_name}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Session auto-synced to OSAD Records</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Close Session
          </button>
        </div>

      </div>
    </div>
  )
}
