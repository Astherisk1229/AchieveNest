import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import PersonnelPortfolioController from '../controllers/PersonnelPortfolioController.js'
import personnelAccomplishmentService from '../services/personnelAccomplishmentService.js'
import personnelPortfolioService from '../services/personnelPortfolioService.js'

/**
 * usePersonnelPortfolio.js
 * Custom React Hook bridging UI View components to live PersonnelPortfolioController reflection
 * and server-enforced submitted snapshot lock states (Plan C Phase C2).
 */
export function usePersonnelPortfolio(personnelId = 'EMP-2024-001', profileContext = {}) {
  const [portfolio, setPortfolio] = useState(() => PersonnelPortfolioController.loadPortfolio(personnelId, profileContext))
  const [latestSubmission, setLatestSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [submissionHistory, setSubmissionHistory] = useState([])
  const inFlightRef = useRef(false)
  const profileKey = useMemo(() => JSON.stringify(profileContext || {}), [profileContext])

  // Refresh state helper
  const refreshPortfolio = useCallback((updatedModel, submissionData = null) => {
    if (submissionData !== undefined) {
      setLatestSubmission(submissionData)
    }
    if (updatedModel && submissionData?.status) {
      updatedModel.transitionStatus(
        submissionData.status,
        updatedModel.personnel_name,
        'Personnel',
        `Server submission status synced: ${submissionData.status}`
      )
    }
    setPortfolio(updatedModel)
    setError(null)
  }, [])

  // Asynchronous reload directly from backend
  const reload = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setError(null)
    try {
      const parsedContext = JSON.parse(profileKey || '{}')
      const [loaded, subRes, histRes] = await Promise.all([
        PersonnelPortfolioController.loadPortfolioAsync(personnelId, parsedContext),
        personnelPortfolioService.getLatestSubmission().catch(() => null),
        personnelPortfolioService.getSubmissionHistory().catch(() => null)
      ])

      const submissionPayload = subRes?.data || null
      const submissionHeader = submissionPayload?.submission || (submissionPayload?.status ? submissionPayload : null)
      const subData = submissionHeader
        ? { ...submissionHeader, items: Array.isArray(submissionPayload?.items) ? submissionPayload.items : (submissionHeader.items || []) }
        : null
      setLatestSubmission(subData)

      const historyData = histRes?.data?.versions || []
      setSubmissionHistory(historyData)

      if (subData && subData.status && subData.status !== 'DRAFT' && loaded && typeof loaded.transitionStatus === 'function') {
        loaded.transitionStatus(
          subData.status,
          loaded.personnel_name,
          'Personnel',
          `Active submission loaded from server: ${subData.status}`
        )
      }

      refreshPortfolio(loaded, subData)
    } catch (err) {
      console.error('[usePersonnelPortfolio] Error loading portfolio from backend:', err)
      setError(err?.message || 'Failed to load portfolio records from repository')
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [personnelId, profileKey, refreshPortfolio])

  useEffect(() => {
    let active = true
    reload()
    return () => {
      active = false
    }
  }, [reload])

  const loadSubmissionHistory = useCallback(async () => {
    try {
      const res = await personnelPortfolioService.getSubmissionHistory()
      const versions = res?.data?.versions || []
      setSubmissionHistory(versions)
      return versions
    } catch (err) {
      console.error('[usePersonnelPortfolio] Error loading submission history:', err)
      return []
    }
  }, [])

  const addItem = useCallback((areaKey, itemData) => {
    try {
      if (!portfolio) return false
      const updated = PersonnelPortfolioController.addItem(portfolio, areaKey, itemData)
      refreshPortfolio(updated)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [portfolio, refreshPortfolio])

  const removeItem = useCallback((areaKey, itemId) => {
    try {
      if (!portfolio) return false
      const updated = PersonnelPortfolioController.removeItem(portfolio, areaKey, itemId)
      refreshPortfolio(updated)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [portfolio, refreshPortfolio])

  const updateYearsOfService = useCallback((years) => {
    try {
      if (!portfolio) return false
      const updated = PersonnelPortfolioController.updateYearsOfService(portfolio, years)
      refreshPortfolio(updated)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [portfolio, refreshPortfolio])

  const submitPortfolio = useCallback(async (options = {}) => {
    try {
      if (!portfolio) return { success: false, message: 'No portfolio loaded' }
      const res = await PersonnelPortfolioController.submitPortfolioAsync(portfolio, options)
      refreshPortfolio(portfolio)
      return res
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [portfolio, refreshPortfolio])

  const resubmitPortfolio = useCallback(async (options = {}) => {
    try {
      if (!portfolio) return { success: false, message: 'No portfolio loaded' }
      const res = await PersonnelPortfolioController.resubmitPortfolioAsync(portfolio, options)
      refreshPortfolio(portfolio)
      return res
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [portfolio, refreshPortfolio])

  const submitToDean = useCallback(async (options = {}) => {
    return submitPortfolio(options)
  }, [submitPortfolio])

  const autoPopulateFromVault = useCallback(async () => {
    setLoading(true)
    try {
      const accomplishments = await personnelAccomplishmentService.fetchAccomplishments()
      const updated = PersonnelPortfolioController.buildPortfolioFromAccomplishments(personnelId, accomplishments, profileContext)
      refreshPortfolio(updated)
      return { success: true, count: accomplishments.length }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }, [personnelId, profileContext, refreshPortfolio])

  const updateItem = useCallback((areaKey, itemId, updatedFields) => {
    try {
      if (!portfolio) return false
      const updated = PersonnelPortfolioController.updateItem(portfolio, areaKey, itemId, updatedFields)
      refreshPortfolio(updated)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [portfolio, refreshPortfolio])

  const isLocked = Boolean(
    latestSubmission && ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes((latestSubmission.status || '').toLowerCase())
  ) || Boolean(
    portfolio && ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes((portfolio.status || '').toLowerCase())
  )

  const returnFeedback = latestSubmission?.return_feedback || (
    latestSubmission?.return_reason ? {
      reason: latestSubmission.return_reason,
      required_corrections: latestSubmission.return_reason,
      returned_at: latestSubmission.returned_at,
      item_deficiencies: []
    } : null
  )

  const purgePortfolio = useCallback(async (options = {}) => {
    try {
      const res = await PersonnelPortfolioController.purgePortfolioAsync(portfolio, options)
      await reload()
      return res
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [portfolio, reload])

  const versionNumber = Number(latestSubmission?.version_number) || 1

  return {
    portfolio,
    latestSubmission,
    submissionHistory,
    versionNumber,
    returnFeedback,
    isLocked,
    submissionStatus: latestSubmission?.status || portfolio?.status || 'draft',
    loading,
    error,
    addItem,
    removeItem,
    updateItem,
    updateYearsOfService,
    submitPortfolio,
    resubmitPortfolio,
    purgePortfolio,
    submitToDean,
    loadSubmissionHistory,
    autoPopulateFromVault,
    reload
  }
}

export default usePersonnelPortfolio
