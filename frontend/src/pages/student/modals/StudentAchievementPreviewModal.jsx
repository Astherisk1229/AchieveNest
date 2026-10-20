import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Download, ExternalLink, FileText, Pencil, RotateCcw, ShieldAlert, ShieldCheck, ShieldQuestion, X, XCircle } from 'lucide-react'
import StudentCertificateSection from '../../../components/common/StudentCertificateSection'
import EvidenceThumbnail, { evidenceMime, useEvidenceObjectUrl } from '../../../components/common/EvidenceThumbnail'
import { detailRows, isConfiguredAchievement } from '../../../utils/achievementDetails'
import useStudentAchievementSchema from '../../../hooks/useStudentAchievementSchema'
import portfolioService from '../../../services/portfolioService'
import eventService from '../../../services/eventService'
import { formatDateTime } from '../../../utils/achievementDates'
import { parseSignatoryInfo } from '../../../utils/signatureVault'

const STATUS_STYLE = {
  draft: { label: 'Draft', icon: Pencil, className: 'bg-slate-100 text-slate-700 border-slate-300' },
  submitted: { label: 'Pending review', icon: Clock, className: 'bg-amber-50 text-amber-800 border-amber-300' },
  revision_requested: { label: 'Returned for revision', icon: RotateCcw, className: 'bg-orange-50 text-orange-800 border-orange-300' },
  verified: { label: 'Verified', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-rose-50 text-rose-800 border-rose-300' }
}
const EVENT_LABELS = { submitted: 'Submitted for review', resubmitted: 'Resubmitted', revision_requested: 'Returned for revision', verified: 'Verified by coordinator', rejected: 'Rejected', superseded: 'Replaced by an approved edit' }

function securityLabel(evidence) {
  if (evidence.security_status === 'clean') return { text: 'Security check passed', icon: ShieldCheck, className: 'text-emerald-700' }
  if (evidence.security_status === 'rejected') return { text: 'Failed the security check', icon: ShieldAlert, className: 'text-rose-700' }
  return { text: 'Security check pending', icon: ShieldQuestion, className: 'text-amber-700' }
}

function Field({ label, children }) {
  return <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{children}</dd></div>
}

export function automaticAttendanceCertificateMetadata(achievement) {
  const metadata = typeof achievement?.structured_metadata === 'string'
    ? (() => { try { return JSON.parse(achievement.structured_metadata) } catch { return {} } })()
    : (achievement?.structured_metadata || {})

  return metadata.automatic_attendance_certificate === true || metadata.automatic_attendance_certificate === 'true'
    ? metadata
    : null
}

export function AutomaticAttendanceCertificatePreview({ achievement, eventCertificateConfiguration, compact = false, landscape = false, viewer = false }) {
  const metadata = automaticAttendanceCertificateMetadata(achievement)
  if (!metadata) return null

  const savedCertificate = metadata.event_certificate || {}
  const eventCertificate = eventCertificateConfiguration || {}
  const savedConfiguration = savedCertificate.certificate_configuration || savedCertificate
  const liveConfiguration = eventCertificate.certificate_configuration || eventCertificate
  const isLegacyOsadSigner = value => /(?:^|\()OSAD(?:\)|$)/i.test(String(value || ''))
    || /^Dr\. Ana Reyes \(Club Moderator\)$/i.test(String(value || ''))
    || /^Prof\. Juan Dela Cruz(?: \(OSAD Director\))?$/i.test(String(value || ''))
  const isLegacySampleImage = value => /A\. Reyes|J\. Dela Cruz/i.test(String(value || ''))
  const certificateConfiguration = {
    issuer_name: savedConfiguration.issuer_name || liveConfiguration.issuer_name || '',
    signatory_1: savedConfiguration.signatory_1 || liveConfiguration.signatory_1 || '',
    signatory_2: savedConfiguration.signatory_2 || liveConfiguration.signatory_2 || '',
    signatory_1_img: savedConfiguration.signatory_1_img || liveConfiguration.signatory_1_img || null,
    signatory_2_img: savedConfiguration.signatory_2_img || liveConfiguration.signatory_2_img || null
  }
  const certificateTitle = 'Certificate of Participation'
  const signatories = [
    { value: certificateConfiguration.signatory_1, image: certificateConfiguration.signatory_1_img },
    { value: certificateConfiguration.signatory_2, image: certificateConfiguration.signatory_2_img }
  ].filter(signatory => !isLegacyOsadSigner(signatory.value)
    && !isLegacySampleImage(signatory.image)
    && (signatory.value || signatory.image))
  const issuerName = certificateConfiguration.issuer_name || 'Organization-issued certificate'

  const eventTitle = String(achievement.title || '').replace(/^Certificate of Participation\s*[—-]\s*/i, '') || 'the event'

  if (compact) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden bg-amber-50/50 p-1">
        <article className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-sm border-[3px] border-double border-amber-700/45 bg-[#fffefa] px-3 py-1 text-center text-slate-800 shadow-sm">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045]" aria-hidden="true">
            <span className="font-serif text-3xl font-black text-slate-900">NDMU</span>
          </div>
          <div className="relative z-10">
            <p className="truncate text-[6px] font-extrabold uppercase tracking-[0.16em] text-amber-900">{issuerName}</p>
            <p className="truncate text-[5px] font-bold uppercase tracking-[0.1em] text-slate-500">Notre Dame of Marbel University</p>
            <h3 className="mt-0.5 truncate font-serif text-[10px] font-extrabold uppercase text-slate-900">{certificateTitle}</h3>
            <p className="mt-0.5 truncate text-[6px] italic text-slate-500">This official digital certificate is proudly presented to</p>
            <p className="truncate text-[9px] font-extrabold text-emerald-800">{achievement.student_name || 'Verified attendee'}</p>
            <p className="mt-0.5 truncate text-[6px] text-slate-700">For active attendance and successful completion of:</p>
            <p className="truncate text-[7px] font-extrabold text-slate-900">{eventTitle}</p>
            <p className="truncate text-[6px] text-slate-600">Held on {achievement.display_date} at {achievement.organizer_or_body || 'Event venue'}</p>
          </div>
          <div className="relative z-10 mt-1 flex justify-center gap-5 border-t border-amber-900/20 pt-1">
            {signatories.map((signatory, index) => {
              const parsed = parseSignatoryInfo(signatory.value, 'Authorized Signatory', 'Official')
              return <div key={index} className="flex min-w-0 items-center gap-1">
                {signatory.image && <img src={signatory.image} alt="" aria-hidden="true" className="h-3 max-w-8 object-contain" />}
                <span className="max-w-16 truncate text-[5px] font-bold uppercase text-slate-700">{parsed.name}</span>
              </div>
            })}
          </div>
        </article>
      </div>
    )
  }

  if (landscape) {
    return (
      <div style={{ containerType: 'inline-size' }} className={`mx-auto aspect-[1.414/1] w-full overflow-hidden rounded-xl border border-amber-200 bg-amber-50/50 p-2 shadow-inner ${viewer ? 'max-h-[74vh] max-w-5xl' : 'max-h-[38vh]'}`}>
        <article className="relative flex h-full w-full flex-col justify-between overflow-hidden border-[5px] border-double border-amber-700/45 bg-[#fffefa] px-[5%] py-[3%] text-center text-slate-800 shadow-sm">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]" aria-hidden="true">
            <span className="font-serif text-[clamp(3rem,10cqw,8rem)] font-black text-slate-900">NDMU</span>
          </div>
          <div className="relative z-10">
            <p className="text-[clamp(0.5rem,1.05cqw,0.8rem)] font-extrabold uppercase tracking-[0.18em] text-amber-900">{issuerName}</p>
            <p className="mt-0.5 text-[clamp(0.4rem,0.8cqw,0.65rem)] font-bold uppercase tracking-[0.14em] text-slate-500">Notre Dame of Marbel University</p>
          </div>
          <div className="relative z-10">
            <h3 className="whitespace-nowrap font-serif text-[clamp(0.8rem,2.8cqw,1.8rem)] font-extrabold uppercase tracking-wide text-slate-900">{certificateTitle}</h3>
            <p className="mt-[1.5%] text-[clamp(0.55rem,1.1cqw,0.9rem)] italic text-slate-500">This official digital certificate is proudly presented to</p>
            <p className="mt-1 truncate text-[clamp(0.8rem,1.65cqw,1.35rem)] font-extrabold text-emerald-800">{achievement.student_name || 'Verified attendee'}</p>
            <p className="mt-[1.5%] text-[clamp(0.55rem,1cqw,0.85rem)] text-slate-700">For active attendance and successful completion of:</p>
            <p className="truncate text-[clamp(0.65rem,1.35cqw,1.1rem)] font-extrabold text-slate-900">{eventTitle}</p>
            <p className="mt-1 text-[clamp(0.5rem,0.95cqw,0.8rem)] text-slate-600">Held on {achievement.display_date} at {achievement.organizer_or_body || 'Event venue'}.</p>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-[8%] border-t border-amber-900/20 pt-[2%]">
            {signatories.map((signatory, index) => {
              const parsed = parseSignatoryInfo(signatory.value, 'Authorized Signatory', 'Official')
              return <div key={index} className="flex min-w-0 flex-col items-center justify-end">
                <div className="flex h-[clamp(1rem,6cqw,2.4rem)] items-end justify-center">
                  {signatory.image && <img src={signatory.image} alt={`${parsed.name} signature`} className="h-full max-w-[8rem] object-contain" />}
                </div>
                <div className="my-1 w-[82%] border-t border-slate-700" />
                <p className="max-w-full truncate text-[clamp(0.45rem,0.85cqw,0.7rem)] font-extrabold uppercase text-slate-900">{parsed.name}</p>
                <p className="max-w-full truncate text-[clamp(0.4rem,0.7cqw,0.6rem)] font-bold uppercase tracking-wider text-slate-600">{parsed.title}</p>
              </div>
            })}
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="flex h-[48vh] min-h-72 items-center justify-center overflow-auto rounded-2xl border border-amber-200 bg-[#fbfaf6] p-4 shadow-inner sm:p-6">
      <article className="w-full max-w-xl border-4 border-double border-amber-500 bg-white px-5 py-7 text-center text-slate-800 shadow-md sm:px-9 sm:py-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-800">{issuerName}</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Notre Dame of Marbel University</p>
        <h3 className="mt-5 font-serif text-xl font-bold uppercase tracking-wide text-slate-900">{certificateTitle}</h3>
        <p className="mt-5 text-xs italic text-slate-500">This official digital certificate is proudly presented to</p>
        <p className="mt-2 inline-block border-b border-amber-400 pb-1 text-xl font-extrabold text-emerald-800">{achievement.student_name || 'Verified attendee'}</p>
        <p className="mt-5 text-sm leading-6 text-slate-700">For active attendance and successful completion of:</p>
        <p className="mt-1 text-base font-bold text-slate-900">{eventTitle}</p>
        <p className="mt-4 text-xs text-slate-600">Held on {achievement.display_date}</p>
        <p className="mt-1 text-xs font-semibold text-slate-700">at {achievement.organizer_or_body || 'Event organizer'}.</p>
        {signatories.length > 0 && <div className="mt-7 grid grid-cols-2 gap-8 border-t border-amber-200 pt-5 text-center">
          {signatories.map((signatory, index) => {
            const parsed = parseSignatoryInfo(signatory.value, 'Authorized Signatory', 'Official')
            return <div key={index} className="flex min-w-0 flex-col items-center">
              <div className="flex h-9 items-end justify-center">
                {signatory.image && <img src={signatory.image} alt={`${parsed.name} signature`} className="h-9 max-w-[150px] object-contain" />}
              </div>
              <div className="my-1.5 w-[88%] border-t border-slate-700" />
              <p className="max-w-full truncate text-[11px] font-extrabold uppercase tracking-wide text-slate-900">{parsed.name}</p>
              <p className="max-w-full truncate text-[9px] font-bold uppercase tracking-wider text-slate-600">{parsed.title}</p>
            </div>
          })}
        </div>}
      </article>
    </div>
  )
}

/**
 * Document-first achievement preview: the real uploaded document on the left, the student's
 * entered details on the right. Shows only data that exists; nothing is defaulted or invented.
 */
export { detailRows }

export default function StudentAchievementPreviewModal({ achievement, isOpen, onClose, onEdit, onDownload, onResubmit }) {
  const [events, setEvents] = useState([])
  const [eventCertificateConfiguration, setEventCertificateConfiguration] = useState(null)
  const [activeEvidenceId, setActiveEvidenceId] = useState(null)
  const schemaCatalog = useStudentAchievementSchema(isOpen)
  const evidenceList = achievement?.evidence || []
  const activeEvidence = evidenceList.find(item => item.id === activeEvidenceId) || evidenceList[0] || null
  const { url: fullUrl } = useEvidenceObjectUrl(isOpen ? activeEvidence : null)
  const automaticCertificate = automaticAttendanceCertificateMetadata(achievement)

  useEffect(() => {
    if (!isOpen || !achievement?.id) { setEvents([]); setEventCertificateConfiguration(null); return undefined }
    let active = true
    setActiveEvidenceId(null)
    const certificateMetadata = automaticAttendanceCertificateMetadata(achievement)
    const eventId = certificateMetadata?.origin_event_id
    if (eventId) {
      eventService.getCertificatePreview(eventId)
        .then(configuration => { if (active) setEventCertificateConfiguration(configuration) })
        .catch(() => { if (active) setEventCertificateConfiguration(null) })
    } else {
      setEventCertificateConfiguration(null)
    }
    portfolioService.fetchRecord(achievement.id)
      .then(result => { if (active) setEvents(result?.events || []) })
      .catch(() => { if (active) setEvents([]) })
    return () => { active = false }
  }, [isOpen, achievement?.id])

  if (!isOpen || !achievement) return null

  const status = achievement.canonical_status || 'draft'
  const style = STATUS_STYLE[status] || STATUS_STYLE.draft
  const StatusIcon = style.icon
  const editable = ['draft', 'revision_requested', 'verified'].includes(status)
  const configured = isConfiguredAchievement(achievement.structured_metadata)
  const details = detailRows(achievement.subcategory_id, achievement.structured_metadata, schemaCatalog)
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
            {automaticCertificate ? (
              <>
                <AutomaticAttendanceCertificatePreview achievement={achievement} eventCertificateConfiguration={eventCertificateConfiguration} />
                <p className="mt-3 text-center text-xs font-medium text-slate-500">This automatic attendance certificate is stored directly in your portfolio, so no separate document attachment is needed.</p>
              </>
            ) : <EvidenceThumbnail evidence={activeEvidence} className="h-[48vh] min-h-72 rounded-2xl border border-slate-200 bg-white dark:border-slate-800" fit="object-contain"/>}
            {!automaticCertificate && activeEvidence && (() => {
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
            {!automaticCertificate && evidenceList.length > 1 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Documents">
              {evidenceList.map(item => <button key={item.id} type="button" onClick={() => setActiveEvidenceId(item.id)} className={`max-w-[12rem] truncate rounded-lg border px-2.5 py-1 text-xs ${item.id === activeEvidence?.id ? 'border-[#16834a] bg-emerald-50 font-bold text-emerald-900' : 'border-slate-300 text-slate-700'}`}>{item.original_filename}</button>)}
            </div>}
            {!automaticCertificate && activeEvidence && evidenceMime(activeEvidence) === 'application/pdf' && <p className="mt-2 text-[11px] text-slate-500">PDF previews show the first page. Use "Open full size" to read every page.</p>}
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {status === 'revision_requested' && achievement.return_remarks && <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <p className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" aria-hidden="true"/>Coordinator remarks</p>
              <p className="mt-1">{achievement.return_remarks}</p>
            </div>}
            {achievement.certificate && <StudentCertificateSection certificate={achievement.certificate}/>}

            {!configured && <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Organizer / issuing body">{achievement.organizer_or_body || <span className="text-slate-500">Not provided</span>}</Field>
              <Field label="Activity date">{achievement.display_date}</Field>
            </dl>}
            {!configured && achievement.description && <Field label="Description"><span className="whitespace-pre-line">{achievement.description}</span></Field>}

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
          {editable && <button type="button" onClick={() => { onClose(); (status === 'revision_requested' ? onResubmit : onEdit)?.(achievement) }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#16834a] px-4 text-sm font-bold text-white hover:bg-[#126b3c]"><Pencil className="h-4 w-4"/>{status === 'revision_requested' ? 'Revise and resubmit' : status === 'verified' ? 'Edit achievement' : 'Continue editing'}</button>}
        </footer>
      </section>
    </div>
  )
}
