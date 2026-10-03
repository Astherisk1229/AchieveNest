import { useCallback, useEffect, useState } from 'react'
import hrEvaluationService from '../../../services/hrEvaluationService'

export default function useRankingWorkspaceStage(cycleId, trackKey, stage) {
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' })
  const load = useCallback(async () => {
    setState(current => ({ ...current, phase: 'loading', error: '' }))
    try {
      const data = await hrEvaluationService.workspace(cycleId, trackKey, stage)
      setState({ phase: 'ready', data, error: '' })
      return data
    } catch (error) {
      setState({ phase: 'error', data: null, error: error?.error?.message || error?.message || 'This stage could not be loaded.' })
      return null
    }
  }, [cycleId, trackKey, stage])

  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}
