import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Download, ExternalLink, FileText, Pencil, RotateCcw, ShieldAlert, ShieldCheck, ShieldQuestion, X, XCircle } from 'lucide-react'
import StudentCertificateSection from '../../../components/common/StudentCertificateSection'
import EvidenceThumbnail, { evidenceMime, useEvidenceObjectUrl } from '../../../components/common/EvidenceThumbnail'
import { getSubcategorySchema } from '../../../config/portfolioFormSchemaRegistry'
import { parseStructuredMetadata } from '../../../controllers/StudentAchievementDraftSession'
import portfolioService from '../../../services/portfolioService'
import { formatDateTime } from '../../../utils/achievementDates'

const STATUS_STYLE = {
  draft: { label: 'Draft', icon: Pencil, className: 'bg-slate-100 text-slate-700 border-slate-300' },
  submitted: { label: 'Pending review', icon: Clock, className: 'bg-amber-50 text-amber-800 border-amber-300' },
  revision_requested: { label: 'Returned for revision', icon: RotateCcw, className: 'bg-orange-50 text-orange-800 border-orange-300' },
  verified: { label: 'Verified', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-rose-50 text-rose-800 border-rose-300' }
}
const EVENT_LABELS = { submitted: 'Submitted for review', resubmitted: 'Resubmitted', revision_requested: 'Returned for revision', verified: 'Verified by coordinator', rejected: 'Rejected' }

function securityLabel(evidence) {
  if (evidence.security_status === 'clean') return { text: 'Security check passed', icon: ShieldCheck, className: 'text-emerald-700' }
  if (evidence.security_status === 'rejected') return { text: 'Failed the security check', icon: ShieldAlert, className: 'text-rose-700' }
  return { text: 'Security check pending', icon: ShieldQuestion, className: 'text-amber-700' }
}

/** Category-specific details as label/value pairs, using the subcategory form's own labels. */
export function detailRows(subcategoryId, metadataValue) {
  const metadata = parseStructuredMetadata(metadataValue)
  const fields = getSubcategorySchema(subcategoryId)?.fields || []
  return fields
    .filter(field => ![undefined, null, ''].includes(metadata[field.key]))
    .map(field => {
      const raw = metadata[field.key]
      const option = (field.options || []).find(item => item.value === raw)
      return { key: field.key, label: field.label, value: option ? option.label : String(raw) }
    })
}

function Field({ label, children }) {
  return <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{children}</dd></div>
}

/**
 * Document-first achievement preview: the real uploaded document on the left, the student's
 * entered details on the right. Shows only data that exists; nothing is defaulted or invented.
 */
export default function StudentAchievementPreviewModal({ achievement, isOpen, onClose, onEdit, onDownload, onResubmit }) {
  const [events, setEvents] = useState([])
  const [activeEvidenceId, setActiveEvidenceId] = useState(null)
  const evidenceList = achievement?.evidence || []
  const activeEvidence = evidenceList.find(item => item.id === activeEvidenceId) || evidenceList[0] || null
  const { url: fullUrl } = useEvidenceObjectUrl(isOpen ? activeEvidence : null)

  useEffect(() => {
    if (!isOpen || !achievement?.id) { setEvents([]); return undefined }
    let active = true
    setActiveEvidenceId(null)
    portfolioService.fetchRecord(achievement.id)
      .then(result => { if (active) setEvents(result?.events || []) })
      .catch(() => { if (active) setEvents([]) })
    return () => { active = false }
  }, [isOpen, achievement?.id])

  if (!isOpen || !achievement) return null

  const status = achievement.canonical_status || 'draft'
  const style = STATUS_STYLE[status] || STATUS_STYLE.draft
  const StatusIcon = style.icon
  const editable = ['draft', 'revision_requested'].includes(status)
  const details = detailRows(achievement.subcategory_id, achievement.structured_metadata)
  const classification = [achievement.category_name || achievement.category, achievement.subcategory].filter(Boolean).join(' › ')
  const history = events.filter(event => EVENT_LABELS[event.action])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="achievement-preview-title">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-950">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <h2 id="achievement-preview-title" className="truncate text-lg font-extrabold text-slate-900 dark:text-white">{achievement.title || 'Untitled draft'}</h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{classification || 'Category not chosen yet'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${style.className}`}><StatusIcon className="h-3.5 w-3.5" aria-hidden="true"/>{style.label}</span>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close preview"><X className="h-5 w-5"/></button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 lg:border-b-0 lg:border-r sm:p-5">
            <EvidenceThumbnail evidence={activeEvidence} className="h-[48vh] min-h-72 rounded-2xl border border-slate-200 bg-white dark:border-slate-800" fit="object-contain"/>
            {activeEvidence && (() => {
              const security = securityLabel(activeEvidence)
              const SecurityIcon = security.icon
              return <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100"><FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true"/>{activeEvidence.original_filename}</p>
                  <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${security.className}`}><SecurityIcon className="h-3.5 w-3.5" aria-hidden="true"/>{security.text}</p>
                </div>
                <div className="flex gap-2">
                  {fullUrl && <a href={fullUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-white dark:border-slate-700 dark:text-slate-100"><ExternalLink className="h-3.5 w-3.5"/>Open full size</a>}
                  {onDownload && <button type="button" onClick={() => onDownload({ ...achievement, evidence_id: activeEvidence.id, attached_file_name: activeEvidence.original_filename })} className="inline-flex items-center gap-1.5 rounded-xl bg-[#16834a] px-3 py-2 text-xs font-bold text-white hover:bg-[#126b3c]"><Download className="h-3.5 w-3.5"/>Download</button>}
                </div>
              </div>
            })()}
            {evidenceList.length > 1 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Documents">
              {evidenceList.map(item => <button key={item.id} type="button" onClick={() => setActiveEvidenceId(item.id)} className={`max-w-[12rem] truncate rounded-lg border px-2.5 py-1 text-xs ${item.id === activeEvidence?.id ? 'border-[#16834a] bg-emerald-50 font-bold text-emerald-900' : 'border-slate-300 text-slate-700'}`}>{item.original_filename}</button>)}
            </div>}
            {activeEvidence && evidenceMime(activeEvidence) === 'application/pdf' && <p className="mt-2 text-[11px] text-slate-500">PDF previews show the first page. Use "Open full size" to read every page.</p>}
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {status === 'revision_requested' && achievement.return_remarks && <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <p className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" aria-hidden="true"/>Coordinator remarks</p>
              <p className="mt-1">{achievement.return_remarks}</p>
            </div>}
            {achievement.certificate && <StudentCertificateSection certificate={achievement.certificate}/>}

            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Organizer / issuing body">{achievement.organizer_or_body || <span className="text-slate-500">Not provided</span>}</Field>
              <Field label="Activity date">{achievement.display_date}</Field>
            </dl>
            {achievement.description && <Field label="Description"><span className="whitespace-pre-line">{achievement.description}</span></Field>}

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Details</h3>
              {details.length
                ? <dl className="mt-2 grid gap-3 sm:grid-cols-2">{details.map(row => <Field key={row.key} label={row.label}>{row.value}</Field>)}</dl>
                : <p className="mt-1 text-sm text-slate-500">{achievement.subcategory_id ? 'No details entered yet.' : 'Choose a category and subcategory to add details.'}</p>}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">History</h3>
              <ol className="mt-2 space-y-1.5 text-sm">
                {status === 'draft' && <li className="text-slate-600">{achievement.saved_label || 'Draft'}</li>}
                {history.map(event => <li key={event.id} className="text-slate-700 dark:text-slate-300"><span className="font-semibold">{EVENT_LABELS[event.action]}</span> · {formatDateTime(event.occurred_at)}</li>)}
                {status !== 'draft' && history.length === 0 && <li className="text-slate-500">No history recorded.</li>}
              </ol>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800 sm:px-6">
          <button type="button" onClick={onClose} className="min-h-10 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300">Close</button>
          {editable && <button type="button" onClick={() => { onClose(); (status === 'revision_requested' ? onResubmit : onEdit)?.(achievement) }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#16834a] px-4 text-sm font-bold text-white hover:bg-[#126b3c]"><Pencil className="h-4 w-4"/>{status === 'revision_requested' ? 'Revise and resubmit' : 'Continue editing'}</button>}
        </footer>
      </section>
    </div>
  )
}
