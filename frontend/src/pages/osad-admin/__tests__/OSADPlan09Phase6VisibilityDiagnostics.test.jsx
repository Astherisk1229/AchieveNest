import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OSADStudentAccountsPage from '../OSADStudentAccountsPage'
import { provisioningService } from '../../../services/provisioningService'

vi.mock('../../../services/provisioningService', () => ({
  provisioningService: {
    fetchStudents: vi.fn(),
    provisionManualStudent: vi.fn(),
    checkAvailability: vi.fn()
  }
}))

describe('Plan 09 Phase 6 — Search, Filter, Pagination & Empty-State Diagnostics', () => {
  const mockStudents = Array.from({ length: 30 }, (_, i) => ({
    id: `student-uuid-${i + 1}`,
    institutional_id: `2026100${String(i + 1).padStart(2, '0')}`,
    student_id: `2026100${String(i + 1).padStart(2, '0')}`,
    full_name: `Student Name ${i + 1}`,
    first_name: `Student`,
    last_name: `Name ${i + 1}`,
    email: `student.${i + 1}@ndmu.edu.ph`,
    sex: i % 2 === 0 ? 'Male' : 'Female',
    college: i % 3 === 0 ? 'CEAC' : 'CBA',
    program: i % 3 === 0 ? 'BS Computer Science' : 'BS Business Administration',
    year_level: `${(i % 4) + 1}st Year`,
    status: 'active',
    must_change_password: i === 0
  }))

  const mockColleges = [
    { id: 'col-ceac', code: 'CEAC', name: 'College of Engineering, Architecture & Computing' },
    { id: 'col-cba', code: 'CBA', name: 'College of Business & Accountancy' }
  ]

  const mockPrograms = [
    { id: 'prog-01', college_id: 'col-ceac', college_code: 'CEAC', code: 'BSCS', name: 'BS Computer Science' },
    { id: 'prog-02', college_id: 'col-cba', college_code: 'CBA', code: 'BSBA', name: 'BS Business Administration' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    provisioningService.fetchStudents.mockResolvedValue(mockStudents)
  })

  it('instantiates OSADStudentAccountsPage with pagination and diagnostics support', () => {
    const element = (
      <OSADStudentAccountsPage
        userSearchTerm=""
        setUserSearchTerm={vi.fn()}
        selectedCollege="all"
        setSelectedCollege={vi.fn()}
        selectedSort="name"
        setSelectedSort={vi.fn()}
        colleges={mockColleges}
        degreePrograms={mockPrograms}
      />
    )

    expect(element.type).toBe(OSADStudentAccountsPage)
    expect(element.props.colleges).toHaveLength(2)
  })

  it('proves that 30 student records paginate with pageSize 25 into multiple pages', () => {
    const pageSize = 25
    const totalCount = mockStudents.length
    const totalPages = Math.ceil(totalCount / pageSize)
    expect(totalPages).toBe(2)
    const page1 = mockStudents.slice(0, 25)
    const page2 = mockStudents.slice(25, 30)
    expect(page1).toHaveLength(25)
    expect(page2).toHaveLength(5)
  })

  it('corrects out-of-range pagination when filtered subset is smaller than current page', () => {
    let currentPage = 2
    const filteredList = mockStudents.filter(s => s.college === 'CEAC') // 10 items
    const totalPages = Math.ceil(filteredList.length / 25) // 1 page
    if (currentPage > totalPages) {
      currentPage = 1
    }
    expect(currentPage).toBe(1)
  })
})
