import React, { useState } from 'react'
import { AlertTriangle, Download, ExternalLink, FileText, Scale, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import EvidenceThumbnail, { evidenceMime, useEvidenceObjectUrl } from '../../../components/common/EvidenceThumbnail'
import portfolioService from '../../../services/portfolioService'
import { detailRows, missingRequiredDetails } from '../../../utils/achievementDetails'
import { formatDateRange } from '../../../utils/achievementDates'
import { CoordinatorEventTimeline, useCoordinatorRecordDetail } from './CoordinatorReviewParts'

function securityLabel(evidence) {
  if (evidence.security_status === 'clean') return { text: 'Security check passed', icon: ShieldCheck, className: 'text-emerald-700' }
  if (evidence.security_status === 'rejected') return { text: 'Failed the security check', icon: ShieldAlert, className: 'text-rose-700' }
  return { text: 'Security check pending', icon: ShieldQuestion, className: 'text-amber-700' }
}

export const AWARD_FLAG_TEXT = 'Affects award evaluation'

function AwardFlag() {
  return <span className="ml-1.5 inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-indigo-800"><Scale className="h-3 w-3" aria-hidden="true"/>{AWARD_FLAG_TEXT}</span>
}

function Claim({ label, flagged = false, children }) {
  return <div className={`rounded-xl border p-3 ${flagged ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
    <dt className="flex flex-wrap items-center text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}{flagged && <AwardFlag/>}</dt>
    <dd className="mt-1 text-sm font-semibold text-slate-900">{children}</dd>
  </div>
}

async function download(evidence) {
  const blob = await portfolioService.downloadEvidence(evidence.id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = evidence.original_filename || 'evidence'
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Side-by-side verification: the real document on the left, the student's claims on the right.
 * Only values from the record are shown. Fields the award engine reads are flagged, without points.
 */
export default function CoordinatorSubmissionReview({ item, loadRecordDetail }) {
  const { detail, error } = useCoordinatorRecordDetail(item?.id, loadRecordDetail)
  const [activeId, setActiveId] = useState(null)
  const evidence = detail?.evidence || item?.evidence || []
  const active = evidence.find(entry => entry.id === activeId) || evidence[0] || null
  const { url } = useEvidenceObjectUrl(active)
  if (!item) return null

  const details = detailRows(item.subcategory_id, item.structured_metadata)
  const missing = missingRequiredDetails(item.subcategory_id, item.structured_metadata)
  const activityDate = formatDateRange(item.start_date || item.occurrence_date, item.end_date)

  return <div className="grid gap-5 xl:grid-cols-2">
    <section aria-label="Submitted document" className="space-y-3">
      <EvidenceThumbnail evidence={active} className="h-[60vh] min-h-80 rounded-2xl border border-slate-200" fit="object-contain"/>
      {active && (() => {
        const security = securityLabel(active)
        const Icon = security.icon
        return <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800"><FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true"/>{active.original_filename}</p>
            <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${security.className}`}><Icon className="h-3.5 w-3.5" aria-hidden="true"/>{security.text}</p>
          </div>
          <div className="flex gap-2">
            {url && <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5"/>Open full size</a>}
            <button type="button" onClick={() => download(active)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"><Download className="h-3.5 w-3.5"/>Download</button>
          </div>
        </div>
      })()}
      {evidence.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Documents">
        {evidence.map(entry => <button key={entry.id} type="button" onClick={() => setActiveId(entry.id)} className={`max-w-[12rem] truncate rounded-lg border px-2.5 py-1 text-xs ${entry.id === active?.id ? 'border-[#16834a] bg-emerald-50 font-bold text-emerald-900' : 'border-slate-300 text-slate-700'}`}>{entry.original_filename}</button>)}
      </div>}
      {active && evidenceMime(active) === 'application/pdf' && <p className="text-[11px] text-slate-500">PDF previews show the first page. Use "Open full size" to read every page.</p>}
      {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
    </section>

    <section aria-label="Student's claims" className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Check each claim against the document</p>
        <h3 className="mt-1 text-lg font-extrabold leading-snug text-slate-900">{item.title || 'Untitled'}</h3>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Claim label="Category" flagged>{item.category_name || item.category || 'Not chosen'}</Claim>
        <Claim label="Subcategory" flagged>{item.subcategory_name || 'Not chosen'}</Claim>
        <Claim label="Organizer / issuing body">{item.organizer_or_body || <span className="text-slate-500">Not provided</span>}</Claim>
        <Claim label="Activity date">{activityDate || <span className="text-slate-500">Not provided</span>}</Claim>
        {details.map(row => <Claim key={row.key} label={row.label} flagged={row.affectsAwards}>{row.value}</Claim>)}
      </dl>
      {missing.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <p className="flex items-center gap-1.5 font-bold"><AlertTriangle className="h-4 w-4" aria-hidden="true"/>Required details left empty</p>
        <p className="mt-1">{missing.map(field => field.label + (field.affectsAwards ? ' (affects award evaluation)' : '')).join(', ')}</p>
      </div>}
      {item.description && <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Description</p>
        <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{item.description}</p>
      </div>}
      <p className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-900">Fields marked "{AWARD_FLAG_TEXT}" are used by OSAD when matching this achievement to award criteria. Point values are not shown here. If any of them does not match the document, return the submission with remarks.</p>
      {item.return_remarks && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <p className="font-bold">Previous return remarks</p>
        <p className="mt-1">{item.return_remarks}</p>
      </div>}
      {detail?.events?.length > 0 && <div className="space-y-2">
        <p className="text-xs font-extrabold text-slate-900">History</p>
        <CoordinatorEventTimeline events={detail.events}/>
      </div>}
    </section>
  </div>
}
