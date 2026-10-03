import React from 'react'
import { ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react'

/**
 * StudentCertificateBadge.jsx
 * Compact presentation component for certificate lifecycle status in student views.
 */
export default function StudentCertificateBadge({
  certificate,
  showNumber = true,
  className = ''
}) {
  if (!certificate || !certificate.status) {
    return null
  }

  const status = certificate.status.toUpperCase()

  if (status === 'ISSUED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 ${className}`}
        title={`Official Certificate ${certificate.certificate_number || ''}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Official Certificate</span>
        {showNumber && certificate.certificate_number && (
          <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 opacity-90">
            • {certificate.certificate_number}
          </span>
        )}
      </span>
    )
  }

  if (status === 'REVOKED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 ${className}`}
        title="This certificate has been revoked"
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>Revoked</span>
        {showNumber && certificate.certificate_number && (
          <span className="font-mono text-[10px] text-rose-700 dark:text-rose-400 opacity-80">
            • {certificate.certificate_number}
          </span>
        )}
      </span>
    )
  }

  if (status === 'SUPERSEDED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 ${className}`}
        title="This certificate has been superseded"
      >
        <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Superseded</span>
        {showNumber && certificate.certificate_number && (
          <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 opacity-80">
            • {certificate.certificate_number}
          </span>
        )}
      </span>
    )
  }

  return null
}
