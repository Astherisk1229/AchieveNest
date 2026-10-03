import { useCallback, useEffect, useMemo, useState } from 'react'
import RosterController from '../controllers/RosterController'
import portfolioService from '../services/portfolioService'

/**
 * useStudentRoster.js
 * Custom React Hook bridging View components to RosterController & StudentModel.
 */
export function useStudentRoster(initialStudents = []) {
  const [students, setStudents] = useState(initialStudents)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [courseFilter, setCourseFilter] = useState('All Courses')
  const controller = useMemo(() => new RosterController(students), [students])

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setStudents(await portfolioService.fetchCoordinatorStudents())
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Students could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  const filteredStudents = useMemo(() => {
    return controller.getFilteredRoster(searchQuery, yearFilter, courseFilter).map(std => std.toJSON())
  }, [controller, searchQuery, yearFilter, courseFilter])

  return {
    studentRoster: controller.allStudents.map(s => s.toJSON()),
    filteredStudents,
    searchQuery,
    setSearchQuery,
    yearFilter,
    setYearFilter,
    courseFilter,
    setCourseFilter,
    loading,
    error,
    reload: loadStudents
  }
}
