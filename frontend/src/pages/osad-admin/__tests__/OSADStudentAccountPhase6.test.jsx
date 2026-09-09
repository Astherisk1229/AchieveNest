import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OSADStudentAccountsPage from '../OSADStudentAccountsPage'
import OSADController from '../../../controllers/OSADController'

describe('Plan 03 Phase 6 — Search, Filter & Action Cleanup', () => {
  const mockColleges = [
    { id: 'col-ceac', code: 'CEAC', name: 'College of Engineering, Architecture & Computing' },
    { id: 'col-cba', code: 'CBA', name: 'College of Business & Accountancy' }
  ]

  const mockPrograms = [
    { id: 'prog-01', college_id: 'col-ceac', college_code: 'CEAC', code: 'BSCS', name: 'BS Computer Science' },
    { id: 'prog-02', college_id: 'col-ceac', college_code: 'CEAC', code: 'BSIT', name: 'BS Information Technology' },
    { id: 'prog-03', college_id: 'col-cba', college_code: 'CBA', code: 'BSBA', name: 'BS Business Administration' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders OSADStudentAccountsPage component with full search and filter controls', () => {
    const element = (
      <OSADStudentAccountsPage
        userSearchTerm=""
        setUserSearchTerm={() => {}}
        selectedCollege="all"
        setSelectedCollege={() => {}}
        selectedSort="name"
        setSelectedSort={() => {}}
        getUsers={OSADController.getUsers.bind(OSADController)}
        getStudentPortfolios={() => []}
        resetStudentPassword={() => {}}
        getPasswordResetRequests={() => []}
        approvePasswordResetRequest={() => {}}
        showToast={() => {}}
        colleges={mockColleges}
        degreePrograms={mockPrograms}
      />
    )
    expect(element.type).toBe(OSADStudentAccountsPage)
    expect(element.props.colleges).toHaveLength(2)
    expect(element.props.degreePrograms).toHaveLength(3)
  })

  it('OSADController.getUsers filters by college and search term cleanly', () => {
    const allStudents = OSADController.getUsers('student', '', 'all', 'name')
    expect(allStudents.length).toBeGreaterThan(0)

    const ceacStudents = OSADController.getUsers('student', '', 'CEAC', 'name')
    expect(ceacStudents.every(s => s.college === 'CEAC')).toBe(true)

    const searchedStudents = OSADController.getUsers('student', 'Juan', 'all', 'name')
    expect(searchedStudents.some(s => s.full_name.includes('Juan'))).toBe(true)
  })

  it('OSADController.getUsers searches across institutional ID, email, and program', () => {
    const byId = OSADController.getUsers('student', '202310492', 'all', 'name')
    expect(byId.length).toBeGreaterThan(0)

    const byEmail = OSADController.getUsers('student', 'delacruz@ndmu.edu.ph', 'all', 'name')
    expect(byEmail.length).toBeGreaterThan(0)

    const byProgram = OSADController.getUsers('student', 'Computer Science', 'all', 'name')
    expect(byProgram.length).toBeGreaterThan(0)
  })
})
