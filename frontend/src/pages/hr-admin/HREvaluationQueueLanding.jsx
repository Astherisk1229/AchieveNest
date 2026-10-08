import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { listRankingCycles } from '../../services/personnelEvaluationPeriodService'
import { featuredCycle, workspacePath } from './ranking-cycles/rankingCyclePresentation'

export default function HREvaluationQueueLanding() {
  const [destination, setDestination] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    listRankingCycles().then(response => {
      if (!current) return
      const cycle = featuredCycle(response?.cycles || [])
      const track = cycle?.tracks?.find(item => item.personnel_group === 'FACULTY') || cycle?.tracks?.[0]
      if (!cycle || !track) { setDestination('/hr/ranking-cycles'); return }
      setDestination(workspacePath(cycle, track.personnel_group).replace(/\/[^/]+$/, '/evaluation'))
    }).catch(loadError => { if (current) setError(loadError?.message || 'The evaluation queue could not be loaded.') })
    return () => { current = false }
  }, [])
  if (destination) return <Navigate replace to={destination}/>
  return <main aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">{error || 'Opening the evaluation queue…'}</main>
}
