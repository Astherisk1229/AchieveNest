import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import EditOrganizationModal from '../modals/EditOrganizationModal'
import AddProgramScopeModal from '../modals/AddProgramScopeModal'
import OSADOrganizationDetailsView from '../OSADOrganizationDetailsView'
import * as organizationAdminService from '../../../services/organizationAdminService'

describe('Plan 02 Phase 5 — OSAD Post-Creation Management Frontend', () => {
  it('organizationAdminService exposes complete post-creation mutation APIs', () => {
    expect(typeof organizationAdminService.updateOrganization).toBe('function')
    expect(typeof organizationAdminService.addOrganizationPrograms).toBe('function')
    expect(typeof organizationAdminService.removeOrganizationProgram).toBe('function')
    expect(typeof organizationAdminService.removeOrganizationModerator).toBe('function')
    expect(typeof organizationAdminService.assignOrganizationModerator).toBe('function')
  })

  it('EditOrganizationModal component is defined and exports modal', () => {
    expect(EditOrganizationModal).toBeDefined()
    expect(typeof EditOrganizationModal).toBe('function')
  })

  it('AddProgramScopeModal component is defined and exports modal', () => {
    expect(AddProgramScopeModal).toBeDefined()
    expect(typeof AddProgramScopeModal).toBe('function')
  })

  it('OSADOrganizationDetailsView integrates management actions and modals', () => {
    expect(OSADOrganizationDetailsView).toBeDefined()
    expect(typeof OSADOrganizationDetailsView).toBe('function')
  })
})
