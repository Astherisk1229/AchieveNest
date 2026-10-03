import React, { useCallback, useEffect, useState } from 'react'
import { History, Edit3 } from 'lucide-react'
import { personnelServiceHistoryService } from '../../../services/personnelServiceHistoryService'
import { BASIS_LABELS, classificationLabel, formatServiceDate } from '../../../utils/serviceHistory'
import ServiceHistoryModal from './ServiceHistoryModal'

/** Read-only summary used inside the Faculty Dossier drawer. Exported separately for static rendering in tests. */
export function ServiceHistorySummary({ history, loading, error, notice, onEdit }) {
  const service = history?.qualifying_service
  const version = history?.current_version
  const segments = version?.segments || []
  const verified = service?.basis === 'service_history'

  return (
    <section aria-labelledby="service-history-heading" className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <h4 id="service-history-heading" className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <History className="h-3.5 w-3.5" aria-hidden="true" /> Length of Service
        </h4>
        <button type="button" onClick={onEdit} disabled={loading || Boolean(error)} className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-[#064e2b] hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Edit3 className="h-3.5 w-3.5" /> {version ? 'Edit Service History' : 'Record Service History'}
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading service history…</p>}
      {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{notice}</p>}

      {!loading && !error && history && (
        <div className="space-y-3 rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/40">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[10px] font-extrabold uppercase text-slate-400">Qualifying service</dt>
              <dd className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{service?.display ?? 'Not yet recorded'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-extrabold uppercase text-slate-400">Part-time (not counted)</dt>
              <dd className="mt-0.5 font-extrabold text-slate-900 dark:text-white">{service?.part_time?.total_months ? service.part_time.display : 'None'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-extrabold uppercase text-slate-400">Source</dt>
              <dd className={`mt-0.5 font-bold ${verified ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'}`}>{BASIS_LABELS[service?.basis] || 'Not yet recorded'}</dd>
            </div>
          </dl>

          {segments.length > 0 ? (
            <div className="overflow-x-auto border-t border-slate-100 pt-2.5 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Employment periods</caption>
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400">
                    <th scope="col" className="py-1 pr-3 font-extrabold">Period</th>
                    <th scope="col" className="py-1 pr-3 font-extrabold">Type</th>
                    <th scope="col" className="py-1 font-extrabold">Counted</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map(segment => (
                    <tr key={segment.id || segment.start_date} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 pr-3 font-semibold text-slate-900 dark:text-white">{formatServiceDate(segment.start_date)} – {segment.is_ongoing ? 'Present' : formatServiceDate(segment.end_date)}</td>
                      <td className="py-1.5 pr-3">{classificationLabel(segment.classification)}</td>
                      <td className="py-1.5">{segment.countability === 'countable' ? 'Yes' : `No${segment.hr_reason ? ` — ${segment.hr_reason}` : segment.classification === 'part_time' ? ' — part-time' : ''}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {service?.gaps?.length > 0 && <p className="mt-2 text-[11px] text-slate-500">{service.gaps.length === 1 ? '1 break in service' : `${service.gaps.length} breaks in service`} between periods (not counted).</p>}
              <p className="mt-2 text-[11px] text-slate-500">Version {version.version_number} · saved {formatServiceDate(String(version.resolved_at || '').slice(0, 10))} · as of {formatServiceDate(service?.reference_date)}</p>
            </div>
          ) : (
            <p className="border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800">No employment periods recorded yet. Until HR records them, length of service is taken from the employment start date and is not counted for part-time personnel.</p>
          )}
        </div>
      )}
    </section>
  )
}

/** Faculty Dossier section: loads the HR service history and opens the editor. */
export default function ServiceHistorySection({ personnel }) {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!personnel?.id) return
    setLoading(true)
    setError('')
    try {
      setHistory(await personnelServiceHistoryService.get(personnel.id))
    } catch (apiError) {
      setError(apiError?.response?.data?.error?.message || 'Service history could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [personnel?.id])

  useEffect(() => { load() }, [load])

  return (
    <>
      <ServiceHistorySummary history={history} loading={loading} error={error} notice={notice} onEdit={() => { setNotice(''); setEditing(true) }} />
      <ServiceHistoryModal
        personnel={personnel}
        history={history}
        isOpen={editing}
        onClose={() => setEditing(false)}
        onSaved={saved => { setHistory(saved); setNotice('') }}
        onConflict={() => { setNotice('Another HR user saved this service history first. The latest version is shown; review it and edit again if needed.'); load() }}
      />
    </>
  )
}
