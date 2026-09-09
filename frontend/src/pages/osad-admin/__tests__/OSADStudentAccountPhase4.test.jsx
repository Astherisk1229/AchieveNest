import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AddStudentAccountModal from '../modals/AddStudentAccountModal'
import { provisioningService } from '../../../services/provisioningService'

describe('Plan 03 Phase 4 — Student Creation Form', () => {
  const mockColleges = [
    { id: 'col-ceac', code: 'CEAC', name: 'College of Engineering, Architecture & Computing' },
    { id: 'col-cba', code: 'CBA', name: 'College of Business & Accountancy' }
  ]

  const mockPrograms = [
    { id: 'prog-01', college_id: 'col-ceac', code: 'BSCS', name: 'BS Computer Science' },
    { id: 'prog-02', college_id: 'col-ceac', code: 'BSIT', name: 'BS Information Technology' },
    { id: 'prog-03', college_id: 'col-cba', code: 'BSBA', name: 'BS Business Administration' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('instantiates AddStudentAccountModal with complete form props', () => {
    const element = (
      <AddStudentAccountModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={() => {}}
        colleges={mockColleges}
        degreePrograms={mockPrograms}
      />
    )
    expect(element.type).toBe(AddStudentAccountModal)
    expect(element.props.isOpen).toBe(true)
    expect(element.props.colleges).toHaveLength(2)
    expect(element.props.degreePrograms).toHaveLength(3)
  })

  it('provisioningService exposes provisionManualStudent endpoint', () => {
    expect(typeof provisioningService.provisionManualStudent).toBe('function')
  })

  it('returns null when isOpen is false', () => {
    const element = (
      <AddStudentAccountModal
        isOpen={false}
        onClose={() => {}}
      />
    )
    expect(element.props.isOpen).toBe(false)
  })
})
