import { useState, useCallback, useEffect } from 'react'
import HRRankingController from '../controllers/HRRankingController.js'

/**
 * useHRRanking.js
 * Custom React Hook bridging HR UI components to HRRankingController.
 */
export function useHRRanking() {
  const [portfolios, setPortfolios] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [affiliationFilter, setAffiliationFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('ENDORSED_TO_HR') // default view endorsed
  const [selectedAuditPortfolio, setSelectedAuditPortfolio] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    const list = HRRankingController.filterMasterboard(searchQuery, affiliationFilter, statusFilter)
    setPortfolios(list)
    if (selectedAuditPortfolio) {
      const updated = list.find(p => p.id === selectedAuditPortfolio.id)
      if (updated) setSelectedAuditPortfolio(updated)
    }
  }, [searchQuery, affiliationFilter, statusFilter, selectedAuditPortfolio])

  useEffect(() => {
    reload()
  }, [searchQuery, affiliationFilter, statusFilter])

  const selectAuditPortfolio = useCallback((portfolio) => {
    setSelectedAuditPortfolio(portfolio)
    setError(null)
  }, [])

  const overrideItemScore = useCallback((areaKey, itemId, verifiedPoints, hrRemarks) => {
    if (!selectedAuditPortfolio) return false
    try {
      const updated = HRRankingController.overrideItemScore(selectedAuditPortfolio.id, areaKey, itemId, verifiedPoints, hrRemarks)
      setSelectedAuditPortfolio(updated)
      reload()
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [selectedAuditPortfolio, reload])

  const approveAndLockScore = useCallback((hrOfficerName, remarks) => {
    if (!selectedAuditPortfolio) return false
    try {
      const updated = HRRankingController.approveAndLockRankingScore(selectedAuditPortfolio.id, hrOfficerName, remarks)
      setSelectedAuditPortfolio(updated)
      reload()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [selectedAuditPortfolio, reload])

  return {
    portfolios,
    selectedAuditPortfolio,
    searchQuery,
    setSearchQuery,
    affiliationFilter,
    setAffiliationFilter,
    statusFilter,
    setStatusFilter,
    selectAuditPortfolio,
    overrideItemScore,
    approveAndLockScore,
    error,
    reload
  }
}
