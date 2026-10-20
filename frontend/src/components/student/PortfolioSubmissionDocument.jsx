import React, { useState } from 'react'
import { ExternalLink, FileText, Printer } from 'lucide-react'

const dateText = value => {
  if (!value) return 'Date not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

function SubmissionFile({ file, downloadFile }) {
  const [loading, setLoading] = useState(false)
  const open = async () => {
    const popup = window.open('about:blank', '_blank')
    setLoading(true)
    try {
      const blob = await downloadFile(file)
      const url = URL.createObjectURL(blob?.data || blob)
      if (popup) popup.location = url
      else window.location.assign(url)
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      popup?.close()
    } finally { setLoading(false) }
  }
  return <button type="button" onClick={open} disabled={loading} className="print-hide inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">
    <ExternalLink className="h-4 w-4" aria-hidden="true" />{loading ? 'Opening…' : file.original_filename || 'Open supporting file'}
  </button>
}

export default function PortfolioSubmissionDocument({ snapshot, previewRecords = null, downloadFile, onPrint }) {
  const records = snapshot?.records || previewRecords || []
  const student = snapshot?.student || {}
  const isSubmitted = Boolean(snapshot?.version && snapshot?.submitted_at)
  return <section className="portfolio-submission-print mx-auto w-full max-w-5xl bg-white p-5 text-slate-950 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none" aria-label="Portfolio Submission">
    <header className="border-b-2 border-slate-900 pb-5 text-center">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-emerald-800">Notre Dame of Marbel University</p>
      <h1 className="mt-2 text-2xl font-black tracking-wide">PORTFOLIO SUBMISSION</h1>
      {isSubmitted
        ? <p className="mt-2 text-sm font-semibold">Final Submission · Version {snapshot.version} · Submitted {dateText(snapshot.submitted_at)}</p>
        : <p className="mt-2 text-sm font-semibold">Review Preview · Not yet submitted</p>}
    </header>
    <dl className="mt-5 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 border-b border-slate-300 pb-5 text-sm">
      <dt className="font-semibold text-slate-600">Student</dt><dd>{student.name || 'Student'}</dd>
      <dt className="font-semibold text-slate-600">Student ID</dt><dd>{student.student_id || '—'}</dd>
      {(snapshot?.awards || []).length > 0 && <><dt className="font-semibold text-slate-600">Awards</dt><dd>{snapshot.awards.map(award => award.name).join(', ')}</dd></>}
      <dt className="font-semibold text-slate-600">Records</dt><dd>{records.length}</dd>
    </dl>
    <div className="mt-6 space-y-7">
      {records.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No accomplishments are in the portfolio yet.</p> : records.map((record, index) => {
        const files = record.evidence || []
        const details = record.details && typeof record.details === 'object' ? Object.entries(record.details).filter(([key, value]) => !/score|points|ranking|threshold|candidate_status|potential_awardee|rubric|weight|selection_source/i.test(key) && value !== null && value !== '' && typeof value !== 'object') : []
        return <article key={record.record_id || record.id || index} className="break-inside-avoid border-b border-slate-300 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dateText(record.start_date || record.activity_date || record.occurrence_date)}</p>
          <h2 className="mt-1 text-lg font-bold">{record.title || record.achievement_title || 'Untitled accomplishment'}</h2>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-sm">
            {(record.category || record.category_name) && <><dt className="text-slate-600">Category</dt><dd>{record.category || record.category_name}{(record.subcategory || record.subcategory_name) ? ` · ${record.subcategory || record.subcategory_name}` : ''}</dd></>}
            {(record.organizer || record.organizer_or_body) && <><dt className="text-slate-600">Organizer</dt><dd>{record.organizer || record.organizer_or_body}</dd></>}
            {record.verification_status && <><dt className="text-slate-600">Verification</dt><dd className="capitalize">{String(record.verification_status).replaceAll('_', ' ')}</dd></>}
            {record.description && <><dt className="text-slate-600">Details</dt><dd className="whitespace-pre-wrap">{record.description}</dd></>}
            {details.map(([key, value]) => <React.Fragment key={key}><dt className="capitalize text-slate-600">{key.replaceAll('_', ' ')}</dt><dd>{String(value)}</dd></React.Fragment>)}
          </dl>
          <div className="mt-3">
            <h3 className="mb-2 text-sm font-semibold">Supporting files</h3>
            {files.length === 0 ? <p className="text-sm text-slate-600">No supporting files attached.</p> : <ul className="space-y-2">{files.map(file => <li key={file.id} className="flex flex-wrap items-center gap-2 text-sm"><FileText className="h-4 w-4 text-emerald-700 print-hide" aria-hidden="true" /><span className="hidden print:inline">{file.original_filename || 'Supporting file'}{file.mime_type ? ` · ${file.mime_type}` : ''}</span>{downloadFile && <SubmissionFile file={file} downloadFile={downloadFile} />}</li>)}</ul>}
          </div>
        </article>
      })}
    </div>
    <footer className="mt-8 border-t border-slate-300 pt-3 text-center text-xs text-slate-500">Portfolio Submission · {isSubmitted ? `Version ${snapshot.version}` : 'Review preview'}{isSubmitted ? ` · ${dateText(snapshot.submitted_at)}` : ''}</footer>
    {onPrint && <button type="button" onClick={onPrint} className="print-hide mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"><Printer className="h-4 w-4" aria-hidden="true" />Print / Save as PDF</button>}
    <style>{`@media print { @page { size: A4; margin: 14mm; } body * { visibility: hidden !important; } .portfolio-submission-print, .portfolio-submission-print * { visibility: visible !important; } .portfolio-submission-print { position: absolute; inset: 0; width: 100%; } }`}</style>
  </section>
}
