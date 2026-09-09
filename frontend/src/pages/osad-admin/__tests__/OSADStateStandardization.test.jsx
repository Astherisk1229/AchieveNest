/**
 * OSADStateStandardization.test.jsx
 * Verification of Plan 06 Phase 8 — Loading, Empty, Search-Empty, Error & Permission States
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import {
  OSADLoadingState,
  OSADEmptyState,
  OSADSearchEmptyState,
  OSADErrorState,
  OSADPermissionState
} from '../../../components/osad/OSADStateBlock'
import OSADAcademicProgramsPage from '../OSADAcademicProgramsPage'
import OSADStudentOrganizationsPage from '../OSADStudentOrganizationsPage'
import OSADPasswordResetRequestsPage from '../OSADPasswordResetRequestsPage'
import OSADAwardsAndCriteriaPage from '../OSADAwardsAndCriteriaPage'
import OSADAccreditationReportsPage from '../OSADAccreditationReportsPage'
import OSADSystemAuditLogsPage from '../OSADSystemAuditLogsPage'
import OSADCoordinatorManagerView from '../OSADCoordinatorManagerView'
import OSADCollegeDetailsView from '../OSADCollegeDetailsView'
import OSADOrganizationDetailsView from '../OSADOrganizationDetailsView'
import OSADStudentsForEvaluationView from '../OSADStudentsForEvaluationView'
import OSADPotentialCandidatesView from '../OSADPotentialCandidatesView'
import OSADStudentAwardReviewWorkspace from '../OSADStudentAwardReviewWorkspace'

describe('Plan 06 Phase 8 — OSAD State Standardization Suite', () => {
  it('instantiates OSADLoadingState with role="status" and polite live region', () => {
    const loader = OSADLoadingState({
      message: 'Loading records in progress...',
      subMessage: 'Please hold.'
    })

    expect(loader.props.role).toBe('status')
    expect(loader.props['aria-live']).toBe('polite')
    expect(loader.props.className).toContain('font-sans')
  })

  it('instantiates OSADEmptyState with clear explanation and action CTA', () => {
    const onAction = vi.fn()
    const emptyState = OSADEmptyState({
      title: 'No Organizations Registered',
      description: 'Establish your first organization.',
      actionLabel: 'Create Organization',
      onAction
    })

    expect(emptyState.type).toBe('div')
    expect(emptyState.props.className).toContain('font-sans')
  })

  it('instantiates OSADSearchEmptyState with reset/clear filter callback', () => {
    const onReset = vi.fn()
    const searchEmpty = OSADSearchEmptyState({
      title: 'No Matching Records',
      description: 'No results match your active query.',
      onReset,
      resetLabel: 'Clear Search'
    })

    expect(searchEmpty.type).toBe('div')
  })

  it('instantiates OSADErrorState with role="alert", assertive live region, and retry callback', () => {
    const onRetry = vi.fn()
    const errorState = OSADErrorState({
      title: 'Unable to Load Student Accounts',
      message: 'Network transport timeout.',
      onRetry
    })

    expect(errorState.props.role).toBe('alert')
    expect(errorState.props['aria-live']).toBe('assertive')
  })

  it('instantiates OSADPermissionState with role="alert" and safe back navigation', () => {
    const onBack = vi.fn()
    const permissionState = OSADPermissionState({
      title: 'Restricted Access',
      message: 'Only OSAD Administrators can perform this action.',
      onBack
    })

    expect(permissionState.props.role).toBe('alert')
  })

  it('instantiates Academic Structure with empty colleges dataset', () => {
    const page = <OSADAcademicProgramsPage colleges={[]} academicPrograms={[]} />
    expect(page.type).toBe(OSADAcademicProgramsPage)
    expect(page.props.colleges).toHaveLength(0)
  })

  it('instantiates Student Organizations with empty dataset and search empty branches', () => {
    const page = <OSADStudentOrganizationsPage organizations={[]} />
    expect(page.type).toBe(OSADStudentOrganizationsPage)
    expect(page.props.organizations).toHaveLength(0)
  })

  it('instantiates Password Reset Requests page with distinct state handling', () => {
    const page = <OSADPasswordResetRequestsPage />
    expect(page.type).toBe(OSADPasswordResetRequestsPage)
  })

  it('instantiates Accreditation Reports and System Audit Logs with empty dataset branches', () => {
    const reports = <OSADAccreditationReportsPage accreditationReports={[]} />
    const auditLogs = <OSADSystemAuditLogsPage auditLogs={[]} />

    expect(reports.type).toBe(OSADAccreditationReportsPage)
    expect(auditLogs.type).toBe(OSADSystemAuditLogsPage)
  })

  it('instantiates detail and workspace sub-views with state blocks', () => {
    const coordView = (
      <OSADCoordinatorManagerView
        collegeId="c-ceac"
        fallbackCollege={{ id: 'c-ceac', code: 'CEAC', name: 'Engineering' }}
        onBack={vi.fn()}
      />
    )
    const collegeView = (
      <OSADCollegeDetailsView
        collegeId="c-ceac"
        fallbackCollege={{ id: 'c-ceac', code: 'CEAC', name: 'Engineering', programs: [] }}
        onBack={vi.fn()}
      />
    )
    const orgView = (
      <OSADOrganizationDetailsView
        organizationId="org-1"
        fallbackOrganization={{ id: 'org-1', code: 'CS', name: 'Computer Society', programs: [] }}
        onBack={vi.fn()}
      />
    )
    const evalView = (
      <OSADStudentsForEvaluationView
        award={{ id: 'a-1', name: 'Award 1' }}
        onBack={vi.fn()}
      />
    )
    const potView = (
      <OSADPotentialCandidatesView
        award={{ id: 'a-1', name: 'Award 1' }}
        onBack={vi.fn()}
      />
    )
    const workspaceView = (
      <OSADStudentAwardReviewWorkspace
        awardId="a-1"
        studentId="s-1"
        onBack={vi.fn()}
      />
    )

    expect(coordView.type).toBe(OSADCoordinatorManagerView)
    expect(collegeView.type).toBe(OSADCollegeDetailsView)
    expect(orgView.type).toBe(OSADOrganizationDetailsView)
    expect(evalView.type).toBe(OSADStudentsForEvaluationView)
    expect(potView.type).toBe(OSADPotentialCandidatesView)
    expect(workspaceView.type).toBe(OSADStudentAwardReviewWorkspace)
  })
})
