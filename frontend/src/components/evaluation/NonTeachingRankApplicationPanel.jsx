import React, { useEffect, useState } from 'react'
import facultyPhaseOService from '../../services/facultyPhaseOService'

const message = error => error?.response?.data?.error?.code || error?.message || 'Rank application could not be loaded.'

export default function NonTeachingRankApplicationPanel({ personnelId, cycleId, trackId, onClose }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [selected, setSelected] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const data = await facultyPhaseOService.currentNonTeachingApplied(personnelId, {
        ranking_cycle_id: cycleId, ranking_track_id: trackId,
      })
      setState({ loading: false, data, error: '' })
      setSelected(data?.decision?.suggested_rank_code || data?.valid_rank_options?.[0]?.rank_code || '')
    } catch (error) {
      setState({ loading: false, data: null, error: message(error) })
    }
  }
  useEffect(() => { load() }, [personnelId, cycleId, trackId])

  const act = async action => {
    setBusy(true)
    setState(current => ({ ...current, error: '' }))
    try {
      await action()
      await load()
    } catch (error) {
      setState(current => ({ ...current, error: message(error) }))
    } finally {
      setBusy(false)
    }
  }

  const decision = state.data?.decision
  const options = decision?.valid_rank_options || state.data?.valid_rank_options || []
  const confirmed = decision?.status === 'confirmed'
  return <section role="dialog" aria-modal="true" aria-labelledby="ntf-rank-title" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-slate-950">
    <h2 id="ntf-rank-title" className="text-lg font-black text-slate-950 dark:text-white">Rank Applied For</h2>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Confirm an eligible target so a passing evaluation can recommend advancement.</p>
    {state.loading ? <p className="mt-5 text-sm">Loading rank options…</p> : <div className="mt-5 space-y-4">
      <p className="text-sm">Present Rank: <strong>{state.data?.present_rank || 'Unresolved'}</strong></p>
      {confirmed ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-900">Confirmed: {options.find(item => item.rank_code === decision.confirmed_rank_code)?.display_label || decision.confirmed_rank_code}</p>
        : options.length === 0 ? <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">{['Assistant Instructor', 'Senior Instructor'].includes(state.data?.present_rank) ? 'A verified Master’s degree is required before this personnel member can advance to Assistant Professor.' : 'No active rank transition is available. HR must review the rank rules before an advancement can be recommended.'}</p>
          : decision?.status === 'suggested' ? <><label className="block text-sm font-bold" htmlFor="ntf-applied-rank">Eligible rank</label><select id="ntf-applied-rank" value={selected} onChange={event => setSelected(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm dark:bg-slate-900">{options.map(item => <option key={item.rank_code} value={item.rank_code}>{item.display_label}</option>)}</select>{selected !== decision.suggested_rank_code && <label className="block text-sm font-bold">Reason for choosing a different eligible rank<textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm dark:bg-slate-900"/></label>}<button type="button" disabled={busy || !selected || (selected !== decision.suggested_rank_code && !reason.trim())} onClick={() => act(() => facultyPhaseOService.confirmApplied(decision.id, { rank_code: selected, justification: selected === decision.suggested_rank_code ? null : reason.trim() }))} className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white disabled:opacity-50">Confirm Rank Applied For</button></>
            : <button type="button" disabled={busy} onClick={() => act(() => facultyPhaseOService.suggestApplied(personnelId, { ranking_cycle_id: cycleId, ranking_track_id: trackId }))} className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white disabled:opacity-50">Prepare eligible rank</button>}
      {state.error && <p role="alert" className="text-sm font-semibold text-rose-700">{state.error}</p>}
    </div>}
    <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold dark:border-slate-700">Close</button></div>
  </section>
}
