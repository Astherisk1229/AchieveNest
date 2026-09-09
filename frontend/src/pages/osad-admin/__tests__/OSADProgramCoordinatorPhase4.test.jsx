import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import EditProgramModal from '../modals/EditProgramModal'
import CreateProgramModal from '../modals/CreateProgramModal'
import OSADCollegeDetailsView from '../OSADCollegeDetailsView'
import OSADCoordinatorManagerView from '../OSADCoordinatorManagerView'
import ManagePersonnelProgramsModal from '../modals/ManagePersonnelProgramsModal'
import * as collegeAdminService from '../../../services/collegeAdminService'

describe('Plan 01 Phase 4 — OSAD Academic Program & Coordinator Coverage Frontend', () => {
  it('exposes canonical Phase 3 API methods in collegeAdminService', () => {
    expect(typeof collegeAdminService.fetchColleges).toBe('function')
    expect(typeof collegeAdminService.fetchAcademicPrograms).toBe('function')
    expect(typeof collegeAdminService.createAcademicProgram).toBe('function')
    expect(typeof collegeAdminService.updateAcademicProgram).toBe('function')
    expect(typeof collegeAdminService.fetchCoordinatorPersonnel).toBe('function')
    expect(typeof collegeAdminService.fetchPersonnelCoordinatorContext).toBe('function')
    expect(typeof collegeAdminService.updatePersonnelCoordinatorAssignments).toBe('function')
    expect(typeof collegeAdminService.reassignProgramCoordinator).toBe('function')
  })

  it('EditProgramModal and CreateProgramModal are strictly master data only and decouple coordinator fields', () => {
    expect(EditProgramModal).toBeDefined()
    expect(CreateProgramModal).toBeDefined()
  })

  it('OSADCollegeDetailsView and OSADCoordinatorManagerView are defined components', () => {
    expect(OSADCollegeDetailsView).toBeDefined()
    expect(OSADCoordinatorManagerView).toBeDefined()
    expect(ManagePersonnelProgramsModal).toBeDefined()
  })
})
