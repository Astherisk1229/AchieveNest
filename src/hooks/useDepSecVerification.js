import { useState, useCallback, useEffect } from 'react'
import DepSecVerificationController from '../controllers/DepSecVerificationController.js'

/**
 * useDepSecVerification.js
 * Custom React Hook bridging Department Secretary UI to DepSecVerificationController.
 */
export function useDepSecVerification(departmentId = 'DEP-CEAC') {
  const [controller] = useState(() => new DepSecVerificationController(departmentId))
  const [portfolios, setPortfolios] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    const list = controller.filterPortfolios(searchQuery, statusFilter)
    setPortfolios(list)
    if (selectedPortfolio) {
      const updatedSelected = list.find(p => p.id === selectedPortfolio.id)
      if (updatedSelected) setSelectedPortfolio(updatedSelected)
    }
  }, [controller, searchQuery, statusFilter, selectedPortfolio])

  useEffect(() => {
    reload()
  }, [searchQuery, statusFilter])

  const selectPortfolio = useCallback((portfolio) => {
    setSelectedPortfolio(portfolio)
    setError(null)
  }, [])

  const updateItemVerification = useCallback((areaKey, itemId, verifiedPoints, isProofVerified, remarks) => {
    if (!selectedPortfolio) return false
    try {
      const updated = controller.updateItemVerification(
        selectedPortfolio.id,
        areaKey,
        itemId,
        verifiedPoints,
        isProofVerified,
        remarks
      )
      setSelectedPortfolio(updated)
      reload()
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [controller, selectedPortfolio, reload])

  const endorseToHR = useCallback((evaluatorName, remarks) => {
    if (!selectedPortfolio) return false
    try {
      const updated = controller.endorseToHR(selectedPortfolio.id, evaluatorName, remarks)
      setSelectedPortfolio(updated)
      reload()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [controller, selectedPortfolio, reload])

  const returnToPersonnel = useCallback((evaluatorName, remarks) => {
    if (!selectedPortfolio) return false
    try {
      const updated = controller.returnToPersonnel(selectedPortfolio.id, evaluatorName, remarks)
      setSelectedPortfolio(updated)
      reload()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [controller, selectedPortfolio, reload])

  return {
    portfolios,
    selectedPortfolio,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectPortfolio,
    updateItemVerification,
    endorseToHR,
    returnToPersonnel,
    error,
    reload
  }
}
