import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  LogOut
} from 'lucide-react'
import { submitPasswordChange, logoutUser, getCurrentUser } from '../../services/authService'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await submitPasswordChange(newPassword, confirmPassword)
      setIsSuccess(true)
      setTimeout(() => {
        const accountType = user?.account_type || 'student'
        if (accountType === 'student') {
          navigate('/student/dashboard')
        } else if (accountType === 'osad_admin') {
          navigate('/osad/dashboard')
        } else if (accountType === 'hr_admin') {
          navigate('/hr/dashboard')
        } else {
          navigate('/personnel/dashboard')
        }
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#064e2b] to-slate-950 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Strip */}
        <div className="p-6 bg-[#064e2b] text-white border-b border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-300 border border-white/10 flex items-center justify-center font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-snug">
                Change Your Password
              </h2>
              <p className="text-xs text-emerald-200/90 font-medium">
                Mandatory Security Setup
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isSuccess ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Password Updated Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Your mandatory password change is complete. Redirecting you to your portal dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* Security Advisory Alert */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">
                  You logged in with a temporary password issued by your administrator. You must create a permanent password before accessing your account.
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 8 characters..."
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your new password..."
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(p => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Policy checklist */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                  <div className={`flex items-center gap-1.5 font-bold ${newPassword.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Minimum 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-bold ${newPassword && newPassword === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passwords match</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                  >
                    Cancel & Sign Out
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="px-5 py-2.5 rounded-xl bg-[#064e2b] hover:bg-[#16834a] disabled:opacity-40 text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isSubmitting ? 'Updating...' : 'Set New Password'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
