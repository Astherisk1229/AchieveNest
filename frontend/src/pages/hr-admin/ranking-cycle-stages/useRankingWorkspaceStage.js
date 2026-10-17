import { useCallback, useEffect, useRef, useState } from 'react'
import hrEvaluationService from '../../../services/hrEvaluationService'
import { resolveStoredAuthSession } from '../../../utils/authStorage'

const stageCache = new Map()
const CACHE_LIFETIME_MS = 30_000

export function combineRankingWorkspaceResults(results) {
  if (results.length <= 1) return results[0] || { rows: [], total_rows: 0, read_only: true }
  return {
    ...results[0],
    rows: results.flatMap(result => result?.rows || []),
    total_rows: results.reduce((total, result) => total + Number(result?.total_rows || 0), 0),
    read_only: results.every(result => Boolean(result?.read_only)),
  }
}

function getSessionCacheScope() {
  try {
    const session = resolveStoredAuthSession()
    const roles = [...(session.user?.roles || [])].sort().join(',')
    // Keep cached ranking data isolated by authenticated identity and token.
    // The token is only held in this in-memory cache key; it is never persisted.
    return [session.user?.profile?.id || session.user?.id || 'anonymous', roles, session.token || ''].join(':')
  } catch {
    return 'anonymous'
  }
}

export default function useRankingWorkspaceStage(cycleId, trackKey, stage, params = null) {
  const paramsKey = JSON.stringify(params)
  const trackKeysKey = (Array.isArray(trackKey) ? trackKey : [trackKey]).filter(Boolean).join(',')
  const cacheKey = `${getSessionCacheScope()}:${cycleId}:${trackKeysKey}:${stage}:${paramsKey}`
  const requestId = useRef(0)
  const [state, setState] = useState(() => {
    const cached = stageCache.get(cacheKey)
    return cached ? { key: cacheKey, phase: 'ready', data: cached.data, error: '' } : { key: cacheKey, phase: 'loading', data: null, error: '' }
  })
  const load = useCallback(async (force = true) => {
    const sequence = ++requestId.current
    const cached = stageCache.get(cacheKey)
    if (!force && stage !== 'results' && cached && Date.now() - cached.updatedAt < CACHE_LIFETIME_MS) {
      setState({ key: cacheKey, phase: 'ready', data: cached.data, error: '' })
      return cached.data
    }
    setState(current => ({ key: cacheKey, phase: current.key === cacheKey && current.data ? 'ready' : 'loading', data: current.key === cacheKey ? current.data : null, error: '' }))
    try {
      const trackKeys = trackKeysKey.split(',').filter(Boolean)
      const results = await Promise.all(trackKeys.map(key => hrEvaluationService.workspace(cycleId, key, stage, paramsKey === 'null' ? {} : JSON.parse(paramsKey))))
      const data = combineRankingWorkspaceResults(results)
      stageCache.set(cacheKey, { data, updatedAt: Date.now() })
      if (stageCache.size > 24) stageCache.delete(stageCache.keys().next().value)
      if (sequence === requestId.current) setState({ key: cacheKey, phase: 'ready', data, error: '' })
      return data
    } catch (error) {
      if (sequence === requestId.current) setState(current => ({ key: cacheKey, phase: current.key === cacheKey && current.data ? 'ready' : 'error', data: current.key === cacheKey ? current.data : null, error: error?.error?.message || error?.message || 'This stage could not be loaded.' }))
      return null
    }
  }, [cacheKey, cycleId, trackKeysKey, stage, paramsKey])

  useEffect(() => { load(false) }, [load])
  return { ...state, reload: () => load(true) }
}
