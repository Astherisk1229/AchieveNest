import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock
} from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(true)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        // If there's an error in URL hash like #error=access_denied
        const hash = window.location.hash || ''
        if (hash.includes('error=')) {
          setIsValidSession(false)
          setError('This password reset link is invalid or has expired. Please request a new link.')
        } else if (!session) {
          // Check if auth state changes to PASSWORD_RECOVERY
          const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
            if (event === 'PASSWORD_RECOVERY' || s) {
              setIsValidSession(true)
            }
          })
          return () => {
            listener?.subscription?.unsubscribe()
          }
        } else {
          setIsValidSession(true)
        }
      } catch (err) {
        setIsValidSession(false)
        setError('Unable to verify recovery link. Please try again.')
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  // Validation rules
  const hasMinLength = newPassword.length >= 8
  const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
  const hasNumberSpecial = /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
  const isMatch = newPassword !== '' && newPassword === confirmPassword
  const isFormValid = hasMinLength && hasUpperLower && hasNumberSpecial && isMatch

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!isFormValid) {
      setError('Please satisfy all password security requirements before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw new Error(updateError.message || 'Unable to update password. Please try again.')
      }

      setIsSuccess(true)
      // Sign out recovery session cleanly so user logs in with new credentials
      await supabase.auth.signOut()
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Verifying recovery link...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans antialiased text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="p-6 bg-[#EFF7F0] border-b border-[#BBDCC3] text-[#17663B] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E7F5EA] text-[#17663B] flex items-center justify-center font-extrabold text-sm shrink-0 border border-[#BBDCC3]">
            <KeyRound className="w-5 h-5 text-[#17663B]" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#17663B]">Reset Your Password</h3>
            <p className="text-xs text-[#356148] font-medium">NDMU Institutional Account Security</p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#064e2b] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7 text-[#064e2b]" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">Password Updated Successfully!</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Your account password has been updated. You can now sign in to AchieveNest using your new institutional credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full mt-2 py-3 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : !isValidSession ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">Invalid or Expired Link</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {error || 'This password reset link is invalid or has expired. Please request a new password reset link from the login page.'}
              </p>
              <Link
                to="/login"
                className="inline-flex w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition items-center justify-center gap-2"
              >
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* New Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new strong password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#69A97C] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#69A97C] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Requirements Checklist */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                <span className="block font-bold text-slate-600 mb-1">Password Requirements:</span>
                <div className={`flex items-center gap-2 font-medium ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center gap-2 font-medium ${hasUpperLower ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasUpperLower ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <span>Contains both uppercase and lowercase letters</span>
                </div>
                <div className={`flex items-center gap-2 font-medium ${hasNumberSpecial ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasNumberSpecial ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <span>Contains at least one number and special character</span>
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-2 font-medium ${isMatch ? 'text-emerald-700 font-bold' : 'text-rose-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isMatch ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                    <span>{isMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-3 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Updating Password...' : 'Save New Password'}</span>
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
