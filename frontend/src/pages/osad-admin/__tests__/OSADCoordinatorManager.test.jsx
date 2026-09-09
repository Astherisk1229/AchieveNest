import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OSADCoordinatorManagerView from '../OSADCoordinatorManagerView'
import ManagePersonnelProgramsModal from '../modals/ManagePersonnelProgramsModal'
import * as collegeAdminService from '../../../services/collegeAdminService'

describe('Program Coordinator Assignment Redesign (Phase F)', () => {
  const mockCollege = {
    id: '20000000-0000-0000-0000-000000000001',
    code: 'CET',
    name: 'College of Engineering and Technology',
    acronym_badge_color: '#16834A'
  }

  const mockPersonnel = {
    profile_id: '10000000-0000-0000-0000-000000000008',
    name: 'Engr. Carlos Mendoza',
    email: 'demo.coordinator.a@ndmu.edu.ph',
    designation: 'Faculty Personnel',
    eligible_program_count: 2,
    current_coordinator_assignment_count: 1,
    assigned_program_codes: ['BSCS']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('instantiates OSADCoordinatorManagerView with college and fallback props', () => {
    const element = (
      <OSADCoordinatorManagerView
        collegeId="20000000-0000-0000-0000-000000000001"
        fallbackCollege={mockCollege}
        onBack={vi.fn()}
        onAssignmentsUpdated={vi.fn()}
      />
    )

    expect(element.type).toBe(OSADCoordinatorManagerView)
    expect(element.props.collegeId).toBe('20000000-0000-0000-0000-000000000001')
    expect(element.props.fallbackCollege.code).toBe('CET')
  })

  it('instantiates ManagePersonnelProgramsModal with personnel and college props', () => {
    const element = (
      <ManagePersonnelProgramsModal
        isOpen={true}
        onClose={vi.fn()}
        collegeId="20000000-0000-0000-0000-000000000001"
        personnel={mockPersonnel}
        onSuccess={vi.fn()}
      />
    )

    expect(element.type).toBe(ManagePersonnelProgramsModal)
    expect(element.props.isOpen).toBe(true)
    expect(element.props.personnel.name).toBe('Engr. Carlos Mendoza')
  })

  it('collegeAdminService exports Phase F coordinator API methods', () => {
    expect(typeof collegeAdminService.fetchCoordinatorPersonnel).toBe('function')
    expect(typeof collegeAdminService.fetchPersonnelCoordinatorContext).toBe('function')
    expect(typeof collegeAdminService.updatePersonnelCoordinatorAssignments).toBe('function')
  })
})
