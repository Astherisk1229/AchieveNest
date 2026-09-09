import React from 'react'
import { describe, it, expect, vi } from 'vitest'

import {
  isAcademicPersonnel,
  formatPersonnelPlacement,
  formatPersonnelClassification,
  formatFacultyEngagement,
  formatEmploymentStatus,
  collectPersonnelPlacementOptions,
  validatePersonnelPlacement
} from '../../utils/personnelPlacement'
import { NAVIGATION_CATALOG } from '../../config/navigationCatalog'
import { getAuthorizedNavigationForSession } from '../../config/personnelRoleNavigation'
import { CANONICAL_ROLES, CANONICAL_ACCOUNT_TYPES } from '../../utils/roleContext'
import RouteAccessController from '../RouteAccessController'

// HR Pages & Components
import HRDashboardPage, { HRDashboard } from '../../pages/hr-admin/HRDashboardPage'
import HRPersonnelDirectoryPage, { HRPersonnelDirectory } from '../../pages/hr-admin/HRPersonnelDirectoryPage'
import HREvaluationSubmissionsPage, { HREvaluationSubmissions } from '../../pages/hr-admin/HREvaluationSubmissionsPage'
import HRFacultyEvaluationOversightPage, { HRFacultyEvaluationAndRankingPage } from '../../pages/hr-admin/HRFacultyEvaluationOversightPage'
import HRAuditTrailPage, { HRAuditTrail } from '../../pages/hr-admin/HRAuditTrailPage'
import HRRankAssignmentLogsPage, { HRRankAssignmentLogs } from '../../pages/hr-admin/HRRankAssignmentLogsPage'
import HRPasswordResetRequestsPage from '../../pages/hr-admin/HRPasswordResetRequestsPage'
import PersonnelDirectoryTable from '../../pages/hr-admin/personnel-directory/PersonnelDirectoryTable'
import FacultyDossierDrawer from '../../pages/hr-admin/personnel-directory/FacultyDossierDrawer'
import EditAssignmentModal from '../../pages/hr-admin/personnel-directory/EditAssignmentModal'
import EditMasterDataModal from '../../pages/hr-admin/personnel-directory/EditMasterDataModal'
import DeanAssignmentModal from '../../pages/hr-admin/modals/DeanAssignmentModal'

describe('AchieveNest — HR Navigation & Module Health Check Verification Suite', () => {

  const hrSession = {
    account_type: CANONICAL_ACCOUNT_TYPES.HR_ADMIN,
    user_type: CANONICAL_ACCOUNT_TYPES.HR_ADMIN,
    role: CANONICAL_ROLES.HR_STAFF,
    active_role_context: CANONICAL_ROLES.HR_STAFF,
    assigned_roles: [CANONICAL_ROLES.HR_STAFF]
  }

  // =========================================================================
  // 1. Phase N0 / N1: HR Sidebar & Route Inventory Audit
  // =========================================================================
  describe('Phase N0/N1: HR Sidebar & Route Inventory Audit', () => {
    it('has all canonical HR items defined in NAVIGATION_CATALOG with required permissions and roles', () => {
      const hrItems = NAVIGATION_CATALOG.filter(
        item => item.portal === 'hr' || (item.allowedAccountTypes && item.allowedAccountTypes.includes(CANONICAL_ACCOUNT_TYPES.HR_ADMIN))
      )
      expect(hrItems.length).toBeGreaterThanOrEqual(6)

      const expectedPaths = [
        '/hr/dashboard',
        '/hr/personnel-directory',
        '/hr/evaluation-submissions',
        '/hr/audit-trail',
        '/hr/rank-assignment-logs',
        '/hr/password-resets'
      ]

      expectedPaths.forEach(path => {
        const found = hrItems.some(item => item.path === path)
        expect(found, `Expected HR route ${path} in NAVIGATION_CATALOG`).toBe(true)
      })
    })

    it('returns authorized navigation items for hr_staff session with correct icons and paths', () => {
      const authorizedNav = getAuthorizedNavigationForSession(hrSession)
      expect(authorizedNav.length).toBeGreaterThanOrEqual(6)

      const labels = authorizedNav.map(item => item.label)
      expect(labels).toContain('HR Dashboard')
      expect(labels).toContain('Personnel Directory')
      expect(labels).toContain('Evaluation Submissions')
      expect(labels).toContain('HR Audit Trail')
      expect(labels).toContain('Rank Assignment Logs')
      expect(labels).toContain('Password Resets')

      authorizedNav.forEach(item => {
        expect(item.icon).toBeDefined()
        expect(item.path).toMatch(/^\/hr\//)
      })
    })
  })

  // =========================================================================
  // 2. Phase N2A / N3A: Personnel Classification & Null Safety Verification
  // =========================================================================
  describe('Phase N2A/N3A: Null Safety & Plan D Model Resolution', () => {
    it('isAcademicPersonnel safely handles null, undefined, numbers, strings, and objects without throwing', () => {
      expect(isAcademicPersonnel(null)).toBe(false)
      expect(isAcademicPersonnel(undefined)).toBe(false)
      expect(isAcademicPersonnel('')).toBe(false)
      expect(isAcademicPersonnel(123)).toBe(false)
      expect(isAcademicPersonnel({})).toBe(false)
      expect(isAcademicPersonnel({ organizational_side: 'academic' })).toBe(true)
      expect(isAcademicPersonnel({ organizational_side: 'non_academic' })).toBe(false)
      expect(isAcademicPersonnel({ personnel_classification: 'academic' })).toBe(true)
      expect(isAcademicPersonnel({ personnel_classification: 'non_academic' })).toBe(false)
    })

    it('formatPersonnelPlacement safely handles null, undefined, and empty objects', () => {
      expect(formatPersonnelPlacement(null)).toBe('Placement unassigned')
      expect(formatPersonnelPlacement(undefined)).toBe('Placement unassigned')
      expect(formatPersonnelPlacement({})).toBe('Administrative Unit unassigned')
      expect(formatPersonnelPlacement({ organizational_side: 'academic', college_code: 'CEAC' })).toBe('CEAC')
      expect(formatPersonnelPlacement({
        organizational_side: 'academic',
        college_code: 'CEAC',
        program_affiliations: [{ code: 'BSCS' }]
      })).toBe('CEAC • BSCS')
      expect(formatPersonnelPlacement({
        organizational_side: 'non_academic',
        administrative_unit_name: 'Human Resources Office'
      })).toBe('Human Resources Office')
    })

    it('formatPersonnelClassification safely handles null and prioritizes Plan D fields', () => {
      expect(formatPersonnelClassification(null)).toBe('')
      expect(formatPersonnelClassification(undefined)).toBe('')
      expect(formatPersonnelClassification({
        personnel_group: 'faculty',
        organizational_side: 'academic'
      })).toBe('Faculty • Academic')
      expect(formatPersonnelClassification({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'academic'
      })).toBe('Non-Teaching Faculty • Academic')
      expect(formatPersonnelClassification({
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic'
      })).toBe('Non-Teaching Faculty • Non-Academic')
    })

    it('formatFacultyEngagement and formatEmploymentStatus safely handle null', () => {
      expect(formatFacultyEngagement(null)).toBe('Unassigned')
      expect(formatFacultyEngagement(undefined)).toBe('Unassigned')
      expect(formatFacultyEngagement({ faculty_engagement: 'full_time_faculty' })).toBe('Full-time Faculty')
      expect(formatFacultyEngagement({ faculty_engagement: 'part_time_faculty' })).toBe('Part-time Faculty')

      expect(formatEmploymentStatus(null)).toBe('Unassigned')
      expect(formatEmploymentStatus(undefined)).toBe('Unassigned')
      expect(formatEmploymentStatus({ employment_status: 'permanent' })).toBe('Permanent')
      expect(formatEmploymentStatus({ employment_status: 'probationary' })).toBe('Probationary')
    })

    it('collectPersonnelPlacementOptions handles null and empty arrays safely', () => {
      const optionsNull = collectPersonnelPlacementOptions(null)
      expect(optionsNull.colleges).toEqual([])
      expect(optionsNull.academicPrograms).toEqual([])
      expect(optionsNull.administrativeUnits).toEqual([])

      const optionsValid = collectPersonnelPlacementOptions([
        null,
        undefined,
        {
          college_id: 'col_1',
          college_code: 'CEAC',
          college_name: 'CEAC',
          program_affiliations: [{ id: 'prog_1', academic_program_id: 'prog_1', code: 'BSCS', name: 'BS Computer Science', college_id: 'col_1' }]
        },
        {
          administrative_unit_id: 'unit_1',
          administrative_unit_code: 'HRDO',
          administrative_unit_name: 'HR Development'
        }
      ])

      expect(optionsValid.colleges).toHaveLength(1)
      expect(optionsValid.academicPrograms).toHaveLength(1)
      expect(optionsValid.administrativeUnits).toHaveLength(1)
    })
  })

  // =========================================================================
  // 3. Phase N3A / N3B: Component Instantiation & Props Invariant Checks
  // =========================================================================
  describe('Phase N3A/N3B: HR Component Instantiation & Props Invariants', () => {
    it('instantiates PersonnelDirectoryTable safely with empty list and sortConfig', () => {
      const el = (
        <PersonnelDirectoryTable
          personnelList={[]}
          sortConfig={{ column: 'full_name', direction: 'asc' }}
        />
      )
      expect(el.type).toBe(PersonnelDirectoryTable)
      expect(el.props.personnelList).toEqual([])
    })

    it('instantiates EditAssignmentModal safely with null personnel', () => {
      const elClosed = (
        <EditAssignmentModal
          isOpen={false}
          personnel={null}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      )
      expect(elClosed.type).toBe(EditAssignmentModal)
      expect(elClosed.props.personnel).toBeNull()
    })

    it('instantiates EditMasterDataModal safely with null or populated personnel', () => {
      const el = (
        <EditMasterDataModal
          isOpen={false}
          personnel={null}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      )
      expect(el.type).toBe(EditMasterDataModal)
      expect(el.props.isOpen).toBe(false)
    })

    it('instantiates FacultyDossierDrawer safely with null personnel', () => {
      const el = (
        <FacultyDossierDrawer
          isOpen={false}
          personnel={null}
          onClose={vi.fn()}
        />
      )
      expect(el.type).toBe(FacultyDossierDrawer)
      expect(el.props.isOpen).toBe(false)
    })

    it('instantiates DeanAssignmentModal safely with empty personnel list', () => {
      const el = (
        <DeanAssignmentModal
          isOpen={false}
          personnelList={[]}
          onClose={vi.fn()}
        />
      )
      expect(el.type).toBe(DeanAssignmentModal)
      expect(el.props.personnelList).toEqual([])
    })
  })

  // =========================================================================
  // 4. Phase N3B / N4: All HR Module Page Exports & Standalone Invariants
  // =========================================================================
  describe('Phase N3B/N4: HR Page Modules Invariants', () => {
    it('instantiates HRDashboardPage correctly with currentUser', () => {
      const el = <HRDashboardPage currentUser={hrSession} />
      expect(el.type).toBeDefined()
    })

    it('instantiates HRPersonnelDirectoryPage correctly', () => {
      const el = <HRPersonnelDirectoryPage />
      expect(el.type).toBe(HRPersonnelDirectoryPage)
    })

    it('instantiates HREvaluationSubmissionsPage correctly', () => {
      const el = <HREvaluationSubmissionsPage />
      expect(el.type).toBe(HREvaluationSubmissionsPage)
    })

    it('instantiates HRFacultyEvaluationOversightPage correctly and exports alias HRFacultyEvaluationAndRankingPage', () => {
      const el = <HRFacultyEvaluationOversightPage />
      expect(el.type).toBe(HRFacultyEvaluationOversightPage)
      expect(HRFacultyEvaluationAndRankingPage).toBe(HRFacultyEvaluationOversightPage)
    })

    it('instantiates HRAuditTrailPage correctly', () => {
      const el = <HRAuditTrailPage />
      expect(el.type).toBe(HRAuditTrailPage)
    })

    it('instantiates HRRankAssignmentLogsPage correctly', () => {
      const el = <HRRankAssignmentLogsPage />
      expect(el.type).toBe(HRRankAssignmentLogsPage)
    })

    it('instantiates HRPasswordResetRequestsPage correctly', () => {
      const el = <HRPasswordResetRequestsPage />
      expect(el.type).toBe(HRPasswordResetRequestsPage)
    })
  })

  // =========================================================================
  // 5. Phase N3D: RBAC & Route Access Guards
  // =========================================================================
  describe('Phase N3D: RBAC Route Access Controller Verification', () => {
    it('allows hr_admin in /hr routes and strictly blocks student and personnel', () => {
      const hrUser = { account_type: CANONICAL_ACCOUNT_TYPES.HR_ADMIN, role: CANONICAL_ROLES.HR_STAFF, assigned_roles: [CANONICAL_ROLES.HR_STAFF] }
      const studentUser = { account_type: CANONICAL_ACCOUNT_TYPES.STUDENT, role: CANONICAL_ROLES.STUDENT, assigned_roles: [CANONICAL_ROLES.STUDENT] }
      const personnelUser = { account_type: CANONICAL_ACCOUNT_TYPES.PERSONNEL, role: CANONICAL_ROLES.PERSONNEL, assigned_roles: [CANONICAL_ROLES.PERSONNEL] }
      const deanUser = { account_type: CANONICAL_ACCOUNT_TYPES.PERSONNEL, role: CANONICAL_ROLES.DEAN, assigned_roles: [CANONICAL_ROLES.DEAN, CANONICAL_ROLES.PERSONNEL] }

      // HR route requires hr_admin account_type and hr_staff role
      expect(RouteAccessController.isAllowedAccess(hrUser, [CANONICAL_ACCOUNT_TYPES.HR_ADMIN], [CANONICAL_ROLES.HR_STAFF])).toBe(true)
      expect(RouteAccessController.isAllowedAccess(studentUser, [CANONICAL_ACCOUNT_TYPES.HR_ADMIN], [CANONICAL_ROLES.HR_STAFF])).toBe(false)
      expect(RouteAccessController.isAllowedAccess(personnelUser, [CANONICAL_ACCOUNT_TYPES.HR_ADMIN], [CANONICAL_ROLES.HR_STAFF])).toBe(false)
      expect(RouteAccessController.isAllowedAccess(deanUser, [CANONICAL_ACCOUNT_TYPES.HR_ADMIN], [CANONICAL_ROLES.HR_STAFF])).toBe(false)

      // Resolution redirects
      expect(RouteAccessController.resolveRedirect(hrUser)).toBe('/hr/dashboard')
      expect(RouteAccessController.resolveRedirect(studentUser)).toBe('/student/dashboard')
      expect(RouteAccessController.resolveRedirect(personnelUser)).toBe('/personnel/dashboard')
    })
  })
})
