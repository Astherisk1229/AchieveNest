import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, AlertTriangle, KeyRound, X } from 'lucide-react'
import { authenticateUser, requestPasswordReset } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import campusBanner from '../../assets/ndmu_login_bg.jpg'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Forgot Password Request Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState(null)

  // Test Accounts Presets for AchieveNest-Test
  const demoAccounts = [
    { label: 'HR Admin', desc: 'HR Director Account', email: 'hr.admin01@ndmu.edu.ph' },
    { label: 'OSAD Admin', desc: 'OSAD Office Holder Account', email: 'osad.admin01@ndmu.edu.ph' },
    { label: 'Student 01', desc: 'Student Demo Account', email: 'achievenest.demo.student01@ndmu.edu.ph' },
    { label: 'Personnel 01', desc: 'Personnel Demo Account', email: 'achievenest.demo.personnel01@ndmu.edu.ph' },
  ]

  const handleSelectDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please provide your email address and password.')
      return
    }

    try {
      setIsSubmitting(true)
      const session = await authenticateUser(email, password, keepSignedIn)
      if (login) {
        login(session)
      }

      const accountType = session.account_type || session.user_type
      switch (accountType) {
        case 'student':
          navigate('/student/dashboard')
          break
        case 'personnel':
          navigate('/personnel/dashboard')
          break
        case 'hr_admin':
          navigate('/hr/dashboard')
          break
        case 'osad_admin':
          navigate('/osad/dashboard')
          break
        default:
          navigate(RouteAccessController.resolveRedirect(session))
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900 bg-[#091811] selection:bg-[#EFF7F0] selection:text-white relative overflow-hidden">

      {/* Background Campus Image & Atmospheric Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={campusBanner}
          alt="NDMU Campus Twilight Wallpaper"
          className="w-full h-full object-cover opacity-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#091811] via-[#091811]/40 to-[#091811]/30"></div>

        {/* Ambient Radial Concentric Arc Rings matching inspiration image */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <div className="w-[500px] h-[500px] rounded-full border border-emerald-300/40" />
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 space-y-4 relative z-10 text-center animate-in zoom-in-95 duration-200">
        
        {/* NDMU Crest / Logo */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#064e2b] to-[#12361e] text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-emerald-400/30">
            A
          </div>
        </div>

        {/* Title & Subtitle matching inspiration */}
        <div className="space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            AchieveNest
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Notre Dame of Marbel University
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 text-left animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left pt-1">
          {/* Institutional Email Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Institutional Email (@ndmu.edu.ph)"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#064e2b] focus:bg-white transition"
              required
            />
          </div>

          {/* Password Field with Eye Toggle */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#064e2b] focus:bg-white transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#064e2b] focus:ring-[#064e2b]"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(email || '')
                setForgotSuccess(false)
                setForgotError(null)
                setIsForgotModalOpen(true)
              }}
              className="font-semibold text-slate-600 hover:text-[#064e2b] cursor-pointer transition"
            >
              Forgot password?
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#1c232e] hover:bg-[#111620] text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md mt-2"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider matching inspiration image */}
        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[11px] font-medium text-slate-400">Or select demo account</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Demo Accounts Preset Grid matching inspiration bottom buttons */}
        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((demo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectDemo(demo.email)}
              className="px-2 py-2 rounded-xl bg-slate-50 hover:bg-[#dde8d8] border border-slate-200/80 hover:border-[#69A97C]/40 text-xs font-bold text-slate-700 hover:text-[#064e2b] transition text-center cursor-pointer shadow-2xs truncate"
              title={demo.desc}
            >
              {demo.label}
            </button>
          ))}
        </div>

        {/* Footer Accreditation Notice */}
        <div className="pt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          PAASCU Level III • ISO 9001:2015 • CHEd Recognized
        </div>

      </div>

      {/* Password Reset Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans text-slate-900">

            {/* Modal Header */}
            <div className="p-6 bg-[#EFF7F0] border-b border-[#BBDCC3] text-[#17663B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E7F5EA] text-[#17663B] flex items-center justify-center font-extrabold text-sm shrink-0 border border-[#BBDCC3]">
                  <KeyRound className="w-5 h-5 text-[#17663B]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#17663B]">Reset Your Password</h3>
                  <p className="text-xs text-[#356148] font-medium">NDMU Institutional Account Recovery</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-2 rounded-xl text-[#356148] hover:bg-[#EAF4EC] hover:text-[#17663B] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {forgotSuccess ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#064e2b] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6 text-[#064e2b]" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Password Reset Email Sent</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  If an account exists for <strong>{forgotEmail}</strong>, password recovery instructions have been dispatched.
                  Please check your inbox and follow the secure link to create a new password.
                </p>
                
                {/* Fallback In-person Assistance Notice */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-[11px] text-slate-600 text-left space-y-1">
                  <span className="block font-bold text-slate-700">Didn't receive an email or cannot access your inbox?</span>
                  <p className="text-slate-500 leading-relaxed">
                    • <strong>Students:</strong> Visit the <strong>OSAD Office</strong> for in-person identity verification and recovery.<br />
                    • <strong>Personnel / Faculty:</strong> Visit the <strong>HR Office</strong> for in-person identity verification.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setForgotError(null)
                  const clean = String(forgotEmail || '').trim().toLowerCase()
                  if (!clean || !clean.endsWith('@ndmu.edu.ph')) {
                    setForgotError('Please enter a valid NDMU institutional email (@ndmu.edu.ph).')
                    return
                  }

                  setForgotSubmitting(true)
                  try {
                    await requestPasswordReset(clean)
                    setForgotSuccess(true)
                  } catch (err) {
                    setForgotError(err.message || 'Unable to send password reset instructions. Please try again.')
                  } finally {
                    setForgotSubmitting(false)
                  }
                }}
                className="p-6 space-y-4"
              >
                {forgotError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Institutional Email Address (@ndmu.edu.ph)
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="e.g. jdelacruz@ndmu.edu.ph"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#69A97C] focus:bg-white transition"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    A secure password reset link will be sent to this email address.
                  </span>
                </div>

                {/* Secondary In-Person Recovery Guidance Notice */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-[11px] text-slate-600 space-y-1.5">
                  <span className="block font-bold text-slate-700">Can't access your institutional email?</span>
                  <div className="text-slate-500 leading-relaxed space-y-1">
                    <p>• <strong>Students:</strong> Please visit <strong>OSAD</strong> for in-person account recovery assistance.</p>
                    <p>• <strong>Personnel:</strong> Please visit <strong>HR</strong> for in-person account recovery assistance.</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#176B43] hover:bg-[#125536] text-white text-xs font-extrabold transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {forgotSubmitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
