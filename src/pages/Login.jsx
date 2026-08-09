import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { authenticateUser } from '../services/authService'
import campusBanner from '../assets/ndmu_campus_banner.png'

export default function Login() {
  const navigate = useNavigate()
  
  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row font-sans text-slate-900 bg-[#fbfbfa] selection:bg-[#1b4332] selection:text-white lg:overflow-hidden">
      
      {/* ================= LEFT SIDE: EDITORIAL DARK GREEN BRAND PANEL (50%) ================= */}
      <div className="lg:w-1/2 bg-[#0c2214] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-r border-[#184227]">
        
        {/* Top Header Logo */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-white/20 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4"/>
              <circle cx="50" cy="50" r="28" fill="#ffffff" />
              <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
              <text x="50" y="82" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">NDMU</text>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white leading-tight">AchieveNest</h2>
            <p className="text-[11px] text-emerald-300/80 font-medium">Notre Dame of Marbel University</p>
          </div>
        </div>

        {/* Middle Hero Card - Optimized for crisp vertical density */}
        <div className="my-4 lg:my-6 relative z-10">
          <div className="rounded-2xl overflow-hidden border border-[#1b4332] bg-[#091a0f] relative">
            <div className="h-36 sm:h-44 lg:h-48 xl:h-52 w-full relative overflow-hidden flex items-center justify-center">
              <img 
                src={campusBanner} 
                alt="NDMU Campus" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#091a0f] via-[#091a0f]/40 to-transparent"></div>

              {/* NDMU Official White Overlay Emblem Banner */}
              <div className="absolute px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-100 max-w-xs text-center">
                <div className="flex justify-center mb-0.5">
                  <div className="w-7 h-7 rounded-full bg-[#1b4332] p-0.5 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#ffffff"/>
                      <circle cx="50" cy="50" r="28" fill="#1b4332" />
                      <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="bold">M</text>
                    </svg>
                  </div>
                </div>
                <div className="text-[9px] tracking-widest font-bold text-[#1b4332] uppercase">NOTRE DAME OF</div>
                <div className="text-base sm:text-lg font-serif font-bold text-[#1b4332] tracking-tight leading-none">
                  Marbel University
                </div>
                {/* Accreditation Muted Pastel Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-slate-200/80">
                  <span className="text-[9px] font-medium text-[#2d6a3f] uppercase px-1.5 py-0.5 rounded bg-[#edf3ec] border border-[#d2e6d5]">PAASCU Accredited</span>
                  <span className="text-[9px] font-medium text-[#2d6a3f] uppercase px-1.5 py-0.5 rounded bg-[#edf3ec] border border-[#d2e6d5]">ISO Certified</span>
                  <span className="text-[9px] font-medium text-[#8a5d00] uppercase px-1.5 py-0.5 rounded bg-[#fbf3db] border border-[#f0e2b6]">CHED Recognized</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bullet Point Features & Stats Bar */}
        <div className="relative z-10 space-y-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-snug">
              Your journey of excellence starts here.
            </h3>
          </div>

          <ul className="space-y-2">
            <li className="flex items-center gap-2.5 text-xs text-emerald-100/90 font-medium">
              <div className="w-4 h-4 rounded-full bg-[#1b4332] border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Track and showcase your achievements</span>
            </li>
            <li className="flex items-center gap-2.5 text-xs text-emerald-100/90 font-medium">
              <div className="w-4 h-4 rounded-full bg-[#1b4332] border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Build your professional portfolio</span>
            </li>
            <li className="flex items-center gap-2.5 text-xs text-emerald-100/90 font-medium">
              <div className="w-4 h-4 rounded-full bg-[#1b4332] border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Get recognized for your hard work</span>
            </li>
          </ul>

          {/* Clean Editorial Stats Bar */}
          <div className="pt-3.5 border-t border-[#184227] grid grid-cols-3 gap-3">
            <div>
              <p className="text-lg font-bold text-white">2,500+</p>
              <p className="text-[11px] text-emerald-200/70">Active Students</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">15,000+</p>
              <p className="text-[11px] text-emerald-200/70">Achievements</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">98%</p>
              <p className="text-[11px] text-emerald-200/70">Satisfaction</p>
            </div>
          </div>
        </div>

      </div>

      {/* ================= RIGHT SIDE: CLEAN MINIMALIST AUTH PANEL (50%) ================= */}
      <div className="lg:w-1/2 bg-[#fbfbfa] p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center overflow-y-auto">
        
        <div className="max-w-md mx-auto w-full space-y-4 lg:space-y-5">
          
          {/* Welcome Heading */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">Welcome back</h1>
            <p className="text-xs sm:text-sm text-[#787774] mt-0.5">Sign in to your AchieveNest account</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#fdebec] border border-[#f5c6cb] text-[#9f2f2d] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#9f2f2d]" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@ndmu.edu.ph"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1b4332] focus:ring-[#1b4332]"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-5 rounded-xl bg-[#1b4332] hover:bg-[#12361e] text-white font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts Bento Card Grid (Compact 2-Column Grid) */}
          <div className="p-3.5 rounded-2xl bg-[#edf3ec]/60 border border-[#d2e6d5] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#1b4332]">Demo Accounts <span className="text-slate-500 font-normal">— password: any</span></span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((demo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDemo(demo.email)}
                  className="px-2.5 py-2 rounded-xl bg-white hover:bg-[#f4f8f5] border border-slate-200/80 hover:border-[#1b4332]/40 flex flex-col text-left transition group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-[#1b4332]">{demo.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium truncate">{demo.desc}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

