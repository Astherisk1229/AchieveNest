import { useState, useMemo, useCallback } from 'react'
import StudentAchievementController from '../controllers/StudentAchievementController'

/**
 * useStudentAchievements.js
 * Custom React Hook serving as the MVC Bridge for Student Achievements.
 */
export default function useStudentAchievements() {
  const [achievements, setAchievements] = useState(() => StudentAchievementController.getAllAchievements())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')

  // Popover State: { achievement, position: { x, y } }
  const [popoverState, setPopoverState] = useState({ achievement: null, position: { x: 0, y: 0 } })
  // Preview Modal State: achievement object or null
  const [previewItem, setPreviewItem] = useState(null)

  const refreshData = useCallback(() => {
    setAchievements(StudentAchievementController.getAllAchievements())
  }, [])

  const filteredAchievements = useMemo(() => {
    return StudentAchievementController.getFilteredAchievements(
      searchTerm,
      selectedStatus,
      selectedCategory,
      sortOrder
    )
  }, [achievements, searchTerm, selectedStatus, selectedCategory, sortOrder])

  const stats = useMemo(() => {
    return StudentAchievementController.getStats()
  }, [achievements])

  const handleOpenPopover = useCallback((e, achievement) => {
    e.stopPropagation()
    const targetElement = e.currentTarget
    const rect = targetElement.getBoundingClientRect()
    setPopoverState({
      achievement,
      targetElement,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom
      }
    })
  }, [])

  const handleClosePopover = useCallback(() => {
    setPopoverState({ achievement: null, targetElement: null, position: { x: 0, y: 0 } })
  }, [])

  const addAchievement = useCallback((data) => {
    const created = StudentAchievementController.addAchievement(data)
    refreshData()
    return created
  }, [refreshData])

  const updateAchievement = useCallback((id, data) => {
    const updated = StudentAchievementController.updateAchievement(id, data)
    refreshData()
    return updated
  }, [refreshData])

  const resubmitAchievement = useCallback((id, data) => {
    const updated = StudentAchievementController.resubmitAchievement(id, data)
    refreshData()
    return updated
  }, [refreshData])

  const deleteAchievement = useCallback((id) => {
    const ok = StudentAchievementController.deleteAchievement(id)
    if (ok) refreshData()
    return ok
  }, [refreshData])

  const toggleFavorite = useCallback((id) => {
    const updated = StudentAchievementController.toggleFavorite(id)
    refreshData()
    return updated
  }, [refreshData])

  const toggleAttachPortfolio = useCallback((id) => {
    const updated = StudentAchievementController.toggleAttachPortfolio(id)
    refreshData()
    return updated
  }, [refreshData])

  return {
    achievements,
    filteredAchievements,
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
    popoverState,
    setPopoverState,
    handleOpenPopover,
    handleClosePopover,
    previewItem,
    setPreviewItem,
    addAchievement,
    updateAchievement,
    resubmitAchievement,
    deleteAchievement,
    toggleFavorite,
    toggleAttachPortfolio,
    refreshData
  }
}
