import { useState, useCallback, useEffect } from 'react'
import PersonnelPortfolioController from '../controllers/PersonnelPortfolioController.js'

/**
 * usePersonnelPortfolio.js
 * Custom React Hook bridging UI View components to PersonnelPortfolioController.
 */
export function usePersonnelPortfolio(personnelId = 'EMP-2024-001') {
  const [portfolio, setPortfolio] = useState(() => PersonnelPortfolioController.loadPortfolio(personnelId))
  const [totals, setTotals] = useState(() => portfolio ? portfolio.calculateAcceptedCappedTotals() : null)
  const [error, setError] = useState(null)

  // Refresh totals whenever portfolio changes
  const refreshPortfolio = useCallback((updatedModel) => {
    setPortfolio(updatedModel)
    setTotals(updatedModel.calculateAcceptedCappedTotals())
    setError(null)
  }, [])

  const reload = useCallback(() => {
    const loaded = PersonnelPortfolioController.loadPortfolio(personnelId)
    refreshPortfolio(loaded)
  }, [personnelId, refreshPortfolio])

  useEffect(() => {
    reload()
  }, [reload])

  const addItem = useCallback((areaKey, itemData) => {
    try {
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
      const updated = PersonnelPortfolioController.updateYearsOfService(portfolio, years)
      refreshPortfolio(updated)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [portfolio, refreshPortfolio])

  const submitToDepSec = useCallback(() => {
    try {
      const updated = PersonnelPortfolioController.submitToDepSec(portfolio, portfolio.personnel_name)
      refreshPortfolio(updated)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [portfolio, refreshPortfolio])

  const autoPopulateFromVault = useCallback(() => {
    try {
      const updated = PersonnelPortfolioController.autoPopulateFromVault(portfolio, personnelId)
      refreshPortfolio(updated)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    }
  }, [portfolio, personnelId, refreshPortfolio])

  const updateItem = useCallback((areaKey, itemId, updatedFields) => {
    try {
      const updated = PersonnelPortfolioController.updateItem(portfolio, areaKey, itemId, updatedFields)
      refreshPortfolio(updated)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [portfolio, refreshPortfolio])

  return {
    portfolio,
    totals,
    error,
    addItem,
    removeItem,
    updateItem,
    updateYearsOfService,
    submitToDepSec,
    autoPopulateFromVault,
    reload
  }
}
