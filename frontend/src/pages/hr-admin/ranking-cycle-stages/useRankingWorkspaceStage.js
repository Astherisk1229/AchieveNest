import { useCallback, useEffect, useState } from 'react'
import hrEvaluationService from '../../../services/hrEvaluationService'
import { apiErrorText } from '../../../utils/apiErrorText'

const workspaceCache = new Map()
const CACHE_TTL_MS = 30_000

export function combineRankingWorkspaceResults(results) {
  if (results.length <= 1) return results[0] || { rows: [], total_rows: 0, read_only: true }
  return {
    ...results[0],
    rows: results.flatMap(result => result?.rows || []),
    total_rows: results.reduce((total, result) => total + Number(result?.total_rows || 0), 0),
    read_only: results.every(result => Boolean(result?.read_only)),
  }
}

export default function useRankingWorkspaceStage(cycleId, trackKey, stage) {
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' })
  const cacheKey = `${cycleId || ''}|${stage}|${(Array.isArray(trackKey) ? trackKey : [trackKey]).filter(Boolean).join(',')}`
  const load = useCallback(async (force = false) => {
    const cached = workspaceCache.get(cacheKey)
    if (!force && stage !== 'results' && cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
      setState({ phase: 'ready', data: cached.data, error: '' })
      return cached.data
    }
    setState(current => ({ ...current, phase: current.data ? 'refreshing' : 'loading', error: '' }))
    try {
      const trackKeys = Array.isArray(trackKey) ? trackKey.filter(Boolean) : [trackKey]
      const results = await Promise.all(trackKeys.map(key => hrEvaluationService.workspace(cycleId, key, stage)))
      const data = combineRankingWorkspaceResults(results)
      workspaceCache.set(cacheKey, { data, savedAt: Date.now() })
      setState({ phase: 'ready', data, error: '' })
      return data
    } catch (error) {
      setState({ phase: 'error', data: null, error: apiErrorText(error, 'This stage could not be loaded.') })
      return null
    }
  }, [cacheKey, cycleId, trackKey, stage])

  useEffect(() => { void load() }, [load])
  return { ...state, reload: () => load(true) }
}
