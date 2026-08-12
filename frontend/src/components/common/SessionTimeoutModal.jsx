import React from 'react'
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react'

/**
 * SessionTimeoutModal.jsx
 * Warning modal shown 2 minutes prior to automatic idle session timeout on shared terminals.
 */
export default function SessionTimeoutModal({
  isOpen,
  secondsRemaining = 120,
  onStayLoggedIn,
  onLogoutNow
}) {
  if (!isOpen) return null

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center space-y-5">
        
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center font-bold animate-pulse">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900">Session Expiring Soon</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            For security on shared NDMU campus terminals, your session will automatically log out due to inactivity.
          </p>
        </div>

        {/* Timer Box */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-center gap-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="font-mono text-xl font-black">{formattedTime}</span>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Remaining</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onLogoutNow}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Now</span>
          </button>

          <button
            type="button"
            onClick={onStayLoggedIn}
            className="flex-1 py-3 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
        </div>

      </div>
    </div>
  )
}
