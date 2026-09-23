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

  const uploadEvidence = useCallback(async (recordId, evidence = []) => {
    for (const entry of evidence) {
      const file = entry instanceof File ? entry : entry?.file
      if (!file) continue
      const form = new FormData()
      form.append('file', file)
      form.append('evidence_type', entry?.evidence_type || 'certificate')
      await portfolioService.addEvidence(recordId, form)
    }
  }, [])

  const addAchievement = useCallback(async data => {
    const { evidence = [], submit_now: submitNow = false, ...recordData } = data || {}
    // A new record is always created as a draft first so multipart evidence can
    // be persisted before the backend is asked to place it in the review queue.
    const result = await portfolioService.createRecord({ ...recordData, evidence: [], submit_now: false })
    const id = result?.data?.id || result?.id
    if (!id) throw new Error('Backend did not return the created portfolio UUID.')
    await uploadEvidence(id, evidence)
    if (submitNow) await portfolioService.resubmitRecord(id)
    await refreshData()
    return id
  }, [refreshData, uploadEvidence])

  const resubmitAchievement = useCallback(async (id, data) => {
    const { evidence = [], submit_now: _submitNow, ...recordData } = data || {}
    await portfolioService.updateRecord(id, recordData)
    await uploadEvidence(id, evidence)
    await portfolioService.resubmitRecord(id)
    await refreshData()
    return id
  }, [refreshData, uploadEvidence])

  const updateAchievement = useCallback(async (id, data) => {
    const { evidence = [], submit_now: submitNow = false, ...recordData } = data || {}
    await portfolioService.updateRecord(id, recordData)
    await uploadEvidence(id, evidence)
    if (submitNow) await portfolioService.resubmitRecord(id)
    await refreshData()
    return id
  }, [refreshData, uploadEvidence])

  return {
    achievements, filteredAchievements, stats, loading, error, taxonomy,
    searchTerm, setSearchTerm, selectedCategory, setSelectedCategory,
    selectedStatus, setSelectedStatus, sortOrder, setSortOrder,
    viewMode, setViewMode, popoverState, setPopoverState,
    handleOpenPopover, handleClosePopover, previewItem, setPreviewItem,
    addAchievement, updateAchievement, resubmitAchievement, refreshData
  }
}
