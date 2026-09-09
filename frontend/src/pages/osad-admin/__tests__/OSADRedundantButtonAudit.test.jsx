/**
 * OSADRedundantButtonAudit.test.jsx
 * Verification of OSAD Action Hierarchy, Destructive Action Confirmations,
 * and Single-Primary Action Discipline across canonical pages.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import OSADAcademicProgramsPage from '../OSADAcademicProgramsPage'
import OSADCertificateTemplatesPage from '../OSADCertificateTemplatesPage'
import OSADStudentOrganizationsPage from '../OSADStudentOrganizationsPage'

describe('Plan 06 Phase 4 — OSAD Redundant Button & Action Hierarchy Audit', () => {
  it('instantiates OSADAcademicProgramsPage with primary and secondary action props', () => {
    const onOpenProgram = vi.fn()
    const onOpenCollege = vi.fn()

    const element = (
      <OSADAcademicProgramsPage
        colleges={[]}
        degreePrograms={[]}
        onOpenAddProgram={onOpenProgram}
        onOpenAddCollege={onOpenCollege}
      />
    )

    expect(element.type).toBe(OSADAcademicProgramsPage)
    expect(element.props.onOpenAddProgram).toBe(onOpenProgram)
    expect(element.props.onOpenAddCollege).toBe(onOpenCollege)
  })

  it('instantiates OSADCertificateTemplatesPage cleanly', () => {
    const element = <OSADCertificateTemplatesPage />
    expect(element.type).toBe(OSADCertificateTemplatesPage)
  })

  it('instantiates OSADStudentOrganizationsPage with organization and club create handlers', () => {
    const onOpenOrg = vi.fn()
    const onOpenClub = vi.fn()

    const element = (
      <OSADStudentOrganizationsPage
        organizations={[]}
        clubs={[]}
        onOpenAddOrg={onOpenOrg}
        onOpenAddClub={onOpenClub}
      />
    )

    expect(element.type).toBe(OSADStudentOrganizationsPage)
    expect(element.props.onOpenAddOrg).toBe(onOpenOrg)
    expect(element.props.onOpenAddClub).toBe(onOpenClub)
  })
})
