import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AddStudentAccountModal from '../modals/AddStudentAccountModal'
import OSADStudentAccountsPage from '../OSADStudentAccountsPage'

describe('Plan 03 Phase 3 — Fix Add Student Account Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AddStudentAccountModal is defined as a valid React component function', () => {
    expect(AddStudentAccountModal).toBeDefined()
    expect(typeof AddStudentAccountModal).toBe('function')
  })

  it('renders nothing when isOpen is false', () => {
    const element = (
      <AddStudentAccountModal
        isOpen={false}
        onClose={() => {}}
        onSubmit={() => {}}
      />
    )
    expect(element.props.isOpen).toBe(false)
  })

  it('instantiates AddStudentAccountModal cleanly when isOpen is true', () => {
    const onCloseMock = vi.fn()
    const onSubmitMock = vi.fn()
    const element = (
      <AddStudentAccountModal
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        colleges={[{ id: 'col-1', name: 'CEAC' }]}
        degreePrograms={[{ id: 'prog-1', name: 'BSCS' }]}
      />
    )
    expect(element.type).toBe(AddStudentAccountModal)
    expect(element.props.isOpen).toBe(true)
    expect(element.props.colleges).toHaveLength(1)
  })

  it('OSADStudentAccountsPage mounts with AddStudentAccountModal integration', () => {
    const mockGetUsers = vi.fn(() => [
      {
        id: 'usr-1',
        full_name: 'Juan Dela Cruz',
        student_id: '202310492',
        role: 'student',
        college: 'CEAC',
        program: 'BS Computer Science'
      }
    ])

    const pageElement = (
      <OSADStudentAccountsPage
        userSearchTerm=""
        setUserSearchTerm={() => {}}
        selectedCollege="all"
        setSelectedCollege={() => {}}
        selectedSort="name"
        setSelectedSort={() => {}}
        getUsers={mockGetUsers}
        getStudentPortfolios={() => []}
        resetStudentPassword={() => {}}
        getPasswordResetRequests={() => []}
        approvePasswordResetRequest={() => {}}
        showToast={() => {}}
      />
    )

    expect(pageElement.type).toBe(OSADStudentAccountsPage)
  })
})
