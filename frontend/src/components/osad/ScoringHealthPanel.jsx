import React, { useCallback, useEffect, useState } from 'react'
import { fetchUnscoredRecords, rescoreRecord } from '../../services/awardAdminService'

function errorText(err) {
  return err?.error?.message || err?.message || 'Request failed.'
}

/** Lists verified records that have no scoring contributions and lets OSAD rescore them. */
export default function ScoringHealthPanel() {
  const [state, setState] = useState({ loading: true, error: null, records: [], total: 0 })
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetchUnscoredRecords()
      setState({ loading: false, error: null, ...data })
    } catch (err) {
      setState({ loading: false, error: errorText(err), records: [], total: 0 })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rescore = async (id) => {
    setBusyId(id)
    setNotice(null)
    try {
      await rescoreRecord(id)
      setNotice({ ok: true, text: 'Record rescored.' })
      await load()
    } catch (err) {
      setNotice({ ok: false, text: errorText(err) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section aria-labelledby="scoring-health-heading" className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#131e2e]">
      <div className="flex items-center justify-between gap-3">
        <h2 id="scoring-health-heading" className="text-sm font-semibold text-slate-800 dark:text-slate-100">Scoring health</h2>
        <button type="button" onClick={load} className="text-xs font-semibold text-emerald-700 hover:underline">Refresh</button>
      </div>
      {state.loading ? (
        <p className="mt-2 text-sm text-slate-500">Checking verified records...</p>
      ) : state.error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">{state.error}</p>
      ) : state.total === 0 ? (
        <p className="mt-2 text-sm text-slate-500">All verified records have been scored.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {state.total} verified {state.total === 1 ? 'record has' : 'records have'} no scoring contributions yet.
          </p>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {state.records.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">{r.title} <span className="text-slate-500">· {r.student_name}</span></span>
                <button type="button" disabled={busyId === r.id} onClick={() => rescore(r.id)} className="shrink-0 rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60">
                  {busyId === r.id ? 'Rescoring...' : 'Rescore'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {notice && <p role="status" className={`mt-2 text-xs ${notice.ok ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}
    </section>
  )
}
