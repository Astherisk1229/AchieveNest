import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import attendanceCertificateService from '../../services/attendanceCertificateService'

function errorText(error) {
  return error?.error?.message || error?.message || 'The attendance certificates could not be loaded.'
}

function displayDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export default function AutomaticAttendanceCertificatesPanel() {
  const [state, setState] = useState({ loading: true, error: '', certificates: [], summary: { total: 0, verified: 0, events: 0 } })
  const [searchTerm, setSearchTerm] = useState('')

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

  const certificates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return state.certificates
    return state.certificates.filter((certificate) => [
      certificate.title,
      certificate.student_name,
      certificate.student_id_number,
      certificate.event_title
    ].some((value) => String(value || '').toLowerCase().includes(query)))
  }, [searchTerm, state.certificates])

  const metric = (label, value) => (
    <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  )

  return (
    <section aria-labelledby="automatic-attendance-certificates-heading" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metric('Portfolio Certificates', state.summary.total)}
        {metric('Verified Attendance', state.summary.verified)}
        {metric('Events With Certificates', state.summary.events)}
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 id="automatic-attendance-certificates-heading" className="flex items-center gap-2 text-base font-extrabold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Attendance Certificates
            </h2>
            <p className="text-xs text-slate-500">Automatically saved to each verified attendee’s portfolio when an attendance session closes.</p>
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
          <p className="text-sm text-slate-500">{state.certificates.length === 0 ? 'No attendance certificates have been added to student portfolios yet.' : 'No attendance certificates match your search.'}</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="p-3.5 font-bold">{certificate.title}</td>
                    <td className="p-3.5 font-bold">{certificate.student_name || 'Unknown'}<span className="block font-normal text-slate-500">{certificate.student_id_number || '—'}</span></td>
                    <td className="p-3.5">{certificate.event_title || '—'}</td>
                    <td className="p-3.5 text-slate-500">{displayDate(certificate.verified_at || certificate.created_at)}</td>
                    <td className="p-3.5"><span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">Verified</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
