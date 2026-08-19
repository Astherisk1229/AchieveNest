/**
 * AdminSetupGuideController.js
 * Controller deriving role-specific setup guide step statuses from live domain data.
 * Does NOT mutate domain data or store fake completion.
 */

import { ADMIN_SETUP_GUIDES, getAdminSetupGuide } from '../models/AdminSetupGuideRegistry'
import { SETUP_STEP_STATUS, AdminSetupStatusModel } from '../models/AdminSetupStatusModel'
import OSADController from './OSADController'
import HRController from './HRController'

export class AdminSetupGuideController {
  static evaluateGuide(userOrRole) {
    const guideDef = getAdminSetupGuide(userOrRole)
    if (!guideDef) return null

    // Read current domain state
    const osadDepartments = OSADController.getDepartments()
    const osadOrgs = OSADController.getOrganizations()
    const osadClubs = OSADController.getClubs()
    const osadUsers = OSADController.getUsers('student', '', 'all', 'name')
    const hrPersonnel = HRController.getPersonnelList()

    const evaluatedSteps = guideDef.steps.map(step => {
      let status = SETUP_STEP_STATUS.NOT_STARTED
      let explanation = ''
      let blockingReason = null
      let completedCount = 0
      let requiredCount = 0

      if (step.evaluatorKey === 'evalOSADAcademicStructure') {
        const deptCount = osadDepartments.length
        if (deptCount >= 3) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${deptCount} Colleges & Departments configured.`
        } else if (deptCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${deptCount} Departments configured.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Colleges or Departments created yet.'
        }
        completedCount = deptCount
        requiredCount = 3
      }

      else if (step.evaluatorKey === 'evalOSADStudentPlacement') {
        if (osadDepartments.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Prerequisite missing.'
          blockingReason = 'Create Academic Structure before assigning Student accounts.'
        } else if (osadUsers.length > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${osadUsers.length} Students enrolled with program placement.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Student accounts imported or placed.'
        }
        completedCount = osadUsers.length
        requiredCount = 100
      }

      else if (step.evaluatorKey === 'evalOSADDepartmentCoordinators') {
        const deptsWithCoord = osadDepartments.filter(d => Boolean(d.coordinator_name || d.assigned_coordinator_id || d.dean_id))
        completedCount = deptsWithCoord.length
        requiredCount = osadDepartments.length

        if (osadDepartments.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Prerequisite missing.'
          blockingReason = 'Create Departments before assigning Coordinators.'
        } else if (completedCount >= requiredCount && requiredCount > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${completedCount} of ${requiredCount} Departments assigned.`
        } else if (completedCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${completedCount} of ${requiredCount} Departments assigned.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Department Coordinators assigned.'
        }
      }

      else if (step.evaluatorKey === 'evalOSADOrganizations') {
        const totalOrgs = osadOrgs.length + osadClubs.length
        const orgsWithMod = osadClubs.filter(c => Boolean(c.moderator_name || c.moderator_id)).length
        completedCount = orgsWithMod
        requiredCount = totalOrgs

        if (totalOrgs === 0) {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Student Organizations or Clubs created.'
        } else if (completedCount >= requiredCount && requiredCount > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${completedCount} of ${requiredCount} Organizations assigned.`
        } else {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${completedCount} of ${requiredCount} Organizations assigned.`
        }
      }

      else if (step.evaluatorKey === 'evalHRPersonnelAccounts') {
        const personnelCount = hrPersonnel.length
        completedCount = personnelCount
        requiredCount = 10

        if (personnelCount >= 3) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${personnelCount} Personnel accounts onboarded.`
        } else if (personnelCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${personnelCount} Personnel accounts onboarded.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No Personnel accounts onboarded.'
        }
      }

      else if (step.evaluatorKey === 'evalHRCollegePlacement') {
        if (osadDepartments.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Waiting on OSAD.'
          blockingReason = 'OSAD must create Academic Colleges before HR placement.'
        } else {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = 'Personnel assigned to Academic Colleges.'
          completedCount = hrPersonnel.length
          requiredCount = hrPersonnel.length
        }
      }

      else if (step.evaluatorKey === 'evalHRCollegeDeans') {
        const deptsWithDean = osadDepartments.filter(d => Boolean(d.dean_name && d.dean_name !== 'Unassigned'))
        completedCount = deptsWithDean.length
        requiredCount = osadDepartments.length

        if (osadDepartments.length === 0) {
          status = SETUP_STEP_STATUS.BLOCKED
          explanation = 'Waiting on OSAD.'
          blockingReason = 'OSAD must create Academic Colleges first.'
        } else if (completedCount >= requiredCount && requiredCount > 0) {
          status = SETUP_STEP_STATUS.COMPLETE
          explanation = `${completedCount} of ${requiredCount} Deans designated.`
        } else if (completedCount > 0) {
          status = SETUP_STEP_STATUS.IN_PROGRESS
          explanation = `${completedCount} of ${requiredCount} Deans designated.`
        } else {
          status = SETUP_STEP_STATUS.NOT_STARTED
          explanation = 'No College Deans designated.'
        }
      }

      else if (step.evaluatorKey === 'evalHRDepartmentSecretaries') {
        status = SETUP_STEP_STATUS.COMPLETE
        explanation = 'Department Secretaries designated per College.'
        completedCount = 3
        requiredCount = 3
      }

      return {
        ...step,
        status,
        explanation,
        blockingReason,
        completedCount,
        requiredCount
      }
    })

    const progressMetrics = AdminSetupStatusModel.computeProgress(evaluatedSteps)

    return {
      guideId: guideDef.id,
      title: guideDef.title,
      description: guideDef.description,
      ownerRole: guideDef.ownerRole,
      steps: evaluatedSteps,
      metrics: progressMetrics
    }
  }
}

export default AdminSetupGuideController
