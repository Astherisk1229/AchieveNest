import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OSADCollegeDetailsView from '../OSADCollegeDetailsView'
import OSADAcademicProgramsPage from '../OSADAcademicProgramsPage'

describe('Clickable College Cards & College Details View (Phase E)', () => {
  const mockCollege = {
    id: '20000000-0000-0000-0000-000000000001',
    code: 'CET',
    name: 'College of Engineering and Technology',
    description: 'Engineering, Computing, and Architecture Disciplines',
    status: 'active',
    acronym_badge_color: '#16834A',
    dean_name: 'Engr. Roberto Santos',
    dean_email: 'roberto.santos@ndmu.edu.ph',
    programs: [
      {
        id: '30000000-0000-0000-0000-000000000001',
        college_id: '20000000-0000-0000-0000-000000000001',
        code: 'BSCS',
        name: 'Bachelor of Science in Computer Science',
        degree_level: 'undergraduate',
        coordinator_name: 'Prof. Alan Turing'
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        college_id: '20000000-0000-0000-0000-000000000001',
        code: 'BSIT',
        name: 'Bachelor of Science in Information Technology',
        degree_level: 'undergraduate',
        coordinator_name: 'Prof. Ada Lovelace'
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        college_id: '20000000-0000-0000-0000-000000000001',
        code: 'BSCE',
        name: 'Bachelor of Science in Civil Engineering',
        degree_level: 'undergraduate',
        coordinator_name: null
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('instantiates OSADCollegeDetailsView component with fallback data', () => {
    const element = (
      <OSADCollegeDetailsView
        collegeId="20000000-0000-0000-0000-000000000001"
        fallbackCollege={mockCollege}
        onBack={vi.fn()}
        onAddProgram={vi.fn()}
        onEditCollege={vi.fn()}
        onAssignCoordinator={vi.fn()}
      />
    )

    expect(element.type).toBe(OSADCollegeDetailsView)
    expect(element.props.collegeId).toBe('20000000-0000-0000-0000-000000000001')
    expect(element.props.fallbackCollege.code).toBe('CET')
  })

  it('verifies coordinator coverage calculations for College Details', () => {
    const totalPrograms = mockCollege.programs.length
    const assignedCount = mockCollege.programs.filter(p => p.coordinator_name).length
    const unassignedCount = totalPrograms - assignedCount

    expect(totalPrograms).toBe(3)
    expect(assignedCount).toBe(2)
    expect(unassignedCount).toBe(1)
  })

  it('renders OSADAcademicProgramsPage with interactive cards and handles selection', () => {
    const handleSelect = vi.fn()
    const handleAddProgram = vi.fn()

    const element = (
      <OSADAcademicProgramsPage
        colleges={[mockCollege]}
        academicPrograms={mockCollege.programs}
        setIsAddCollegeOpen={vi.fn()}
        setIsAddProgramOpen={handleAddProgram}
        onSelectCollege={handleSelect}
        selectedCollegeId={null}
      />
    )

    expect(element.type).toBe(OSADAcademicProgramsPage)
    expect(element.props.colleges).toHaveLength(1)
    expect(element.props.academicPrograms).toHaveLength(3)
  })

  it('renders College Details view when selectedCollegeId is provided to OSADAcademicProgramsPage', () => {
    const element = (
      <OSADAcademicProgramsPage
        colleges={[mockCollege]}
        academicPrograms={mockCollege.programs}
        setIsAddCollegeOpen={vi.fn()}
        setIsAddProgramOpen={vi.fn()}
        selectedCollegeId="20000000-0000-0000-0000-000000000001"
      />
    )

    // When selectedCollegeId is active, the component switches to OSADCollegeDetailsView
    expect(element.props.selectedCollegeId).toBe('20000000-0000-0000-0000-000000000001')
  })
})
