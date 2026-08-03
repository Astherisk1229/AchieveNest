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

  // Demo Accounts Presets from Screenshot
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans text-slate-900 bg-white selection:bg-[#2d8a4e] selection:text-white">
      
      {/* ================= LEFT SIDE: DEEP GREEN BRAND PANEL (50%) ================= */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#12361e] via-[#1b4332] to-[#0d2816] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        
        {/* Subtle Glow Overlay */}
        <div className="absolute top-0 left-0 w-full h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Logo */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4"/>
              <circle cx="50" cy="50" r="28" fill="#ffffff" />
              <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
              <text x="50" y="82" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">NDMU</text>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">AchieveNest</h2>
            <p className="text-xs text-emerald-200/80 font-medium">Notre Dame of Marbel University</p>
          </div>
        </div>

        {/* Middle Hero Card */}
        <div className="my-8 relative z-10">
          <div className="rounded-3xl overflow-hidden border border-emerald-600/30 bg-[#0d2a17]/90 shadow-2xl relative">
            
            <div className="h-56 sm:h-64 w-full relative overflow-hidden flex items-center justify-center">
              <img 
                src={campusBanner} 
                alt="NDMU Campus" 
                className="w-full h-full object-cover opacity-85 hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e2c18] via-emerald-950/40 to-transparent"></div>

              {/* NDMU Official White Overlay Emblem Banner */}
              <div className="absolute px-5 py-3.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-emerald-100 max-w-xs sm:max-w-sm text-center transform hover:scale-105 transition">
                <div className="flex justify-center mb-1">
                  <div className="w-9 h-9 rounded-full bg-[#1b4332] p-1 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#ffffff"/>
                      <circle cx="50" cy="50" r="28" fill="#1b4332" />
                      <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="bold">M</text>
                    </svg>
                  </div>
                </div>
                <div className="text-[10px] tracking-widest font-bold text-[#1b4332] uppercase">NOTRE DAME OF</div>
                <div className="text-xl sm:text-2xl font-serif font-black text-[#1b4332] tracking-tight leading-none">
                  Marbel University
                </div>
                {/* Accreditation Icons Bar */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 pt-2 border-t border-gray-200/80">
                  <span className="text-[10px] font-bold text-gray-600 uppercase px-2 py-0.5 rounded bg-gray-100">PAASCU Accredited</span>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase px-2 py-0.5 rounded bg-emerald-50">ISO Certified</span>
                  <span className="text-[10px] font-bold text-amber-800 uppercase px-2 py-0.5 rounded bg-amber-50">CHED Recognized</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bullet Point Features */}
        <div className="relative z-10 space-y-5">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Your journey of excellence starts here.
            </h3>
          </div>

          <ul className="space-y-2.5">
            <li className="flex items-center gap-3 text-sm leading-relaxed text-emerald-100 font-medium">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Track and showcase your achievements</span>
            </li>
            <li className="flex items-center gap-3 text-sm leading-relaxed text-emerald-100 font-medium">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Build your professional portfolio</span>
            </li>
            <li className="flex items-center gap-3 text-sm leading-relaxed text-emerald-100 font-medium">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Get recognized for your hard work</span>
            </li>
          </ul>

          {/* Stats Bar */}
          <div className="pt-5 border-t border-emerald-800/60 grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-black text-white">2,500+</p>
              <p className="text-xs text-emerald-200/80 font-medium">Active Students</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">15,000+</p>
              <p className="text-xs text-emerald-200/80 font-medium">Achievements</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">98%</p>
              <p className="text-xs text-emerald-200/80 font-medium">Satisfaction</p>
            </div>
          </div>
        </div>

      </div>

      {/* ================= RIGHT SIDE: CLEAN WHITE AUTH PANEL (50%) ================= */}
      <div className="lg:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
        
        <div className="max-w-md mx-auto w-full space-y-6">
          
          {/* Welcome Heading */}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">Sign in to your AchieveNest account</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@ndmu.edu.ph"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[#0f172a] focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-[#0f172a] focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#2d8a4e] focus:ring-[#2d8a4e]"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-base shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts Card */}
          <div className="p-4 rounded-2xl bg-[#eef7f0] border border-[#cbe6d2] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-[#1e5831]">Demo Accounts <span className="text-slate-500 font-normal">— password: any</span></span>
            </div>

            <div className="space-y-1.5">
              {demoAccounts.map((demo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDemo(demo.email)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-left transition shadow-xs group"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#2d8a4e]">{demo.label}</span>
                  <span className="text-xs text-slate-500 font-medium">{demo.desc}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
