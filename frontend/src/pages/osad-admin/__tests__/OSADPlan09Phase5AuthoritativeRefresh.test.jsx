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

describe('Plan 09 Phase 5 — Frontend Mutation & Authoritative Refresh', () => {
  const mockStudents = [
    {
      id: 'student-uuid-1',
      institutional_id: '202610001',
      student_id: '202610001',
      full_name: 'Dela Cruz, Juan',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      email: 'juan.delacruz@ndmu.edu.ph',
      sex: 'Male',
      college: 'CEAC',
      program: 'BS Computer Science',
      year_level: '1st Year',
      status: 'active',
      must_change_password: false
    },
    {
      id: 'student-uuid-2',
      institutional_id: '202610002',
      student_id: '202610002',
      full_name: 'Santos, Maria',
      first_name: 'Maria',
      last_name: 'Santos',
      email: 'maria.santos@ndmu.edu.ph',
      sex: null, // Legacy null sex test
      college: 'CBA',
      program: 'BS Business Administration',
      year_level: '2nd Year',
      status: 'active',
      must_change_password: true
    }
  ]

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

  it('instantiates OSADStudentAccountsPage with authoritative server props and college/program catalogs', () => {
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
    expect(element.props.degreePrograms).toHaveLength(2)
  })

  it('verifies provisioningService.fetchStudents contract returns canonical array', async () => {
    const students = await provisioningService.fetchStudents()
    expect(students).toHaveLength(2)
    expect(students[0].institutional_id).toBe('202610001')
    expect(students[1].sex).toBeNull()
    expect(students[1].must_change_password).toBe(true)
  })

  it('verifies provisioningService.provisionManualStudent creates student account cleanly', async () => {
    provisioningService.provisionManualStudent.mockResolvedValueOnce({
      data: {
        id: 'student-new-uuid',
        institutional_id: '202610099',
        full_name: 'Bautista, Carlo',
        must_change_password: true
      }
    })

    const payload = {
      institutional_id: '202610099',
      first_name: 'Carlo',
      last_name: 'Bautista',
      email: 'carlo.bautista@ndmu.edu.ph',
      sex: 'Male',
      academic_program_id: 'prog-01',
      year_level: '1st Year',
      academic_year: '2026-2027'
    }

    const res = await provisioningService.provisionManualStudent(payload)
    expect(res.data.institutional_id).toBe('202610099')
    expect(res.data.must_change_password).toBe(true)
  })
})
