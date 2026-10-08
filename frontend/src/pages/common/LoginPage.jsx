import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react'
import { authenticateDemoUser, authenticateUser, getCurrentUser, requestPasswordReset } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import RouteAccessController from '../../controllers/RouteAccessController'
import campusBanner from '../../assets/ndmu_login_bg.jpg'
import { AchieveNestLogo } from '../../components/brand'

const demoAccounts = [
  { label: 'Student A', description: 'BSA / Accountancy', email: 'demo.student.a@ndmu.edu.ph' },
  { label: 'Student B', description: 'BSBA-FM / Financial Mgmt', email: 'demo.student.b@ndmu.edu.ph' },
  { label: 'Academic Personnel', description: 'CBA Faculty', email: 'demo.academic.personnel@ndmu.edu.ph' },
  { label: 'Non-Academic Personnel', description: 'HR Unit Staff', email: 'demo.nonacademic.personnel@ndmu.edu.ph' },
  { label: 'HR Administrator', description: 'HR Admin Portal', email: 'demo.hr.admin@ndmu.edu.ph' },
  { label: 'OSAD Administrator', description: 'OSAD Admin Portal', email: 'demo.osad.admin@ndmu.edu.ph' },
  { label: 'College Dean', description: 'CBA Dean Oversight', email: 'demo.dean@ndmu.edu.ph' },
  { label: 'Program Coordinator A', description: 'BSA Coordinator Queue', email: 'demo.coordinator.a@ndmu.edu.ph' },
  { label: 'Program Coordinator B', description: 'BSBA-FM Coordinator Queue', email: 'demo.coordinator.b@ndmu.edu.ph' },
  { label: 'Organization Moderator', description: 'DEMO_JPIA Moderator', email: 'demo.moderator@ndmu.edu.ph' },
]

function loginErrorMessage(error, fallback) {
  const message = typeof error === 'string'
    ? error
    : (error?.error?.message || error?.message || '')
  if (/undefined variable|fatal error|uncaught exception|stack trace/i.test(message)) {
    return 'Sign-in is temporarily unavailable. Please try again shortly.'
  }
  return message || fallback
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, user: signedInUser } = useAuth()
  const forgotEmailRef = useRef(null)
  const demoMenuRef = useRef(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState(null)

  useEffect(() => {
    if (!isForgotModalOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !forgotSubmitting) setIsForgotModalOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => forgotEmailRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isForgotModalOpen, forgotSubmitting])

  const openForgotPassword = () => {
    setForgotEmail(email)
    setForgotSuccess(false)
    setForgotError(null)
    setIsForgotModalOpen(true)
  }

  const finishLogin = (session) => {
    login?.(session)

    const accountType = session.account_type || session.user_type
    const destinations = {
      student: '/student/dashboard',
      personnel: '/personnel/dashboard',
      hr_admin: '/hr/dashboard',
      osad_admin: '/osad/dashboard',
    }

    navigate(destinations[accountType] || RouteAccessController.resolveRedirect(session))
  }

  const handleSelectDemo = async (demoEmail) => {
    demoMenuRef.current?.removeAttribute('open')
    setEmail(demoEmail)
    setPassword('')
    setError('')

    try {
      setIsSubmitting(true)
      const session = await authenticateDemoUser(demoEmail, keepSignedIn)
      finishLogin(session)
    } catch (err) {
      setError(loginErrorMessage(err, 'We could not start the demo session. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Enter your institutional email and password to continue.')
      return
    }

    try {
      setIsSubmitting(true)
      const session = await authenticateUser(email, password, keepSignedIn)
      finishLogin(session)
    } catch (err) {
      setError(loginErrorMessage(err, 'We could not sign you in. Check your credentials and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    setForgotError(null)
    const cleanEmail = String(forgotEmail || '').trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.endsWith('@ndmu.edu.ph')) {
      setForgotError('Enter a valid NDMU institutional email ending in @ndmu.edu.ph.')
      return
    }

    try {
      setForgotSubmitting(true)
      await requestPasswordReset(cleanEmail)
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(err.message || 'The request could not be submitted. Please try again.')
    } finally {
      setForgotSubmitting(false)
    }
  }

  // Already signed in (e.g. an unknown URL redirected here): go to the user's own dashboard.
  if (signedInUser && !isSubmitting && getCurrentUser()) {
    return <Navigate to={RouteAccessController.resolveRedirect(signedInUser)} replace />
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#071a13] font-sans text-slate-950 selection:bg-emerald-200 selection:text-emerald-950">
      <div className="fixed inset-0 lg:hidden" aria-hidden="true">
        <img src={campusBanner} alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#071a13]/80" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1920px] items-stretch lg:p-5 xl:p-7">
        <section
          className="relative hidden flex-1 overflow-hidden rounded-[28px] bg-[#071a13] lg:block"
          style={{ containerType: 'size' }}
          aria-label="Notre Dame of Marbel University campus"
        >
          {/* Soft backdrop: fills any space around the banner so it never looks letterboxed. */}
          <img
            src={campusBanner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-2xl brightness-75"
          />
          {/* Banner keeps the crest and the school name inside the visible area at any screen size:
              it fills the panel like object-cover, but is never scaled past 190% of the panel width. */}
          <img
            src={campusBanner}
            alt="Notre Dame of Marbel University campus at twilight"
            className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
            style={{ width: 'min(max(100cqw, 212.5cqh), 190cqw)', height: 'auto' }}
          />
        </section>

        <section className="relative flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-8 lg:ml-5 lg:min-h-0 lg:w-[510px] lg:rounded-[28px] lg:bg-white lg:px-12 xl:w-[560px] xl:px-16">
          <div className="w-full max-w-[430px] rounded-[24px] bg-white px-5 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-9 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none">
            <header className="mb-8">
              <div className="mb-7">
                <AchieveNestLogo variant="horizontal" size="auth" />
                <p className="mt-1 text-xs font-medium text-slate-500">Notre Dame of Marbel University</p>
              </div>

              <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-slate-950 sm:text-[2.35rem]">
                Welcome back
              </h1>
              <p className="mt-2.5 text-sm leading-6 text-slate-600">
                Enter your institutional credentials to access your account.
              </p>
            </header>

            {error && (
              <div id="login-error" role="alert" aria-live="assertive" className="mb-5 flex items-start gap-3 rounded-[14px] bg-rose-50 px-4 py-3.5 text-sm leading-5 text-rose-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-800">
                  Institutional email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@ndmu.edu.ph"
                    aria-describedby={error ? 'login-error' : undefined}
                    className="h-12 w-full rounded-[14px] bg-slate-100 pl-11 pr-4 text-sm text-slate-950 outline-none ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-500 hover:ring-slate-300 focus:bg-white focus:ring-2 focus:ring-[#147a4c]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="login-password" className="text-sm font-semibold text-slate-800">Password</label>
                  <button type="button" onClick={openForgotPassword} className="rounded text-xs font-bold text-[#11683f] underline-offset-4 transition hover:text-[#084d2d] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c] focus-visible:ring-offset-2">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-[14px] bg-slate-100 pl-11 pr-12 text-sm text-slate-950 outline-none ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-500 hover:ring-slate-300 focus:bg-white focus:ring-2 focus:ring-[#147a4c]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                  </button>
                </div>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(event) => setKeepSignedIn(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="flex size-5 items-center justify-center rounded-md bg-white ring-1 ring-inset ring-slate-300 transition peer-checked:bg-[#11683f] peer-checked:text-white peer-checked:ring-[#11683f] peer-focus-visible:ring-2 peer-focus-visible:ring-[#147a4c] peer-focus-visible:ring-offset-2">
                  {keepSignedIn && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
                </span>
                Keep me signed in
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#0d5d39] px-5 text-sm font-bold text-white shadow-[0_9px_24px_rgba(13,93,57,0.24)] transition hover:bg-[#084c2d] hover:shadow-[0_12px_28px_rgba(13,93,57,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c] focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <section className="my-7" aria-label="Demo access">
              <div className="mb-3 flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Demo access</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="mb-3 text-xs leading-5 text-slate-500">
                Choose a persona to sign in instantly on this local demo.
              </p>

              <details ref={demoMenuRef} className="group relative">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-[12px] bg-white px-4 py-3 text-sm font-bold text-emerald-950 ring-1 ring-inset ring-emerald-800/30 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c] [&::-webkit-details-marker]:hidden">
                  <span>Demo Accounts</span>
                  <ChevronDown className="size-4 shrink-0 text-emerald-800 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 max-h-[min(18rem,42vh)] w-full overflow-y-auto rounded-[14px] bg-white p-1.5 shadow-[0_16px_36px_rgba(11,39,26,0.2)] ring-1 ring-emerald-900/10">
                  {demoAccounts.map((demo) => (
                    <li key={demo.email}>
                      <button
                        type="button"
                        onClick={() => handleSelectDemo(demo.email)}
                        disabled={isSubmitting}
                        className={`min-h-11 w-full rounded-[9px] px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147a4c] disabled:cursor-not-allowed disabled:opacity-60 ${
                          email === demo.email
                            ? 'bg-emerald-50 text-emerald-950'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        title={`Sign in as ${demo.label}`}
                      >
                        <span className="block text-xs font-bold">{demo.label}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{demo.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            </section>

            <footer className="mt-7 flex items-start gap-2.5 border-t border-slate-200 pt-5 text-[10px] font-semibold leading-4 text-slate-500">
              <ShieldCheck className="mt-px size-4 shrink-0 text-[#11683f]" aria-hidden="true" />
              <p>PAASCU Level III <span aria-hidden="true">•</span> ISO 9001:2015 <span aria-hidden="true">•</span> CHED Recognized</p>
            </footer>
          </div>
        </section>
      </div>

      {isForgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#071a13]/75 p-0 sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !forgotSubmitting) setIsForgotModalOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            className="w-full max-w-md overflow-hidden rounded-t-[24px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:rounded-[20px]"
          >
            <header className="flex items-start justify-between gap-5 border-b border-emerald-100 bg-emerald-50 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#0d5d39] text-white">
                  <KeyRound className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="reset-title" className="text-base font-extrabold tracking-[-0.015em] text-emerald-950">Request a password reset</h2>
                  <p className="mt-0.5 text-xs text-emerald-800">NDMU institutional account recovery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                disabled={forgotSubmitting}
                className="flex size-10 shrink-0 items-center justify-center rounded-[12px] text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c] disabled:opacity-50"
                aria-label="Close password reset dialog"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            {forgotSuccess ? (
              <div className="px-5 py-7 sm:px-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-[#0d5d39]">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.025em] text-slate-950">Request submitted</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Your request has been forwarded to the appropriate office for verification.</p>
                <div className="mt-5 rounded-[14px] bg-slate-100 px-4 py-4 text-sm leading-6 text-slate-700">
                  <p><strong className="font-bold text-slate-900">Students:</strong> verified and issued by the OSAD Office.</p>
                  <p className="mt-1"><strong className="font-bold text-slate-900">Personnel:</strong> verified and issued by the HR Office.</p>
                </div>
                <button type="button" onClick={() => setIsForgotModalOpen(false)} className="mt-6 h-11 w-full rounded-[12px] bg-[#0d5d39] px-5 text-sm font-bold text-white transition hover:bg-[#084c2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c] focus-visible:ring-offset-2">
                  Return to login
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="px-5 py-6 sm:px-6" noValidate>
                <p className="text-sm leading-6 text-slate-600">Enter your institutional email. Your request will be routed to the appropriate university office for verification.</p>

                {forgotError && (
                  <div role="alert" aria-live="assertive" className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="mt-5">
                  <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-800">Institutional email</label>
                  <input
                    ref={forgotEmailRef}
                    id="reset-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    placeholder="name@ndmu.edu.ph"
                    className="h-12 w-full rounded-[14px] bg-slate-100 px-4 text-sm text-slate-950 outline-none ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-500 hover:ring-slate-300 focus:bg-white focus:ring-2 focus:ring-[#147a4c]"
                    required
                  />
                </div>

                <div className="mt-5 rounded-[14px] bg-slate-100 px-4 py-4 text-xs leading-5 text-slate-600">
                  <p className="font-bold text-slate-800">Office verification routing</p>
                  <p className="mt-1.5">Students are assisted by OSAD. Personnel are assisted by HR.</p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setIsForgotModalOpen(false)} disabled={forgotSubmitting} className="h-11 rounded-[12px] px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c] disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={forgotSubmitting} className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#0d5d39] px-5 text-sm font-bold text-white transition hover:bg-[#084c2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147a4c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                    {forgotSubmitting && <span className="size-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />}
                    {forgotSubmitting ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
