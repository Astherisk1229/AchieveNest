import { useState, useEffect, useMemo, useCallback } from 'react'
import PersonnelAchievementController from '../controllers/PersonnelAchievementController.js'

/**
 * usePersonnelAchievements.js
 * Custom React Hook bridging Personnel Achievements View to PersonnelAchievementController.
 */
export default function usePersonnelAchievements() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')

  // Active preview item & popover target
  const [previewItem, setPreviewItem] = useState(null)
  const [popoverState, setPopoverState] = useState({ id: null, x: 0, y: 0 })

  // Refresh achievements from backend
  const refreshAchievements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const loaded = await PersonnelAchievementController.loadAchievements()
      setAchievements(loaded)
    } catch (err) {
      console.error('Error fetching accomplishments:', err)
      setError(err?.message || 'Failed to fetch accomplishments')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshAchievements()
  }, [refreshAchievements])

  // Action wrappers
  const addAchievement = useCallback(async (newEntry, file = null) => {
    const savedModel = await PersonnelAchievementController.addAchievement(newEntry, file)
    setAchievements(prev => [savedModel, ...prev])
    return savedModel
  }, [])

  const updateAchievement = useCallback((targetId, updateData) => {
    setAchievements(prev => PersonnelAchievementController.updateAchievement(prev, targetId, updateData))
    if (previewItem && previewItem.id === targetId) {
      setPreviewItem(prev => {
        if (!prev) return null
        const json = prev.toJSON()
        return { ...json, ...updateData }
      })
    }
  }, [previewItem])

  const deleteAchievement = useCallback(async (targetId) => {
    await PersonnelAchievementController.deleteAchievement(targetId)
    setAchievements(prev => prev.filter(item => item.id !== targetId))
    if (previewItem && previewItem.id === targetId) {
      setPreviewItem(null)
    }
    setPopoverState({ id: null, x: 0, y: 0 })
  }, [previewItem])

  const toggleFavorite = useCallback((targetId) => {
    setAchievements(prev => PersonnelAchievementController.toggleFavorite(prev, targetId))
  }, [])

  const attachToPortfolio = useCallback((targetId, portfolioId, portfolioName) => {
    setAchievements(prev => PersonnelAchievementController.attachToPortfolio(prev, targetId, portfolioId, portfolioName))
  }, [])

  // Filtered & Sorted achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(item => {
      return item.matchesFilter(searchTerm, selectedStatus, selectedCategory)
    }).sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date) - new Date(a.date)
      if (sortOrder === 'oldest') return new Date(a.date) - new Date(b.date)
      if (sortOrder === 'title') return a.title.localeCompare(b.title)
      return 0
    })
  }, [achievements, searchTerm, selectedStatus, selectedCategory, sortOrder])

  // Search suggestions calculation
  const searchSuggestions = useMemo(() => {
    return PersonnelAchievementController.getSearchSuggestions(searchTerm, achievements)
  }, [searchTerm, achievements])

  // Stat counts
  const stats = useMemo(() => {
    const total = achievements.length
    const verified = achievements.filter(a => a.status === 'Verified').length
    const pending = achievements.filter(a => a.status === 'Pending Review' || a.status === 'Pending').length
    const returned = achievements.filter(a => a.status === 'Returned').length
    const favorited = achievements.filter(a => a.is_favorited).length

    return { total, verified, pending, returned, favorited }
  }, [achievements])

  return {
    achievements,
    loading,
    error,
    refreshAchievements,
    filteredAchievements,
    searchSuggestions,
    stats,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    previewItem,
    setPreviewItem,
    popoverState,
    setPopoverState,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    toggleFavorite,
    attachToPortfolio
  }
}
