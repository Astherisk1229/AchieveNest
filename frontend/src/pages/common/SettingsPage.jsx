import React from 'react'
import { 
  Settings, 
  Bell, 
  Sun, 
  Moon, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw,
  Sliders,
  Mail,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useTheme from '../../hooks/useTheme'
import useUserSettings from '../../hooks/useUserSettings'

export default function SettingsPage({ currentUser }) {
  const { user: authUser } = useAuth()
  const activeUser = currentUser || authUser
  const { isDark, toggleTheme } = useTheme()

  const {
    notifications,
    saveSuccess,
    saveError,
    handleToggleNotification,
    handleResetDefaults
  } = useUserSettings(activeUser)

  const notificationOptions = [
    {
      key: 'faculty_submission_received',
      title: 'Faculty Portfolio Submissions',
      description: 'Receive notification preferences for new faculty portfolio submissions awaiting HR review.'
    },
    {
      key: 'personnel_password_reset_requested',
      title: 'Personnel Password Reset Requests',
      description: 'Receive notifications when a personnel account submits a password reset request.'
    },
    {
      key: 'weekly_evaluation_audit_digest',
      title: 'Weekly Evaluation Audit Digest',
      description: 'Receive a weekly summary digest of finalized faculty evaluations and sealed ranks.'
    },
    {
      key: 'evaluation_return_or_finalization_updates',
      title: 'Evaluation Status Updates',
      description: 'Receive alerts when an evaluation is returned for revision or sealed by HR.'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#1b4332] dark:text-emerald-400 shrink-0" />
            <span>Portal & Notification Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Configure notification preferences, system appearance, and governance display options.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Save Toast Feedback */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Settings preference saved successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Appearance & Theme Card */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-slate-600" />}
            <span>System Appearance & Theme</span>
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Theme Display Mode</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toggle between high-contrast dark theme and warm light editorial theme.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              isDark
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
            <span>Governance Notification Preferences</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400">User-Scoped Settings</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {notificationOptions.map(option => {
            const isEnabled = Boolean(notifications[option.key])
            return (
              <div key={option.key} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0 pr-4">
                  <p className="font-extrabold text-slate-900 dark:text-white leading-snug">{option.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{option.description}</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={() => handleToggleNotification(option.key)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 focus:outline-none ${
                    isEnabled ? 'bg-[#1b4332] dark:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Institutional Compliance Notice */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold">
          <ShieldCheck className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
          <span>Governance Preference Policy</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Settings are saved to your local browser profile. Mandatory institutional audit alerts and compliance logging cannot be disabled per NDMU Governance Guidelines.
        </p>
      </div>
    </div>
  )
}
