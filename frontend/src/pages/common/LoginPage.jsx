import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, X } from 'lucide-react'
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
  const [forgotReason, setForgotReason] = useState('')
  const [forgotTargetOffice, setForgotTargetOffice] = useState('osad') // 'osad' | 'hr'
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

  // Demo Accounts Presets
  const demoAccounts = [
    { label: 'Student', desc: 'Student dashboard', email: 'student@ndmu.edu.ph' },
    { label: 'Personnel', desc: 'Faculty / personnel view', email: 'faculty@ndmu.edu.ph' },
    { label: 'Coordinator', desc: 'Program coordinator view', email: 'coordinator@ndmu.edu.ph' },
    { label: 'Organization', desc: 'Org moderator view', email: 'moderator@ndmu.edu.ph' },
    { label: 'OSAD Admin', desc: 'Student affairs admin', email: 'osad@ndmu.edu.ph' },
    { label: 'HR Admin', desc: 'Human resource executive', email: 'hr@ndmu.edu.ph' }
  ]

  const handleSelectDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password123')
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

      switch (session.user_type) {
        case 'student':
          navigate('/student/dashboard')
          break
        case 'personnel':
          navigate('/personnel/dashboard')
          break
        case 'hr_staff':
          navigate('/hr/dashboard')
          break
        case 'osad_staff':
          navigate('/osad/dashboard')
          break
        default:
          navigate('/student/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900 bg-[#091811] selection:bg-[#1b4332] selection:text-white relative overflow-hidden">

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
          <div className="w-[800px] h-[800px] rounded-full border border-emerald-300/30" />
          <div className="w-[1100px] h-[1100px] rounded-full border border-emerald-300/20" />
        </div>
      </div>

      {/* ================= CENTERED FLOATING AUTH CARD ================= */}
      <div className="max-w-md w-full rounded-[2rem] bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl p-7 sm:p-9 text-center relative z-10 space-y-5 animate-in zoom-in-95 duration-300">

        {/* Floating Top Center Emblem Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/80 mx-auto flex items-center justify-center -mt-2 p-1.5 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4" />
            <circle cx="50" cy="50" r="28" fill="#ffffff" />
            <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
          </svg>
        </div>

        {/* Centered Heading & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to AchieveNest</h1>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#fdebec] border border-[#f5c6cb] text-[#9f2f2d] text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#9f2f2d]" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">

          {/* Email Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:bg-white transition"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:bg-white transition"
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
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#1b4332] focus:ring-[#1b4332]"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotEmail(email || 'student@ndmu.edu.ph')
                setForgotReason('Locked out of institutional account. Please reset my credentials.')
                setForgotSuccess(false)
                setIsForgotModalOpen(true)
              }}
              className="font-semibold text-slate-600 hover:text-[#1b4332] cursor-pointer transition"
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
        <div className="grid grid-cols-3 gap-2">
          {demoAccounts.map((demo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectDemo(demo.email)}
              className="px-2 py-2 rounded-xl bg-slate-50 hover:bg-[#edf3ec] border border-slate-200/80 hover:border-[#1b4332]/40 text-xs font-bold text-slate-700 hover:text-[#1b4332] transition text-center cursor-pointer shadow-2xs truncate"
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

      {/* Student Password Reset Request Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans text-slate-900">

            {/* Modal Header */}
            <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-200 flex items-center justify-center font-extrabold text-sm shrink-0 border border-emerald-400/30">
                  <KeyRound className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Request Password Reset</h3>
                  <p className="text-xs text-emerald-200/90 font-medium">NDMU OSAD Administrative Assistance</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {forgotSuccess ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#1b4332] border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-[#1b4332]" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Reset Request Dispatched!</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {forgotTargetOffice === 'hr' ? (
                    <>Your password reset request has been logged and routed to <strong>Human Resources (HR)</strong>. An HR administrator will review your personnel record and issue temporary credentials.</>
                  ) : (
                    <>Your password reset request has been logged and routed to <strong>OSAD</strong>. An OSAD administrator will review your student record and issue temporary credentials.</>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#12361e] text-white font-extrabold text-xs shadow-2xs transition cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!forgotEmail) return
                  setForgotSubmitting(true)
                  try {
                    await requestPasswordReset(forgotEmail, forgotReason, forgotTargetOffice)
                    setForgotSuccess(true)
                  } catch (err) {
                    console.error('Request reset error:', err)
                  } finally {
                    setForgotSubmitting(false)
                  }
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Account Category for Reset
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotTargetOffice('osad')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${forgotTargetOffice === 'osad'
                          ? 'border-[#1b4332] bg-emerald-50/70 text-[#1b4332]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      <span className="text-xs font-extrabold">Student Reset</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">OSAD Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForgotTargetOffice('hr')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${forgotTargetOffice === 'hr'
                          ? 'border-[#1b4332] bg-emerald-50/70 text-[#1b4332]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      <span className="text-xs font-extrabold">Faculty / Personnel Reset</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">Human Resources</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institutional Email Address (@ndmu.edu.ph)
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      const val = e.target.value
                      setForgotEmail(val)
                      // Auto-switch target department if email suggests faculty/personnel
                      if (val.includes('faculty') || val.includes('coord') || val.includes('sec') || val.includes('mod') || val.includes('hr')) {
                        setForgotTargetOffice('hr')
                      }
                    }}
                    required
                    placeholder={forgotTargetOffice === 'hr' ? 'faculty@ndmu.edu.ph' : 'student@ndmu.edu.ph'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1b4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Remarks / Reason for Assistance
                  </label>
                  <textarea
                    value={forgotReason}
                    onChange={(e) => setForgotReason(e.target.value)}
                    rows={3}
                    required
                    placeholder="Explain why you need a password reset..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1b4332]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium">
                  {forgotTargetOffice === 'hr' ? (
                    <>Human Resources (HR) will verify your employee record and issue your temporary credentials.</>
                  ) : (
                    <>OSAD will verify your student record and send an approval notification once approved.</>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#12361e] text-white text-xs font-extrabold transition cursor-pointer shadow-2xs"
                  >
                    {forgotSubmitting
                      ? 'Submitting Request...'
                      : forgotTargetOffice === 'hr'
                        ? 'Submit Request to HR'
                        : 'Submit Request to OSAD'}
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

