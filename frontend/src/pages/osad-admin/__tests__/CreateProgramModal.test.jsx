import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CreateProgramModal from '../modals/CreateProgramModal'
import DegreeProgramModel from '../../../models/DegreeProgramModel'
import * as collegeAdminService from '../../../services/collegeAdminService'

describe('CreateProgramModal & Academic Program Flow (Phase D)', () => {
  const mockColleges = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      code: 'CET',
      name: 'College of Engineering and Technology',
      acronym_badge_color: '#16834A',
      status: 'active'
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      code: 'CBA',
      name: 'College of Business and Accountancy',
      acronym_badge_color: '#1B4D3E',
      status: 'active'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('instantiates CreateProgramModal component cleanly in global mode', () => {
    const element = (
      <CreateProgramModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={() => {}}
        colleges={mockColleges}
        initialCollegeId={null}
      />
    )
    expect(element.type).toBe(CreateProgramModal)
    expect(element.props.isOpen).toBe(true)
    expect(element.props.initialCollegeId).toBeNull()
  })

  it('instantiates CreateProgramModal in locked/scoped College mode', () => {
    const element = (
      <CreateProgramModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={() => {}}
        colleges={mockColleges}
        initialCollegeId="20000000-0000-0000-0000-000000000001"
      />
    )
    expect(element.props.initialCollegeId).toBe('20000000-0000-0000-0000-000000000001')
  })

  it('collegeAdminService exposes academic program management endpoints', () => {
    expect(typeof collegeAdminService.fetchAcademicPrograms).toBe('function')
    expect(typeof collegeAdminService.createAcademicProgram).toBe('function')
  })

  it('DegreeProgramModel defaults degree_level to undergraduate', () => {
    const model = new DegreeProgramModel({
      college_id: '20000000-0000-0000-0000-000000000001',
      code: 'bscs',
      name: 'Bachelor of Science in Computer Science'
    })

    expect(model.code).toBe('BSCS')
    expect(model.name).toBe('Bachelor of Science in Computer Science')
    expect(model.degree_level).toBe('undergraduate')
    expect(model.degreeLevel).toBe('undergraduate')
    expect(model.status).toBe('active')
  })

  it('DegreeProgramModel.validate enforces parent college, code, and name', () => {
    // Valid model
    const valid = DegreeProgramModel.validate({
      college_id: '20000000-0000-0000-0000-000000000001',
      code: 'BSCE',
      name: 'Bachelor of Science in Civil Engineering'
    }, mockColleges, [])
    expect(valid.isValid).toBe(true)
    expect(valid.errors).toHaveLength(0)

    // Missing college
    const missingCollege = DegreeProgramModel.validate({
      code: 'BSCE',
      name: 'Civil Engineering'
    }, mockColleges, [])
    expect(missingCollege.isValid).toBe(false)
    expect(missingCollege.errors).toContain('A parent College must be selected for the Academic Program.')

    // Missing code & name
    const missingFields = DegreeProgramModel.validate({
      college_id: '20000000-0000-0000-0000-000000000001'
    }, mockColleges, [])
    expect(missingFields.isValid).toBe(false)
    expect(missingFields.errors).toContain('Academic Program code is required.')
    expect(missingFields.errors).toContain('Academic Program name is required.')

    // Duplicate code
    const duplicate = DegreeProgramModel.validate({
      college_id: '20000000-0000-0000-0000-000000000001',
      code: 'BSCS',
      name: 'Another CS Program'
    }, mockColleges, [{ id: 'p-1', code: 'BSCS' }])
    expect(duplicate.isValid).toBe(false)
    expect(duplicate.errors[0]).toMatch(/already exists/i)
  })
})
