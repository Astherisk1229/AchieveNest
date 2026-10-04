import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import certificateService from '../../services/certificateService'

const STATUS_STYLE = {
  ISSUED: 'bg-emerald-100 text-emerald-800',
  REVOKED: 'bg-rose-100 text-rose-800',
  SUPERSEDED: 'bg-slate-200 text-slate-700'
}

function errorText(err) {
  return err?.error?.message || err?.message || 'The request could not be completed.'
}

function newKey() {
  return globalThis.crypto?.randomUUID?.() || `cert-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function ActionDialog({ action, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const key = useRef(newKey())
  const revoke = action.type === 'revoke'

  const submit = async (event) => {
    event.preventDefault()
    if (!reason.trim()) { setError('A reason is required.'); return }
    setBusy(true)
    setError('')
    try {
      if (revoke) {
        await certificateService.revokeCertificate(action.certificate.id, { idempotency_key: key.current, reason: reason.trim(), reason_details: details.trim() || undefined })
      } else {
        await certificateService.reissueCertificate(action.certificate.id, { idempotency_key: key.current, reissue_reason: reason.trim(), reissue_reason_details: details.trim() || undefined })
      }
      await onDone(revoke ? 'Certificate revoked.' : 'Certificate reissued.')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={revoke ? 'Revoke certificate' : 'Reissue certificate'} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <h3 className="text-sm font-extrabold">{revoke ? 'Revoke certificate' : 'Reissue certificate'}</h3>
        <p className="text-xs text-slate-500">{action.certificate.certificate_number} · {action.certificate.student_name}</p>
        <label className="block text-xs font-bold">
          Reason{revoke ? '' : ' (max 100 characters)'}
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={revoke ? 1000 : 100} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="block text-xs font-bold">
          Details (optional)
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <p className="text-[11px] text-slate-500">
          {revoke ? 'A revoked certificate fails public verification and cannot be reissued directly.' : 'The current certificate is superseded and a new one is issued with a new number.'}
        </p>
        {error && <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-xl bg-[#16834a] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
            {busy ? 'Working...' : revoke ? 'Revoke' : 'Reissue'}
          </button>
        </div>
      </form>
    </div>
  )
}

/** Real issued-certificate history and counts from the backend. Revoke/reissue only when canManage (OSAD). */
export default function IssuedCertificatesPanel({ canManage = false, eventsCount = null, refreshKey = 0 }) {
  const [state, setState] = useState({ loading: true, error: '', certificates: [], summary: { total: 0, issued: 0, revoked: 0, superseded: 0 } })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [action, setAction] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const data = await certificateService.listCertificates()
      setState({ loading: false, error: '', certificates: data.certificates, summary: data.summary })
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: errorText(err) }))
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return state.certificates.filter((c) =>
      (statusFilter === 'ALL' || c.status === statusFilter) &&
      (!q || [c.certificate_number, c.student_name, c.student_id_number, c.event_title, c.certificate_purpose].some((v) => String(v || '').toLowerCase().includes(q)))
    )
  }, [state.certificates, searchTerm, statusFilter])

  const { summary } = state
  const metric = (label, value) => (
    <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  )

  return (
    <section aria-labelledby="issued-certificates-heading" className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metric('Total Issued Records', summary.total)}
        {metric('Currently Valid', summary.issued)}
        {metric('Revoked', summary.revoked)}
        {eventsCount === null ? metric('Superseded (reissued)', summary.superseded) : metric('Event Contexts', `${eventsCount} Events`)}
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 id="issued-certificates-heading" className="flex items-center gap-2 text-base font-extrabold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Issued Certificates
            </h2>
            <p className="text-xs text-slate-500">Every certificate issued from a verified record, with its current verification status.</p>
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="rounded-xl border border-slate-200 px-2 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
              <option value="ALL">All statuses</option>
              <option value="ISSUED">Valid</option>
              <option value="REVOKED">Revoked</option>
              <option value="SUPERSEDED">Superseded</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search student, number or event..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs dark:border-slate-800 dark:bg-slate-900" />
            </div>
          </div>
        </div>

        {notice && <p role="status" className="text-xs font-semibold text-emerald-700">{notice}</p>}

        {state.loading ? (
          <p className="text-sm text-slate-500">Loading certificates...</p>
        ) : state.error ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-rose-600">{state.error}</p>
            <button type="button" onClick={load} className="text-xs font-bold text-emerald-700 hover:underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">{state.certificates.length === 0 ? 'No certificates have been issued yet.' : 'No certificates match your filters.'}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/60">
                  <th className="p-3.5">Certificate No.</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Purpose</th>
                  <th className="p-3.5">Issued</th>
                  <th className="p-3.5">Status</th>
                  {canManage && <th className="p-3.5">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3.5 font-mono font-bold">{c.certificate_number}</td>
                    <td className="p-3.5 font-bold">{c.student_name || 'Unknown'}<span className="block font-normal text-slate-500">{c.student_id_number}</span></td>
                    <td className="p-3.5">{c.event_title || 'Not linked to an event'}</td>
                    <td className="p-3.5">{c.certificate_purpose}</td>
                    <td className="p-3.5 text-slate-500">{c.issued_at ? new Date(c.issued_at).toLocaleDateString() : ''}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${STATUS_STYLE[c.status] || ''}`}>{c.status === 'ISSUED' ? 'Valid' : c.status === 'REVOKED' ? 'Revoked' : 'Superseded'}</span>
                      {c.status === 'REVOKED' && c.revocation_reason && <span className="mt-1 block text-[10px] text-slate-500">{c.revocation_reason}</span>}
                    </td>
                    {canManage && (
                      <td className="p-3.5">
                        {c.status === 'ISSUED' ? (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setAction({ type: 'reissue', certificate: c })} className="font-bold text-emerald-700 hover:underline">Reissue</button>
                            <button type="button" onClick={() => setAction({ type: 'revoke', certificate: c })} className="font-bold text-rose-700 hover:underline">Revoke</button>
                          </div>
                        ) : <span className="text-slate-400">No action</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {summary.total > state.certificates.length && !state.loading && !state.error && (
          <p className="text-[11px] text-slate-500">Showing the latest {state.certificates.length} of {summary.total} records. Use the filters to narrow.</p>
        )}
      </div>

      {action && (
        <ActionDialog
          action={action}
          onClose={() => setAction(null)}
          onDone={async (message) => { setAction(null); setNotice(message); await load() }}
        />
      )}
    </section>
  )
}
