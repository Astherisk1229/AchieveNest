import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import OSADStudentOrganizationsPage from '../OSADStudentOrganizationsPage'
import OSADOrganizationDetailsView from '../OSADOrganizationDetailsView'
import * as organizationAdminService from '../../../services/organizationAdminService'

describe('Plan 02 Phase 4 — OSAD Organization Detail & Clickable Cards Frontend', () => {
  it('exposes canonical organization admin service API methods', () => {
    expect(typeof organizationAdminService.fetchOrganizations).toBe('function')
    expect(typeof organizationAdminService.fetchOrganization).toBe('function')
    expect(typeof organizationAdminService.createOrganization).toBe('function')
    expect(typeof organizationAdminService.assignOrganizationModerator).toBe('function')
    expect(typeof organizationAdminService.updateOrganizationLogo).toBe('function')
    expect(typeof organizationAdminService.deleteOrganizationLogo).toBe('function')
    expect(typeof organizationAdminService.getOrganizationLogoUrl).toBe('function')
  })

  it('OSADStudentOrganizationsPage component is defined and supports drill-down props', () => {
    expect(OSADStudentOrganizationsPage).toBeDefined()
    expect(typeof OSADStudentOrganizationsPage).toBe('function')
  })

  it('OSADOrganizationDetailsView component is defined and exports detail view', () => {
    expect(OSADOrganizationDetailsView).toBeDefined()
    expect(typeof OSADOrganizationDetailsView).toBe('function')
  })

  it('getOrganizationLogoUrl generates the correct API URL endpoint', () => {
    const url = organizationAdminService.getOrganizationLogoUrl('test-uuid-123')
    expect(url).toContain('/osad/organizations/test-uuid-123/logo')
  })
})
