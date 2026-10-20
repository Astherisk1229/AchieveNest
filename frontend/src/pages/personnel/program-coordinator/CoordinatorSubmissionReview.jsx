import React, { useEffect, useState } from 'react'
import { AlertTriangle, Download, ExternalLink, FileText, Minus, Plus, Scale, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { evidenceMime, useEvidenceObjectUrl } from '../../../components/common/EvidenceThumbnail'
import portfolioService from '../../../services/portfolioService'
import { detailRows, isConfiguredAchievement, missingRequiredDetails } from '../../../utils/achievementDetails'
import useStudentAchievementSchema from '../../../hooks/useStudentAchievementSchema'
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
  return <div className="grid gap-1 py-3 sm:grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)] sm:gap-4">
    <dt className="flex flex-wrap items-center self-start text-xs font-semibold text-slate-600">{label}{flagged && <AwardFlag/>}</dt>
    <dd className="min-w-0 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-900">{children}</dd>
  </div>
}

async function download(evidence) {
  const blob = await portfolioService.downloadEvidence(evidence.id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = evidence.original_filename || 'evidence'
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Side-by-side verification: the real document on the left, the student's claims on the right.
 * Only values from the record are shown. Fields the award engine reads are flagged, without points.
 */
export default function CoordinatorSubmissionReview({ item, loadRecordDetail }) {
  const { detail, error } = useCoordinatorRecordDetail(item?.id, loadRecordDetail)
  const schemaCatalog = useStudentAchievementSchema(Boolean(item))
  const [activeId, setActiveId] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [downloadError, setDownloadError] = useState('')
  const [reviewView, setReviewView] = useState('compare')
  const evidence = detail?.evidence || item?.evidence || []
  const active = evidence.find(entry => entry.id === activeId) || evidence[0] || null
  const { url, loading, failed } = useEvidenceObjectUrl(active)
  useEffect(() => { setZoom(1); setDownloadError('') }, [item?.id, active?.id])
  if (!item) return null

  const handleDownload = async () => {
    if (!active) return
    setDownloadError('')
    try { await download(active) }
    catch { setDownloadError('The supporting document could not be downloaded. Try opening it full size and downloading from there.') }
  }

  const configured = isConfiguredAchievement(item.structured_metadata)
  const details = detailRows(item.subcategory_id, item.structured_metadata, schemaCatalog)
  const missing = missingRequiredDetails(item.subcategory_id, item.structured_metadata, schemaCatalog)
  const activityDate = formatDateRange(item.start_date || item.occurrence_date, item.end_date)

  const viewButtonClass = view => `rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${reviewView === view ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-white'}`

  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs font-semibold text-slate-600">Review view</p>
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1" aria-label="Choose review layout">
        <button type="button" aria-pressed={reviewView === 'compare'} onClick={() => setReviewView('compare')} className={viewButtonClass('compare')}>Compare</button>
        <button type="button" aria-pressed={reviewView === 'document'} onClick={() => setReviewView('document')} className={viewButtonClass('document')}>Evidence</button>
        <button type="button" aria-pressed={reviewView === 'details'} onClick={() => setReviewView('details')} className={viewButtonClass('details')}>Details</button>
      </div>
    </div>

    <div className={`grid min-w-0 gap-5 ${reviewView === 'compare' ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-1'}`}>
    <section aria-label="Submitted document" className={`min-w-0 space-y-3 ${reviewView === 'details' ? 'hidden' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">Supporting evidence</h3>
          <p className="mt-0.5 max-w-full truncate text-xs text-slate-500" title={active?.original_filename || ''}>{active?.original_filename || 'No document attached'}</p>
        </div>
        {active && <div className="flex items-center gap-1.5">
          <div className="mr-1 flex items-center rounded-lg border border-slate-200 bg-white p-0.5" aria-label="Evidence zoom controls">
            <button type="button" onClick={() => setZoom(value => Math.max(0.75, +(value - 0.25).toFixed(2)))} disabled={zoom <= 0.75} aria-label="Zoom out" className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><Minus className="h-4 w-4"/></button>
            <button type="button" onClick={() => setZoom(1)} aria-label="Reset zoom" title="Reset zoom" className="min-w-12 rounded-md px-1.5 py-1 text-xs font-semibold tabular-nums text-slate-700 hover:bg-slate-100">{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={() => setZoom(value => Math.min(2, +(value + 0.25).toFixed(2)))} disabled={zoom >= 2} aria-label="Zoom in" className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4"/></button>
          </div>
          {url && <a href={url} target="_blank" rel="noreferrer" aria-label="Open evidence full size" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5"/><span className="hidden sm:inline">Open</span></a>}
          <button type="button" onClick={handleDownload} aria-label="Download evidence" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-3.5 w-3.5"/><span className="hidden sm:inline">Download</span></button>
        </div>}
      </div>

      <div className="flex h-[min(38vh,34rem)] min-h-[16rem] items-center justify-center overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-2 sm:min-h-[18rem] xl:h-[min(38vh,34rem)]">
        {!active ? <div className="flex flex-col items-center gap-2 px-5 text-center text-slate-500"><FileText className="h-7 w-7 text-slate-400"/><p className="text-sm font-semibold">No supporting evidence attached</p></div>
          : loading ? <p className="text-sm font-medium text-slate-500">Loading document preview…</p>
            : !url || failed ? <div className="flex flex-col items-center gap-2 px-5 text-center text-slate-500"><AlertTriangle className="h-6 w-6 text-amber-600"/><p className="text-sm font-semibold">Preview unavailable</p><p className="text-xs">Try downloading the supporting document.</p></div>
              : evidenceMime(active) === 'application/pdf'
                ? <iframe title={`Preview of ${active.original_filename}`} src={`${url}#page=1&view=FitH&toolbar=1`} className="h-full min-h-full w-full origin-center bg-white shadow-sm" style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%`, height: `${100 / zoom}%` }}/>
                : <img src={url} alt={`Document: ${active.original_filename}`} className="h-full min-h-full w-full origin-center object-contain transition-transform" style={{ transform: `scale(${zoom})` }}/>
        }
      </div>
      {active && (() => {
        const security = securityLabel(active)
        const Icon = security.icon
        return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2">
          <p className={`flex items-center gap-1.5 text-xs font-medium ${security.className}`}><Icon className="h-3.5 w-3.5" aria-hidden="true"/>{security.text}</p>
          {downloadError && <p role="alert" className="w-full text-xs font-medium text-rose-700">{downloadError}</p>}
        </div>
      })()}
      {evidence.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Documents">
        {evidence.map(entry => <button key={entry.id} type="button" onClick={() => setActiveId(entry.id)} className={`max-w-[12rem] truncate rounded-lg border px-2.5 py-1 text-xs ${entry.id === active?.id ? 'border-[#16834a] bg-emerald-50 font-bold text-emerald-900' : 'border-slate-300 text-slate-700'}`}>{entry.original_filename}</button>)}
      </div>}
      {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
    </section>

    <section aria-label="Student's claims" className={`min-w-0 space-y-5 ${reviewView === 'document' ? 'hidden' : ''}`}>
      <div>
        <p className="text-xs font-semibold text-slate-500">Submitted achievement</p>
        <h3 className="mt-1 text-xl font-bold leading-snug text-slate-900">{item.title || 'Untitled'}</h3>
      </div>
      {item.revision_of_record_id && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
        <p className="font-bold">Updated version of a verified achievement</p>
        <p className="mt-1 text-xs leading-relaxed">Review the updated details and evidence. The previous verified version remains active unless you approve this revision.</p>
      </div>}
      <div className="space-y-4">
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Classification</h4>
          <dl className="mt-1 divide-y divide-slate-200 border-y border-slate-200">
            <Claim label="Category">{item.category_name || item.category || 'Not chosen'}</Claim>
            <Claim label="Subcategory">{item.subcategory_name || 'Not chosen'}</Claim>
          </dl>
        </section>
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Submitted details</h4>
          <dl className="mt-1 divide-y divide-slate-200 border-y border-slate-200">
            {!configured && <>
              <Claim label="Organizer / issuing body">{item.organizer_or_body || <span className="text-slate-500">Not provided</span>}</Claim>
              <Claim label="Activity date">{activityDate || <span className="text-slate-500">Not provided</span>}</Claim>
            </>}
            {details.map(row => <Claim key={row.key} label={row.label} flagged={row.affectsAwards}>{row.value}</Claim>)}
          </dl>
        </section>
        {!configured && item.description && <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</h4>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">{item.description}</p>
        </section>}
      </div>
      {missing.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <p className="flex items-center gap-1.5 font-bold"><AlertTriangle className="h-4 w-4" aria-hidden="true"/>Required details left empty</p>
        <p className="mt-1">{missing.map(field => field.label + (field.affectsAwards ? ` (${AWARD_FLAG_TEXT})` : '')).join(', ')}</p>
      </div>}
      {details.some(row => row.affectsAwards) && <p className="border-l-2 border-indigo-300 pl-3 text-xs leading-relaxed text-slate-600">Fields marked “{AWARD_FLAG_TEXT}” are used by OSAD when matching this achievement to award criteria.</p>}
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
  </div>
}
