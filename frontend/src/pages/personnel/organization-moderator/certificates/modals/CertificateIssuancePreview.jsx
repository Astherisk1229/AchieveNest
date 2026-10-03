import React from 'react'
import { CheckCircle2, Eye, ExternalLink, ShieldCheck } from 'lucide-react'
import { CERTIFICATE_PURPOSE_LABELS } from '../../../../../services/certificateReadiness'

export default function CertificateIssuancePreview({ recipient, selectedEvent, issuedCertificate = null }) {
  const purpose = CERTIFICATE_PURPOSE_LABELS[recipient?.certificatePurpose] || 'Certificate Preview'

  if (issuedCertificate) {
    return (
      <section className="space-y-4" aria-labelledby="certificate-issued-heading" aria-live="polite">
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-5 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 id="certificate-issued-heading" className="font-extrabold">{issuedCertificate.alreadyIssued ? 'Certificate already issued' : 'Certificate issued'}</h3>
            <p className="mt-1 text-sm leading-relaxed">The official certificate identity was generated and persisted by the backend.</p>
          </div>
        </div>
        <dl className="grid gap-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950 sm:grid-cols-2">
          <div className="min-w-0"><dt className="text-xs font-bold text-slate-500 dark:text-slate-400">Certificate No.</dt><dd className="mt-1 break-words text-base font-extrabold tabular-nums text-slate-900 dark:text-white">{issuedCertificate.certificateNumber}</dd></div>
          <div className="min-w-0"><dt className="text-xs font-bold text-slate-500 dark:text-slate-400">Purpose</dt><dd className="mt-1 break-words text-base font-extrabold text-slate-900 dark:text-white">{CERTIFICATE_PURPOSE_LABELS[issuedCertificate.certificatePurpose] || purpose}</dd></div>
          <div className="min-w-0"><dt className="text-xs font-bold text-slate-500 dark:text-slate-400">Recipient</dt><dd className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">{recipient?.studentName}</dd></div>
          <div className="min-w-0"><dt className="text-xs font-bold text-slate-500 dark:text-slate-400">Issued</dt><dd className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">{issuedCertificate.issuedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(issuedCertificate.issuedAt.replace(' ', 'T'))) : 'Recorded by the backend'}</dd></div>
        </dl>
        {issuedCertificate.verificationUrl && <a href={issuedCertificate.verificationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-extrabold text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40">Open public verification <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}
      </section>
    )
  }

  return (
    <section className="space-y-4" aria-labelledby="certificate-preview-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="certificate-preview-heading" className="text-sm font-extrabold text-slate-900 dark:text-white">Unofficial certificate preview</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Presentation only. No issuance record, certificate number, public ID, or QR code is generated.</p>
        </div>
        <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 dark:bg-amber-950 dark:text-amber-200"><Eye className="h-4 w-4" aria-hidden="true" /> PREVIEW</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-700/30 bg-amber-50 px-5 py-10 text-center text-slate-900 shadow-lg dark:border-amber-500/30 dark:bg-slate-950 dark:text-white sm:px-10">
        <div className="absolute inset-x-0 top-0 bg-amber-700 py-1 text-[10px] font-black tracking-[0.22em] text-white">UNOFFICIAL PREVIEW</div>
        <p className="mt-3 text-xs font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">Notre Dame of Marbel University</p>
        <h4 className="mt-5 break-words font-serif text-2xl font-black sm:text-3xl">{purpose}</h4>
        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">Presented to</p>
        <p className="mx-auto mt-2 max-w-2xl break-words font-serif text-2xl font-bold text-emerald-950 dark:text-emerald-200">{recipient?.studentName}</p>
        <p className="mx-auto mt-5 max-w-2xl break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">For the verified source record <strong>{recipient?.sourceRecord?.title}</strong>{selectedEvent?.title ? ` within ${selectedEvent.title}` : ''}.</p>
        <p className="mx-auto mt-3 max-w-2xl break-words text-xs text-slate-600 dark:text-slate-300">Template: <strong>{recipient?.template?.name || 'No compatible template selected'}</strong></p>
        <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 rounded-xl bg-white/80 p-3 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200"><ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" /> Backend readiness: {recipient?.readinessStatus === 'ISSUABLE' ? 'Ready' : recipient?.readinessStatus === 'NOT_ELIGIBLE' ? 'No Certificate Applicable' : 'Eligible — Not Ready'}</div>
      </div>
    </section>
  )
}
