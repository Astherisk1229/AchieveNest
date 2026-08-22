/**
 * ForbiddenPage.jsx
 * 403 Forbidden Access Page for AchieveNest.
 */

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  const { user, activeRoleContext } = useAuth() || {}

  const getHomePath = () => {
    switch (activeRoleContext || user?.active_role_context) {
      case 'student': return '/student/dashboard'
      case 'hr_staff': return '/hr/dashboard'
      case 'osad_staff': return '/osad/dashboard'
      default: return '/personnel/dashboard?tab=overview'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
        
        {/* Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
            403 Access Forbidden
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Restricted Page or Context
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            You do not have authorization to view this section in your current active role context (<span className="font-bold text-slate-700 dark:text-slate-300">{activeRoleContext || 'unassigned'}</span>). Please switch to an authorized role context or return to your dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={getHomePath()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#EFF7F0] hover:bg-[#143426] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

      </div>
    </div>
  )
}
