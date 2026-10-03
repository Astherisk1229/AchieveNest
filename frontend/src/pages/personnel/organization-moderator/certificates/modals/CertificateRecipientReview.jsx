import React, { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, FileCheck2, Search, ShieldAlert } from 'lucide-react'
import { CERTIFICATE_PURPOSE_LABELS } from '../../../../../services/certificateReadiness'

const STATUS_PRESENTATION = {
  ISSUABLE: {
    label: 'Ready',
    classes: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    Icon: CheckCircle2
  },
  ELIGIBLE_NOT_ISSUABLE: {
    label: 'Eligible — Not Ready',
    classes: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    Icon: AlertCircle
  },
  NOT_ELIGIBLE: {
    label: 'No Certificate Applicable',
    classes: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    Icon: ShieldAlert
  }
}

export default function CertificateRecipientReview({ recipients = [], selectedRecipientId, onSelectRecipient, isDisabled = false }) {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredRecipients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return recipients
    return recipients.filter(recipient => [
      recipient.studentName,
      recipient.studentNumber,
      recipient.sourceRecord?.title
    ].some(value => String(value || '').toLowerCase().includes(query)))
  }, [recipients, searchTerm])

  const counts = recipients.reduce((result, recipient) => {
    result[recipient.readinessStatus] = (result[recipient.readinessStatus] || 0) + 1
    return result
  }, {})

  return (
    <section className="space-y-4" aria-labelledby="certificate-recipient-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="certificate-recipient-heading" className="text-sm font-extrabold text-slate-900 dark:text-white">
            Backend certificate assessment
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Eligibility, purpose, and blockers below come directly from the certificate service.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold tabular-nums">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{counts.ISSUABLE || 0} ready</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900 dark:bg-amber-950 dark:text-amber-200">{counts.ELIGIBLE_NOT_ISSUABLE || 0} blocked</span>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-800 dark:bg-slate-800 dark:text-slate-200">{counts.NOT_ELIGIBLE || 0} no certificate</span>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">Search certificate candidates</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder="Search by student, ID, or source record"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </label>

      <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {filteredRecipients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            No certificate candidates match this search.
          </div>
        ) : filteredRecipients.map(recipient => {
          const status = STATUS_PRESENTATION[recipient.readinessStatus]
          const StatusIcon = status.Icon
          const selected = selectedRecipientId === recipient.sourceRecord.id
          return (
            <button
              key={recipient.sourceRecord.id}
              type="button"
              onClick={() => onSelectRecipient(recipient.sourceRecord.id)}
              disabled={isDisabled}
              aria-pressed={selected}
              className={`w-full min-w-0 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'}`}
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-extrabold text-slate-900 dark:text-white">{recipient.studentName}</p>
                  <p className="mt-0.5 break-words text-xs text-slate-600 dark:text-slate-300">
                    {[recipient.studentNumber, recipient.program].filter(Boolean).join(' • ') || `Student reference: ${recipient.studentId}`}
                  </p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[11px] font-extrabold ${status.classes}`}>
                  <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {status.label}
                </span>
              </div>

              <div className="mt-3 grid min-w-0 gap-3 border-t border-slate-200 pt-3 dark:border-slate-700 sm:grid-cols-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Source record</span>
                  <p className="break-words text-xs font-bold text-slate-800 dark:text-slate-200">{recipient.sourceRecord.title}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Certificate purpose</span>
                  <p className="break-words text-xs font-bold text-slate-800 dark:text-slate-200">
                    {recipient.certificatePurpose ? CERTIFICATE_PURPOSE_LABELS[recipient.certificatePurpose] || recipient.certificatePurpose : 'No Certificate Applicable'}
                  </p>
                </div>
              </div>

              {recipient.blockingReasons.length > 0 && (
                <ul className="mt-3 space-y-1.5" aria-label="Certificate readiness blockers">
                  {recipient.blockingReasons.map(reason => (
                    <li key={reason.code} className="flex gap-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      <span className="break-words">{reason.message}</span>
                    </li>
                  ))}
                </ul>
              )}

              {recipient.existingCertificate && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                  <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Already issued.</strong>
                    {recipient.existingCertificate.certificateNumber ? ` Certificate No. ${recipient.existingCertificate.certificateNumber}` : ' Use the controlled reissue workflow for any replacement.'}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
