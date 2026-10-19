import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Search, ShieldCheck, X } from 'lucide-react'
import attendanceCertificateService from '../../services/attendanceCertificateService'
import { AutomaticAttendanceCertificatePreview } from '../../pages/student/modals/StudentAchievementPreviewModal'

function errorText(error) {
  return error?.error?.message || error?.message || 'The attendance certificates could not be loaded.'
}

function displayDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export default function AutomaticAttendanceCertificatesPanel({ eventId = null }) {
  const [state, setState] = useState({ loading: true, error: '', certificates: [], summary: { total: 0, verified: 0, events: 0 } })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const certificateTriggerRef = useRef(null)
  const certificateCloseRef = useRef(null)
  const certificateDialogRef = useRef(null)

  const closeCertificate = useCallback(() => {
    setSelectedCertificate(null)
    requestAnimationFrame(() => certificateTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!selectedCertificate) return undefined
    certificateCloseRef.current?.focus()

    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeCertificate()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = [...(certificateDialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || [])].filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !certificateDialogRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !certificateDialogRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown)
    return () => document.removeEventListener('keydown', handleDialogKeyDown)
  }, [selectedCertificate, closeCertificate])

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const data = await attendanceCertificateService.list()
      setState({ loading: false, error: '', certificates: data.certificates, summary: data.summary })
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: errorText(error) }))
    }
  }, [])

  useEffect(() => { load() }, [load])

  const eventCertificates = useMemo(() => (
    eventId
      ? state.certificates.filter((certificate) => String(certificate.event_id) === String(eventId))
      : state.certificates
  ), [eventId, state.certificates])

  const certificates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return eventCertificates
    return eventCertificates.filter((certificate) => [
      certificate.title,
      certificate.student_name,
      certificate.student_id_number,
      certificate.event_title
    ].some((value) => String(value || '').toLowerCase().includes(query)))
  }, [eventCertificates, searchTerm])

  const metric = (label, value) => (
    <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  )

  return (
    <section aria-labelledby="automatic-attendance-certificates-heading" className="space-y-4">
      {!eventId && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metric('Portfolio Certificates', state.summary.total)}
          {metric('Verified Attendance', state.summary.verified)}
          {metric('Events With Certificates', state.summary.events)}
        </div>
      )}

      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 id="automatic-attendance-certificates-heading" className="flex items-center gap-2 text-base font-extrabold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Attendance Certificates
            </h2>
            <p className="text-xs text-slate-500">Automatically saved to each verified attendee’s portfolio when an attendance session closes{eventId ? ' for this event' : ''}.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search student or event..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs dark:border-slate-800 dark:bg-slate-900" />
          </div>
        </div>

        {state.loading ? (
          <p className="text-sm text-slate-500">Loading attendance certificates...</p>
        ) : state.error ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-rose-600">{state.error}</p>
            <button type="button" onClick={load} className="text-xs font-bold text-emerald-700 hover:underline">Try again</button>
          </div>
        ) : certificates.length === 0 ? (
          <p className="text-sm text-slate-500">{eventCertificates.length === 0 ? (eventId ? 'No attendance certificates have been added for this event yet.' : 'No attendance certificates have been added to student portfolios yet.') : 'No attendance certificates match your search.'}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/60">
                  <th className="p-3.5">Certificate</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Added to Portfolio</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="p-3.5 font-bold">
                      {certificate.title}
                      {Number(certificate.duplicate_record_count) > 1 && (
                        <span className="mt-1 block text-xs font-medium text-amber-700" role="note">
                          {certificate.duplicate_record_count} matching records; newest shown
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold">{certificate.student_name || 'Unknown'}<span className="block font-normal text-slate-500">{certificate.student_id_number || '—'}</span></td>
                    <td className="p-3.5">{certificate.event_title || '—'}</td>
                    <td className="p-3.5 text-slate-500">{displayDate(certificate.verified_at || certificate.created_at)}</td>
                    <td className="p-3.5"><span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">Verified</span></td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          certificateTriggerRef.current = event.currentTarget
                          setSelectedCertificate(certificate)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                        aria-label={`View certificate for ${certificate.student_name || 'student'}`}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        View certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCertificate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-certificate-dialog-title"
          ref={certificateDialogRef}
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeCertificate() }}
        >
          <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <h2 id="attendance-certificate-dialog-title" className="text-lg font-extrabold text-slate-900 dark:text-white">Attendance certificate</h2>
                <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{selectedCertificate.student_name} · {selectedCertificate.event_title}</p>
              </div>
              <button ref={certificateCloseRef} type="button" onClick={closeCertificate} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:hover:bg-slate-800" aria-label="Close certificate preview">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900 sm:p-6">
              <AutomaticAttendanceCertificatePreview
                achievement={{
                  ...selectedCertificate,
                  display_date: displayDate(selectedCertificate.occurrence_date),
                }}
                landscape
                viewer
              />
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
