import React from 'react'
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'

export default function CertificateSignatoryResolver({ recipient }) {
  const slots = recipient?.template?.signatorySlots || []
  const signatoryBlockers = (recipient?.blockingReasons || []).filter(reason => [
    'REQUIRED_SIGNATORY_UNAVAILABLE',
    'SIGNATORY_NOT_AUTHORIZED',
    'SIGNATURE_ASSET_UNAVAILABLE'
  ].includes(reason.code))

  return (
    <section className="space-y-4" aria-labelledby="signatory-readiness-heading">
      <div>
        <h3 id="signatory-readiness-heading" className="text-sm font-extrabold text-slate-900 dark:text-white">Backend signatory readiness</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">This step displays the template contract and backend blockers. It does not infer or configure institutional policy.</p>
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-xs leading-relaxed text-slate-800 dark:bg-slate-800 dark:text-slate-200">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Signatory configuration remains governed by the backend certificate contract.
      </div>

      {slots.length > 0 && (
        <div className="space-y-2">
          {slots.map((slot, index) => (
            <div key={slot.role_code || slot.id || index} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <span className="min-w-0 break-words text-sm font-bold text-slate-900 dark:text-white">{slot.title || slot.role_name || slot.role_code || 'Required signatory'}</span>
              <span className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">{String(slot.requirement_type || '').toUpperCase() === 'REQUIRED' ? 'Required' : 'Optional'}</span>
            </div>
          ))}
        </div>
      )}

      {signatoryBlockers.length > 0 ? (
        <ul className="space-y-2" aria-label="Signatory readiness blockers">
          {signatoryBlockers.map(reason => <li key={reason.code} className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{reason.message}</span></li>)}
        </ul>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" role="status"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> No signatory blocker was reported.</div>
      )}
    </section>
  )
}
