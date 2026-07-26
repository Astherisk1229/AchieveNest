import { useState, useMemo } from 'react'
import RosterController from '../controllers/RosterController'

/**
 * useStudentRoster.js
 * Custom React Hook bridging View components to RosterController & StudentModel.
 */
export function useStudentRoster(initialStudents = []) {
  const [controller] = useState(() => new RosterController(initialStudents))
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [courseFilter, setCourseFilter] = useState('All Courses')

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
    setCourseFilter
  }
}
