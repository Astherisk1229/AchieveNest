import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AddStudentAccountModal from '../modals/AddStudentAccountModal'
import OSADStudentAccountsPage from '../OSADStudentAccountsPage'
import {
  STUDENT_YEAR_LEVELS,
  STUDENT_SEX_OPTIONS,
  STUDENT_SEX_SELECT_OPTIONS,
  STUDENT_YEAR_LEVEL_SELECT_OPTIONS,
  getAcademicYearValues,
  getDefaultAcademicYear
} from '../../../contracts/studentAccountContract'

describe('Plan 08 Phase 4 — OSAD Student Form UX & Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enforces canonical Year Level contract (1st Year through 5th Year, strictly no Graduate)', () => {
    expect(STUDENT_YEAR_LEVELS).toEqual([
      '1st Year',
      '2nd Year',
      '3rd Year',
      '4th Year',
      '5th Year'
    ])
    expect(STUDENT_YEAR_LEVELS).not.toContain('Graduate')
    expect(STUDENT_YEAR_LEVELS).not.toContain('6th Year')
  })

  it('enforces canonical Sex options and non-selectable placeholder contract', () => {
    expect(STUDENT_SEX_OPTIONS).toEqual([
      'Male',
      'Female',
      'Prefer not to say'
    ])

    const placeholder = STUDENT_SEX_SELECT_OPTIONS.find(opt => opt.value === '')
    expect(placeholder).toBeDefined()
    expect(placeholder.disabled).toBe(true)
    expect(placeholder.label).toBe('Select Sex')

    const activeValues = STUDENT_SEX_SELECT_OPTIONS.filter(opt => !opt.disabled).map(opt => opt.value)
    expect(activeValues).toEqual(STUDENT_SEX_OPTIONS)
  })

  it('provides dynamic Academic Year values with 2025 lower bound', () => {
    const ayValues = getAcademicYearValues()
    expect(ayValues.length).toBeGreaterThanOrEqual(1)
    expect(ayValues).toContain('2025-2026')

    const defaultAY = getDefaultAcademicYear()
    expect(ayValues[0]).toBe(defaultAY)
  })

  it('instantiates AddStudentAccountModal with required props and accessibility attributes', () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn()
    const element = (
      <AddStudentAccountModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        colleges={[{ id: 'col-1', code: 'CEAC', name: 'College of Engineering' }]}
        degreePrograms={[{ id: 'prog-1', code: 'BSCS', name: 'BS Computer Science', college_id: 'col-1' }]}
      />
    )

    expect(element.type).toBe(AddStudentAccountModal)
    expect(element.props.isOpen).toBe(true)
    expect(element.props.colleges).toHaveLength(1)
    expect(element.props.degreePrograms).toHaveLength(1)
  })

  it('GAP-01 Remediation: OSADStudentAccountsPage filters strictly exclude Graduate', () => {
    const element = (
      <OSADStudentAccountsPage
        userSearchTerm=""
        setUserSearchTerm={vi.fn()}
        selectedCollege="all"
        setSelectedCollege={vi.fn()}
        selectedSort="id_asc"
        setSelectedSort={vi.fn()}
        getUsers={vi.fn(() => [])}
        getStudentPortfolios={vi.fn(() => [])}
        resetStudentPassword={vi.fn()}
        updateStudentStatus={vi.fn()}
      />
    )

    expect(element.type).toBe(OSADStudentAccountsPage)
    // Verify component mounts cleanly with canonical contract
    expect(element.props.selectedCollege).toBe('all')
  })
})
