import React, { useEffect, useRef } from 'react'
import { ArrowLeft, ExternalLink, FileQuestion, X } from 'lucide-react'

export default function AwardEvidenceDrawer({ criterion, open, onClose, returnFocusRef, loading = false, error = null, onRetry = null }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    closeRef.current?.focus()
    const escape = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open, onClose])

  const close = () => {
    onClose()
    requestAnimationFrame(() => returnFocusRef?.current?.focus())
  }

  if (!open || !criterion) return null
  const records = criterion.evidenceRecords || []

  return <div className="fixed inset-0 z-50" role="presentation">
    <button type="button" aria-label="Close evidence panel" onClick={close} className="absolute inset-0 bg-slate-950/35" />
    <aside role="dialog" aria-modal="true" aria-labelledby="evidence-drawer-title" className="absolute inset-0 flex flex-col bg-white shadow-2xl dark:bg-[#101827] sm:inset-y-0 sm:left-auto sm:w-[min(34rem,92vw)]">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="min-w-0"><p className="text-sm text-slate-500">Verified records</p><h2 id="evidence-drawer-title" className="truncate text-lg font-semibold text-slate-900 dark:text-white">{criterion.criterion_name}</h2></div>
        <button ref={closeRef} type="button" onClick={close} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5 sm:hidden" aria-hidden="true" /><X className="hidden h-5 w-5 sm:block" aria-hidden="true" /><span className="sr-only">Back to candidate review</span></button>
      </header>
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? <div role="status" className="space-y-4" aria-label="Loading evidence records">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />)}</div>
          : error ? <div role="alert" className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"><p className="font-semibold text-slate-900 dark:text-white">We couldn't load the evidence records.</p><p className="text-sm text-slate-500">The candidate review remains available.</p>{onRetry && <button type="button" onClick={onRetry} className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Try again</button>}</div>
          : records.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"><FileQuestion className="h-8 w-8 text-slate-400" aria-hidden="true" /><p className="font-semibold text-slate-900 dark:text-white">No evidence records available for this criterion.</p></div>
          : <ul className="divide-y divide-slate-200 dark:divide-slate-800">{records.map((record, index) => {
            const attachment = record.attachment_url || record.document_url || record.file_url || null
            return <li key={record.record_id || record.id || index} className="space-y-3 py-5 first:pt-0">
              <div><h3 className="font-semibold text-slate-900 dark:text-white">{record.title || 'Evidence title unavailable'}</h3><p className="mt-1 text-sm text-slate-500">{record.category_name || record.category_code || record.type || 'Evidence type unavailable'}</p></div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {record.occurrence_date && <div><dt className="text-slate-500">Date</dt><dd className="text-slate-800 dark:text-slate-200">{record.occurrence_date}</dd></div>}
                {record.verification_status && <div><dt className="text-slate-500">Verification</dt><dd className="text-slate-800 dark:text-slate-200">{record.verification_status}</dd></div>}
                {(record.issuer || record.organizer) && <div><dt className="text-slate-500">Issuer / organizer</dt><dd className="text-slate-800 dark:text-slate-200">{record.issuer || record.organizer}</dd></div>}
                {(record.role || record.result || record.structured_metadata?.placement) && <div><dt className="text-slate-500">Role / result</dt><dd className="text-slate-800 dark:text-slate-200">{record.role || record.result || record.structured_metadata?.placement}</dd></div>}
              </dl>
              {attachment ? <a href={attachment} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">View attachment <ExternalLink className="h-4 w-4" aria-hidden="true" /></a> : <p className="text-sm text-slate-500">Supporting file unavailable</p>}
            </li>
          })}</ul>}
      </div>
    </aside>
  </div>
}
