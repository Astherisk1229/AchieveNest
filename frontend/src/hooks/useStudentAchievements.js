import { useState, useMemo, useCallback, useEffect } from 'react'
import StudentAchievementController from '../controllers/StudentAchievementController'
import portfolioService from '../services/portfolioService'

export default function useStudentAchievements() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [popoverState, setPopoverState] = useState({ achievement: null, position: { x: 0, y: 0 } })
  const [previewItem, setPreviewItem] = useState(null)
  const [taxonomy, setTaxonomy] = useState([])

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const records = await portfolioService.fetchRecords()
      setAchievements(StudentAchievementController.normalizeMany(records))
    } catch (err) {
      setAchievements([])
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load achievements.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshData() }, [refreshData])

  useEffect(() => {
    let active = true
    portfolioService.fetchCategories()
      .then(categories => { if (active) setTaxonomy(Array.isArray(categories) ? categories : []) })
      .catch(() => { if (active) setTaxonomy([]) })
    return () => { active = false }
  }, [])

  const filteredAchievements = useMemo(() => StudentAchievementController.getFilteredAchievements(
    achievements, searchTerm, selectedStatus, selectedCategory, sortOrder
  ), [achievements, searchTerm, selectedStatus, selectedCategory, sortOrder])

  const stats = useMemo(() => StudentAchievementController.getStats(achievements), [achievements])

  const handleOpenPopover = useCallback((event, achievement) => {
    event.stopPropagation()
    const targetElement = event.currentTarget
    const rect = targetElement.getBoundingClientRect()
    setPopoverState({ achievement, targetElement, position: { x: rect.left + rect.width / 2, y: rect.bottom } })
  }, [])

  const handleClosePopover = useCallback(() => {
    setPopoverState({ achievement: null, targetElement: null, position: { x: 0, y: 0 } })
  }, [])

  return {
    achievements, filteredAchievements, stats, loading, error, taxonomy,
    searchTerm, setSearchTerm, selectedCategory, setSelectedCategory,
    selectedStatus, setSelectedStatus, sortOrder, setSortOrder,
    viewMode, setViewMode, popoverState, setPopoverState,
    handleOpenPopover, handleClosePopover, previewItem, setPreviewItem,
    refreshData
  }
}
