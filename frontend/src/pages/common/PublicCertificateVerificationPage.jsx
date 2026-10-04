/**
 * PublicCertificateVerificationPage.jsx
 * Public, unauthenticated certificate verification page.
 * Route: /verify/certificate/:publicId
 *
 * Reads the real certificate record from the backend (GET /certificates/verify/{id}) so that
 * the QR code printed on an issued certificate resolves to its persisted status. It never
 * treats an unreachable or unknown record as verified, and shows revoked or superseded
 * certificates as such.
 */

import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Home, Loader2, ExternalLink } from 'lucide-react'
import certificateService from '../../services/certificateService'
import { AchieveNestLogo } from '../../components/brand'

const PURPOSE_LABELS = {
  PARTICIPATION: 'Certificate of Participation',
  ATTENDANCE: 'Certificate of Attendance',
  COMPLETION: 'Certificate of Completion',
  RECOGNITION: 'Certificate of Recognition',
  ACHIEVEMENT: 'Certificate of Achievement'
}

const STATUS_VIEW = {
  ISSUED: { tone: 'valid', badge: 'OFFICIAL VERIFIED CREDENTIAL • ISSUED' },
  REVOKED: { tone: 'invalid', badge: 'REVOKED • THIS CERTIFICATE IS NO LONGER VALID' },
  SUPERSEDED: { tone: 'warn', badge: 'SUPERSEDED • A REPLACEMENT CERTIFICATE EXISTS' }
}

function formatIssuedAt(value) {
  if (!value) return 'Not available'
  const date = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export default function PublicCertificateVerificationPage() {
  const { publicId } = useParams()
  const [state, setState] = useState({ phase: 'loading', cert: null })

  useEffect(() => {
    let cancelled = false
    setState({ phase: 'loading', cert: null })
    certificateService
      .verify(publicId)
      .then((cert) => {
        if (!cancelled) setState({ phase: cert ? 'found' : 'notFound', cert: cert || null })
      })
      .catch((error) => {
        if (cancelled) return
        const code = error?.error?.code
        setState({ phase: code === 'CERTIFICATE_NOT_FOUND' ? 'notFound' : 'error', cert: null })
      })
    return () => {
      cancelled = true
    }
  }, [publicId])

  const { phase, cert } = state
  const view = cert ? STATUS_VIEW[cert.status] || STATUS_VIEW.REVOKED : null
  const tone = view?.tone
  const toneClasses = {
    valid: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
    warn: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
    invalid: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 font-sans text-slate-800 dark:text-slate-200">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg bg-white px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
          <div>
            <AchieveNestLogo variant="horizontal" size="compact" />
            <span className="text-[10px] font-extrabold text-[#16834a] uppercase tracking-wider block">Public Verification Portal</span>
          </div>
        </Link>
        <Link
          to="/"
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </header>

      <main className="max-w-2xl w-full mx-auto my-auto space-y-6" aria-live="polite">
        {phase === 'loading' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-600" />
            <p className="text-xs font-bold text-slate-500">Checking the certificate registry…</p>
          </div>
        )}

        {phase === 'found' && cert && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 text-center">
            <div className="space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${toneClasses[tone]}`}>
                {tone === 'valid' ? <ShieldCheck className="w-9 h-9" /> : <ShieldAlert className="w-9 h-9" />}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold ${toneClasses[tone]}`}>
                {tone === 'valid' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{view.badge}</span>
              </div>
              <h1 className="text-2xl font-serif font-black text-slate-900 dark:text-white tracking-tight pt-1">
                {PURPOSE_LABELS[cert.certificate_purpose] || 'Certificate'}
              </h1>
              <p className="text-xs font-mono font-bold text-slate-500">
                Certificate No: <span className="text-slate-900 dark:text-white font-extrabold">{cert.certificate_number}</span>
              </p>
            </div>

            <dl className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left space-y-3 text-xs">
              <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <dt className="text-slate-500 font-bold">Recipient Name</dt>
                <dd className="font-extrabold text-slate-900 dark:text-white text-right">{cert.recipient_name || 'Not available'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <dt className="text-slate-500 font-bold">Recognized For</dt>
                <dd className="font-bold text-emerald-800 dark:text-emerald-300 text-right">{cert.title || 'Not available'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <dt className="text-slate-500 font-bold">Issued By</dt>
                <dd className="font-bold text-slate-800 dark:text-slate-200 text-right">{cert.issuer_name || 'Not available'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 font-bold">Issuance Timestamp</dt>
                <dd className="text-slate-700 dark:text-slate-300 font-bold text-right">{formatIssuedAt(cert.issued_at)}</dd>
              </div>
            </dl>

            {cert.replacement_available && cert.replacement_url && (
              <Link
                to={cert.replacement_url}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View the replacement certificate</span>
              </Link>
            )}

            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-slate-600 dark:text-slate-400 text-center">
              This result comes directly from the Notre Dame of Marbel University OSAD certificate registry.
            </div>
          </div>
        )}

        {phase === 'notFound' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Certificate Record Not Found</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No certificate matches the verification ID <code className="font-mono text-slate-800 dark:text-slate-200">{publicId}</code>.
              Please check the link or QR code. A certificate that cannot be found here should not be treated as genuine.
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Verification Unavailable</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              The registry could not be reached, so this certificate has not been verified. Please try again in a moment.
            </p>
          </div>
        )}
      </main>

      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[10px] text-slate-400 font-bold">
        AchieveNest © 2026 Notre Dame of Marbel University • Official OSAD Credential Registry
      </footer>
    </div>
  )
}
