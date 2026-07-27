import React, { useState } from 'react'
import { X, QrCode, CheckCircle2, UserCheck, ShieldCheck, Camera } from 'lucide-react'

export default function AttendanceScannerModal({ isOpen, onClose, activeEvent }) {
  const [scannedLogs, setScannedLogs] = useState([
    { id: '1', student_id: '2021-00123', name: 'Maria Santos', course: 'BSCS', timestamp: '9:02 AM' },
    { id: '2', student_id: '2021-00456', name: 'Juan Dela Cruz', course: 'BSIT', timestamp: '9:05 AM' }
  ])
  const [manualIdInput, setManualIdInput] = useState('')

  if (!isOpen) return null

  const handleSimulateScan = () => {
    const randomId = `2022-${Math.floor(10000 + Math.random() * 90000)}`
    const demoNames = ['Ana Reyes', 'Mark Tan', 'Patricia Cruz', 'Gabriel Lim', 'Rhea Gomez']
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)]
    const newLog = {
      id: String(Date.now()),
      student_id: randomId,
      name: randomName,
      course: 'BS Computer Science',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setScannedLogs([newLog, ...scannedLogs])
  }

  const handleManualAdd = (e) => {
    e.preventDefault()
    if (!manualIdInput) return
    const newLog = {
      id: String(Date.now()),
      student_id: manualIdInput,
      name: 'Registered NDMU Student',
      course: 'CEAC Department',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setScannedLogs([newLog, ...scannedLogs])
    setManualIdInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Barcode & QR Attendance Session</h3>
              <p className="text-xs text-emerald-200/80">
                {activeEvent?.title || 'Computer Society Tech Summit 2026'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera / Scanner Simulation Box */}
        <div className="p-6 bg-slate-900 text-white flex flex-col items-center justify-center relative min-h-[200px]">
          <div className="w-48 h-32 rounded-2xl border-2 border-dashed border-emerald-400/80 flex flex-col items-center justify-center gap-2 bg-emerald-950/40 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse"></div>
            <Camera className="w-8 h-8 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-300">Align NDMU Digital ID Barcode</span>
          </div>

          <button
            onClick={handleSimulateScan}
            className="mt-4 px-4 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold transition shadow-lg flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Simulate Live Camera Scan</span>
          </button>
        </div>

        {/* Manual Barcode Entry */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <form onSubmit={handleManualAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Student ID (e.g. 2021-00123)..."
              value={manualIdInput}
              onChange={(e) => setManualIdInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#2d8a4e]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition"
            >
              Record Attendance
            </button>
          </form>
        </div>

        {/* Real-time Scan Logs List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Verified Attendees ({scannedLogs.length})
            </h4>
            <span className="text-xs font-bold text-[#2d8a4e] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Session</span>
            </span>
          </div>

          {scannedLogs.map((log) => (
            <div 
              key={log.id} 
              className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{log.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{log.student_id} • {log.course}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Session auto-synced to OSAD Records</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Close Session
          </button>
        </div>

      </div>
    </div>
  )
}
