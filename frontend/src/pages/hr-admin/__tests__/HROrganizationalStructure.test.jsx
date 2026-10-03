import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('HR Organizational Structure Directory and Workspace Contract', () => {
  const pagePath = path.resolve(__dirname, '../HROrganizationalStructurePage.jsx')
  const assignModalPath = path.resolve(__dirname, '../modals/AssignDeanModal.jsx')
  const reassignModalPath = path.resolve(__dirname, '../modals/ReassignDeanModal.jsx')
  const drawerPath = path.resolve(__dirname, '../modals/PersonnelDetailDrawer.jsx')
  const dataIssuesPath = path.resolve(__dirname, '../modals/OrganizationalDataIssuesModal.jsx')
  const servicePath = path.resolve(__dirname, '../../../services/hrAdminService.js')
  const backendControllerPath = path.resolve(__dirname, '../../../../../backend/app/Controllers/Api/HROrganizationalStructureController.php')

  const page = fs.readFileSync(pagePath, 'utf8')
  const assignModal = fs.readFileSync(assignModalPath, 'utf8')
  const reassignModal = fs.readFileSync(reassignModalPath, 'utf8')
  const drawer = fs.readFileSync(drawerPath, 'utf8')
  const dataIssues = fs.readFileSync(dataIssuesPath, 'utf8')
  const service = fs.readFileSync(servicePath, 'utf8')
  const backendController = fs.readFileSync(backendControllerPath, 'utf8')

  describe('1. Directory and dedicated workspace architecture', () => {
    it('separates the organization directory from the selected workspace', () => {
      expect(page).toContain("directoryType === 'colleges'")
      expect(page).toContain("directoryType === 'offices'")
      expect(page).toContain('filteredOrganizations')
      expect(page).toContain('selectedOrganization')
      expect(page).toContain('returnToDirectory')
    })

    it('uses contextual directory and personnel searches', () => {
      expect(page).toContain('directorySearch')
      expect(page).toContain('personnelSearch')
      expect(page).toContain('Search colleges or offices...')
      expect(page).toContain('Search personnel by name or employee ID...')
      expect(page).not.toContain('Search college, department, dean, personnel')
    })

    it('preserves two-group classification: Teaching Faculty and Non-Teaching Faculty', () => {
      expect(page).toContain("personnel_group === 'faculty'")
      expect(page).toContain("personnel_group === 'non_teaching_faculty'")
      expect(page).toContain('Teaching Faculty')
      expect(page).toContain('Non-Teaching Faculty')
    })
  })

  describe('2. Dean Management & Leadership Section', () => {
    it('renders assigned Dean state with Reassign Dean trigger', () => {
      expect(page).toContain('activeDean')
      expect(page).toContain('Reassign Dean')
      expect(page).toContain('setReassignOpen(true)')
    })

    it('renders unassigned Dean state with Assign Dean trigger', () => {
      expect(page).toContain('No Dean currently assigned.')
      expect(page).toContain('Assign Dean')
      expect(page).toContain('setAssignOpen(true)')
    })
  })

  describe('3. Assign Dean Workflow (AssignDeanModal)', () => {
    it('filters candidate pool to active Academic Personnel affiliated with the college', () => {
      expect(assignModal).toContain('matchesCollege')
      expect(assignModal).toContain('isAcademic')
      expect(assignModal).toContain('assignDeanRole')
    })

    it('includes review step and escape key accessibility', () => {
      expect(assignModal).toContain('isConfirmStep')
      expect(assignModal).toContain('Escape')
      expect(assignModal).toContain('role="dialog"')
    })
  })

  describe('4. Reassign Dean Workflow & Required Reason (ReassignDeanModal)', () => {
    it('displays current Dean in read-only format', () => {
      expect(reassignModal).toContain('Current Active Dean')
      expect(reassignModal).toContain('currentDean?.full_name')
    })

    it('excludes current Dean from the replacement candidate pool', () => {
      expect(reassignModal).toContain('p.id === currentDean.profile_id')
    })

    it('enforces required non-empty reason for reassignment', () => {
      expect(reassignModal).toContain('Reason for Reassignment')
      expect(reassignModal).toContain('trimmedReason.length < 5')
      expect(reassignModal).toContain('A reason for Dean reassignment is required')
    })

    it('includes confirmation step and explicit HR Audit Trail warning', () => {
      expect(reassignModal).toContain('Review Dean Reassignment')
      expect(reassignModal).toContain('isAcknowledged')
      expect(reassignModal).toContain('preserves its history')
      expect(reassignModal).toContain('reassignCollegeDean')
    })
  })

  describe('5. Personnel Detail Drawer (PersonnelDetailDrawer)', () => {
    it('displays identity and in-context portfolio, assignment, and evaluation tabs', () => {
      expect(drawer).toContain('person.full_name')
      expect(drawer).toContain('person.institutional_id')
      expect(drawer).toContain("['Overview', 'Portfolio', 'Assignments', 'Evaluation Summary']")
      expect(drawer).toContain('Open Full Evaluation Record')
      expect(drawer).not.toContain('/hr/personnel-directory?search=')
      expect(drawer).toContain('Escape')
    })
  })

  describe('6. Data Issues & Inconsistency Handling', () => {
    it('shows only an actionable issue state when records need attention', () => {
      expect(page).not.toContain('No data issues')
      expect(page).toContain('records need attention')
      expect(page).toContain('setIssuesOpen(true)')
    })

    it('OrganizationalDataIssuesModal lists personnel requiring assignment review', () => {
      expect(dataIssues).toContain('Organizational Data Issues')
      expect(dataIssues).toContain('Review in Directory')
    })
  })

  describe('7. Backend API & Atomic Transaction Contract', () => {
    it('hrAdminService exports reassignCollegeDean and assignDeanRole', () => {
      expect(service).toContain('export async function reassignCollegeDean')
      expect(service).toContain('export async function assignDeanRole')
      expect(service).toContain('/hr/colleges/${collegeId}/reassign-dean')
    })

    it('HROrganizationalStructureController implements atomic reassignDean with validation and audit trail', () => {
      expect(backendController).toContain('public function reassignDean')
      expect(backendController).toContain('REASON_REQUIRED')
      expect(backendController).toContain('INELIGIBLE_DEAN_CANDIDATE')
      expect(backendController).toContain('COLLEGE_DEAN_REASSIGNED')
      expect(backendController).toContain('$db->transBegin()')
      expect(backendController).toContain('$db->transCommit()')
    })
  })
})
